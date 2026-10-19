import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
const COOKIE = 'tj_session';
export function hashToken(value:string) { return createHash('sha256').update(value).digest('hex'); }
export function newToken() { return randomBytes(32).toString('hex'); }
export async function startSession(userId:string) {
  const token = newToken();
  const expiresAt = new Date(Date.now()+7*24*60*60*1000);
  await db.session.create({data:{userId,tokenHash:hashToken(token),expiresAt}});
  (await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires:expiresAt});
}
export async function endSession() {
  const jar=await cookies(); const token=jar.get(COOKIE)?.value;
  if(token) await db.session.updateMany({where:{tokenHash:hashToken(token)},data:{revokedAt:new Date()}});
  jar.delete(COOKIE);
}
export async function currentUser() {
  const token=(await cookies()).get(COOKIE)?.value;
  if(!token) return null;
  const session=await db.session.findUnique({where:{tokenHash:hashToken(token)},include:{user:true}});
  if(!session || session.revokedAt || session.expiresAt<=new Date()) return null;
  return session.user;
}
export async function requireUser() { const u=await currentUser(); if(!u) redirect('/login'); return u; }
export async function requireAdmin() { const u=await requireUser(); if(u.role!=='ADMIN') redirect('/dashboard'); return u; }
export async function hasActiveAccess(userId:string) {
  const user=await db.user.findUnique({where:{id:userId},select:{role:true,status:true}});
  if(!user || user.role!=='TRADER' || user.status!=='ACTIVE') return false;
  return !!(await db.subscription.findFirst({where:{userId,status:'ACTIVE',startsAt:{lte:new Date()},expiresAt:{gt:new Date()}}}));
}
