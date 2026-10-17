# Digão — conexão oficial Meta Cloud API

## Por que existe este conector
O atendimento e o cardápio usam a lógica atual em src/app.js. Este conector substitui a comunicação não oficial Baileys por webhook assinado e envio Graph API. **Não usar os dois transportes ao mesmo tempo.**

## Antes de ativar
O titular do WhatsApp Business deve autorizar a ligação à WhatsApp Business Platform. Para continuar usando o aplicativo no mesmo número, deve escolher **Coexistência pelo Embedded Signup** de um parceiro/Tech Provider habilitado. A compatibilidade, a elegibilidade e eventuais cobranças devem ser confirmadas previamente. **Não registrar o número pelo fluxo tradicional sem confirmar se isso afetará o aplicativo Business.**

A Meta pode cobrar pelas mensagens de atendimento; verificar tabela atual e taxas do parceiro antes de ativar o serviço. A integração não pode ser feita somente com número telefônico e não dispensa autorização do estabelecimento.

## Ativação no Railway
1. Solicitar domínio HTTPS público do serviço digao-lanches-bot.
2. Obter de maneira privada o Phone Number ID, token de acesso permanente autorizado para mensagens, App Secret e um webhook Verify Token aleatório.
3. Cadastrar variáveis somente no Railway (nunca no GitHub nem em grupos):
   - WHATSAPP_TRANSPORT=meta-cloud
   - META_ACCESS_TOKEN=...
   - META_PHONE_NUMBER_ID=...
   - META_APP_SECRET=...
   - META_VERIFY_TOKEN=...
   - META_GRAPH_VERSION=v25.0 (atualizar conforme a versão aprovada da Graph API)
   - DATA_DIR=/data
4. No painel da Meta, definir webhook https://DOMINIO/webhook/meta e o mesmo Verify Token.
5. Inscrever o campo messages. Para Coexistência e pausa automática durante respostas manuais, habilitar também smb_message_echoes quando disponível.
6. Verificar /health: cloudConfigured=true prova somente que as credenciais foram lidas, não que o número está operacional.
7. Testar menu, categorias, carrinho, comprovante e atendimento humano antes de uso comercial.

## Segurança
- POST /webhook/meta exige assinatura HMAC SHA-256 em X-Hub-Signature-256 sobre bytes originais. Assinatura inválida retorna 401.
- Só eventos associados a META_PHONE_NUMBER_ID são processados.
- Eventos já vistos são registrados em /data/cloud-webhook-processed.json para evitar duplicações acidentais de pedidos.
- O código não apaga /data/whatsapp-auth nem /data/store.json.
- O registro de atividade não guarda conversas nem tokens.
- É necessário configurar ADMIN_TOKEN privado para revisão dos pedidos, e conferir pagamento no banco antes de marcar Pix como confirmado.
- Delivery permanece desabilitado até Digão definir taxas.

## Limites conhecidos
O webhook serializa mensagens e evita processar o mesmo ID duas vezes; porém, o mecanismo de fila transacional para recuperação de falhas após responder 200 ainda precisa ser fortalecido antes de uso em grande escala. Também é necessário confirmar limites, custos e disponibilidade de Coexistência com a Meta/parceiro no momento da ativação.

Fontes:
- Documentação oficial do Graph API: https://www.postman.com/meta/whatsapp-business-platform/
- SDK de referência da Meta para segurança de webhook: https://github.com/fbsamples/whatsapp-api-examples
