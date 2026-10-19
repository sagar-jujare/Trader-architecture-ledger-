"use client";
import {useEffect,useState} from 'react';
export function LoginError({message}:{message:string}){
 const [open,setOpen]=useState(Boolean(message));
 useEffect(()=>setOpen(Boolean(message)),[message]);
 if(!message) return null;
 return <><p role="alert" className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{message}</p>{open&&<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5" role="alertdialog" aria-modal="true" aria-label="Sign in failed"><div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"><h2 className="font-bold text-xl text-slate-900">Sign in failed</h2><p className="text-slate-600 mt-2">{message}</p><button autoFocus type="button" onClick={()=>setOpen(false)} className="mt-5 w-full rounded-lg bg-blue-600 text-white py-2.5 font-semibold">Try again</button></div></div>}</>;
}
