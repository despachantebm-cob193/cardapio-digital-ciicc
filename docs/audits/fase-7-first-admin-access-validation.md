# Fase 7 — Validação do primeiro admin e bloqueio de acessos

## Projeto

Cardápio Digital CIICC

## Escopo

Criar ou validar o primeiro profile admin manualmente no Supabase real, testar login Google como admin, testar bloqueio de usuário comum e registrar evidências sanitizadas.

Esta fase não inicia funcionalidades de venda, estoque, carrinho, checkout, pagamento, comprovantes, Storage, PWA/offline real, dashboard operacional, fechamento diário ou remoção total do Firebase.

## Base técnica

- Branch: feat/fase-7-validate-first-admin-access
- Base segura: 630a364
- Fase anterior: Fase 6 concluída e mergeada na PR #7
- Migration validada: supabase/migrations/20260612180000_create_profiles_rls.sql
- Projeto Supabase real: dwbvclvqratgiyusnliq

## Referências auditadas

- docs/audits/fase-6-apply-validate-supabase-profiles-rls.md
- supabase/migrations/20260612180000_create_profiles_rls.sql
- src/App.tsx
- src/components/AdminLogin.tsx
- src/features/auth/supabaseAuthService.ts
- src/features/auth/supabaseProfileService.ts

## Situação herdada da Fase 6

A Fase 6 aplicou e validou no Supabase real a estrutura de profiles/RLS, incluindo:

- tabela public.profiles;
- enum public.user_role;
- enum public.profile_status;
- RLS habilitado em public.profiles;
- policies mínimas para leitura, insert próprio e update próprio/admin;
- função public.is_active_admin();
- trigger de proteção contra elevação indevida de role/status por usuário não-admin;
- grants finais mínimos para authenticated: INSERT, SELECT, UPDATE.

Nenhum dado real de admin, e-mail, UUID, token ou service_role key foi versionado.

## Validação manual obrigatória

Executar apenas no Supabase Dashboard e no navegador local, sem colar dados reais no chat e sem versionar dados reais.

### 1. Criar ou validar primeiro admin

Status: PENDENTE

Critério de aceite:

- profile criado ou atualizado manualmente em public.profiles;
- auth_user_id aponta para usuário existente em auth.users;
- role = admin;
- status = active;
- e-mail real não versionado;
- UUID real não versionado.

SQL orientativo sanitizado, para execução local no Dashboard SQL Editor com placeholders substituídos fora do repositório:

```sql
insert into public.profiles (
  auth_user_id,
  email,
  display_name,
  role,
  status
)
values (
  '<AUTH_USERS_ID_DO_ADMIN>',
  '<EMAIL_DO_ADMIN>',
  '<NOME_DO_ADMIN>',
  'admin',
  'active'
)
on conflict (auth_user_id) do update
set
  role = 'admin',
  status = 'active',
  updated_at = now();
```

Consulta sanitizada de validação:

```sql
select
  id,
  auth_user_id,
  role,
  status,
  created_at,
  updated_at
from public.profiles
where auth_user_id = '<AUTH_USERS_ID_DO_ADMIN>';
```

### 2. Testar login Google admin

Status: PENDENTE

Critério de aceite:

- login Google via Supabase iniciado pelo botão do admin;
- sessão Supabase retornada ao app;
- profile correspondente carregado por auth_user_id;
- isActiveAdminProfile retorna acesso válido para role admin e status active;
- painel admin fica acessível para o usuário admin.

### 3. Testar bloqueio de usuário comum

Status: PENDENTE

Critério de aceite:

- login Google via Supabase com usuário sem profile admin ativo;
- app não libera adminAuthenticated;
- painel admin permanece bloqueado;
- nenhum dado real do usuário comum é versionado.

## Evidências sanitizadas a registrar

Registrar somente evidências sem dados reais:

- ADMIN_PROFILE_PRESENTE=SIM/NAO
- ADMIN_ROLE=admin
- ADMIN_STATUS=active
- LOGIN_GOOGLE_ADMIN=OK/FALHOU
- ADMIN_PANEL_ACCESS=OK/FALHOU
- COMMON_USER_BLOCKED=OK/FALHOU
- EMAIL_REAL_VERSIONADO=NAO
- UUID_REAL_VERSIONADO=NAO
- TOKEN_VERSIONADO=NAO
- SERVICE_ROLE_KEY_VERSIONADA=NAO

## Validações técnicas

Status inicial:

- npm run lint: PENDENTE
- npm run build: PENDENTE

## Segurança

- Não versionar e-mail real.
- Não versionar UUID real.
- Não versionar token.
- Não versionar service_role key.
- Não colar dados reais no chat.
- Se houve token Supabase CLI exposto operacionalmente em fase anterior, revogar o token antigo e gerar novo somente se necessário.

## Firebase

Firebase permanece como legado ativo mantido.

Nenhuma remoção, substituição total ou migração completa do Firebase foi executada nesta fase.

## Funcionalidades de negócio

Não foram iniciadas funcionalidades de:

- vendas;
- carrinho;
- checkout;
- estoque;
- lotes;
- pagamentos;
- comprovantes;
- Storage;
- PWA/offline real;
- dashboard operacional;
- fechamento diário.

## Status

FASE_7_FIRST_ADMIN_ACCESS_VALIDATION=INICIADA
PRIMEIRO_ADMIN=PENDENTE
TESTE_LOGIN_ADMIN=PENDENTE
TESTE_BLOQUEIO_USUARIO_COMUM=PENDENTE
DADOS_SENSIVEIS_VERSIONADOS=NAO_IDENTIFICADOS
