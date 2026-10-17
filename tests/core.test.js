import test from 'node:test';
import assert from 'node:assert/strict';
import {findProducts,money} from '../src/catalog.js';
import {buildPix,crc16} from '../src/pix.js';
test('busca sem acento e busca por nome',()=>{assert.ok(findProducts('x bacon').some(p=>p.id==='x-bacon'));assert.ok(findProducts('calabresa').length>=2);assert.ok(findProducts('HOT DOG').length>0);});
test('preços em centavos',()=>assert.equal(money(2600),'R$ 26,00'));
test('pix possui valor, chave, CRC e txid',()=>{const value=buildPix({key:'teste@example.com',name:'DIGAO LANCHES',city:'RIBEIRAO PRETO',amountCents:2600,txid:'DG-000001'});assert.ok(value.includes('540526.00'));assert.ok(value.includes('teste@example.com'));assert.equal(value.slice(-4),crc16(value.slice(0,-4)));});
test('pix recusa valores invalidos',()=>assert.throws(()=>buildPix({key:'a',name:'b',city:'c',amountCents:-10,txid:'a'})));

test('saudação não se repete e conversa comum não recebe resposta',async()=>{
  const {handleMessage}=await import('../src/app.js');
  const jid='551699900'+Date.now()+'@s.whatsapp.net';
  assert.match(handleMessage(jid,'oi'),/Falaaa/);
  assert.equal(handleMessage(jid,'oi'),null);
  assert.equal(handleMessage(jid,'Tudo bem, Digão?'),null);
  assert.match(handleMessage(jid,'menu'),/Lanches/);
});
test('mensagem humana pausa respostas casuais, mas menu explicito reativa',async()=>{
  const {handleMessage,pauseForOwner}=await import('../src/app.js');
  const jid='551698800'+Date.now()+'@s.whatsapp.net';
  pauseForOwner(jid,60);
  assert.equal(handleMessage(jid,'oi'),null);
  assert.match(handleMessage(jid,'menu'),/Lanches/);
});
