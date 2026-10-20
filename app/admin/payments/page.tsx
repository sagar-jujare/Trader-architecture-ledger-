import Link from 'next/link';
import {requireAdmin} from '@/lib/auth';
import {db} from '@/lib/db';
import {Workspace} from '@/components/workspace';
import {reviewPayment} from '@/app/actions';
import {SubmitButton} from '@/components/submit-button';

export default async function Payments({searchParams}:{searchParams:Promise<{error?:string;success?:string;view?:string}>}){
 const admin=await requireAdmin(); const q=await searchParams;
 const view=q.view==='history'?'history':'pending';
 const [pendingCount,approvedCount,rejectedCount,payments]=await Promise.all([
  db.payment.count({where:{status:'SUBMITTED'}}),
  db.payment.count({where:{status:'APPROVED'}}),
  db.payment.count({where:{status:'REJECTED'}}),
  db.payment.findMany({where:view==='pending'?{status:'SUBMITTED'}:{status:{in:['APPROVED','REJECTED']}},include:{user:true},orderBy:{createdAt:'desc'},take:100})
 ]);
 return <Workspace admin name={admin.email}><div className="space-y-6">
  <div className="flex flex-wrap justify-between gap-3 items-start"><div><p className="admin-eyebrow">PAYMENT OPERATIONS</p><h1 className="page-title">Payment verification</h1><p className="muted text-sm mt-1">A clear review queue with transaction details, subscription plans and approval history.</p></div><span className="pill">Manual verification required</span></div>
  {q.error&&<div className="card bad" role="alert">{q.error}</div>}{q.success&&<div className="card good" role="status">{q.success}</div>}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="admin-stat"><span>Awaiting review</span><strong>{pendingCount}</strong><small>Action required</small></div><div className="admin-stat"><span>Approved (all time)</span><strong>{approvedCount}</strong><small>Verified payments</small></div><div className="admin-stat"><span>Rejected (all time)</span><strong>{rejectedCount}</strong><small>Declined submissions</small></div></div>
  <div className="flex gap-2 border-b border-slate-200 pb-3"><Link href="/admin/payments" className={'admin-tab '+(view==='pending'?'selected':'')}>Pending reviews ({pendingCount})</Link><Link href="/admin/payments?view=history" className={'admin-tab '+(view==='history'?'selected':'')}>Review history</Link></div>
  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><b>Verification checklist:</b> Open your bank/UPI statement → locate the exact UTR → confirm the credited amount and beneficiary account → check it has not been used for another payment → only then approve. A screenshot alone is not proof.</div>
  {!payments.length&&<div className="card text-center py-12"><p className="font-semibold">{view==='pending'?'All caught up — no payments awaiting review.':'No reviewed payments yet.'}</p><p className="muted text-sm mt-2">New customer submissions will appear here.</p></div>}
  <div className="grid gap-4">{payments.map(pay=>{const name=pay.note?.match(/Payer: ([^|]+)/)?.[1]?.trim()||pay.user.name||'—';const phone=pay.note?.match(/Phone: ([^|]+)/)?.[1]?.trim()||pay.user.phone||'—';const plan=pay.amountPaise===49900?'monthly':pay.amountPaise===499900?'yearly':'custom';return <article className="card admin-payment-card" key={pay.id}>
   <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100"><div><div className="flex items-center gap-2 flex-wrap"><Link className="link font-bold text-lg" href={'/admin/users/'+pay.userId}>{name} ↗</Link><span className={'admin-status '+(pay.status==='APPROVED'?'approved':pay.status==='REJECTED'?'rejected':'pending')}>{pay.status==='SUBMITTED'?'Needs review':pay.status.toLowerCase()}</span></div><p className="muted text-sm">{pay.user.email} · Submitted {pay.createdAt.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'})}</p></div><div className="text-left sm:text-right"><p className="text-2xl font-extrabold">₹{(pay.amountPaise/100).toLocaleString('en-IN')}</p><p className="muted text-xs">{plan==='monthly'?'Matches ₹499 monthly':plan==='yearly'?'Matches ₹4,999 yearly':'Amount requires manual plan check'}</p></div></div>
   <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 py-4"><div className="admin-detail"><span>UTR / Transaction number</span><b className="break-all select-all">{pay.reference}</b></div><div className="admin-detail"><span>Payment method</span><b>{pay.method==='BANK_TRANSFER'?'Bank transfer':pay.method==='UPI'?'UPI':'Cashfree'}</b></div><div className="admin-detail"><span>Customer name</span><b>{name}</b></div><div className="admin-detail"><span>Phone number</span><b>{phone}</b></div></div>
   {pay.note&&<details className="text-sm muted mb-4"><summary className="cursor-pointer font-semibold">Customer-submitted notes</summary><p className="mt-2 break-words">{pay.note}</p></details>}
   {view==='pending'?<form action={reviewPayment} className="admin-review-panel"><input type="hidden" name="paymentId" value={pay.id}/><div className="flex-1 min-w-48"><label htmlFor={'days-'+pay.id}>Activate subscription for</label><select id={'days-'+pay.id} name="days" defaultValue={plan==='yearly'?'365':'30'}><option value="30">1 month — ₹499</option><option value="365">1 year — ₹4,999</option></select><p className="muted text-xs mt-1">Confirm the plan matches the received amount.</p></div><div className="flex flex-wrap gap-2 items-center"><SubmitButton name="decision" value="APPROVED" className="btn">Approve & activate</SubmitButton><SubmitButton name="decision" value="REJECTED" className="admin-reject">Reject payment</SubmitButton></div></form>:<p className="text-xs muted">Reviewed {pay.reviewedAt?.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'})||'—'}</p>}
  </article>})}</div>
  {payments.length===100&&<p className="muted text-sm">Showing the most recent 100 records.</p>}
 </div></Workspace>;
}
