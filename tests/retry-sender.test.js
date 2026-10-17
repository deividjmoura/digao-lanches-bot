import test from 'node:test';
import assert from 'node:assert/strict';
import {createRetryMessageCache} from '../src/retry-cache.js';
import {phoneForIncoming,allowedTestMessage} from '../src/whatsapp-test-guard.js';

test('retry cache never returns content for another contact or an incoming message',()=>{
 let clock=1000;
 const cache=createRetryMessageCache({now:()=>clock,ttlMs:60000});
 const key={id:'msg-id',remoteJid:'5547999912345@s.whatsapp.net',fromMe:true};
 cache.remember(key,'menu');
 assert.deepEqual(cache.get(key),{conversation:'menu'});
 assert.equal(cache.get({...key,remoteJid:'5547999999999@s.whatsapp.net'}),undefined);
 assert.equal(cache.get({...key,remoteJid:'123@lid'}),undefined);
 assert.equal(cache.get({...key,fromMe:false}),undefined);
 clock=62000;
 assert.equal(cache.get(key),undefined);
});
test('resolve LID with trusted mapping and preserve approved test-only routing',async()=>{
 const id={remoteJid:'12345@lid',fromMe:false};
 const pn=await phoneForIncoming(id,async()=> '5547984746350@s.whatsapp.net');
 assert.equal(pn,'5547984746350@s.whatsapp.net');
 assert.equal(allowedTestMessage({...id,remoteJidAlt:pn},'5547984746350'),true);
 assert.equal(allowedTestMessage(id,'5547984746350'),false);
 assert.equal(await phoneForIncoming(id,async()=> 'another@lid'),null);
 assert.equal(await phoneForIncoming(id,async()=>{throw Error('lookup unavailable')}),null);
 assert.equal(await phoneForIncoming({remoteJid:'5547984746350@s.whatsapp.net'},async()=>{throw Error('should not lookup')}),'5547984746350@s.whatsapp.net');
});
