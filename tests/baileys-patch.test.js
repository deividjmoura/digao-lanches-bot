import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { patchSource } from '../scripts/patch-baileys-lid-retry.mjs';

const fixture = [
  "const isLidUser = jid => jid.endsWith('@lid');",
  "const getDecryptionJid = async jid => jid;",
  "async function decryptBlock(decryptionJid, e2eType, content, stanza, repository, logger) {",
  "  let msgBuffer;",
  "  switch (e2eType) {",
  "    case 'pkmsg':",
  "    case 'msg':",
  "      msgBuffer = await repository.decryptMessage({",
  "        jid: decryptionJid,",
  "        type: e2eType,",
  "        ciphertext: content",
  "      });",
  "      break;",
  "  }",
  "  return msgBuffer;",
  "}"
].join('\n');

function loadPatched() {
  const patched = patchSource(fixture);
  assert.equal(patched.changed, true);
  assert.match(patched.source, /DIGAO_LID_PN_DECRYPT_RETRY_V2/);
  assert.equal(patchSource(patched.source).changed, false);
  return runInNewContext(patched.source + '\n decryptBlock', {});
}

test('patch recognizes exactly one known Baileys decrypt block', () => {
  assert.throws(() => patchSource("const getDecryptionJid = 1; const isLidUser = 1;"), /exactly one/);
  assert.throws(() => patchSource(fixture + '\n' + fixture), /found 2/);
});

test('normal decryption does not trigger fallback', async () => {
  const run = loadPatched();
  const calls = [];
  const repo = { decryptMessage: async ({jid}) => { calls.push(jid); return 'success'; } };
  assert.equal(await run('123@lid', 'msg', Buffer.from('cipher'), {attrs:{sender_pn:'5511999@s.whatsapp.net'}}, repo, {info(){}}), 'success');
  assert.deepEqual(calls,['123@lid']);
});

test('retries with PN paired by the current stanza on Bad MAC', async () => {
  const run = loadPatched();
  const calls=[];
  const repo = {decryptMessage: async ({jid}) => {
    calls.push(jid);
    if(jid==='123@lid') throw Error('Bad MAC');
    return 'recovered';
  }};
  assert.equal(await run('123@lid','msg',Buffer.from('cipher'),{attrs:{sender_pn:'5511999@s.whatsapp.net'}},repo,{info(){}}),'recovered');
  assert.deepEqual(calls,['123@lid','5511999@s.whatsapp.net']);
});

test('refuses unpaired/wrong alternate and preserves original error', async () => {
  const run=loadPatched();
  const original=Error('Bad MAC');
  const calls=[];
  const repo={decryptMessage:async ({jid})=>{calls.push(jid);throw original;}};
  await assert.rejects(run('123@lid','pkmsg',Buffer.from('x'),{attrs:{sender_pn:'bad@lid'}},repo,{info(){}}),err=>err===original);
  assert.deepEqual(calls,['123@lid']);
});

test('when alternate decrypt also fails, preserves original error', async () => {
  const run=loadPatched();
  const original=Error('Bad MAC');
  const calls=[];
  const repo={decryptMessage:async ({jid})=>{calls.push(jid);throw jid==='123@lid'?original:Error('No session');}};
  await assert.rejects(run('123@lid','msg',Buffer.from('x'),{attrs:{sender_pn:'5511999@s.whatsapp.net'}},repo,{info(){}}),err=>err===original);
  assert.deepEqual(calls,['123@lid','5511999@s.whatsapp.net']);
});
