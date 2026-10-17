// Isolated, fail-closed LID/PN decryption fallback for Baileys 7.0.0-rc14.
// Experimental: validate in CI before considering a production deploy.
// Inspired by https://github.com/WhiskeySockets/Baileys/pull/2763
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const marker = 'DIGAO_LID_PN_DECRYPT_RETRY_V2';
const exactVersion = '7.0.0-rc14';

const pattern = /case\s+['"]pkmsg['"]\s*:\s*case\s+['"]msg['"]\s*:\s*msgBuffer\s*=\s*await\s+repository\.decryptMessage\(\{\s*jid:\s*decryptionJid\s*,\s*type:\s*e2eType\s*,\s*ciphertext:\s*content\s*,?\s*\}\)\s*;?\s*break\s*;?/g;

const replacement = [
  "case 'pkmsg':",
  "case 'msg': {",
  "  try {",
  "    msgBuffer = await repository.decryptMessage({ jid: decryptionJid, type: e2eType, ciphertext: content });",
  "  } catch (primaryError) {",
  "    // DIGAO_LID_PN_DECRYPT_RETRY_V2: only alternate addresses supplied by this stanza.",
  "    const alt = isLidUser(decryptionJid)",
  "      ? (stanza.attrs.participant_pn || stanza.attrs.sender_pn || stanza.attrs.peer_recipient_pn)",
  "      : (stanza.attrs.participant_lid || stanza.attrs.sender_lid || stanza.attrs.peer_recipient_lid);",
  "    const correctType = isLidUser(decryptionJid)",
  "      ? /^\\d+(?::\\d+)?@s\\.whatsapp\\.net$/.test(alt || '')",
  "      : /^\\d+(?::\\d+)?@lid$/.test(alt || '');",
  "    if (!correctType || alt === decryptionJid) throw primaryError;",
  "    try {",
  "      msgBuffer = await repository.decryptMessage({ jid: alt, type: e2eType, ciphertext: content });",
  "      logger.info('LID/PN decryption recovered using stanza alternate identity');",
  "    } catch {",
  "      throw primaryError;",
  "    }",
  "  }",
  "  break;",
  "}"
].join('\n');

export function patchSource(source) {
  if (source.includes(marker)) return { changed: false, source };
  // A changed vendor package must never be patched blindly.
  if (!source.includes('isLidUser') || !source.includes('getDecryptionJid'))
    throw new Error('Required Baileys identity helpers unavailable; refusing patch');
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1)
    throw new Error('Expected exactly one Baileys decrypt block, found ' + matches.length);
  return { changed: true, source: source.replace(pattern, () => replacement) };
}

function apply() {
  const base = resolve('node_modules/@whiskeysockets/baileys');
  const pkg = JSON.parse(readFileSync(resolve(base, 'package.json'), 'utf8'));
  if (pkg.version !== exactVersion)
    throw new Error('Baileys version mismatch: expected ' + exactVersion + ', found ' + pkg.version);
  const file = resolve(base, 'lib/Utils/decode-wa-message.js');
  const oldCode = readFileSync(file, 'utf8');
  const result = patchSource(oldCode);
  if (result.changed) writeFileSync(file, result.source, 'utf8');
  console.log(result.changed ? 'Applied Digão Baileys LID/PN fallback V2' : 'Digão Baileys fallback already present');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) apply();
