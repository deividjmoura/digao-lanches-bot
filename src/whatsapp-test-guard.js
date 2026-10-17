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

export async function phoneForIncoming(key,lookup){
 const jids=[key?.remoteJidAlt,key?.remoteJid];
 const phone=jids.find(jid=>/^\d+(?::\d+)?@s\.whatsapp\.net$/.test(String(jid||'')));
 if(phone)return phone;
 const lid=jids.find(jid=>/^\d+(?::\d+)?@lid$/.test(String(jid||'')));
 if(!lid||typeof lookup!=='function')return null;
 try{const resolved=await lookup(lid);return /^\d+(?::\d+)?@s\.whatsapp\.net$/.test(String(resolved||''))?resolved:null;}
 catch{return null;}
}
