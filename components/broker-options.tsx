'use client';

import {useState} from 'react';
import {ArrowUpRight, CheckCircle2, Gift, X} from 'lucide-react';

type Broker = {name:string;domain:string;url:string;intro:string;benefits:string[];accent:string;card:string;button:string;check:string};
const brokers:Broker[]=[
 {name:'Dhan',domain:'dhan.co',url:process.env.NEXT_PUBLIC_DHAN_ACCOUNT_URL || 'https://dhan.co/',intro:'Trading tools for active Indian market participants.',benefits:['Advanced charts and technical indicators','Options trading and market-depth tools','Risk controls and order-management features'],accent:'bg-[#e9f2ff] text-[#1265d8]',card:'bg-gradient-to-br from-[#edf5ff] via-white to-[#dcecff] border-[#a9cdfb]',button:'bg-[#1768d2] hover:bg-[#0e4d9e]',check:'text-[#1768d2]'},
 {name:'Sahi',domain:'sahi.com',url:process.env.NEXT_PUBLIC_SAHI_ACCOUNT_URL || 'https://www.sahi.com/',intro:'A trading platform designed for active equity and options traders.',benefits:['Options-focused single-screen trading tools','Integrated charting and market analysis','Mobile account opening with digital KYC'],accent:'bg-[#f0eaff] text-[#663bd5]',card:'bg-gradient-to-br from-[#f4efff] via-white to-[#e8dcff] border-[#cbb7ff]',button:'bg-[#6336cc] hover:bg-[#4925a0]',check:'text-[#6336cc]'},
 {name:'INDmoney',domain:'indmoney.com',url:process.env.NEXT_PUBLIC_INDMONEY_ACCOUNT_URL || 'https://www.indmoney.com/',intro:'An investing and trading platform across several asset categories.',benefits:['Indian stocks, ETFs and mutual funds in one app','Access to Indian and US market investing features','Portfolio monitoring and investment tools'],accent:'bg-[#eaf8f1] text-[#147c58]',card:'bg-gradient-to-br from-[#eafbf2] via-white to-[#d6f6e7] border-[#a7e4c8]',button:'bg-[#137e58] hover:bg-[#0b5d41]',check:'text-[#137e58]'}
];
export function BrokerOptions({compact=false}:{compact?:boolean}){
 const [selectedBroker,setSelectedBroker]=useState<Broker|null>(null);
 return <section id={compact?undefined:'broker-accounts'} className={compact?'card space-y-5':'bg-white py-20 lg:py-24'}>
  <div className={compact?'':'max-w-7xl mx-auto px-6'}>
   <p className="text-emerald-700 font-bold text-xs uppercase tracking-widest">Broker account options</p>
   <h2 className={compact?'font-bold text-xl mt-2':'text-4xl lg:text-5xl font-black mt-3'}>Choose a platform for your trading journey.</h2>
   <p className="text-slate-600 text-sm mt-3 mb-7 max-w-3xl">Explore account-opening options and compare features that may suit your trading and investing needs. Accounts are opened directly with the respective provider.</p>
   <div className="grid md:grid-cols-3 gap-5">{brokers.map(b=><article key={b.name} className={"rounded-2xl border p-5 sm:p-6 shadow-sm flex flex-col transition-shadow hover:shadow-lg "+b.card}>
    <div className="flex items-center gap-3 mb-4"><div className={'w-14 h-14 rounded-xl flex items-center justify-center border border-slate-100 '+b.accent}><img src={'https://www.google.com/s2/favicons?domain='+b.domain+'&sz=128'} alt={b.name+' logo'} width="36" height="36" loading="lazy"/></div><h3 className="font-black text-xl text-slate-900">{b.name}</h3></div>
    <p className="text-sm text-slate-600 mb-5">{b.intro}</p>
    <ul className="space-y-3 text-sm text-slate-700 mb-6 flex-1">{b.benefits.map(benefit=><li key={benefit} className="flex gap-2 items-start"><CheckCircle2 size={17} className={b.check+" mt-0.5 shrink-0"}/>{benefit}</li>)}</ul>
    <button type="button" onClick={()=>setSelectedBroker(b)} className={"rounded-xl text-white font-semibold px-4 py-3 flex justify-center items-center gap-2 transition-colors "+b.button}>Open {b.name} account <ArrowUpRight size={17}/></button>
   </article>)}</div>
   <p className="text-xs text-slate-500 mt-5">Broker features, eligibility and charges can change. Check each provider’s official terms before opening an account. We may earn compensation from some account-opening links. Trading involves risk and no profit is assured.</p>
  </div>
  {selectedBroker && <div className="fixed inset-0 z-[100] bg-slate-950/65 flex items-center justify-center p-4" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelectedBroker(null)}}>
   <div role="dialog" aria-modal="true" aria-labelledby="broker-giveaway-title" className="relative bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
    <button type="button" onClick={()=>setSelectedBroker(null)} aria-label="Close popup" className="absolute right-4 top-4 text-slate-500 hover:text-slate-900"><X size={22}/></button>
    <div className="rounded-full bg-amber-100 text-amber-700 w-12 h-12 flex items-center justify-center mb-4"><Gift size={25}/></div>
    <h3 id="broker-giveaway-title" className="text-2xl font-extrabold mb-3">Open an account for a chance at a giveaway!</h3>
    <p className="text-slate-600 text-sm leading-6 mb-3">Open your {selectedBroker.name} account through the link provided here for a chance to participate in a giveaway.</p>
    <p className="text-xs text-slate-500 leading-5 mb-5">A giveaway entry or prize is not guaranteed. Eligibility, entry verification, prizes, dates and terms must be confirmed by Trader Architecture Ledger before any promotion takes place. Account opening is subject to the broker’s terms. We may earn compensation from account-opening links.</p>
    <div className="flex flex-col sm:flex-row gap-3">
     <button type="button" onClick={()=>setSelectedBroker(null)} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold flex-1">Not now</button>
     <a href={selectedBroker.url} target="_blank" rel="noopener noreferrer sponsored" onClick={()=>setSelectedBroker(null)} className={"rounded-xl text-white px-4 py-3 font-semibold flex-1 text-center "+selectedBroker.button}>Continue to {selectedBroker.name} ↗</a>
    </div>
   </div>
  </div>}
 </section>;
}
