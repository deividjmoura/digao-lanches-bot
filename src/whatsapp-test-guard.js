// Uma conexão de teste deve responder apenas ao telefone explicitamente autorizado.
export function allowedTestMessage(key,allowed){
 if(!String(allowed??'').trim())return true;
 const phone=String(allowed).replace(/\D/g,'');
 if(!/^\d{10,15}$/.test(phone))return false;
 return [key?.remoteJid,key?.remoteJidAlt].some(jid=>{
  const match=/^(\d+)(?::\d+)?@s\.whatsapp\.net$/.exec(String(jid||''));
  return match?.[1]===phone;
 });
}
