# Fase 6 — Aplicação e validação Supabase Profiles/RLS

## Projeto

Cardápio Digital CIICC

## Escopo

Aplicar e validar no ambiente Supabase real a migration de profiles, roles e RLS criada na Fase 5, mantendo o Firebase como legado ativo e sem iniciar funcionalidades de venda, estoque, carrinho, checkout, pagamento, comprovantes, Storage ou PWA/offline real.

## Base técnica

- Branch: feat/fase-6-apply-validate-supabase-profiles-rls
- Base inicial: d7a7654
- Migration alvo: supabase/migrations/20260612180000_create_profiles_rls.sql
- Projeto Supabase real: dwbvclvqratgiyusnliq
- Nome do projeto no Dashboard: cardapio digital ciicc

## Resultado da aplicação real

A migration de profiles/RLS foi aplicada no Supabase real por meio do SQL Editor do Dashboard.

Motivo do uso do Dashboard:

- A Supabase CLI via npx supabase funcionou localmente.
- O projeto foi autenticado e localizado corretamente.
- A rede corporativa bloqueava PostgreSQL/pooler inicialmente.
- Em outra rede, as portas do pooler 5432 e 6543 passaram.
- A CLI continuou bloqueada por permissão ao tentar configurar pooler via supabase link.
- Para não bloquear a Fase 6, a aplicação foi feita pelo Dashboard SQL Editor, com validação SQL posterior.

## Estruturas aplicadas

A migration aplicada materializou:

- extensão pgcrypto;
- enum public.user_role com valores customer e admin;
- enum public.profile_status com valores active, inactive e blocked;
- tabela public.profiles;
- índices profiles_auth_user_id_idx, profiles_email_idx, profiles_role_idx e profiles_status_idx;
- função public.set_updated_at();
- função public.is_active_admin();
- função public.prevent_profile_privilege_escalation();
- trigger set_profiles_updated_at;
- trigger prevent_profile_privilege_escalation;
- RLS habilitado em public.profiles;
- policies profiles_select_own_or_admin, profiles_insert_self_customer e profiles_update_own_limited_or_admin.

## Hardening de grants

Após a aplicação inicial, a validação de grants indicou permissões amplas herdadas ou pré-existentes para o role authenticated.

Foi aplicado hardening manual controlado no SQL Editor:

SQL executado:
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant usage on type public.user_role to authenticated;
grant usage on type public.profile_status to authenticated;
grant execute on function public.is_active_admin() to authenticated;

## Resultado validado dos grants finais

A validação final para anon e authenticated retornou somente:

authenticated | INSERT
authenticated | SELECT
authenticated | UPDATE

Resultado: aprovado.

## Segurança e dados sensíveis

Nenhum dado real de admin, e-mail, senha, token, service_role key ou segredo foi versionado.

A estratégia de primeiro admin permanece manual e fora do repositório.

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

FASE_6_SUPABASE_PROFILES_RLS_APLICADA_E_VALIDADA_PARCIALMENTE=SIM

Pendente para conclusão total da Fase 6:

- criar/validar primeiro admin manualmente sem versionar dados reais;
- testar login Google admin;
- testar bloqueio de usuário comum;
- atualizar TASKS.md;
- validar npm run lint;
- validar npm run build;
- abrir PR separada com alterações documentais.
