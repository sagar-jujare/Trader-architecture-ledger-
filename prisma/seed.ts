import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const db=new PrismaClient();
async function main(){
 const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();
 const password=process.env.ADMIN_PASSWORD;
 if(!email || !password || password.length<14) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (14+ chars)');
 const existing=await db.user.findUnique({where:{email}});
 if(existing) { console.log('Admin email already exists; no changes made.'); return; }
 await db.user.create({data:{email,passwordHash:await hash(password,12),role:'ADMIN',status:'ACTIVE',name:'Administrator'}});
 console.log('Admin created:',email);
}
main().finally(()=>db.$disconnect());
