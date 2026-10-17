import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveWhatsAppAuthDir} from '../src/auth-path.js';
test('keeps the old auth directory by default; never erases it',()=>{
 assert.equal(resolveWhatsAppAuthDir('/data'),'/data/whatsapp-auth');
 assert.equal(resolveWhatsAppAuthDir('/data',''),'/data/whatsapp-auth');
 assert.equal(resolveWhatsAppAuthDir('/data','/data/whatsapp-auth-repair-20261017'),'/data/whatsapp-auth-repair-20261017');
});
test('new auth directory is confined to the mounted data volume',()=>{
 assert.throws(()=>resolveWhatsAppAuthDir('/data','/data'),/subpasta/);
 assert.throws(()=>resolveWhatsAppAuthDir('/data','/tmp/whatsapp-auth'),/subpasta/);
 assert.throws(()=>resolveWhatsAppAuthDir('/data','/data/../app'),/subpasta/);
 assert.throws(()=>resolveWhatsAppAuthDir('/data','/database/whatsapp-auth'),/subpasta/);
});
