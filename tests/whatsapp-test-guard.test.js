import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedTestMessage} from '../src/whatsapp-test-guard.js';
test('default mode allows events normally',()=>{
 assert.equal(allowedTestMessage({remoteJid:'123@lid'},''),true);
});
test('test mode matches number through direct phone or LID alternate',()=>{
 const allowed='5547999912345';
 assert.equal(allowedTestMessage({remoteJid:allowed+'@s.whatsapp.net'},allowed),true);
 assert.equal(allowedTestMessage({remoteJid:'123456@lid',remoteJidAlt:allowed+'@s.whatsapp.net'},allowed),true);
 assert.equal(allowedTestMessage({remoteJid:'123456@lid'},allowed),false);
 assert.equal(allowedTestMessage({remoteJid:'5547999910000@s.whatsapp.net'},allowed),false);
});
test('invalid test number fails closed',()=>{
 assert.equal(allowedTestMessage({remoteJid:'123@lid'},'abc'),false);
});
