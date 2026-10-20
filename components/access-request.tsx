'use client';

import {useEffect,useState,type FormEvent} from 'react';
import {ArrowRight,MessageCircle,X} from 'lucide-react';

type Props={variant?:'outline'|'green'|'dark';label?:string};
export function AccessRequestButton({variant='outline',label='Request Access'}:Props){
  const [open,setOpen]=useState(false);
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [email,setEmail]=useState('');
  const [plan,setPlan]=useState<'monthly'|'yearly'>('monthly');
  const [consent,setConsent]=useState(false);
  useEffect(()=>{if(!open)return;const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[open]);
  const buttonClass=variant==='green'?'bg-emerald-600 text-white hover:bg-emerald-700':variant==='dark'?'bg-emerald-500 text-slate-950 hover:bg-emerald-400':'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!consent)return;
    const selected=plan==='monthly'?'1 Month — ₹499':'1 Year — ₹4,999';
    const message=`Hello, I would like to request access to Trader Architecture Ledger.\n\nName: ${name.trim()}\nPhone: ${phone.trim()}\nEmail: ${email.trim()}\nInterested plan: ${selected}\n\nPlease share the next steps for membership and access.`;
    const url='https://wa.me/918088521053?text='+encodeURIComponent(message);
    // Open WhatsApp after validation; the visitor must press Send to share the details.
    window.location.assign(url);
  }
  return <>
    <button type="button" onClick={()=>setOpen(true)} className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold px-6 py-4 transition-colors ${buttonClass}`}><MessageCircle size={18}/>{label}<ArrowRight size={17}/></button>
    {open&&<div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
      <div role="dialog" aria-modal="true" aria-labelledby="access-heading" className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-900 my-auto">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Trader Architecture Ledger</p><h2 id="access-heading" className="text-2xl font-black mt-2">Request Access</h2><p className="text-sm text-slate-600 mt-2">Enter your details and select your preferred membership. You can review the message before sending it on WhatsApp.</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close form" className="rounded-lg p-2 hover:bg-slate-100"><X size={22}/></button></div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">Full name<input autoFocus required maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" className="mt-1.5 block w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-600"/></label>
          <label className="block text-sm font-semibold">Phone number<input required type="tel" minLength={10} maxLength={18} pattern="[+0-9 ()-]{10,18}" title="Enter a valid phone number" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210" className="mt-1.5 block w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-600"/></label>
          <label className="block text-sm font-semibold">Email address<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 block w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-emerald-600"/></label>
          <fieldset><legend className="text-sm font-semibold mb-2">Interested plan</legend><div className="grid grid-cols-2 gap-3">{([{id:'monthly',title:'1 Month',price:'₹499'},{id:'yearly',title:'1 Year',price:'₹4,999'}] as const).map(p=><label key={p.id} className={`cursor-pointer rounded-xl border-2 p-3 ${plan===p.id?'border-emerald-600 bg-emerald-50':'border-slate-200'}`}><input type="radio" name="access-plan" className="accent-emerald-600" checked={plan===p.id} onChange={()=>setPlan(p.id)}/><span className="ml-2 font-semibold">{p.title}</span><span className="block mt-2 text-xl font-black">{p.price}</span></label>)}</div></fieldset>
          <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-0.5 accent-emerald-600"/><span>I agree to share these details with the administrator through WhatsApp to request membership access.</span></label>
          <button type="submit" className="w-full rounded-xl bg-emerald-600 text-white font-bold px-5 py-4 hover:bg-emerald-700 inline-flex items-center justify-center gap-2"><MessageCircle size={19}/> Continue to WhatsApp <ArrowRight size={18}/></button>
          <p className="text-xs text-slate-500 text-center">WhatsApp will open with your details prefilled. You must press <b>Send</b> there to submit your request. Access is subject to admin approval; no payment is collected here.</p>
        </form>
      </div>
    </div>}
  </>;
}
