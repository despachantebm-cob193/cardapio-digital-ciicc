# Fase 2 — Fundação Supabase Auth

Data: 2026-06-12  
Fase: FASE_2_SUPABASE_AUTH  
Status: CONCLUIDA_TECNICAMENTE  
Tipo: Fundação técnica sem implementação funcional de negócio

## Objetivo

Iniciar a fundação técnica do Supabase no projeto Cardápio Digital CIICC, preparando cliente Supabase e camada inicial de autenticação Google via Supabase Auth.

Esta fase não implementa vendas, carrinho, estoque, pagamentos, comprovantes, dashboard admin, migrations, RLS final, storage ou PWA/offline real.

## Escopo executado

- Instalação de `@supabase/supabase-js`.
- Criação de `src/lib/supabaseClient.ts`.
- Validação de variáveis:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Criação de camada inicial em `src/features/auth/supabaseAuthService.ts`.
- Criação de tipos mínimos em `src/features/auth/authTypes.ts`.
- Criação de tipagem Vite em `src/vite-env.d.ts`.
- Firebase mantido como legado ativo durante a transição.

## Arquivos criados

- `src/lib/supabaseClient.ts`
- `src/features/auth/supabaseAuthService.ts`
- `src/features/auth/authTypes.ts`
- `src/vite-env.d.ts`

## Arquivos alterados

- `package.json`
- `package-lock.json`
- `.env.example` se aplicável

## Decisão técnica

A Fase 2 introduz Supabase de forma incremental, sem substituir abruptamente Firebase.

O Firebase permanece funcional como legado/protótipo até que a autenticação Supabase esteja validada e a substituição progressiva seja feita em PRs controladas.

## Fora de escopo confirmado

- Remoção total do Firebase.
- Migrations completas.
- RLS final.
- Storage de comprovantes.
- Vendas.
- Carrinho.
- Checkout.
- Estoque.
- Lotes.
- Pagamentos.
- Comprovantes.
- Dashboard admin.
- PWA/offline real.
- Deploy Vercel real.

## Riscos conhecidos

- O app ainda contém acoplamento ativo com Firebase.
- O fluxo visual ainda referencia textos de Firebase em telas antigas.
- O cliente Supabase depende de `.env.local` real em ambiente local.
- A integração visual do login Google via Supabase ainda precisa ser feita com cautela para não quebrar o protótipo.

## Validações

- `npm run lint` — OK após criação de `src/vite-env.d.ts`.
- `npm run build` — OK.
- Segredos reais — auditoria final executada antes do commit, sem ocorrência identificada.

## Estado

- SUPABASE_CLIENT=CRIADO
- SUPABASE_AUTH_SERVICE=CRIADO
- FIREBASE_STATUS=LEGADO_ATIVO_MANTIDO
- IMPLEMENTACAO_FUNCIONAL_DE_NEGOCIO=NAO
