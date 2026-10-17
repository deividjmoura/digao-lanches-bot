import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeliveryTracker} from '../src/delivery-tracker.js';

test('tracks only the message ID on its original destination',()=>{
 const logs=[];
 const tracker=createDeliveryTracker({info:(data,label)=>logs.push([data,label])});
 const key={id:'wa-msg-1',remoteJid:'5547984746350@s.whatsapp.net'};
 assert.equal(tracker.track(key,'probe'),true);
 tracker.onMessagesUpdate([{key:{...key,remoteJid:'another@s.whatsapp.net'},update:{status:3}}]);
 tracker.onMessagesUpdate([{key,update:{status:2}}]);
 tracker.onReceipts([{key,receipt:{receiptTimestamp:123}}]);
 assert.equal(logs.filter(([,label])=>label==='Atualização de entrega do WhatsApp').length,1);
 assert.equal(logs.filter(([,label])=>label==='Recibo de mensagem do WhatsApp').length,1);
 assert.equal(logs.some(([data])=>JSON.stringify(data).includes('5547984746350')),false);
});
test('does not track unknown or missing message IDs',()=>{
 const logs=[];
 const t=createDeliveryTracker({info:()=>logs.push(true)});
 assert.equal(t.track({remoteJid:'123@lid'}),false);
 t.onMessagesUpdate([{key:{id:'n',remoteJid:'123@lid'},update:{status:2}}]);
 assert.equal(logs.length,0);
});
