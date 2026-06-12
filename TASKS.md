# TASKS — MVP Cardapio Digital CIICC

Data: 2026-06-12
Status geral: FASE_1_EM_ANDAMENTO

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

Status: EM_ANDAMENTO

- [x] README real do produto.
- [x] Titulo do app atualizado.
- [x] Arquivo de exemplo de variaveis.
- [x] CI com validacao de tipos e build.
- [x] Mapeamento de legado Firebase/prototipo.

## FASE 2 — Autenticacao e Supabase

Status: NAO_INICIADA

- [ ] Cliente Supabase.
- [ ] Login Google.
- [ ] Perfil de usuario.
- [ ] Perfil administrador.
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

Status: CONCLUIDA_TECNICAMENTE_AGUARDANDO_MERGE  
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

- [ ] Integrar login Google via Supabase em fluxo controlado.
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

Status: CONCLUIDA_TECNICAMENTE_AGUARDANDO_PR
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

- [ ] Abrir PR separada da Fase 3.

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
