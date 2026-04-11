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
