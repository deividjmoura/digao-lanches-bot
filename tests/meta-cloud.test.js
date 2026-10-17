import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validMetaSignature,metaIncomingMessages,metaOwnerEchoes,createMetaCloudTransport} from '../src/metaCloud.js';

test('Webhook Meta aceita apenas HMAC SHA-256 do corpo original',()=>{
 const body=Buffer.from('{"entry":[]}'),sig='sha256='+createHmac('sha256','secret').update(body).digest('hex');
 assert.equal(validMetaSignature(body,sig,'secret'),true);
 assert.equal(validMetaSignature(body,sig,'wrong'),false);
 assert.equal(validMetaSignature(Buffer.from('other'),sig,'secret'),false);
 assert.equal(validMetaSignature(body,'invalid','secret'),false);
});
test('Webhook processa somente o número configurado e formatos aceitos',()=>{
 const value={entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:'123'},messages:[
  {id:'wamid.1',from:'5547999912345',type:'text',text:{body:'menu'}},
  {id:'wamid.2',from:'5547999912345',type:'image',image:{id:'12345',caption:'pix'}},
  {id:'wamid.3',from:'5547999912345',type:'reaction'}
 ]}}]}]};
 assert.deepEqual(metaIncomingMessages(value,'123'),[
  {id:'wamid.1',from:'5547999912345',text:'menu',imageId:null},
  {id:'wamid.2',from:'5547999912345',text:'pix',imageId:'12345'}
 ]);
 assert.equal(metaIncomingMessages(value,'other').length,0);
});
test('Webhook legítimo envia uma resposta e impede pedidos duplicados após reiniciar',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'digao-meta-')),routes={},requests=[];
 const app={get:(url,fn)=>routes['GET '+url]=fn,post:(url,fn)=>routes['POST '+url]=fn};
 const logger={info(){},error(x){throw Error(x.error)}};
 const previous=globalThis.fetch;
 globalThis.fetch=async(url,opts)=>{requests.push({url,body:JSON.parse(opts.body)});return {ok:true,json:async()=>({messages:[{id:'wamid.sent'}]})};};
 try{
  const create=()=>createMetaCloudTransport({token:'token',phoneNumberId:'123',appSecret:'secret',verifyToken:'verify',dataDir:dir,logger,onText:async(jid,text)=>{assert.equal(jid,'5547999912345@s.whatsapp.net');return 'DIGAO: '+text;},onImage:async()=>null});
  create().register(app);
  const body={entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:'123'},messages:[{id:'wamid.1',from:'5547999912345',type:'text',text:{body:'menu'}}]}}]}]};
  const rawBody=Buffer.from(JSON.stringify(body)),sig='sha256='+createHmac('sha256','secret').update(rawBody).digest('hex');
  const req={body,rawBody,get:()=>sig},res={sendStatus(code){this.code=code;return this;}};
  routes['POST /webhook/meta'](req,res);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(res.code,200);assert.equal(requests.length,1);assert.equal(requests[0].body.text.body,'DIGAO: menu');
  create().register(app);
  routes['POST /webhook/meta'](req,res);await new Promise(resolve=>setImmediate(resolve));assert.equal(requests.length,1);
  routes['POST /webhook/meta']({...req,get:()=> 'invalid'},res);assert.equal(res.code,401);
 }finally{globalThis.fetch=previous;rmSync(dir,{recursive:true,force:true});}
});

test('Coexistência: mensagem manual identifica contato, sem tratá-la como pedido',()=>{
 const event={entry:[{changes:[{field:'smb_message_echoes',value:{metadata:{phone_number_id:'123'},message_echoes:[{id:'echo.1',from:'5516997767962',to:'5547999912345',type:'text'}]}}]}]};
 assert.deepEqual(metaOwnerEchoes(event,'123'),[{id:'echo.1',to:'5547999912345'}]);
 assert.equal(metaIncomingMessages(event,'123').length,0);
});
