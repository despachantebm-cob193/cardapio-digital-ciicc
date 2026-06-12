# TASKS — MVP Cardapio Digital CIICC

Data: 2026-06-12
Status geral: FASE_5_EM_ANDAMENTO

Este arquivo acompanha a execucao do projeto por fases. Deve ser atualizado a cada novo chat, branch ou PR.

## Legenda

- [ ] Pendente
- [x] Concluido
- [~] Parcial
- [!] Bloqueado

## FASE 0 — Governanca e planejamento

Status: CONCLUIDA

- [x] Necessidade original registrada.
- [x] Produto definido como autoatendimento interno.
- [x] Arquitetura alvo definida: Supabase, Vercel e PWA.
- [x] Mapa de evolucao criado.
- [x] Governanca inicial criada.
- [x] TASKS inicial criado.
- [x] PRD completo do MVP.
- [x] Arquitetura tecnica do MVP.
- [x] Modelo de dados Supabase.
- [x] Criterios finais de aceite.
- [x] PR documental da Fase 0 mergeada.

## FASE 1 — Limpeza e CI

Status: CONCLUIDA

- [x] README real do produto.
- [x] Titulo do app atualizado.
- [x] Arquivo de exemplo de variaveis.
- [x] CI com validacao de tipos e build.
- [x] Mapeamento de legado Firebase/prototipo.

## FASE 2 — Autenticacao e Supabase

Status: CONCLUIDA

- [x] Cliente Supabase.
- [x] Login Google.
- [x] Perfil de usuario.
- [x] Perfil administrador.
- [ ] Remocao do fluxo Firebase.

## FASE 3 — Dados do MVP

Status: NAO_INICIADA

- [ ] Produtos.
- [ ] Categorias.
- [ ] Estoque.
- [ ] Lotes.
- [ ] Vendas.
- [ ] Itens de venda.
- [ ] Pagamentos.
- [ ] Comprovantes.
- [ ] Movimentos de estoque.
- [ ] Politicas de acesso.

## FASE 4 — Area cliente

Status: NAO_INICIADA

- [ ] Catalogo.
- [ ] Carrinho.
- [ ] Registro de retirada.
- [ ] PIX.
- [ ] Dinheiro na caixinha.
- [ ] Pagamento futuro.
- [ ] Historico pessoal.

## FASE 5 — Area admin

Status: NAO_INICIADA

- [ ] Dashboard diario.
- [ ] Produtos.
- [ ] Estoque.
- [ ] Lotes pereciveis.
- [ ] Vendas.
- [ ] Pagamentos.
- [ ] Fechamento diario.

## FASE 6 — PWA offline

Status: NAO_INICIADA

- [ ] Instalavel.
- [ ] Cache.
- [ ] Fila offline.
- [ ] Sincronizacao.
- [ ] Conflitos.

## FASE 7 — Producao

Status: NAO_INICIADA

- [ ] Deploy Vercel.
- [ ] Variaveis de ambiente.
- [ ] Teste em producao.

## FASE 8 — Gate MVP

Status: NAO_INICIADA

- [ ] Teste cliente.
- [ ] Teste admin.
- [ ] Teste estoque.
- [ ] Teste pagamentos.
- [ ] Teste offline.
- [ ] Piloto interno.

## Decisoes registradas

- Produto: autoatendimento interno com controle de retirada.
- Banco alvo: Supabase.
- Deploy alvo: Vercel.
- App alvo: PWA.
- Auth alvo: Google pelo Supabase.
- Firebase atual: legado/prototipo a migrar.
- PRD vigente: docs/PRD_MVP.md.
- Arquitetura tecnica vigente: docs/TECHNICAL_ARCHITECTURE_MVP.md.
- Modelo de dados Supabase vigente: docs/SUPABASE_DATA_MODEL_MVP.md.
- Criterios de aceite vigentes: docs/MVP_ACCEPTANCE_CRITERIA.md.

## Fase 2 — Supabase Auth

Status: CONCLUIDA_E_MERGEADA  
Branch: feat/fase-2-supabase-auth  
Data de início: 2026-06-12

### Concluído nesta fase

- [x] Sincronizar main pós-merge da PR #2.
- [x] Criar branch `feat/fase-2-supabase-auth`.
- [x] Auditar arquitetura atual antes de editar.
- [x] Instalar `@supabase/supabase-js`.
- [x] Criar cliente Supabase inicial.
- [x] Criar camada inicial de autenticação/sessão Supabase.
- [x] Criar tipos mínimos de perfil/role.
- [x] Criar tipagem Vite para variáveis `VITE_*`.
- [x] Validar `npm run lint`.
- [x] Validar `npm run build`.
- [x] Manter Firebase como legado ativo durante a transição.

### Pendente nesta fase

- [x] Integrar login Google via Supabase em fluxo controlado.
- [ ] Mapear substituição progressiva dos pontos Firebase em runtime.
- [x] Confirmar ausência de segredos reais antes do commit.
- [x] Abrir PR separada da Fase 2.

### Fora de escopo mantido

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
- Remoção abrupta do Firebase.


## Fase 3 — Supabase Google Auth Flow

Status: CONCLUIDA_E_MERGEADA
Branch: feat/fase-3-supabase-google-auth-flow
Data de início: 2026-06-12

### Concluído nesta fase

- [x] Sincronizar main pós-merge da PR #3.
- [x] Criar branch `feat/fase-3-supabase-google-auth-flow`.
- [x] Auditar `App.tsx`, `AdminLogin`, `CustomerRegistrationGate` e fluxos atuais de autenticação.
- [x] Integrar login Google via Supabase Auth no fluxo visual controlado do admin.
- [x] Manter Firebase como legado ativo durante a transição.
- [x] Neutralizar texto visual obsoleto diretamente ligado ao login Google.
- [x] Validar `npm run lint`.
- [x] Validar `npm run build`.
- [x] Criar auditoria documental da Fase 3.

### Pendente nesta fase

- [x] Abrir PR separada da Fase 3.

### Fora de escopo mantido

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


## FASE 4A — Perfis e Roles Supabase

Status: CONCLUIDA_E_MERGEADA

Branch: feat/fase-4-supabase-profiles-roles

- [x] Gate pós-merge da Fase 3.
- [x] Branch de Fase 4 criada.
- [x] Auditoria de App.tsx, AdminLogin, CustomerRegistrationGate, authTypes e serviços Supabase.
- [x] Serviço inicial de profile Supabase criado.
- [x] Leitura de profile por auth_user_id preparada.
- [x] Helper de admin ativo criado.
- [x] App.tsx ajustado para exigir profile admin ativo em sessão Supabase.
- [x] Firebase legado mantido durante transição.
- [x] Auditoria documental da Fase 4 revisada.
- [x] Validação final lint/build.
- [x] Commit local.
- [x] Push da branch.
- [x] PR separada.
- [x] PR #5 mergeada.

Fora de escopo mantido nesta fase:

- Vendas.
- Carrinho.
- Checkout.
- Estoque.
- Lotes.
- Pagamentos.
- Comprovantes.
- Storage.
- PWA/offline real.
- Deploy produção.
- Migrations completas de negócio.
- RLS final.
- Remoção total do Firebase.
- Dashboard operacional completo.
- Fechamento diário.

## FASE 5A — Migrations e RLS inicial Supabase Profiles

Status: EM_ANDAMENTO

Branch: feat/fase-5-supabase-profiles-migrations-rls
Base segura: 00e746e

### Concluído nesta fase

- [x] Confirmar PR #5 mergeada.
- [x] Criar branch `feat/fase-5-supabase-profiles-migrations-rls`.
- [x] Auditar `docs/SUPABASE_DATA_MODEL_MVP.md`.
- [x] Auditar service de profiles criado na Fase 4.
- [x] Criar estrutura `supabase/migrations`.
- [x] Criar migration inicial de `profiles`.
- [x] Criar enum `user_role`.
- [x] Criar enum `profile_status`.
- [x] Criar tabela `profiles`.
- [x] Criar indices de `auth_user_id`, `email`, `role` e `status`.
- [x] Habilitar RLS em `profiles`.
- [x] Criar policies minimas de leitura, insert proprio e update proprio/admin.
- [x] Criar trigger de protecao contra elevacao indevida de role/status por usuario nao admin.
- [x] Documentar estrategia segura para primeiro admin.
- [x] Manter Firebase legado ativo.
- [x] Criar auditoria documental da Fase 5.

### Pendente nesta fase

- [ ] Validar `npm run lint` localmente ou via CI.
- [ ] Validar `npm run build` localmente ou via CI.
- [ ] Revisar SQL antes de aplicar em Supabase real.
- [ ] Abrir PR separada da Fase 5.

### Fora de escopo mantido

- Vendas.
- Carrinho.
- Checkout.
- Estoque.
- Lotes.
- Pagamentos.
- Comprovantes.
- Storage.
- PWA/offline real.
- Dashboard operacional.
- Fechamento diario.
- Remocao total do Firebase.
- Migracao completa do comprador.
- Fluxo financeiro.
