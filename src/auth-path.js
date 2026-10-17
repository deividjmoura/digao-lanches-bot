import path from 'node:path';

// Keep the legacy login untouched. A new Baileys login uses a separate
// directory under the same persistent volume, not a recursive deletion.
export function resolveWhatsAppAuthDir(dataDir,override){
 const base=path.resolve(dataDir);
 if(!String(override||'').trim())return path.join(base,'whatsapp-auth');
 const selected=path.resolve(String(override));
 if(selected===base||!selected.startsWith(base+path.sep))
  throw new Error('WHATSAPP_AUTH_DIR deve ser uma subpasta de DATA_DIR');
 return selected;
}
