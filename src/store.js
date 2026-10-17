import fs from 'node:fs';
import path from 'node:path';
const dir=process.env.DATA_DIR||'./data';
fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,'store.json');
let data={ sessions:{}, orders:{}, counter:0 };
try { data={...data,...JSON.parse(fs.readFileSync(file,'utf8'))}; } catch(e) { if(e.code!=='ENOENT') throw e; }
function save(){ const tmp=file+'.tmp'; fs.writeFileSync(tmp,JSON.stringify(data,null,2),{mode:0o600}); fs.renameSync(tmp,file); }
export const state = key => { if(!data.sessions[key]){data.sessions[key]={cart:[],step:'menu',search:[],updatedAt:Date.now()};save();} return data.sessions[key]; };
export const update = (key,patch) => { Object.assign(state(key),patch,{updatedAt:Date.now()}); save(); };
export const nextOrderId = () => { data.counter++; save(); return 'DG-'+String(data.counter).padStart(6,'0'); };
export const addOrder = order => { data.orders[order.id]=order; save(); };
export const listOrders = () => Object.values(data.orders).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
export const getOrder = id => data.orders[id];
export const updateOrder = (id,patch) => { if(!data.orders[id])return null; Object.assign(data.orders[id],patch,{updatedAt:new Date().toISOString()});save();return data.orders[id]; };
