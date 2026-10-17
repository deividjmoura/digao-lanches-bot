import test from 'node:test';
import assert from 'node:assert/strict';
import {findProducts,money} from '../src/catalog.js';
import {buildPix,crc16} from '../src/pix.js';
test('busca sem acento e busca por nome',()=>{assert.ok(findProducts('x bacon').some(p=>p.id==='x-bacon'));assert.ok(findProducts('calabresa').length>=2);assert.ok(findProducts('HOT DOG').length>0);});
test('preços em centavos',()=>assert.equal(money(2600),'R$ 26,00'));
test('pix possui valor, chave, CRC e txid',()=>{const value=buildPix({key:'teste@example.com',name:'DIGAO LANCHES',city:'RIBEIRAO PRETO',amountCents:2600,txid:'DG-000001'});assert.ok(value.includes('540526.00'));assert.ok(value.includes('teste@example.com'));assert.equal(value.slice(-4),crc16(value.slice(0,-4)));});
test('pix recusa valores invalidos',()=>assert.throws(()=>buildPix({key:'a',name:'b',city:'c',amountCents:-10,txid:'a'})));
