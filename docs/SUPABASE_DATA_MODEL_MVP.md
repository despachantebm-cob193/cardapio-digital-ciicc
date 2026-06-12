# Modelo de Dados Supabase — MVP Cardapio Digital CIICC

Data: 2026-06-12
Status: MODELO_DADOS_SUPABASE_INICIAL
Fase: FASE_0
MVP_STATUS: NAO_INICIADO
Tipo: Documento tecnico de modelo de dados

## 1. Objetivo

Este documento define o modelo de dados alvo do MVP no Supabase Postgres, com tabelas, campos, relacionamentos, constraints, indices, RLS, Storage e regras de auditoria.

Esta entrega e documental. Nao cria migrations, nao altera banco, nao implementa RLS e nao altera o app.

## 2. Referencias oficiais

- docs/PRD_MVP.md
- docs/TECHNICAL_ARCHITECTURE_MVP.md
- docs/GOVERNANCE.md
- docs/MVP_ROADMAP_CHECKLIST.md
- TASKS.md

## 3. Principios do modelo

1. Toda venda deve ser auditavel.
2. Todo pagamento deve estar vinculado a uma venda.
3. Todo comprovante deve estar vinculado a um pagamento.
4. Toda baixa, entrada, sobra, descarte ou ajuste deve gerar movimento de estoque.
5. Produto com venda associada nao deve ser apagado fisicamente.
6. Lote com movimentacao nao deve ser apagado fisicamente.
7. Cliente so deve acessar seus proprios dados.
8. Admin deve acessar dados operacionais.
9. RLS deve ser obrigatoria nas tabelas sensiveis.
10. Operacoes offline devem ser idempotentes por `local_id`.

## 4. Extensoes recomendadas

- pgcrypto para UUID via gen_random_uuid.
- citext opcional para e-mails case-insensitive.

## 5. Enums recomendados

### 5.1 user_role

- customer
- admin

### 5.2 profile_status

- active
- inactive
- blocked

### 5.3 payment_method

- pix
- cash_box
- pay_later

### 5.4 payment_status

- declared
- proof_sent
- confirmed
- pending
- rejected

### 5.5 sale_status

- open
- completed
- canceled
- conflict

### 5.6 sync_status

- online
- pending_sync
- syncing
- synced
- conflict
- failed

### 5.7 batch_status

- open
- closed
- canceled

### 5.8 stock_movement_type

- initial_balance
- purchase_entry
- sale_out
- manual_adjustment
- waste
- leftover
- correction
- sync_compensation

### 5.9 proof_status

- uploaded
- pending_upload
- accepted
- rejected

## 6. Tabelas do MVP

## 6.1 profiles

Finalidade:
Representar usuario autenticado no Supabase Auth e controlar role/status.

Campos:
- id uuid primary key default gen_random_uuid()
- auth_user_id uuid unique not null references auth.users(id)
- full_name text
- email text not null
- avatar_url text
- role user_role not null default customer
- status profile_status not null default active
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Constraints:
- unique(auth_user_id)
- unique(email)

Indices:
- profiles_auth_user_id_idx
- profiles_email_idx
- profiles_role_idx
- profiles_status_idx

RLS:
- Usuario autenticado pode ler o proprio profile.
- Usuario autenticado pode atualizar campos permitidos do proprio profile, exceto role/status.
- Admin pode ler todos os profiles.
- Apenas admin pode alterar role/status.

## 6.2 product_categories

Finalidade:
Agrupar produtos no catalogo.

Campos:
- id uuid primary key default gen_random_uuid()
- name text not null
- slug text not null
- sort_order integer not null default 0
- is_active boolean not null default true
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Constraints:
- unique(slug)

Indices:
- product_categories_slug_idx
- product_categories_is_active_idx
- product_categories_sort_order_idx

RLS:
- Usuario autenticado pode ler categorias ativas.
- Admin pode ler, criar, editar e desativar categorias.

## 6.3 products

Finalidade:
Cadastrar produtos vendaveis.

Campos:
- id uuid primary key default gen_random_uuid()
- category_id uuid references product_categories(id)
- name text not null
- slug text not null
- description text
- price_cents integer not null
- image_path text
- is_perishable boolean not null default false
- is_active boolean not null default true
- stock_quantity integer not null default 0
- low_stock_threshold integer not null default 0
- sort_order integer not null default 0
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Constraints:
- unique(slug)
- check(price_cents >= 0)
- check(stock_quantity >= 0)
- check(low_stock_threshold >= 0)

Indices:
- products_category_id_idx
- products_slug_idx
- products_is_active_idx
- products_is_perishable_idx
- products_stock_quantity_idx
- products_sort_order_idx

RLS:
- Usuario autenticado pode ler produtos ativos.
- Admin pode ler, criar, editar e desativar produtos.
- Delete fisico deve ser evitado quando houver venda ou movimento vinculado.

## 6.4 product_batches

Finalidade:
Controlar lotes pereciveis, sobras e descarte.

Campos:
- id uuid primary key default gen_random_uuid()
- product_id uuid not null references products(id)
- batch_date date not null
- expires_at date
- initial_quantity integer not null default 0
- sold_quantity integer not null default 0
- leftover_quantity integer not null default 0
- waste_quantity integer not null default 0
- status batch_status not null default open
- notes text
- created_by uuid references profiles(id)
- closed_by uuid references profiles(id)
- created_at timestamptz not null default now()
- closed_at timestamptz
- updated_at timestamptz not null default now()

Constraints:
- check(initial_quantity >= 0)
- check(sold_quantity >= 0)
- check(leftover_quantity >= 0)
- check(waste_quantity >= 0)

Indices:
- product_batches_product_id_idx
- product_batches_batch_date_idx
- product_batches_status_idx
- product_batches_expires_at_idx

RLS:
- Usuario autenticado pode ler lotes apenas quando necessario para disponibilidade.
- Admin pode ler, criar, editar e fechar lotes.
- Lote com movimentacao deve ser preservado.

## 6.5 sales

Finalidade:
Registrar retirada/venda.

Campos:
- id uuid primary key default gen_random_uuid()
- local_id text
- buyer_id uuid not null references profiles(id)
- total_cents integer not null default 0
- status sale_status not null default completed
- payment_status payment_status not null default pending
- sync_status sync_status not null default online
- created_offline boolean not null default false
- buyer_notes text
- admin_notes text
- created_at timestamptz not null default now()
- synced_at timestamptz
- updated_at timestamptz not null default now()

Constraints:
- check(total_cents >= 0)
- unique(buyer_id, local_id) quando local_id nao for null

Indices:
- sales_buyer_id_idx
- sales_created_at_idx
- sales_payment_status_idx
- sales_sync_status_idx
- sales_local_id_idx

RLS:
- Cliente pode criar venda propria.
- Cliente pode ler apenas suas vendas.
- Admin pode ler todas as vendas.
- Admin pode atualizar status administrativo.
- Cliente nao pode alterar venda confirmada fora do fluxo permitido.

## 6.6 sale_items

Finalidade:
Registrar itens de uma venda com preco congelado.

Campos:
- id uuid primary key default gen_random_uuid()
- sale_id uuid not null references sales(id)
- product_id uuid references products(id)
- batch_id uuid references product_batches(id)
- product_name_snapshot text not null
- unit_price_cents integer not null
- quantity integer not null
- subtotal_cents integer not null
- created_at timestamptz not null default now()

Constraints:
- check(unit_price_cents >= 0)
- check(quantity > 0)
- check(subtotal_cents >= 0)

Indices:
- sale_items_sale_id_idx
- sale_items_product_id_idx
- sale_items_batch_id_idx

RLS:
- Cliente pode ler itens das proprias vendas.
- Admin pode ler todos os itens.
- Criacao deve ocorrer junto ao fluxo de venda.

## 6.7 payments

Finalidade:
Registrar forma, declaracao e validacao de pagamento.

Campos:
- id uuid primary key default gen_random_uuid()
- sale_id uuid not null references sales(id)
- method payment_method not null
- status payment_status not null default pending
- declared_amount_cents integer not null default 0
- confirmed_amount_cents integer
- confirmed_by uuid references profiles(id)
- rejected_by uuid references profiles(id)
- rejection_reason text
- customer_notes text
- admin_notes text
- created_at timestamptz not null default now()
- confirmed_at timestamptz
- rejected_at timestamptz
- updated_at timestamptz not null default now()

Constraints:
- check(declared_amount_cents >= 0)
- check(confirmed_amount_cents is null or confirmed_amount_cents >= 0)

Indices:
- payments_sale_id_idx
- payments_method_idx
- payments_status_idx
- payments_created_at_idx

RLS:
- Cliente pode criar pagamento da propria venda.
- Cliente pode ler pagamento da propria venda.
- Admin pode ler todos.
- Apenas admin pode confirmar/rejeitar.

## 6.8 payment_proofs

Finalidade:
Registrar comprovantes PIX enviados ao Storage.

Campos:
- id uuid primary key default gen_random_uuid()
- payment_id uuid not null references payments(id)
- uploaded_by uuid not null references profiles(id)
- storage_bucket text not null
- storage_path text not null
- file_name text
- mime_type text
- file_size integer
- status proof_status not null default uploaded
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Constraints:
- unique(storage_bucket, storage_path)
- check(file_size is null or file_size >= 0)

Indices:
- payment_proofs_payment_id_idx
- payment_proofs_uploaded_by_idx
- payment_proofs_status_idx

RLS:
- Cliente pode criar comprovante para pagamento de venda propria.
- Cliente pode ler comprovante da propria venda.
- Admin pode ler todos.
- Admin pode aceitar/rejeitar.

## 6.9 stock_movements

Finalidade:
Auditar entradas, baixas, ajustes, sobras, descartes e compensacoes.

Campos:
- id uuid primary key default gen_random_uuid()
- product_id uuid not null references products(id)
- batch_id uuid references product_batches(id)
- sale_id uuid references sales(id)
- type stock_movement_type not null
- quantity_delta integer not null
- reason text
- created_by uuid references profiles(id)
- created_at timestamptz not null default now()

Constraints:
- check(quantity_delta <> 0)

Indices:
- stock_movements_product_id_idx
- stock_movements_batch_id_idx
- stock_movements_sale_id_idx
- stock_movements_type_idx
- stock_movements_created_at_idx

RLS:
- Cliente nao deve criar movimento diretamente.
- Admin pode ler todos.
- Admin pode criar ajuste manual com motivo.
- Movimento de venda deve ser gerado por servico/funcao do fluxo de venda.

## 6.10 daily_closings

Finalidade:
Salvar fechamento diario da operacao.

Campos:
- id uuid primary key default gen_random_uuid()
- closing_date date not null
- total_sales_cents integer not null default 0
- confirmed_pix_cents integer not null default 0
- declared_cash_cents integer not null default 0
- confirmed_cash_cents integer not null default 0
- pay_later_cents integer not null default 0
- pending_cents integer not null default 0
- rejected_cents integer not null default 0
- notes text
- created_by uuid not null references profiles(id)
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Constraints:
- unique(closing_date)
- check(total_sales_cents >= 0)
- check(confirmed_pix_cents >= 0)
- check(declared_cash_cents >= 0)
- check(confirmed_cash_cents >= 0)
- check(pay_later_cents >= 0)
- check(pending_cents >= 0)
- check(rejected_cents >= 0)

Indices:
- daily_closings_closing_date_idx
- daily_closings_created_by_idx

RLS:
- Apenas admin pode criar, ler e atualizar fechamentos.
- Fechamento nao deve apagar vendas, pagamentos ou movimentos.

## 7. Storage

## 7.1 Bucket payment-proofs

Finalidade:
Armazenar comprovantes PIX.

Regras:
- Bucket privado.
- Upload por comprador dono do pagamento ou admin.
- Leitura por comprador dono da venda ou admin.
- Preferir URL assinada.
- Caminho sugerido: payment-proofs/{sale_id}/{payment_id}/{filename}

## 7.2 Bucket product-images

Finalidade:
Armazenar imagens de produtos.

Regras:
- Leitura publica pode ser permitida se nao houver dado sensivel.
- Escrita apenas por admin.
- Caminho sugerido: product-images/{product_id}/{filename}

## 8. Triggers e funcoes futuras

Recomendadas para a fase de implementacao:

- atualizar `updated_at` automaticamente.
- criar profile apos primeiro login, se a estrategia escolhida permitir.
- aplicar baixa de estoque no fluxo de venda.
- impedir estoque negativo.
- registrar movimento de estoque em venda.
- validar idempotencia de `local_id`.
- consolidar fechamento diario por periodo.

## 9. Regras offline

- Venda offline deve gravar `local_id`.
- Venda offline deve iniciar com `sync_status=pending_sync`.
- Ao sincronizar, manter relacao entre local_id e id remoto.
- Duplicidade deve ser evitada por `buyer_id + local_id`.
- Conflito deve marcar `sync_status=conflict`.
- Conflito nao deve apagar dados locais.

## 10. Ordem sugerida de migrations futuras

1. extensions
2. enums
3. profiles
4. product_categories
5. products
6. product_batches
7. sales
8. sale_items
9. payments
10. payment_proofs
11. stock_movements
12. daily_closings
13. storage buckets
14. RLS policies
15. triggers/functions
16. seeds minimos

## 11. Seeds minimos recomendados

Categorias iniciais:
- Quitandas
- Bolachas
- Salgadinhos
- Bebidas
- Doces
- Outros

Produtos:
- Nao criar produtos reais no repositorio se houver preco/operacao sensivel.
- Seeds podem conter exemplos ficticios.

Admin:
- Nao versionar e-mail real como admin sem decisao explicita.
- Preferir configurar admin manualmente no banco ou via variavel segura.

## 12. Fora de escopo deste documento

Este documento nao implementa:

- SQL real de migrations.
- Policies SQL finais.
- Buckets reais.
- Funcoes/triggers reais.
- Dados reais de produto.
- Chaves ou segredos.
- Alteracoes no app.

## 13. Proximo passo recomendado

Criar criterios finais de aceite da Fase 0 e do MVP em documento versionado.

Arquivo recomendado:

`docs/MVP_ACCEPTANCE_CRITERIA.md`

## 14. Estado final

- FASE_0=EM_ANDAMENTO
- MODELO_DADOS_SUPABASE_STATUS=CRIADO
- MVP_STATUS=NAO_INICIADO
- IMPLEMENTACAO_FUNCIONAL=NAO
