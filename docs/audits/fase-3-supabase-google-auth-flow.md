
# Fase 3 — Supabase Google Auth Flow

Data: 2026-06-12  
Fase: FASE_3_SUPABASE_GOOGLE_AUTH_FLOW  
Status: CONCLUIDA_TECNICAMENTE  
Branch: feat/fase-3-supabase-google-auth-flow  
Base segura: 24f4d11  
Tipo: Integração visual controlada de autenticação, sem implementação funcional de negócio

## Objetivo

Integrar o login Google via Supabase Auth em ponto visual controlado do app, preservando o Firebase como legado ativo enquanto a substituição completa não estiver validada.

## Escopo executado até este ponto

- Sincronização da `main` local com `origin/main`.
- Confirmação da base segura `24f4d11`.
- Criação da branch `feat/fase-3-supabase-google-auth-flow`.
- Auditoria inicial dos pontos atuais de autenticação:
  - `src/App.tsx`
  - `src/components/AdminLogin.tsx`
  - `src/components/CustomerRegistrationGate.tsx`
  - `src/features/auth/supabaseAuthService.ts`
  - `src/lib/supabaseClient.ts`
- Integração do botão Google do painel admin com `signInWithGoogle` do Supabase.
- Leitura de sessão Supabase em `App.tsx` para reconhecer retorno do OAuth.
- Preservação do Firebase Auth/Firestore como legado ativo.
- Ajuste do cliente Supabase para não quebrar o app quando variáveis locais ainda não estiverem configuradas.

## Decisão técnica

O fluxo de cliente em `CustomerRegistrationGate` permanece no Firebase legado nesta fase, pois ainda depende de `uid` e persistência Firestore do protótipo.

A integração Supabase foi limitada ao login Google visual do painel admin, que já possuía um ponto de entrada Google e permite validação controlada sem implementar vendas, estoque, pagamentos ou funcionalidades de negócio.

## Firebase legado

O Firebase permanece ativo nos seguintes pontos:

- `src/firebase.ts`
- `src/dbService.ts`
- `src/App.tsx` para sessão legada
- `src/components/CustomerRegistrationGate.tsx`
- `src/components/AdminPanel.tsx`

A remoção total do Firebase permanece fora de escopo até validação completa da substituição.

## Fora de escopo confirmado

- Vendas.
- Carrinho.
- Checkout.
- Estoque.
- Lotes.
- Pagamentos.
- Comprovantes.
- Migrations completas.
- RLS final.
- Storage.
- PWA/offline real.
- Deploy produção.
- Remoção total do Firebase sem validação.

## Validações executadas

- `git diff --check` — OK após remoção de trailing whitespace em `TASKS.md`.
- `npm run lint` — OK.
- `npm run build` — OK.
- Revisão de diff — OK.
- Commit local — pendente neste ciclo.
- Abertura de PR separada da Fase 3 — pendente após push.

## Estado parcial

- SUPABASE_GOOGLE_AUTH_VISUAL_FLOW=INTEGRADO_ADMIN_CONTROLADO
- FIREBASE_STATUS=LEGADO_ATIVO_MANTIDO
- IMPLEMENTACAO_FUNCIONAL_DE_NEGOCIO=NAO_INICIADA
- LINT=OK
- BUILD=OK
