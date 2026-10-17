// Experimental, narrowly scoped LID/PN fallback from Baileys PR #2763.
// Only runs on the exact known 7.0.0-rc14 compiled code shape.
// Refuses to install if the vendor layout changes, rather than silently patching wrong code.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const filename=resolve('node_modules/@whiskeysockets/baileys/lib/Utils/decode-wa-message.js');
const source=readFileSync(filename,'utf8');
const marker='DIGAO_LID_PN_DECRYPT_RETRY_V1';
if(source.includes(marker)){console.log('Baileys LID/PN fallback already present');process.exit(0);}
const pattern=/case\s+['"]pkmsg['"]\s*:\s*case\s+['"]msg['"]\s*:\s*msgBuffer\s*=\s*await\s+repository\.decryptMessage\(\{\s*jid:\s*decryptionJid,?\s*type:\s*e2eType,?\s*ciphertext:\s*content,?\s*\}\)\s*;\s*break\s*;/g;
const matches=[...source.matchAll(pattern)];
if(matches.length!==1)throw Error('Unexpected Baileys decrypt implementation; aborting experimental patch');
const replacement=`case 'pkmsg':
case 'msg':
  try {
    msgBuffer = await repository.decryptMessage({jid: decryptionJid, type: e2eType, ciphertext: content});
  } catch (primaryError) {
    // DIGAO_LID_PN_DECRYPT_RETRY_V1
    const failure = String(primaryError?.message || primaryError);
    let alt = isLidUser(decryptionJid)
      ? (stanza.attrs.participant_pn || stanza.attrs.sender_pn || stanza.attrs.peer_recipient_pn)
      : (stanza.attrs.participant_lid || stanza.attrs.sender_lid || stanza.attrs.peer_recipient_lid);
    if (!alt || alt === decryptionJid || !/@(lid|s\\.whatsapp\\.net)$/.test(alt)
        || !/bad mac|no session|invalid prekey|closed session/i.test(failure)) {
      throw primaryError;
    }
    // Preserve device number: alternate stanza addresses sometimes omit it.
    const device = decryptionJid.match(/^[^:]+:(\\d+)@/);
    if(device && !alt.includes(':'))alt=alt.replace('@', ':'+device[1]+'@');
    try {
      msgBuffer = await repository.decryptMessage({jid: alt, type: e2eType, ciphertext: content});
      logger.info('LID/PN decryption recovered via verified stanza alternate');
    } catch {
      throw primaryError;
    }
  }
  break;`;
writeFileSync(filename,source.replace(pattern,replacement));
console.log('Applied scoped Baileys LID/PN decrypt fallback (experimental)');
