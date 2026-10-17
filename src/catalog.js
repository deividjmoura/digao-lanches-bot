// Valores transcritos das imagens enviadas em 17/10/2026. Confirmar com proprietário.
export const categories = [
  { id: 'lanches', label: '🍔 Lanches' },
  { id: 'hotdogs', label: '🌭 Hot-dogs' },
  { id: 'combos', label: '🍟 Combos casal' },
  { id: 'combos-trio', label: '🍔 Combos trio' },
  { id: 'bebidas', label: '🥤 Bebidas' }
];
const item = (id, name, cents, category, description = '', extras = true, available = true) =>
  ({ id, name, cents, category, description, extras, available });
export const products = [
  item('hamburguer','Hambúrguer',1900,'lanches','2 carnes, presunto, queijo, batata palha, maionese, ketchup, mostarda'),
  item('x-salada','X-Salada',2600,'lanches','2 carnes, presunto, queijo, batata palha, tomate, cebola, milho, alface, maionese, ketchup, mostarda e bacon'),
  item('x-bacon','X-Bacon',3400,'lanches','2 carnes, presunto, queijo, batata palha, tomate, cebola, milho, alface, maionese, ketchup, mostarda e bacon'),
  item('x-tudo','X-Tudo',3600,'lanches','2 carnes, ovo, salsicha, bacon, presunto, queijo, batata palha, tomate, cebola, milho, alface, maionese, ketchup, mostarda'),
  item('x-calabresa','X-Calabresa',3200,'lanches','2 carnes, presunto, queijo, batata palha, tomate, cebola, milho, alface, maionese, ketchup, mostarda, calabresa'),
  item('pao-linguica','Pão com Linguiça',3400,'lanches','200g linguiça caseira, presunto, queijo, batata palha, tomate, cebola, milho, alface, maionese, ketchup, mostarda, catupiry'),
  item('x-frango','X-Frango',3800,'lanches','200g filé de peito, catupiry, presunto, queijo, tomate, cebola, milho, alface, maionese, ketchup, mostarda, bacon'),
  item('x-frango-tudo','X-Frango Tudo',4400,'lanches','Filé de peito, catupiry, presunto, queijo, tomate, cebola, milho, alface, maionese, ketchup, mostarda, 2 carnes, ovo, bacon, salsicha'),
  item('x-tudo-duplo','X-Tudo Duplo',3800,'lanches','2 carnes, 2 ovos, 2 salsichas, bacon, presunto, queijo, batata palha, tomate, cebola, milho, alface, maionese, ketchup, mostarda'),
  item('x-egg','X-Egg',3000,'lanches','2 ovos, 2 carnes, presunto, queijo, tomate, cebola, alface, maionese, ketchup, mostarda, bacon'),
  item('misto-simples','Misto Simples',2000,'lanches','Presunto, mussarela, tomate, cebola, milho, catupiry, batata palha, ketchup, mostarda, maionese'),
  item('bauru','Bauru (contra-filé 200g)',4600,'lanches','200g contra-filé, bacon, alface, tomate, cebola, milho, presunto, mussarela, batata palha, ketchup, mostarda, maionese'),
  item('hot-simples','Hot-dog Simples',2000,'hotdogs','Pão, 2 salsichas, tomate, cebola, milho, presunto, mussarela, batata palha, molhos'),
  item('hot-bacon','Hot-dog Bacon',2400,'hotdogs','Pão, 2 salsichas, tomate, cebola, milho, presunto, mussarela, batata palha, bacon, molhos'),
  item('hot-bacon-cheddar','Hot-dog Bacon Cheddar/Catupiry',2600,'hotdogs','Pão, 2 salsichas, tomate, cebola, milho, presunto, mussarela, batata palha, bacon, molhos, cheddar ou catupiry'),
  item('hot-bacon-calabresa','Hot-dog Bacon Calabresa',2800,'hotdogs','Pão, 2 salsichas, tomate, cebola, milho, presunto, mussarela, batata palha, bacon, molhos, calabresa'),
  item('hot-bacon-frango','Hot-dog Bacon Frango',3200,'hotdogs','Pão, 2 salsichas, tomate, cebola, milho, presunto, mussarela, batata palha, bacon, molhos, frango'),
  item('combo-salada','Casal: 2x X-Salada + Guaraná 2L',5400,'combos','Dois X-Salada e refrigerante Guaraná 2L',false),
  item('combo-bacon','Casal: 2x X-Bacon + Guaraná 2L',7000,'combos','Dois X-Bacon e refrigerante Guaraná 2L',false),
  item('combo-frango','Casal: 2x X-Frango + Guaraná 2L',7800,'combos','Dois X-Frango e refrigerante Guaraná 2L',false),
  item('combo-tudo','Casal: 2x X-Tudo + Guaraná 2L',7400,'combos','Dois X-Tudo e refrigerante Guaraná 2L',false),
  item('combo-tudo-duplo','Casal: 2x X-Tudo Duplo + Guaraná 2L',8000,'combos','Dois X-Tudo Duplo e refrigerante Guaraná 2L',false),
  item('combo-bauru','Casal: 2x Bauru + Guaraná 2L',9600,'combos','Dois Bauru e refrigerante Guaraná 2L',false),
  item('combo-hot-bacon','Casal: 2x Hot-dog Bacon + Guaraná 2L',5000,'combos','Dois Hot-dogs Bacon e refrigerante Guaraná 2L',false),
  item('combo-frango-tudo','Casal: 2x X-Frango Tudo + Guaraná 2L',9000,'combos','Dois X-Frango Tudo e refrigerante Guaraná 2L',false),
  item('trio-salada','Trio: 3x X-Salada + Roller 2L',8000,'combos-trio','Três X-Salada e refrigerante Roller 2L',false),
  item('trio-bacon','Trio: 3x X-Bacon + Roller 2L',10000,'combos-trio','Três X-Bacon e refrigerante Roller 2L',false),
  item('trio-frango','Trio: 3x X-Frango + Roller 2L',11200,'combos-trio','Três X-Frango e refrigerante Roller 2L',false),
  item('trio-tudo-duplo','Trio: 3x X-Tudo Duplo + Roller 2L',11800,'combos-trio','Três X-Tudo Duplo e refrigerante Roller 2L',false),
  item('trio-tudo','Trio: 3x X-Tudo + Roller 2L',11400,'combos-trio','Três X-Tudo e refrigerante Roller 2L',false),
  item('trio-bauru','Trio: 3x Bauru + Coca-Cola 2L',13200,'combos-trio','Três Bauru e Coca-Cola 2L',false),
  item('trio-hot-bacon','Trio: 3x Hot-dog Bacon + Roller 2L',7600,'combos-trio','Três Hot-dogs Bacon e Roller 2L',false),
  item('trio-frango-tudo','Trio: 3x X-Frango Tudo + Coca-Cola 2L',12600,'combos-trio','Três X-Frango Tudo e Coca-Cola 2L',false),
  item('roller-2l','Roller 2L',900,'bebidas','',false),
  item('coca-2l','Coca-Cola 2L',1200,'bebidas','',false),
  item('poty-2l','Poty 2L',900,'bebidas','',false),
  item('kuat-2l','Kuat 2L',800,'bebidas','',false),
  item('coca-lata','Coca-Cola lata',500,'bebidas','',false),
  item('fanta-lata','Fanta lata',500,'bebidas','',false)
];
export const extras = [
  { id:'salsicha',name:'Salsicha',cents:300 },
  { id:'carne',name:'Carne',cents:300 },
  { id:'ovo',name:'Ovo',cents:300 },
  { id:'cheddar',name:'Cheddar',cents:600 },
  { id:'catupiry',name:'Catupiry',cents:600 },
  { id:'bacon',name:'Bacon',cents:700 }
];
export const money = cents => (cents / 100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const normalize = text => String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const findProducts = query => {
  const q = normalize(query);
  return q ? products.filter(p => p.available && normalize(p.name+' '+p.description).includes(q)).slice(0,12) : [];
};
