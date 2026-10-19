import {SubmitButton} from '@/components/submit-button';
import {Workspace} from '@/components/workspace';
import { requireUser, hasActiveAccess } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { saveOnboarding } from '@/app/actions';
export default async function Onboarding({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const user=await requireUser();if(!await hasActiveAccess(user.id)) redirect('/dashboard');
 const profile=await db.onboardingProfile.findUnique({where:{userId:user.id}});
 const p=await searchParams;
 return <Workspace name={user.name}><main className="max-w-3xl mx-auto p-6 md:p-12 space-y-6"><Link href="/dashboard" className="link">← Dashboard</Link><h1 className="text-3xl font-bold">Trader onboarding</h1><p className="text-slate-400">Set your trading preferences and initial capital. You can edit these later.</p>{p.error&&<p className="text-red-400">{p.error}</p>}<form action={saveOnboarding} className="card space-y-4"><div><label>Market</label><select name="market" defaultValue={profile?.market||'EQUITY'}>{['EQUITY','FUTURES','OPTIONS','FOREX','CRYPTO','OTHER'].map(x=><option key={x}>{x}</option>)}</select></div><div><label>Experience</label><select name="experience" defaultValue={profile?.experience||'BEGINNER'}>{['BEGINNER','INTERMEDIATE','ADVANCED'].map(x=><option key={x}>{x}</option>)}</select></div><div><label>Broker (optional)</label><input name="broker" maxLength={80} defaultValue={profile?.broker||''}/></div><div><label>Starting balance (INR)</label><input type="number" name="startingBalance" min="0.01" step="0.01" required defaultValue={profile?.startingBalance.toString()||'80000'}/></div><div><label>Daily target (%)</label><input type="number" name="dailyTargetPct" min="0" max="100" step="0.001" required defaultValue={profile?.dailyTargetPct.toString()||'3'}/></div><div><label>Daily maximum loss (%)</label><input type="number" name="dailyMaxLossPct" min="0" max="100" step="0.001" required defaultValue={profile?.dailyMaxLossPct.toString()||'2'}/></div><SubmitButton className="btn">Save onboarding</SubmitButton></form></main></Workspace>;
}
