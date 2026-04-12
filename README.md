# Já Agendou!

Base SaaS multi-clínicas para Hostinger com Node.js + Express + EJS + MySQL.

## Como rodar localmente
1. Copie `.env.example` para `.env`
2. Instale dependências com `npm install`
3. Importe `database/schema.sql` no MySQL (base inicial)
4. Rode `npm run migrate` para aplicar compatibilidades/migrações
5. Rode `npm run dev`

## Login inicial
- E-mail: `admin@jaagendou.app`
- Senha: `123456`

## Conta mestre (permanente)
- E-mail: `otavio@jaagendou.app`
- Senha: `Otavio2805@`

## Estrutura
- `public/` assets estáticos
- `src/` backend
- `views/` telas EJS
- `database/schema.sql` banco inicial

## Webhook Hotmart (vendas)
Integração adicionada sem alterar os fluxos existentes do sistema.

1. Defina `HOTMART_WEBHOOK_TOKEN` no `.env`.
2. Defina `HOTMART_APPROVED_EVENTS` com os eventos que representam venda aprovada.
3. Defina `HOTMART_PLAN_MAPPINGS` mapeando o plano da Hotmart para dias de licença.
4. Rode `npm run migrate` para criar a tabela de eventos.
5. Configure no painel da Hotmart o endpoint `POST /api/webhook-hotmart` (compatível também com `POST /webhooks/hotmart`).
6. Envie o mesmo token no webhook (campo `hottok` ou header de token).

Eventos recebidos ficam registrados na tabela `hotmart_webhook_events` com idempotência por `event_key`.

Exemplo de mapeamento:

`HOTMART_PLAN_MAPPINGS=pacote_7:7,pacote_30:30,pacote_90:90,pacote_180:180,pacote_360:360`

Opcional (fallback por valor pago):

`HOTMART_PRICE_MAPPINGS=9.97:7,35.97:30,107.91:90,215.82:180,397.00:360`

Quando chegar uma venda aprovada mapeada, o sistema atualiza os mesmos campos de licença já usados hoje:

- `status = ativo`
- `licenca_dias = (dias do plano)`
- `licenca_inicio_em = NOW()`
- `licenca_fim_em = DATE_ADD(NOW(), INTERVAL dias DAY)`
- `desbloqueado_em = NOW()`

Se não existir clínica/usuário para o comprador, o webhook pode criar a conta automaticamente (`HOTMART_AUTO_CREATE_ACCOUNT=true`) e enviar e-mail com acesso inicial (login + senha temporária), desde que SMTP esteja configurado.

Como a venda é vinculada à clínica:

1. `clinica_id` no payload (`metadata/custom`), quando enviado.
2. Se não houver `clinica_id`, por e-mail do comprador (`buyer.email`) em `clinicas.email` ou `usuarios.email` (admin/super_admin).
