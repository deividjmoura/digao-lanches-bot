export function createDeliveryTracker(logger,{now=Date.now}={}){
 const waiting=new Map();
 function prune(){
  for(const [id,record] of waiting)if(now()-record.at>15*60*1000)waiting.delete(id);
  while(waiting.size>20)waiting.delete(waiting.keys().next().value);
 }
 return {
  track(key,label='test'){
   if(!key?.id||!key?.remoteJid)return false;
   prune();
   waiting.set(key.id,{jid:key.remoteJid,label,at:now()});
   logger.info({label,jidType:key.remoteJid.split('@').pop()},'Rastreamento de entrega registrado');
   return true;
  },
  onMessagesUpdate(updates){
   prune();
   for(const item of updates||[]){
    const record=waiting.get(item?.key?.id);
    if(!record||item.key.remoteJid!==record.jid)continue;
    logger.info({label:record.label,status:item.update?.status??null,hasMessage:!!item.update?.message},'Atualização de entrega do WhatsApp');
   }
  },
  onReceipts(updates){
   prune();
   for(const item of updates||[]){
    const record=waiting.get(item?.key?.id);
    if(!record||item.key.remoteJid!==record.jid)continue;
    const receipts=item.receipt||{};
    logger.info({label:record.label,delivered:!!receipts.receiptTimestamp,read:!!receipts.readTimestamp,played:!!receipts.playedTimestamp},'Recibo de mensagem do WhatsApp');
   }
  }
 };
}
