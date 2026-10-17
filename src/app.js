import {products,categories,extras,findProducts,money,normalize} from './catalog.js';
import {state,update,nextOrderId,addOrder,getOrder,updateOrder} from './store.js';
import {buildPix} from './pix.js';
const tag='🍔 DIGÃO BOT | ';
const say=text=>tag+text;
const productById=id=>products.find(p=>p.id===id&&p.available);
const total=s=>s.cart.reduce((acc,entry)=>acc+entry.qty*(entry.cents+entry.extras.reduce((a,e)=>a+e.cents,0)),0);
const lines=s=>s.cart.map((c,i)=>`${i+1}. ${c.qty}x ${c.name} — ${money((c.cents+c.extras.reduce((a,e)=>a+e.cents,0))*c.qty)}${c.extras.length?'\n   + '+c.extras.map(e=>e.name).join(', '):''}${c.note?'\n   Obs: '+c.note:''}`).join('\n');
const menu=()=>say('Falaaa! 😎🔥 Bateu aquela fome? No Digão Lanches a gente resolve!\n\n1️⃣ 🍔 Lanches\n2️⃣ 🌭 Hot-dogs\n3️⃣ 🍟 Combos casal\n4️⃣ 👑 Combos trio\n5️⃣ 🥤 Bebidas\n6️⃣ 🔎 Buscar pelo nome\n7️⃣ 🛒 Meu carrinho\n8️⃣ 🙋 Falar com o Digão\n\nPode mandar o número OU digitar o nome do lanche!\nDigite *menu* para voltar.');
const catalog=cat=>say(categories.find(c=>c.id===cat)?.label+'\n\n'+products.filter(p=>p.category===cat&&p.available).map((p,i)=>`${i+1}. ${p.name} — ${money(p.cents)}`).join('\n')+'\n\nResponda com o número do item ou pesquise por nome. Digite *menu* para voltar.');
const cart=s=>say(s.cart.length? '🛒 Seu carrinho:\n\n'+lines(s)+'\n\n*Subtotal: '+money(total(s))+'*\n\nDigite *finalizar*, *remover 1* ou *menu*.':'Seu carrinho está vazio! Digite *menu* para ver as opções. 😊');
const clean=t=>String(t||'').trim().slice(0,500);
const GREETING_COOLDOWN_MS=12*60*60*1000;
const SESSION_IDLE_MS=30*60*1000;
// O WhatsApp Business também é usado por uma pessoa. Não responder a bate-papo comum.
export function pauseForOwner(jid,minutes=60){
  const current=state(jid);
  update(jid,{humanUntil:Math.max(current.humanUntil||0,Date.now()+minutes*60000)});
}
export function handleMessage(jid,input,{media=false}={}){
 const s=state(jid);const raw=clean(input),low=normalize(raw);
 // Handoff explícito não expira. Mensagens pessoais do dono pausam o robô temporariamente.
 if(s.human || (s.humanUntil||0)>Date.now()) return null;
 const wasNew=!s.lastGreetingAt;
 const idleMs=Date.now()-(s.lastCustomerAt||0);
 update(jid,{lastCustomerAt:Date.now()});
 const isGreeting=['oi','ola','bom dia','boa tarde','boa noite','opa','e ai','eae','hey','hello'].includes(low);
 const explicitMenu=['menu','inicio','começar','comecar'].includes(low);
 if(wasNew && !media){
   update(jid,{lastGreetingAt:Date.now(),step:'menu'});
   // Não perder a intenção do cliente quando ele já pede um produto na primeira mensagem.
   if(isGreeting||!raw||explicitMenu||(!findProducts(raw).length&&!/^buscar |^pesquisar /i.test(raw)))return menu();
 }
 if(isGreeting){
   if(Date.now()-(s.lastGreetingAt||0)>=GREETING_COOLDOWN_MS && idleMs>=SESSION_IDLE_MS){
     update(jid,{lastGreetingAt:Date.now(),step:'menu'});
     return menu();
   }
   return null;
 }
 if(media){
   if(s.step==='proof'&&s.orderId){
     const order=getOrder(s.orderId);
     if(order?.status==='awaiting_proof'){updateOrder(order.id,{status:'proof_submitted',proofReceivedAt:new Date().toISOString()});update(jid,{step:'awaiting_review'});return say('📩 Recebemos seu comprovante! Pedido *'+order.id+'* aguardando conferência no banco pelo Digão. Ainda não está confirmado, tá?');}
   }
   return say('Recebi sua imagem. 😊 Se for comprovante, finalize primeiro um pedido por Pix.');
 }
 if(explicitMenu){update(jid,{step:'menu',search:[]});return menu();}
 if(['atendente','humano','falar com digao','8'].includes(low)&&(s.step==='menu'||low!=='8')){update(jid,{human:true,step:'human'});return say('🙋 Beleza! Chamei o Digão para atender você. As respostas automáticas ficam pausadas até ele liberar a conversa.');}
 if(low==='carrinho'||(low==='7'&&s.step==='menu'))return cart(s);
 if(low==='cancelar'){
  if(s.orderId&&getOrder(s.orderId)&&['awaiting_proof','proof_submitted','awaiting_payment_on_delivery'].includes(getOrder(s.orderId).status))updateOrder(s.orderId,{status:'cancel_requested'});
  update(jid,{step:'menu',cart:[],selected:null,orderId:null});return say('Pedido/carrinho cancelado (se já enviado, o Digão fará a confirmação).\n\n'+menu().replace(tag,''));
 }
 if(low.startsWith('remover ')){const n=Number(low.split(' ')[1]);if(n>=1&&n<=s.cart.length){s.cart.splice(n-1,1);update(jid,{cart:s.cart});return cart(s);}return say('Informe *remover 1* (número do item do carrinho).');}
 if(['finalizar','fechar pedido'].includes(low)){if(!s.cart.length)return cart(s);update(jid,{step:'fulfillment'});return say('Perfeito! 😋 Vai querer *retirar* no balcão ou receber por *entrega*?');}
 if(s.step==='fulfillment'){
   if(low==='retirar'||low==='retirada'){update(jid,{fulfillment:'pickup',address:'',step:'payment'});return say('Como prefere pagar?\n1️⃣ Pix antecipado\n2️⃣ Na retirada (dinheiro/cartão)');}
   if(low==='entrega'){if(process.env.ENABLE_DELIVERY!=='true')return say('A entrega precisa ser confirmada pelo Digão. Digite *retirar* ou *atendente* para combinar a entrega.');update(jid,{fulfillment:'delivery',step:'address'});return say('Digite o endereço completo com rua, número, bairro e referência.');}
   return say('Responda *retirar* ou *entrega*.');
 }
 if(s.step==='address'){if(raw.length<12)return say('Por favor, informe endereço mais completo (rua, número e bairro).');update(jid,{address:raw,step:'payment'});return say('Como prefere pagar?\n1️⃣ Pix antecipado\n2️⃣ Na entrega (dinheiro/cartão)');}
 if(s.step==='payment'){
   const pix=low==='1'||low.includes('pix'),later=low==='2'||low.includes('entrega')||low.includes('retirada')||low.includes('dinheiro')||low.includes('cartao');
   if(!pix&&!later)return say('Responda *1* (Pix) ou *2* (pagar ao receber).');
   if(pix&&!process.env.PIX_KEY)return say('O Pix ainda não está configurado. Escolha *2* para pagamento ao receber ou fale com o Digão.');
   const fee=s.fulfillment==='delivery'?Math.round(Number(process.env.DELIVERY_FEE||0)*100):0;
   if(!Number.isSafeInteger(fee)||fee<0)return say('Taxa de entrega inválida. Chame o Digão.');
   const id=nextOrderId(),amount=total(s)+fee;
   const order={id,jid,items:structuredClone(s.cart),fulfillment:s.fulfillment,address:s.address||'',fee,total:amount,payment:pix?'pix':'later',status:pix?'awaiting_proof':'awaiting_payment_on_delivery',createdAt:new Date().toISOString()};
   let code='';
   if(pix){try{code=buildPix({key:process.env.PIX_KEY,name:process.env.PIX_MERCHANT_NAME||'DIGAO LANCHES',city:process.env.PIX_MERCHANT_CITY||'RIBEIRAO PRETO',amountCents:amount,txid:id});}catch(e){return say('Pix indisponível. Escolha *2* ou fale com o Digão.');}}
   addOrder(order);update(jid,{cart:[],orderId:id,step:pix?'proof':'awaiting_review'});
   return pix?say(`🧾 Pedido *${id}* — ${money(amount)}\n\n💚 *Pix Copia e Cola:*\n${code}\n\nDepois de pagar, *envie a imagem do comprovante aqui*. O Digão vai conferir o recebimento no banco e liberar seu pedido. O envio não equivale à confirmação.`)
    :say(`🧾 Pedido *${id}* recebido! Total: *${money(amount)}*\nPagamento ao ${s.fulfillment==='delivery'?'receber':'retirar'} (dinheiro/cartão).\n\n⏳ Aguardando o Digão aceitar o pedido. Obrigado! 🍔`);
 }
 if(['proof','awaiting_review'].includes(s.step))return say('⏳ Seu pedido '+(s.orderId||'')+' ainda está em análise. Se pagou por Pix, envie a *imagem* do comprovante. Para falar com o Digão, digite *atendente*.');
 if(s.step==='note'&&s.selected){
   const note=low==='nao'||low==='sem'||low==='pular'?'':raw;
   s.selected.note=note; s.cart.push(s.selected);update(jid,{selected:null,cart:s.cart,step:'menu'});
   return say('✅ Adicionado ao carrinho!\n\n'+cart(s).replace(tag,'')+'\n\nPode escolher outro lanche ou digitar *finalizar*.');
 }
 if(s.step==='extras'&&s.selected){
   if(low==='0'||low==='pronto'||low==='sem adicionais'){update(jid,{step:'note'});return say('Alguma observação? Ex.: *sem cebola*. Ou digite *pular*.');}
   const choices=raw.split(/[ ,]+/).map(Number);
   if(!choices.length||choices.some(n=>!Number.isInteger(n)||n<1||n>extras.length))return say('Digite o número do adicional (ex.: 1 6) ou *0* para continuar.');
   s.selected.extras=choices.map(n=>({...extras[n-1]}));update(jid,{selected:s.selected,step:'note'});
   return say('✅ Adicionais anotados! Alguma observação? Ex.: *sem cebola*. Ou digite *pular*.');
 }
 if(s.step==='quantity'&&s.selected){
   const qty=Number(low);
   if(!Number.isInteger(qty)||qty<1||qty>20)return say('Quantos? Digite uma quantidade entre 1 e 20.');
   s.selected.qty=qty;
   if(!s.selected.allowExtras){update(jid,{step:'note'});return say('Alguma observação para este item? Ou digite *pular*.');}
   update(jid,{step:'extras'});
   return say('Quer adicionais? 🔥\n'+extras.map((e,i)=>`${i+1}. ${e.name} +${money(e.cents)}`).join('\n')+'\n\nDigite o número (ex.: *1 6*) ou *0* para nenhum.');
 }
 if(low.startsWith('buscar ')||low.startsWith('pesquisar ')){
   const q=raw.replace(/^\S+\s+/,'');return search(jid,q);
 }
 if(s.step==='search_prompt')return search(jid,raw);
 if(s.step==='choose'&&/^\d+$/.test(low)){
   const idx=Number(low)-1, id=s.search[idx];if(id){return select(jid,id);}return say('Número não encontrado. Pesquise novamente ou digite *menu*.');
 }
 if(s.step==='category'&&/^\d+$/.test(low)){
   const idx=Number(low)-1,id=s.search[idx];if(id)return select(jid,id);return say('Número inválido. Digite *menu* para recomeçar.');
 }
 if(s.step==='menu'&&['1','2','3','4','5','6'].includes(low)){
   if(low==='6'){update(jid,{step:'search_prompt'});return say('🔎 Qual lanche você quer? Digite uma palavra como *bacon*, *hot-dog* ou *frango*.');}
   const c=['lanches','hotdogs','combos','combos-trio','bebidas'][Number(low)-1],ids=products.filter(p=>p.category===c&&p.available).map(p=>p.id);
   update(jid,{step:'category',search:ids});return catalog(c);
 }
 // Busca direta: mesmo sem comando.
 if(raw.length>=2){const matches=findProducts(raw);if(matches.length)return search(jid,raw);}
 // Não responder a mensagens casuais ou desconhecidas. O cliente sempre pode pedir *menu*.
 return null;
}
function select(jid,id){
 const p=productById(id);if(!p)return say('Item não disponível. Digite *menu*.');
 update(jid,{step:'quantity',selected:{id:p.id,name:p.name,cents:p.cents,extras:[],qty:1,note:'',allowExtras:p.extras}});
 return say(`😋 *${p.name}* — ${money(p.cents)}\n${p.description||''}\n\nQuantos você quer? (1 a 20)`);
}
function search(jid,q){
 const found=findProducts(q);
 if(!found.length){update(jid,{step:'search_prompt'});return say('Não encontrei esse lanche 😅 Tente outra palavra, como *bacon*, *frango* ou *calabresa*.');}
 update(jid,{step:'choose',search:found.map(x=>x.id)});
 return say('🔎 Encontrei:\n\n'+found.map((p,i)=>`${i+1}. ${p.name} — ${money(p.cents)}`).join('\n')+'\n\nDigite o número do item desejado.');
}
export function resumeHuman(jid){update(jid,{human:false,step:'menu'});}
export function sessionsStatus(jid){return state(jid);}
