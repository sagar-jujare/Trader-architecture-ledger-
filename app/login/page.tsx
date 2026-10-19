import {SubmitButton} from '@/components/submit-button';
import { login } from '@/app/actions';
import { LoginError } from '@/components/login-error';
import Link from 'next/link';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {error}=await searchParams;
 return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><div className="w-full max-w-md"><Link href="/" className="font-black text-xl text-slate-900">Trader Architecture Ledger<span className="text-emerald-600">.</span></Link><form action={login} className="card space-y-5 mt-6"><div><h1 className="text-2xl font-bold">Welcome back</h1><p className="muted text-sm">Sign in to your private trading workspace.</p></div><LoginError message={error||''}/><div><label>Email address</label><input name="email" type="email" required autoComplete="email"/></div><div><label>Password</label><input name="password" type="password" required autoComplete="current-password"/></div><SubmitButton className="btn w-full">Sign in</SubmitButton><a className="block text-center text-sm text-blue-700 font-semibold hover:underline" target="_blank" rel="noopener noreferrer" href="https://wa.me/918088521053?text=Hello%2C%20I%20need%20help%20resetting%20my%20Trader Architecture Ledger%20password.">Forgot password? Contact support on WhatsApp ↗</a><p className="text-xs muted text-center">Invitation-only access. Never share your password with support.</p></form></div></main>;
}
