import test from 'node:test';
import assert from 'node:assert/strict';
import {freshIncomingEvent,createIncomingDedupe} from '../src/incoming-routing.js';

test('NOX-style append only processes recent real client messages, never old history',()=>{
 const now=1_800_000_000_000;
 const ts=Math.floor(now/1000);
 assert.equal(freshIncomingEvent('notify',{key:{fromMe:false}},now),true);
 assert.equal(freshIncomingEvent('append',{key:{fromMe:false},messageTimestamp:ts},now),true);
 assert.equal(freshIncomingEvent('append',{key:{fromMe:false},messageTimestamp:String(ts)},now),true);
 assert.equal(freshIncomingEvent('append',{key:{fromMe:false},messageTimestamp:{toNumber:()=>ts}},now),true);
 assert.equal(freshIncomingEvent('append',{key:{fromMe:false},messageTimestamp:ts-91},now),false);
 assert.equal(freshIncomingEvent('append',{key:{fromMe:false},messageTimestamp:ts+91},now),false);
 assert.equal(freshIncomingEvent('append',{key:{fromMe:false}},now),false);
 assert.equal(freshIncomingEvent('append',{key:{fromMe:true},messageTimestamp:ts},now),false);
 assert.equal(freshIncomingEvent('history',{key:{fromMe:false},messageTimestamp:ts},now),false);
});
test('dedupe works across append/notify without suppressing later decryption retries',()=>{
 let clock=1000;
 const d=createIncomingDedupe({now:()=>clock,ttlMs:5000});
 const key={remoteJid:'123@lid',id:'msgA'};
 assert.equal(d.has(key),false);
 d.mark(key);
 assert.equal(d.has(key),true);
 assert.equal(d.has({...key,id:'msgB'}),false);
 assert.equal(d.has({...key,remoteJid:'456@lid'}),false);
 clock=7000;
 assert.equal(d.has(key),false);
});
