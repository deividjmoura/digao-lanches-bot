# 🍔 Digão Lanches Bot

Atendimento conversacional para WhatsApp, com catálogo pesquisável, carrinho, adicionais, entrega/retirada e confirmação manual de pagamentos Pix.

> **Status:** base de desenvolvimento. Não há WhatsApp conectado ou pagamentos configurados. Os preços do cardápio são os da imagem enviada em 17/10/2026 e devem ser conferidos antes da estreia.

## Recursos
- Menu textual por números, busca direta por nome (sem obrigar o cliente a navegar).
- Categorias: lanches, hot-dogs, combos de casal, bebidas e adicionais.
- Carrinho por contato, quantidade, extras, observações e confirmação.
- Pix Copia e Cola BR Code gerado **somente com chave Pix configurada**; envio de comprovante não confirma pagamento.
- Aprovação manual em painel de pedidos protegido por `ADMIN_TOKEN`.
- Pagamento na entrega: dinheiro ou cartão, sem cobrar antecipadamente.
- Prefixo obrigatório **🍔 DIGÃO BOT |** em toda resposta automatizada.
- Atendente humano pode assumir a conversa usando o painel.
- QR de pareamento disponível no terminal; auth persistente em `DATA_DIR`.

## Rodar local
```sh
npm install
cp .env.example .env
npm start
```

Abra `http://localhost:3000/admin?token=SEU_ADMIN_TOKEN` para ver os pedidos.

## Railway
1. Criar serviço Node.js vinculado ao repositório.
2. Definir `ADMIN_TOKEN` seguro, `OWNER_PHONE=5516997767962`, `DATA_DIR=/data` e `PORT` (Railway também fornece PORT automaticamente).
3. Montar **volume persistente em /data**: sessões do WhatsApp, carrinhos e pedidos são armazenados ali. Sem volume, perderá dados e poderá exigir novo pareamento.
4. Configurar `PIX_KEY`, `PIX_MERCHANT_NAME` e `PIX_MERCHANT_CITY` **somente depois** de recebê-los do estabelecimento.
5. Ver QR nos logs de deploy para parear quando o número estiver disponível. Não conecte antes da autorização do dono.

### Limitações de implantação
A conexão via Baileys usa WhatsApp Web **não oficial**, sujeita a desconexões e restrições. Para operação comercial estável, avaliar WhatsApp Business Platform oficial. Sem provedor PSP, Pix é **estático com valor e identificador**; o painel requer conferência **no extrato bancário** antes de aprovar. Uma foto de comprovante sozinha não é prova de pagamento.

## Comandos do cliente
`menu`, `buscar x-bacon`, `carrinho`, `finalizar`, `cancelar`, `atendente`. Também entende números do menu.

## Avisos sobre o cardápio
- Combos com itens cortados no rodapé das imagens aparecem como **pendentes de confirmação** e não são vendidos automaticamente.
- Bebidas mostradas em painéis distintos foram consolidadas; disponibilidade e preços devem ser confirmados.
- Observações de remoção de ingrediente não geram desconto automático.

## Segurança
Não publicar dados reais de clientes, chave Pix secreta do PSP, tokens nem arquivos da pasta `data/`. `ADMIN_TOKEN` é obrigatório para painel e rotas administrativas. Verifique pedidos no banco antes de aprovar Pix.

Veja `src/catalog.js` para itens e preços e `src/app.js` para as regras do atendimento.
