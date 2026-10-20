'use client';

import {useMemo,useState} from 'react';
import {Calculator,TrendingUp} from 'lucide-react';

const fmt=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
const RATE=0.02;
const SESSIONS=270;

export function FreeCompoundingCalculator(){
  const [input,setInput]=useState('50000');
  const capital=Number(input);
  const valid=input.trim()!==''&&Number.isFinite(capital)&&capital>0&&capital<=1000000000;
  const outcome=useMemo(()=>valid?capital*Math.pow(1+RATE,SESSIONS):0,[capital,valid]);
  const checkpoints=valid?[0,30,60,90,120,150,180,210,240,270].map(day=>({day,value:capital*Math.pow(1+RATE,day)})):[];
  return <section id="free-calculator" className="bg-white py-20 lg:py-24 border-y border-slate-200" aria-labelledby="free-calculator-heading">
    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-4 py-2 text-xs font-bold tracking-wider"><Calculator size={16}/> FREE VISITOR CALCULATOR</span>
        <h2 id="free-calculator-heading" className="text-4xl lg:text-5xl font-black mt-5 tracking-tight">See the mathematical power of <span className="text-emerald-600">2% daily compounding.</span></h2>
        <p className="text-slate-600 mt-5 leading-relaxed">Enter your starting capital and explore a hypothetical projection across 270 trading sessions. No signup needed.</p>
        <label htmlFor="starting-capital" className="block text-sm font-bold text-slate-800 mt-8 mb-2">Your starting capital (₹)</label>
        <div className="relative max-w-md"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span><input id="starting-capital" type="number" inputMode="decimal" min="1" max="1000000000" step="any" value={input} onChange={e=>setInput(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-4 pl-10 pr-4 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="50000" aria-describedby="capital-help"/></div>
        <p id="capital-help" className="text-xs text-slate-500 mt-2">Enter an amount from ₹1 to ₹1,00,00,00,000. Results update instantly.</p>
        {!valid&&<p role="alert" className="text-sm text-rose-700 mt-2">Please enter a valid starting capital within the allowed range.</p>}
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-bold text-amber-950">Why 270 sessions?</h3><p className="text-sm text-amber-900 mt-2 leading-relaxed">270 is a convenient long-range scenario for this calculator, <strong>not the usual number of Indian stock-market sessions in one year</strong>. A typical year has closer to 245–252 exchange trading days, depending on weekends and market holidays. Reaching 270 sessions generally takes longer than one calendar year.</p></div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-[#f7faf9] shadow-xl p-6 sm:p-8">
        <div className="flex justify-between items-center gap-3"><span className="font-bold text-slate-800">Compounding projection</span><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Illustrative only</span></div>
        <div className="grid sm:grid-cols-2 gap-3 mt-6"><div className="bg-white rounded-2xl p-5 border border-slate-200"><p className="text-sm text-slate-500">Starting capital</p><p className="text-2xl font-black mt-2 break-words">{valid?fmt(capital):'—'}</p></div><div className="bg-emerald-600 text-white rounded-2xl p-5"><p className="text-sm text-emerald-100">After 270 sessions</p><p className="text-2xl font-black mt-2 break-words">{valid?fmt(outcome):'—'}</p></div></div>
        <div className="grid grid-cols-2 gap-4 mt-5"><div><p className="text-xs text-slate-500">Assumed return per session</p><p className="font-black text-lg text-emerald-700">+2%</p></div><div><p className="text-xs text-slate-500">Illustrative growth</p><p className="font-black text-lg">{valid?`${(outcome/capital).toFixed(1)}×`:'—'}</p></div></div>
        <div className="mt-7 flex items-center gap-2"><TrendingUp className="text-emerald-700" size={20}/><h3 className="font-bold">Projected capital by session</h3></div>
        <div className="mt-4 space-y-3">{checkpoints.filter(p=>[0,30,90,180,270].includes(p.day)).map(p=><div key={p.day} className="flex items-center gap-3 text-xs sm:text-sm"><span className="w-20 shrink-0 text-slate-500">Day {p.day}</span><div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.max(1,p.value/outcome*100)}%`}}/></div><span className="font-semibold w-32 sm:w-40 text-right break-words">{fmt(p.value)}</span></div>)}</div>
        <p className="mt-6 text-xs text-slate-600 leading-relaxed"><strong>Calculation:</strong> capital × (1.02)<sup>270</sup>. This assumes a 2% gain on every session, reinvested without interruption. It excludes losses, brokerage, taxes, slippage and withdrawals. A 2% return every trading day is highly unrealistic and is not a forecast, promise or expected outcome. Trading can result in capital loss.</p>
      </div>
    </div>
  </section>;
}
