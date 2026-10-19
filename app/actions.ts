'use server';
import { db } from '@/lib/db';
import { currentUser, endSession, hashToken, newToken, requireAdmin, requireUser, startSession, hasActiveAccess } from '@/lib/auth';
import { hash, compare } from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendInvitation } from '@/lib/invitation-delivery';
function val(form:FormData,key:string){return String(form.get(key)??'').trim();}
function fail(path:string,message:string):never {redirect(path+'?error='+encodeURIComponent(message));}
export async function login(form:FormData){
 const email=val(form,'email').toLowerCase(); const password=val(form,'password');
 const u=await db.user.findUnique({where:{email}});
 if(!u?.passwordHash || !(await compare(password,u.passwordHash))) fail('/login','Incorrect email or password. Please try again.');
 await startSession(u.id);
 redirect(u.role==='ADMIN'?'/admin':'/dashboard');
}
export async function logout(){await endSession();redirect('/login');}
export async function acceptInvite(form:FormData){
 const token=val(form,'token'); const password=val(form,'password');
 if(!/^[a-f0-9]{64}$/.test(token)||password.length<12) fail('/login','Invalid invite or password too short (12+ characters)');
 const inv=await db.invitation.findUnique({where:{tokenHash:hashToken(token)},include:{user:true}});
 if(!inv||inv.consumedAt||inv.expiresAt<=new Date() ) fail('/login','Invite expired or already used');
 const passwordHash=await hash(password,12);
 const changed=await db.$transaction(async tx=>{
  const claimed=await tx.invitation.updateMany({where:{id:inv.id,consumedAt:null,expiresAt:{gt:new Date()}},data:{consumedAt:new Date()}});
  if(claimed.count!==1) return false;
  await tx.user.update({where:{id:inv.userId},data:inv.user.passwordHash ? {passwordHash} : {passwordHash,status:'PENDING_PAYMENT'}});
  return true;
 });
 if(!changed) fail('/login','Invite already used');
 await startSession(inv.userId);redirect('/dashboard');
}
export async function inviteUser(form:FormData){
 const admin=await requireAdmin();
 const parsed=z.object({email:z.email(),name:z.string().min(1).max(100),phone:z.string().regex(/^\+?[0-9 ()-]{7,20}$/)}).safeParse({email:val(form,'email').toLowerCase(),name:val(form,'name'),phone:val(form,'phone')});
 if(!parsed.success) fail('/admin','Invalid email or name');
 const exists=await db.user.findUnique({where:{email:parsed.data.email}});
 if(exists) fail('/admin','User already exists');
 const token=newToken();
 await db.user.create({data:{email:parsed.data.email,name:parsed.data.name,phone:parsed.data.phone,status:'INVITED',invites:{create:{tokenHash:hashToken(token),expiresAt:new Date(Date.now()+48*60*60*1000)}}}});
 await db.auditLog.create({data:{actorId:admin.id,action:'USER_INVITED',metadata:{email:parsed.data.email}}});
 const base=(process.env.APP_URL||'http://localhost:3000').replace(/\/$/,'');
 const link=base+'/invite/'+token;
 const delivery=await sendInvitation({email:parsed.data.email,name:parsed.data.name,phone:parsed.data.phone,link});
 const params=new URLSearchParams({invite:link,inviteName:parsed.data.name,invitePhone:parsed.data.phone,emailDelivery:delivery.email,whatsappDelivery:delivery.whatsapp});
 if(delivery.notes.length) params.set('deliveryError',delivery.notes.join(' | ').slice(0,500));
 redirect('/admin?'+params.toString());
}
export async function submitPayment(form:FormData){
 const u=await requireUser(); if(u.role!=='TRADER') fail('/dashboard','Not a trader');
 if(await hasActiveAccess(u.id)) fail('/dashboard','Already active');
 if(u.status==='SUSPENDED') fail('/dashboard','Account suspended');
 const method=val(form,'method'); const reference=val(form,'reference'); const amount=Number(val(form,'amount'));
 if(!['BANK_TRANSFER','CASHFREE_LINK'].includes(method)||reference.length<6||reference.length>120||!Number.isSafeInteger(amount)||amount<1||amount>100000000) fail('/dashboard','Invalid payment details');
 const pending=await db.payment.count({where:{userId:u.id,status:'SUBMITTED'}});
 if(pending) fail('/dashboard','Payment already awaiting review');
 await db.$transaction([db.payment.create({data:{userId:u.id,method:method as 'BANK_TRANSFER'|'CASHFREE_LINK',reference,amountPaise:amount*100,note:val(form,'note').slice(0,500)}}),db.user.update({where:{id:u.id},data:{status:'PENDING_REVIEW'}})]);
 revalidatePath('/dashboard');redirect('/dashboard?success=Payment+submitted+for+manual+verification');
}
export async function reviewPayment(form:FormData){
 const admin=await requireAdmin(); const id=val(form,'paymentId');const decision=val(form,'decision');
 if(!['APPROVED','REJECTED'].includes(decision)) fail('/admin','Invalid decision');
 const days=Number(val(form,'days'));
 if(decision==='APPROVED'&&(!Number.isInteger(days)||days<1||days>3650)) fail('/admin','Invalid subscription duration');
 await db.$transaction(async tx=>{
  const updated=await tx.payment.updateMany({where:{id,status:'SUBMITTED'},data:{status:decision as 'APPROVED'|'REJECTED',reviewedById:admin.id,reviewedAt:new Date()}});
  if(updated.count!==1) throw new Error('Payment already reviewed');
  const payment=await tx.payment.findUniqueOrThrow({where:{id}});
  if(decision==='APPROVED'){
   const now=new Date();
   await tx.subscription.updateMany({where:{userId:payment.userId,status:'ACTIVE'},data:{status:'REVOKED'}});
   await tx.subscription.create({data:{userId:payment.userId,paymentId:id,planName:'Manual plan',startsAt:now,expiresAt:new Date(now.getTime()+days*86400000)}});
   await tx.user.update({where:{id:payment.userId},data:{status:'ACTIVE'}});
  }else{
   const active=await tx.subscription.count({where:{userId:payment.userId,status:'ACTIVE',expiresAt:{gt:new Date()}}});
   await tx.user.update({where:{id:payment.userId},data:{status:active?'ACTIVE':'PENDING_PAYMENT'}});
  }
  await tx.auditLog.create({data:{actorId:admin.id,action:'PAYMENT_'+decision,targetUserId:payment.userId,metadata:{paymentId:id,days:decision==='APPROVED'?days:null}}});
 });
 revalidatePath('/admin');redirect('/admin?success=Payment+reviewed');
}
export async function changeAccess(form:FormData){
 const admin=await requireAdmin(); const userId=val(form,'userId');const action=val(form,'action');
 if(!['SUSPEND','REVOKE','RESTORE'].includes(action)) fail('/admin','Invalid action');
 const u=await db.user.findUnique({where:{id:userId}});
 if(!u||u.role!=='TRADER') fail('/admin','Invalid trader');
 await db.$transaction(async tx=>{
  if(action==='SUSPEND'||action==='REVOKE'){
   await tx.subscription.updateMany({where:{userId,status:'ACTIVE'},data:{status:'REVOKED'}});
   await tx.user.update({where:{id:userId},data:{status:action==='SUSPEND'?'SUSPENDED':'PENDING_PAYMENT'}});
   await tx.session.updateMany({where:{userId,revokedAt:null},data:{revokedAt:new Date()}});
  } else {
   await tx.user.update({where:{id:userId},data:{status:'PENDING_PAYMENT'}});
  }
  await tx.auditLog.create({data:{actorId:admin.id,action:'USER_'+action,targetUserId:userId}});
 });
 revalidatePath('/admin');redirect('/admin?success=Access+updated');
}

// Phase 3 actions: never trust the browser for access control.
export async function saveOnboarding(form: FormData) {
 const user=await requireUser();
 if(!await hasActiveAccess(user.id)) redirect('/dashboard');
 const parsed=z.object({
  market:z.enum(['EQUITY','FUTURES','OPTIONS','FOREX','CRYPTO','OTHER']),
  experience:z.enum(['BEGINNER','INTERMEDIATE','ADVANCED']),
  broker:z.string().max(80),
  startingBalance:z.coerce.number().positive().max(1000000000),
  dailyTargetPct:z.coerce.number().min(0).max(100),
  dailyMaxLossPct:z.coerce.number().min(0).max(100)
 }).safeParse({market:val(form,'market'),experience:val(form,'experience'),broker:val(form,'broker'),startingBalance:val(form,'startingBalance'),dailyTargetPct:val(form,'dailyTargetPct'),dailyMaxLossPct:val(form,'dailyMaxLossPct')});
 if(!parsed.success) fail('/onboarding','Please enter valid onboarding details');
 await db.onboardingProfile.upsert({where:{userId:user.id},create:{userId:user.id,...parsed.data},update:parsed.data});
 revalidatePath('/dashboard');redirect('/dashboard?success=Profile+saved');
}
export async function addTrade(form: FormData) {
 const user=await requireUser();
 if(!await hasActiveAccess(user.id)) redirect('/dashboard');
 const profile=await db.onboardingProfile.findUnique({where:{userId:user.id}});
 if(!profile) redirect('/onboarding');
 const parsed=z.object({
  date:z.iso.date(),symbol:z.string().min(1).max(30).regex(/^[A-Za-z0-9._-]+$/),
  side:z.enum(['LONG','SHORT']),quantity:z.coerce.number().positive().max(100000000),
  entryPrice:z.coerce.number().positive().max(1000000000),exitPrice:z.coerce.number().positive().max(1000000000),
  fees:z.coerce.number().min(0).max(100000000),notes:z.string().max(1000)
 }).safeParse({date:val(form,'date'),symbol:val(form,'symbol').toUpperCase(),side:val(form,'side'),quantity:val(form,'quantity'),entryPrice:val(form,'entryPrice'),exitPrice:val(form,'exitPrice'),fees:val(form,'fees')||'0',notes:val(form,'notes')});
 if(!parsed.success) fail('/journal','Invalid trade details');
 const {date,...data}=parsed.data;
 await db.trade.create({data:{...data,userId:user.id,tradedAt:new Date(date+'T12:00:00.000Z')}});
 revalidatePath('/journal');redirect('/journal?success=Trade+saved');
}

export async function saveLedgerSettings(form:FormData){
 const u=await requireUser(); if(!await hasActiveAccess(u.id)) redirect('/dashboard');
 const parsed=z.object({startingCapital:z.coerce.number().positive().max(1e12),tradingDays:z.coerce.number().int().min(1).max(1000),targetPct:z.coerce.number().min(0).max(100),maxLossPct:z.coerce.number().min(0).max(100),riskPct:z.coerce.number().min(0).max(100),startDate:z.iso.date(),holidayDates:z.string().max(10000)}).safeParse({startingCapital:val(form,'startingCapital'),tradingDays:val(form,'tradingDays'),targetPct:val(form,'targetPct'),maxLossPct:val(form,'maxLossPct'),riskPct:val(form,'riskPct'),startDate:val(form,'startDate'),holidayDates:val(form,'holidayDates')});
 if(!parsed.success) fail('/ledger','Invalid ledger settings');
 const {startDate,...rest}=parsed.data;
 const holidayDates=rest.holidayDates.split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
 if(holidayDates.some(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x)||Number.isNaN(new Date(x+'T00:00:00.000Z').getTime()))) fail('/ledger','Holiday dates must use YYYY-MM-DD format');
 rest.holidayDates=[...new Set(holidayDates)].join(',');
 await db.ledgerSettings.upsert({where:{userId:u.id},create:{userId:u.id,...rest,startDate:new Date(startDate+'T00:00:00.000Z')},update:{...rest,startDate:new Date(startDate+'T00:00:00.000Z')}});
 revalidatePath('/ledger');redirect('/ledger?success=Settings+saved');
}
export async function saveLedgerDay(form:FormData){
 const u=await requireUser();if(!await hasActiveAccess(u.id)) redirect('/dashboard');
 const settings=await db.ledgerSettings.findUnique({where:{userId:u.id}});
 if(!settings) fail('/ledger','Configure your journal first');
 const parsed=z.object({dayNumber:z.coerce.number().int().min(1).max(settings.tradingDays),date:z.iso.date(),grossProfit:z.coerce.number().min(0).max(1e12),grossLoss:z.coerce.number().min(0).max(1e12),charges:z.coerce.number().min(0).max(1e12),deposit:z.coerce.number().min(0).max(1e12),withdrawal:z.coerce.number().min(0).max(1e12),tradesTaken:z.coerce.number().int().min(0).max(100000),notes:z.string().max(500)}).safeParse({dayNumber:val(form,'dayNumber'),date:val(form,'date'),grossProfit:val(form,'grossProfit')||'0',grossLoss:val(form,'grossLoss')||'0',charges:val(form,'charges')||'0',deposit:val(form,'deposit')||'0',withdrawal:val(form,'withdrawal')||'0',tradesTaken:val(form,'tradesTaken')||'0',notes:val(form,'notes')});
 if(!parsed.success) fail('/ledger','Invalid daily entry');
 const {dayNumber,date,...data}=parsed.data;
 await db.ledgerDay.upsert({where:{userId_dayNumber:{userId:u.id,dayNumber}},create:{userId:u.id,dayNumber,date:new Date(date+'T00:00:00.000Z'),...data},update:{date:new Date(date+'T00:00:00.000Z'),...data}});
 revalidatePath('/ledger');revalidatePath('/dashboard');redirect('/ledger?success=Daily+entry+saved');
}


// Admin-only subscription adjustments, with an audit trail.
export async function updateSubscription(form:FormData){
 const admin=await requireAdmin();
 const id=val(form,'subscriptionId');
 const planName=val(form,'planName');
 const expiresAt=val(form,'expiresAt');
 const status=val(form,'status');
 if(!id||!planName||planName.length>80||!['ACTIVE','EXPIRED','REVOKED'].includes(status)||!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) fail('/admin','Invalid subscription update');
 const expiry=new Date(expiresAt+'T23:59:59.000Z');
 if(Number.isNaN(expiry.getTime())) fail('/admin','Invalid expiry date');
 const old=await db.subscription.findUnique({where:{id}});
 if(!old) fail('/admin','Subscription not found');
 await db.$transaction(async tx=>{
  await tx.subscription.update({where:{id},data:{planName,expiresAt:expiry,status:status as 'ACTIVE'|'EXPIRED'|'REVOKED'}});
  const hasAccess=await tx.subscription.count({where:{userId:old.userId,status:'ACTIVE',expiresAt:{gt:new Date()}}});
  const user=await tx.user.findUniqueOrThrow({where:{id:old.userId}});
  if(user.status!=='SUSPENDED') await tx.user.update({where:{id:old.userId},data:{status:hasAccess?'ACTIVE':'PENDING_PAYMENT'}});
  await tx.auditLog.create({data:{actorId:admin.id,targetUserId:old.userId,action:'SUBSCRIPTION_UPDATED',metadata:{subscriptionId:id,previousStatus:old.status,status,planName,expiresAt}}});
 });
 revalidatePath('/admin');revalidatePath('/admin/users/'+old.userId);
 redirect('/admin/users/'+old.userId+'?success=Subscription+updated');
}

// Admin-controlled password reset: generate a single-use, 30-minute setup link.
// The admin shares this link privately; the user chooses their own password.
export async function adminResetPassword(form:FormData){
 const admin=await requireAdmin();
 const userId=val(form,'userId');
 const user=await db.user.findUnique({where:{id:userId}});
 if(!user || user.role!=='TRADER') fail('/admin','Invalid customer');
 const token=newToken();
 await db.$transaction(async tx=>{
  await tx.invitation.updateMany({where:{userId,consumedAt:null},data:{consumedAt:new Date()}});
  await tx.invitation.create({data:{userId,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+30*60*1000)}});
  await tx.session.updateMany({where:{userId,revokedAt:null},data:{revokedAt:new Date()}});
  await tx.auditLog.create({data:{actorId:admin.id,targetUserId:userId,action:'PASSWORD_RESET_LINK_ISSUED'}});
 });
 const base=(process.env.APP_URL||'http://localhost:3000').replace(/\/$/,'');
 redirect('/admin/users/'+userId+'?resetLink='+encodeURIComponent(base+'/invite/'+token));
}
