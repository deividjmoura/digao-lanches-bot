import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import pino from 'pino';
import makeWASocket, {useMultiFileAuthState,DisconnectReason,downloadMediaMessage,Browsers} from '@whiskeysockets/baileys';
import {handleMessage,resumeHuman,pauseForOwner} from './app.js';
import {listOrders,getOrder,updateOrder,update} from './store.js';
const app=express();app.disable('x-powered-by');app.use(express.json({limit:'128kb'}));
const logger=pino({level:process.env.LOG_LEVEL||'info'});
const dataDir=process.env.DATA_DIR||'./data';
let sock=null, starting=false;
const owner=String(process.env.OWNER_PHONE||'').replace(/\D/g,'');
const token=process.env.ADMIN_TOKEN||'';
const safe=(s)=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function auth(req,res,next){if(!token||token==='ALTERE_PARA_UM_TOKEN_LONGO_ALEATORIO')return res.status(503).json({error:'ADMIN_TOKEN não configurado'});if(req.get('authorization')!=='Bearer '+token)return res.status(401).json({error:'Não autorizado'});next();}
app.get('/health',(_req,res)=>res.json({ok:true,whatsapp:!!sock?.user,version:'0.1.0'}));
app.get('/admin',(_req,res)=>{res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:");res.type('html').send(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Digão | Pedidos</title><style>body{font:16px system-ui;background:#181717;color:#eee;max-width:930px;margin:2rem auto;padding:0 1rem}input,button{padding:12px;border-radius:8px;border:0;margin:4px}button{background:#f7b52b;cursor:pointer;font-weight:bold}article{background:#292727;border-radius:12px;padding:18px;margin:15px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#ccc}</style><h1>🍔 Digão Lanches — Pedidos</h1><p>Somente para o responsável. Antes de aprovar Pix, verifique o crédito no extrato da conta (valor e identificador).</p><input type="password" id="token" placeholder="ADMIN_TOKEN"><button onclick="load()">Entrar / atualizar</button><main id="orders"></main><script>
let secret='';async function api(url,opts={}){return fetch(url,{...opts,headers:{'authorization':'Bearer '+secret,'content-type':'application/json'}})}
async function load(){secret=document.getElementById('token').value||secret;const r=await api('/api/orders');if(!r.ok){document.getElementById('orders').textContent='Token inválido ou configuração pendente';return}let orders=await r.json();const main=document.getElementById('orders');main.replaceChildren();for(const o of orders){const a=document.createElement('article');const h=document.createElement('h3');h.textContent=o.id+' — '+(o.total/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+' — '+o.status;a.append(h);const p=document.createElement('pre');p.textContent='Contato: '+o.jid+'\n'+o.items.map(x=>x.qty+'x '+x.name+' | Extras: '+x.extras.map(e=>e.name).join(', ')+' | Obs: '+x.note).join('\n')+'\n'+o.fulfillment+' | '+(o.address||'retirada')+'\nPagamento: '+o.payment;a.append(p);if(o.proofPath){const img=document.createElement('img');img.style.maxWidth='100%';img.style.maxHeight='280px';api('/api/orders/'+encodeURIComponent(o.id)+'/proof').then(r=>{if(r.ok)return r.blob();throw Error('Falha')}).then(blob=>{img.src=URL.createObjectURL(blob)}).catch(()=>{img.alt='Comprovante indisponível'});a.append(img)}for(const [action,label] of [['accept','Aceitar pedido'],['approve_pix','Confirmar Pix no extrato'],['reject','Rejeitar'],['complete','Entregue']]){if(action==='approve_pix'&&o.payment!=='pix')continue;const b=document.createElement('button');b.textContent=label;b.onclick=async()=>{if(action==='approve_pix'&&!confirm('VOCÊ CONFERIU o recebimento na conta bancária, não apenas a imagem?'))return;const r=await api('/api/orders/'+encodeURIComponent(o.id)+'/'+action,{method:'POST',body:JSON.stringify({bankVerified:action==='approve_pix'})});if(!r.ok)alert((await r.json()).error);await load()};a.append(b)}const b=document.createElement('button');b.textContent='Liberar atendimento automático';b.onclick=async()=>{await api('/api/resume',{method:'POST',body:JSON.stringify({jid:o.jid})});alert('Atendimento automático liberado')};a.append(b);main.append(a)}}</script></html>`);});
app.get('/api/orders',auth,(_req,res)=>res.json(listOrders()));
app.get('/api/orders/:id/proof',auth,(req,res,next)=>{const o=getOrder(req.params.id);if(!o?.proofPath)return res.sendStatus(404);res.type('image/jpeg').sendFile(path.resolve(o.proofPath),err=>{if(err&&!res.headersSent)next(err)});});
async function send(jid,text){if(sock?.user)try{await sock.sendMessage(jid,{text});}catch(e){logger.error({err:e.message},'Falha ao avisar cliente');}}
app.post('/api/orders/:id/:action',auth,async(req,res)=>{const o=getOrder(req.params.id),action=req.params.action;if(!o)return res.status(404).json({error:'Pedido não existe'});let status;
 if(action==='approve_pix'){if(o.payment!=='pix'||!['proof_submitted','awaiting_proof'].includes(o.status))return res.status(409).json({error:'Pedido não está aguardando Pix'});if(req.body.bankVerified!==true)return res.status(400).json({error:'É obrigatório conferir o crédito na conta bancária'});status='confirmed';}
 else if(action==='accept'){if(o.payment!=='later'||o.status!=='awaiting_payment_on_delivery')return res.status(409).json({error:'Situação inválida'});status='confirmed';}
 else if(action==='reject'){if(['completed','rejected'].includes(o.status))return res.status(409).json({error:'Situação inválida'});status='rejected';}
 else if(action==='complete'){if(o.status!=='confirmed')return res.status(409).json({error:'Confirme o pedido antes'});status='completed';}
 else return res.status(404).json({error:'Ação desconhecida'});
 updateOrder(o.id,{status,verifiedAt:action==='approve_pix'?new Date().toISOString():o.verifiedAt});
 const messages={confirmed:'✅ Seu pedido '+o.id+' foi confirmado pelo Digão! 🍔',rejected:'⚠️ O pedido '+o.id+' não foi aprovado. Fale com o Digão para mais informações.',completed:'🍔 Seu pedido '+o.id+' foi finalizado. Obrigado!'};if(messages[status])await send(o.jid,'🍔 DIGÃO BOT | '+messages[status]);
 res.json({ok:true,status});
});
app.post('/api/resume',auth,(req,res)=>{const jid=String(req.body.jid||'');if(!/^\d+@s\.whatsapp\.net$/.test(jid))return res.status(400).json({error:'jid inválido'});resumeHuman(jid);res.json({ok:true});});
app.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>logger.info('Digão HTTP online'));
async function startWhatsApp(){if(starting)return;starting=true;try{
 // Reset versionado: remove somente as credenciais antigas, uma única vez por token.
 const resetId=process.env.RESET_WHATSAPP_AUTH_ID||'';
 if(resetId){
   const marker=path.join(dataDir,'.last-whatsapp-reset');
   const done=fs.existsSync(marker)?fs.readFileSync(marker,'utf8'):'';
   if(done!==resetId){
     fs.rmSync(path.join(dataDir,'whatsapp-auth'),{recursive:true,force:true});
     fs.writeFileSync(marker,resetId,{mode:0o600});
     logger.warn('Credenciais antigas do WhatsApp apagadas para novo pareamento; pedidos preservados');
   }
 }
 const {state,saveCreds}=await useMultiFileAuthState(path.join(dataDir,'whatsapp-auth'));
 sock=makeWASocket({auth:state,logger:pino({level:'warn'}),browser:Browsers.ubuntu('Chrome'),connectTimeoutMs:60000,keepAliveIntervalMs:30000,markOnlineOnConnect:false,syncFullHistory:false});
 sock.ev.on('creds.update',saveCreds);
 // Pareamento por código de 8 caracteres em vez de QR; número informado pelo proprietário.
 let pairingRequested=false;
 sock.ev.on('connection.update',({connection,lastDisconnect,qr})=>{if(qr && !state.creds.registered && !pairingRequested){
  pairingRequested=true;
  const phone=(process.env.OWNER_PHONE||'').replace(/\D/g,'');
  if(!/^\d{10,15}$/.test(phone)){logger.error('OWNER_PHONE inválido para pareamento');}
  else sock.requestPairingCode(phone).then(code=>logger.info({pairingCode:code},'CÓDIGO DE PAREAMENTO WHATSAPP (temporário)')).catch(err=>{pairingRequested=false;logger.error({error:err.message},'Erro ao gerar código de pareamento');});
}if(connection==='open')logger.info('WhatsApp conectado');if(connection==='close'){sock=null;const code=lastDisconnect?.error?.output?.statusCode;if(code===DisconnectReason.loggedOut){logger.error('Sessão deslogada; verificar pareamento e auth');return;}setTimeout(()=>{starting=false;startWhatsApp();},5000);}});
 sock.ev.on('messages.upsert',async({messages,type})=>{logger.info({type,count:messages.length},'Lote de mensagens recebido, sem conteúdo');if(!['notify','append'].includes(type))return;for(const msg of messages){try{
 const jid=msg.key.remoteJid;if(!jid||msg.key.remoteJid==='status@broadcast'||jid.endsWith('@g.us')||!msg.message)continue;
 const sender=msg.key.remoteJidAlt?.endsWith('@s.whatsapp.net')?msg.key.remoteJidAlt:jid;
 logger.info({senderType:jid.split('@')[1],fromMe:!!msg.key.fromMe,hasText:!!(msg.message.conversation||msg.message.extendedTextMessage?.text),type},'Mensagem WhatsApp recebida (sem conteúdo)');
 const content=msg.message.ephemeralMessage?.message||msg.message;
 const image=content.imageMessage||content.documentMessage?.mimetype?.startsWith('image/')&&content.documentMessage;
 const text=content.conversation||content.extendedTextMessage?.text||content.imageMessage?.caption||'';
 if(msg.key.fromMe){
   // O Baileys também vê as mensagens que ele próprio envia. Só uma mensagem
   // humana SEM o prefixo do bot deve pausar o atendimento automático.
   if(text.trim()&&!text.startsWith('🍔 DIGÃO BOT |'))pauseForOwner(sender,60);
   continue;
 }
 if(image){const buf=await downloadMediaMessage(msg,'buffer',{}, {logger,reuploadRequest:sock.updateMediaMessage});const result=handleMessage(sender,text,{media:true});if(result){const orders=listOrders();const current=orders.find(o=>o.jid===sender&&o.status==='proof_submitted'&&!o.proofPath);if(current){const dir=path.join(dataDir,'proofs');fs.mkdirSync(dir,{recursive:true});const dest=path.join(dir,current.id+'.jpg');fs.writeFileSync(dest,buf,{mode:0o600});updateOrder(current.id,{proofPath:dest});}await send(jid,result);}continue;}
 if(!text.trim())continue;
 const result=handleMessage(sender,text);if(result)await send(jid,result);
 }catch(e){logger.error({error:e.message},'Erro ao processar mensagem');}}});
 }catch(e){logger.error({error:e.message},'Falha ao conectar WhatsApp');starting=false;setTimeout(startWhatsApp,10000);}}
if(process.env.ENABLE_WHATSAPP==='true')startWhatsApp();else logger.info('WhatsApp desativado por ENABLE_WHATSAPP=false; painel e fluxo prontos');
