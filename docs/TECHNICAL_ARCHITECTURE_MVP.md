# Arquitetura Tecnica — MVP Cardapio Digital CIICC

Data: 2026-06-12
Status: ARQUITETURA_TECNICA_INICIAL
Fase: FASE_0
MVP_STATUS: NAO_INICIADO
Tipo: Documento tecnico de arquitetura

## 1. Objetivo

Este documento define a arquitetura tecnica alvo do MVP do Cardapio Digital CIICC, respeitando o PRD vigente em `docs/PRD_MVP.md`, a governanca em `docs/GOVERNANCE.md`, o roadmap em `docs/MVP_ROADMAP_CHECKLIST.md` e o controle de tarefas em `TASKS.md`.

Esta entrega e documental. Nao implementa banco, telas, autenticacao, PWA, deploy, migrations ou regras funcionais.

## 2. Stack alvo

- Frontend: React + Vite + TypeScript
- Banco: Supabase Postgres
- Autenticacao: Supabase Auth com Google
- Storage: Supabase Storage
- Deploy: Vercel
- PWA: manifest + service worker
- Offline: IndexedDB + fila de sincronizacao
- Controle de acesso: Supabase RLS
- Versionamento: GitHub com PRs pequenos por fase

## 3. Principios de arquitetura

1. Mobile-first para area cliente.
2. Admin protegido por role.
3. Offline-first controlado para retirada e fila de sincronizacao.
4. Auditoria obrigatoria para venda, pagamento e estoque.
5. Dados sensiveis protegidos por RLS.
6. Comprovantes em Storage com acesso controlado.
7. Nenhum segredo real versionado.
8. Separacao entre fases documentais e fases funcionais.
9. Historico preservado; evitar exclusao fisica de registros auditaveis.
10. Conflito offline deve ser conservador e revisavel por admin.

## 4. Modulos do frontend

### 4.1 Core

- bootstrap do app
- roteamento
- layout base
- provider de auth
- provider de conectividade
- provider de sincronizacao
- cliente Supabase
- camada de repositorios/services

### 4.2 Area cliente

- login
- catalogo
- busca/filtro
- carrinho
- checkout de retirada
- selecao de pagamento
- upload de comprovante PIX
- status de sincronizacao
- historico pessoal
- detalhe de venda pessoal

### 4.3 Area admin

- dashboard diario
- produtos
- categorias
- estoque
- lotes pereciveis
- vendas
- pagamentos
- comprovantes
- fechamento diario
- pendencias e conflitos offline

### 4.4 Offline/PWA

- manifest
- service worker
- cache de shell
- cache de catalogo
- IndexedDB
- fila de operacoes pendentes
- sincronizacao
- tratamento de conflitos

## 5. Estrutura sugerida de pastas

- src/app/App.tsx
- src/app/router.tsx
- src/app/providers/
- src/components/common/
- src/components/forms/
- src/components/layout/
- src/features/auth/
- src/features/catalog/
- src/features/cart/
- src/features/checkout/
- src/features/payments/
- src/features/sales/
- src/features/admin/
- src/features/inventory/
- src/features/batches/
- src/features/daily-closing/
- src/features/offline/
- src/lib/supabase/
- src/lib/indexeddb/
- src/lib/sync/
- src/lib/utils/
- src/types/
- src/constants/

## 6. Supabase Auth

### 6.1 Login

- Usar Google Provider via Supabase Auth.
- Todo usuario autenticado deve ter registro em `profiles`.
- Criacao/atualizacao de perfil pode ocorrer no primeiro login.

### 6.2 Roles

Roles minimas:

- `customer`
- `admin`

### 6.3 Guardas de rota

- Rotas cliente exigem usuario autenticado.
- Rotas admin exigem usuario autenticado com role `admin`.
- Usuario inativo/bloqueado nao deve registrar retirada.

## 7. Modelo de dados inicial

Este modelo sera detalhado em documento proprio de modelo Supabase/migrations. Esta secao define a arquitetura logica.

### 7.1 profiles

Finalidade:

- representar usuarios autenticados.

Campos recomendados:

- `id`
- `auth_user_id`
- `full_name`
- `email`
- `avatar_url`
- `role`
- `status`
- `created_at`
- `updated_at`

### 7.2 product_categories

Finalidade:

- agrupar produtos por tipo.

Campos recomendados:

- `id`
- `name`
- `slug`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

### 7.3 products

Finalidade:

- cadastro de produtos vendaveis.

Campos recomendados:

- `id`
- `category_id`
- `name`
- `slug`
- `description`
- `price_cents`
- `image_path`
- `is_perishable`
- `is_active`
- `stock_quantity`
- `low_stock_threshold`
- `sort_order`
- `created_at`
- `updated_at`

### 7.4 product_batches

Finalidade:

- controlar lotes pereciveis, sobras e descarte.

Campos recomendados:

- `id`
- `product_id`
- `batch_date`
- `expires_at`
- `initial_quantity`
- `sold_quantity`
- `leftover_quantity`
- `waste_quantity`
- `status`
- `notes`
- `created_by`
- `closed_by`
- `created_at`
- `closed_at`

### 7.5 sales

Finalidade:

- registrar retirada/venda.

Campos recomendados:

- `id`
- `local_id`
- `buyer_id`
- `total_cents`
- `status`
- `payment_status`
- `sync_status`
- `created_offline`
- `buyer_notes`
- `admin_notes`
- `created_at`
- `synced_at`
- `updated_at`

### 7.6 sale_items

Finalidade:

- itens de cada venda.

Campos recomendados:

- `id`
- `sale_id`
- `product_id`
- `batch_id`
- `product_name_snapshot`
- `unit_price_cents`
- `quantity`
- `subtotal_cents`
- `created_at`

### 7.7 payments

Finalidade:

- registrar pagamento declarado, pendente, confirmado ou rejeitado.

Campos recomendados:

- `id`
- `sale_id`
- `method`
- `status`
- `declared_amount_cents`
- `confirmed_amount_cents`
- `confirmed_by`
- `rejected_by`
- `rejection_reason`
- `customer_notes`
- `admin_notes`
- `created_at`
- `confirmed_at`
- `rejected_at`
- `updated_at`

### 7.8 payment_proofs

Finalidade:

- registrar comprovantes PIX.

Campos recomendados:

- `id`
- `payment_id`
- `uploaded_by`
- `storage_bucket`
- `storage_path`
- `file_name`
- `mime_type`
- `file_size`
- `status`
- `created_at`

### 7.9 stock_movements

Finalidade:

- auditar entradas, baixas, ajustes, sobras e descartes.

Campos recomendados:

- `id`
- `product_id`
- `batch_id`
- `sale_id`
- `type`
- `quantity_delta`
- `reason`
- `created_by`
- `created_at`

### 7.10 daily_closings

Finalidade:

- salvar fechamento diario.

Campos recomendados:

- `id`
- `closing_date`
- `total_sales_cents`
- `confirmed_pix_cents`
- `declared_cash_cents`
- `confirmed_cash_cents`
- `pay_later_cents`
- `pending_cents`
- `rejected_cents`
- `notes`
- `created_by`
- `created_at`
- `updated_at`

## 8. Status e enums recomendados

### 8.1 Role

- `customer`
- `admin`

### 8.2 Profile status

- `active`
- `inactive`
- `blocked`

### 8.3 Payment method

- `pix`
- `cash_box`
- `pay_later`

### 8.4 Payment status

- `declared`
- `proof_sent`
- `confirmed`
- `pending`
- `rejected`

### 8.5 Sale sync status

- `online`
- `pending_sync`
- `syncing`
- `synced`
- `conflict`
- `failed`

### 8.6 Batch status

- `open`
- `closed`
- `canceled`

### 8.7 Stock movement type

- `initial_balance`
- `purchase_entry`
- `sale_out`
- `manual_adjustment`
- `waste`
- `leftover`
- `correction`
- `sync_compensation`

## 9. RLS — estrategia inicial

### 9.1 profiles

- Usuario autenticado pode ler o proprio perfil.
- Usuario autenticado pode atualizar campos permitidos do proprio perfil.
- Admin pode ler perfis necessarios para auditoria operacional.
- Apenas admin pode alterar role/status.

### 9.2 products e product_categories

- Usuarios autenticados podem ler produtos/categorias ativos.
- Admin pode criar, editar e desativar.
- Evitar delete fisico quando houver venda relacionada.

### 9.3 sales e sale_items

- Cliente pode criar venda propria.
- Cliente pode ler apenas venda propria.
- Admin pode ler todas.
- Admin pode atualizar status administrativo quando necessario.
- Cliente nao pode alterar venda confirmada ou sincronizada fora do fluxo permitido.

### 9.4 payments e payment_proofs

- Cliente pode criar pagamento da propria venda.
- Cliente pode ler pagamentos da propria venda.
- Cliente pode anexar comprovante do proprio pagamento.
- Admin pode ler e validar todos.
- Apenas admin pode confirmar/rejeitar.

### 9.5 stock_movements

- Cliente nao deve criar movimento diretamente.
- Movimento deve ser criado por funcao/servico associado a venda ou por admin.
- Admin pode ler todos.
- Admin pode criar ajuste manual com motivo.

### 9.6 product_batches

- Cliente pode ler lote apenas indiretamente quando necessario para disponibilidade.
- Admin pode criar, fechar e ajustar.
- Alteracoes devem preservar auditoria.

### 9.7 daily_closings

- Apenas admin pode criar e ler fechamentos.
- Fechamento nao deve apagar ou ocultar pendencias.

## 10. Storage

### 10.1 Buckets recomendados

- `payment-proofs`
- `product-images`

### 10.2 payment-proofs

Regras:

- Upload permitido apenas para comprador autenticado dono do pagamento ou admin.
- Leitura por comprador dono da venda ou admin.
- Preferir URLs assinadas.
- Evitar bucket publico.
- Logs nao devem expor URL sensivel.

### 10.3 product-images

Regras:

- Leitura pode ser publica se as imagens nao forem sensiveis.
- Escrita apenas por admin.
- Otimizar tamanho e formato das imagens.

## 11. Offline e IndexedDB

### 11.1 Dados locais

Stores sugeridas:

- `catalog_cache`
- `cart_state`
- `pending_sales`
- `pending_payments`
- `pending_payment_proofs`
- `sync_queue`
- `sync_logs`
- `app_metadata`

### 11.2 Venda offline

Fluxo:

1. Usuario autenticado e com cache local abre catalogo.
2. Seleciona produtos.
3. Confirma retirada.
4. App cria `local_id`.
5. App grava venda, itens e pagamento localmente.
6. App exibe status `pending_sync`.
7. Ao voltar online, fila tenta sincronizar.
8. Se sincronizar, marca como `synced`.
9. Se houver conflito, marca como `conflict` para revisao admin.

### 11.3 Idempotencia

Cada venda offline deve possuir:

- `local_id` unico.
- `created_at` local.
- hash ou chave de idempotencia.
- status de sincronizacao.

O backend/banco deve impedir duplicidade baseada em `local_id` + usuario.

### 11.4 Conflitos

Conflitos esperados:

- estoque insuficiente;
- produto desativado;
- preco mudou;
- upload de comprovante falhou;
- tentativa duplicada.

Conduta:

- nao apagar dado local;
- registrar erro;
- exibir ao usuario;
- permitir revisao administrativa.

## 12. Camada de servicos

Servicos sugeridos:

- `authService`
- `profileService`
- `catalogService`
- `cartService`
- `checkoutService`
- `paymentService`
- `proofUploadService`
- `inventoryService`
- `batchService`
- `dailyClosingService`
- `offlineQueueService`
- `syncService`

## 13. Deploy Vercel

### 13.1 Variaveis esperadas

O `.env.example` deve documentar:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME`
- `VITE_APP_ENV`

Nao versionar segredos reais.

### 13.2 Ambientes

- local
- preview
- production

## 14. Validacao tecnica futura

Antes do piloto MVP:

- login Google validado;
- RLS testado para cliente/admin;
- CRUD admin validado;
- venda cliente validada;
- pagamento PIX/dinheiro/futuro validado;
- upload de comprovante validado;
- estoque/lote validado;
- fechamento diario validado;
- offline/sync validado;
- deploy Vercel validado.

## 15. Fora de escopo deste documento

Este documento nao implementa:

- migrations;
- componentes React;
- autenticacao;
- storage;
- service worker;
- IndexedDB;
- deploy;
- CI;
- testes automatizados.

## 16. Proximo passo recomendado

Criar documento de modelo de dados Supabase com tabelas, colunas, chaves, constraints, indices, policies RLS e buckets.

Arquivo recomendado:

`docs/SUPABASE_DATA_MODEL_MVP.md`

## 17. Estado final

- FASE_0=EM_ANDAMENTO
- ARQUITETURA_TECNICA_STATUS=CRIADA
- MVP_STATUS=NAO_INICIADO
- IMPLEMENTACAO_FUNCIONAL=NAO
