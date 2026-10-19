export type LedgerConfig={startingCapital:number,tradingDays:number,targetPct:number,maxLossPct:number,riskPct:number,startDate:Date;holidayDates?:string};
export type LedgerEntry={dayNumber:number,date:Date,grossProfit:number,grossLoss:number,charges:number,deposit:number,withdrawal:number,tradesTaken:number,notes:string};
export function parseHolidayDates(input:string):Set<string>{
 return new Set(input.split(/[\s,;]+/).map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(new Date(x+'T00:00:00.000Z').getTime())));
}
export function tradingDateForDay(start:Date,day:number,holidays:Set<string>):Date{
 const date=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate()));
 let count=0;
 while(count<day){const weekday=date.getUTCDay();const key=date.toISOString().slice(0,10);if(weekday!==0&&weekday!==6&&!holidays.has(key))count++;if(count<day)date.setUTCDate(date.getUTCDate()+1);}
 return date;
}
export function buildLedger(config:LedgerConfig,entries:LedgerEntry[]){const byDay=new Map(entries.map(x=>[x.dayNumber,x]));let balance=config.startingCapital;let cumulative=0;let wins=0;let losses=0;let chargesTotal=0;let withdrawals=0;const rows=[];const holidays=parseHolidayDates(config.holidayDates||"");
for(let i=1;i<=config.tradingDays;i++){const entry=byDay.get(i);const date=entry?.date||tradingDateForDay(config.startDate,i,holidays);const open=balance;const grossProfit=entry?.grossProfit||0;const grossLoss=entry?.grossLoss||0;const charges=entry?.charges||0;const deposit=entry?.deposit||0;const withdrawal=entry?.withdrawal||0;const net=grossProfit-grossLoss-charges;balance=open+net+deposit-withdrawal;cumulative+=net;chargesTotal+=charges;withdrawals+=withdrawal;if(entry){if(net>0)wins++;if(net<0)losses++;}rows.push({day:i,date,open,ideal:config.startingCapital*Math.pow(1+config.targetPct/100,i-1),idealProfit:config.startingCapital*Math.pow(1+config.targetPct/100,i-1)*config.targetPct/100,target:open*config.targetPct/100,lossLimit:open*config.maxLossPct/100,riskLimit:open*config.riskPct/100,grossProfit,grossLoss,charges,deposit,withdrawal,net,closing:balance,returnPct:open?net/open*100:0,variance:net-open*config.targetPct/100,trades:entry?.tradesTaken||0,notes:entry?.notes||'',status:!entry?'PENDING':net>=open*config.targetPct/100?'TARGET MET':net>0?'PROFIT':net<0?'LOSS':'FLAT',recorded:!!entry});}
return {rows,balance,cumulative,wins,losses,chargesTotal,withdrawals,completed:entries.length};}
export const money=(v:number)=>'₹'+v.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
