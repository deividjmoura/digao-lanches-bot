// NOX handles 'notify' as well as 'append'. For restaurant orders,
// only accept a history/append event if it is genuinely fresh.
export function freshIncomingEvent(type,message,now=Date.now()){
 if(type==='notify')return true;
 if(type!=='append'||message?.key?.fromMe)return false;
 const raw=message?.messageTimestamp;
 const seconds=typeof raw==='number'?raw:typeof raw==='string'?Number(raw):raw?.toNumber?.();
 return Number.isFinite(seconds) && seconds>0 &&
  Math.abs(now-seconds*1000)<=90_000;
}
export function createIncomingDedupe({now=Date.now,ttlMs=600000,limit=800}={}){
 const seen=new Map();
 return {
  has(key){
   const id=String(key?.id||''),jid=String(key?.remoteJid||'');
   if(!id||!jid)return false;
   const k=jid+':'+id;
   const old=seen.get(k);
   return old!=null&&now()-old<ttlMs;
  },
  mark(key){
   const id=String(key?.id||''),jid=String(key?.remoteJid||'');
   if(!id||!jid)return;
   const time=now();
   const k=jid+':'+id;
   seen.set(k,time);
   for(const [item,t] of seen)if(time-t>=ttlMs)seen.delete(item);
   while(seen.size>limit)seen.delete(seen.keys().next().value);
  }
 };
}
