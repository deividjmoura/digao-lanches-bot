// BR Code Pix estático (sem liquidação automática). Nunca confirmar só pelo comprovante.
const tlv=(tag,val)=>tag+String(Buffer.byteLength(String(val),'utf8')).padStart(2,'0')+val;
export function crc16(str){ let crc=0xffff; for(const b of Buffer.from(str,'utf8')){crc ^= b<<8; for(let i=0;i<8;i++)crc=((crc&0x8000)?(crc<<1)^0x1021:crc<<1)&0xffff;} return crc.toString(16).toUpperCase().padStart(4,'0');}
export function buildPix({key,name,city,amountCents,txid}){
  if(!key||!name||!city)throw new Error('Chave Pix e dados do recebedor não configurados');
  if(!Number.isInteger(amountCents)||amountCents<=0)throw new Error('Valor Pix inválido');
  const merchant=tlv('00','br.gov.bcb.pix')+tlv('01',key.trim());
  const emv=tlv('00','01')+tlv('26',merchant)+tlv('52','0000')+tlv('53','986')
    +tlv('54',(amountCents/100).toFixed(2))+tlv('58','BR')
    +tlv('59',name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').slice(0,25).toUpperCase())
    +tlv('60',city.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').slice(0,15).toUpperCase())
    +tlv('62',tlv('05',String(txid).replace(/[^A-Za-z0-9]/g,'').slice(0,25)||'***'));
  const toCrc=emv+'6304';return toCrc+crc16(toCrc);
}
