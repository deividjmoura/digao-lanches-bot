// Return only the original message for the exact recipient/session requested.
export function createRetryMessageCache({now=Date.now,max=200,ttlMs=900000}={}){
 const messages=new Map();
 return {
  remember(key,text){
   if(!key?.id||!key?.remoteJid||key.fromMe!==true)return;
   messages.set(key.id,{jid:key.remoteJid,fromMe:true,at:now(),message:{conversation:String(text)}});
   while(messages.size>max)messages.delete(messages.keys().next().value);
  },
  get(key){
   if(!key?.id||!key?.remoteJid||key.fromMe!==true)return undefined;
   const record=messages.get(key.id);
   if(!record)return undefined;
   if(now()-record.at>ttlMs){messages.delete(key.id);return undefined;}
   if(record.jid!==key.remoteJid||record.fromMe!==key.fromMe)return undefined;
   return record.message;
  }
 };
}
