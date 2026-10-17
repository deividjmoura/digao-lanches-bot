import fs from 'node:fs';
import path from 'node:path';

export async function sendOneTimeSmoke({socket,phone,runId,dataDir,remember,onSubmitted}){
 if(!runId)return 'disabled';
 if(!/^[a-zA-Z0-9_-]{1,64}$/.test(runId))throw Error('Invalid test run identifier');
 if(!/^\d{10,15}$/.test(String(phone||'')))throw Error('Invalid approved test phone');
 const marker=path.join(dataDir,'.whatsapp-smoke-'+runId+'.sent');
 if(fs.existsSync(marker))return 'already-sent';
 const jid=phone+'@s.whatsapp.net';
 const text='🍔 DIGÃO BOT | Teste técnico de conexão: se esta mensagem chegou, responda *menu* aqui, por favor. Não é um pedido.';
 const message=await socket.sendMessage(jid,{text});
 if(!message?.key?.id)throw Error('WhatsApp did not confirm test send attempt');
 remember?.(message.key,text);
 onSubmitted?.(message.key);
 fs.mkdirSync(dataDir,{recursive:true});
 fs.writeFileSync(marker,new Date().toISOString(),{flag:'wx',mode:0o600});
 return 'submitted';
}
