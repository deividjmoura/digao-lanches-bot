import {createHmac,timingSafeEqual} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAX_IMAGE_BYTES=8*1024*1024;
export function validMetaSignature(rawBody,header,appSecret){
 if(!Buffer.isBuffer(rawBody)||!appSecret||typeof header!=='string'||!/^sha256=[a-f\d]{64}$/i.test(header))return false;
 const expected=createHmac('sha256',appSecret).update(rawBody).digest();
 const supplied=Buffer.from(header.slice(7),'hex');
 return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}
export function metaIncomingMessages(payload,phoneNumberId){
 const events=[];
 for(const entry of payload?.entry||[])for(const change of entry?.changes||[]){
  if(change.field!=='messages'||String(change.value?.metadata?.phone_number_id)!==String(phoneNumberId))continue;
  for(const msg of change.value?.messages||[]){
   if(!/^\d{10,15}$/.test(String(msg.from||''))||typeof msg.id!=='string')continue;
   if(!['text','image','interactive','button'].includes(msg.type))continue;
   const text=msg.text?.body||msg.image?.caption||msg.interactive?.button_reply?.title||msg.interactive?.list_reply?.title||msg.button?.text||'';
   events.push({id:msg.id,from:msg.from,text,imageId:msg.type==='image'?(msg.image?.id||null):null});
  }
 }
 return events;
}
function seenEvents(dataDir){
 fs.mkdirSync(dataDir,{recursive:true});
 const filename=path.join(dataDir,'cloud-webhook-processed.json');
 let data=[];
 try{data=JSON.parse(fs.readFileSync(filename,'utf8'));if(!Array.isArray(data))data=[];}catch(e){if(e.code!=='ENOENT')throw e;}
 const seen=new Set(data.filter(v=>typeof v==='string').slice(-15000));
 return {mark(id){
  if(seen.has(id))return false;
  seen.add(id);
  const json=JSON.stringify([...seen].slice(-15000)),tmp=filename+'.tmp';
  fs.writeFileSync(tmp,json,{mode:0o600});fs.renameSync(tmp,filename);
  if(seen.size>15000){seen.clear();for(const v of JSON.parse(json))seen.add(v);}
  return true;
 }};
}
export function createMetaCloudTransport({token,phoneNumberId,appSecret,verifyToken,apiVersion='v25.0',dataDir,logger,onText,onImage}){
 if(!token||!phoneNumberId||!appSecret||!verifyToken||!/^v\d+\.\d+$/.test(apiVersion))throw Error('Configuração Meta Cloud API incompleta');
 const done=seenEvents(dataDir);
 const graph='https://graph.facebook.com/'+apiVersion;
 let chain=Promise.resolve();
 async function graphFetch(url,options={}){
  const response=await fetch(url,{...options,headers:{authorization:'Bearer '+token,...options.headers},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Meta Graph HTTP '+response.status);
  return response;
 }
 async function send(jid,text){
  const to=String(jid).replace(/@s\.whatsapp\.net$/,'');
  if(!/^\d{10,15}$/.test(to))throw Error('Destinatário Cloud API inválido');
  const response=await graphFetch(graph+'/'+phoneNumberId+'/messages',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to,type:'text',text:{preview_url:false,body:String(text)}})});
  const data=await response.json();
  return data.messages?.[0]?.id||null;
 }
 async function downloadImage(mediaId){
  if(!/^\d{4,30}$/.test(String(mediaId)))throw Error('ID de mídia inválido');
  const metadata=await(await graphFetch(graph+'/'+mediaId)).json();
  const url=new URL(metadata.url);
  if(url.protocol!=='https:'||!/(^|\.)(facebook\.com|fbcdn\.net|fbsbx\.com)$/.test(url.hostname))throw Error('URL de mídia não confiável');
  if(!['image/jpeg','image/png'].includes(metadata.mime_type))throw Error('Comprovante em formato não permitido');
  const response=await graphFetch(url.href);
  if(Number(response.headers.get('content-length')||0)>MAX_IMAGE_BYTES)throw Error('Comprovante muito grande');
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>MAX_IMAGE_BYTES)throw Error('Comprovante muito grande');chunks.push(chunk);}
  return {bytes:Buffer.concat(chunks),mimeType:metadata.mime_type};
 }
 function register(app){
  app.get('/webhook/meta',(req,res)=>{
   if(req.query['hub.mode']!=='subscribe'||req.query['hub.verify_token']!==verifyToken||typeof req.query['hub.challenge']!=='string')return res.sendStatus(403);
   return res.type('text/plain').send(req.query['hub.challenge']);
  });
  app.post('/webhook/meta',(req,res)=>{
   if(!validMetaSignature(req.rawBody,req.get('x-hub-signature-256'),appSecret))return res.sendStatus(401);
   const events=metaIncomingMessages(req.body,phoneNumberId);
   res.sendStatus(200);
   for(const event of events){
    chain=chain.then(async()=>{
     if(!done.mark(event.id))return;
     const jid=event.from+'@s.whatsapp.net';
     const reply=event.imageId
       ? await onImage(jid,event.text,await downloadImage(event.imageId))
       : await onText(jid,event.text);
     if(reply){const id=await send(jid,reply);logger.info({accepted:!!id},'Meta aceitou resposta do Digão');}
    }).catch(e=>logger.error({error:e.message},'Falha processando webhook Meta'));
   }
  });
 }
 return {register,send};
}
