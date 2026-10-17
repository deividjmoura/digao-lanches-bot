import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {sendOneTimeSmoke} from '../src/smoke.js';
test('one-time smoke only messages approved test phone, never twice',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'wa-smoke-'));
 const sent=[],cache=[];
 const socket={sendMessage:async(jid,payload)=>{sent.push({jid,payload});return {key:{id:'test',remoteJid:jid,fromMe:true}};}};
 const opts={socket,phone:'5547984746350',runId:'one-time-test',dataDir:dir,remember:(key,text)=>cache.push([key,text])};
 try{
  assert.equal(await sendOneTimeSmoke(opts),'submitted');
  assert.equal(await sendOneTimeSmoke(opts),'already-sent');
  assert.equal(sent.length,1);
  assert.equal(sent[0].jid,'5547984746350@s.whatsapp.net');
  assert.match(sent[0].payload.text,/responda \*menu\*/);
  assert.equal(cache.length,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('smoke cannot run without a valid phone or controlled ID',async()=>{
 let used=false;
 const socket={sendMessage:async()=>{used=true;}};
 const args={socket,phone:'other@lid',runId:'run-1',dataDir:'/tmp'};
 await assert.rejects(sendOneTimeSmoke(args),/test phone/);
 await assert.rejects(sendOneTimeSmoke({...args,phone:'5547984746350',runId:'../escape'}),/identifier/);
 assert.equal(used,false);
 assert.equal(await sendOneTimeSmoke({...args,runId:''}),'disabled');
});
