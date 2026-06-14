# Fase 18 — Estoque, ciclos, baixa de venda e resultado operacional

## Projeto

Cardápio Digital CIICC

## Branch

feat/fase-18-stock-control

## Objetivo

Implementar controle administrativo de produtos físicos por estoque, ciclo, custo, baixa automática por venda e resultado operacional, mantendo o runtime Supabase-only.

## Escopo entregue

- Controle de estoque inicial.
- Controle de estoque atual disponível.
- Custo unitário do produto.
- Tipo de ciclo do produto.
- Ciclo iniciado e ciclo encerrado.
- Sobra de ciclo para perecíveis.
- Baixa automática de estoque por venda via RPC Supabase.
- Bloqueio de venda sem estoque suficiente.
- Bloqueio de venda para produto indisponível.
- Bloqueio de venda para ciclo encerrado.
- Resultado operacional por produto.
- Destaque visual por resultado.
- Destaque azul para industrializado com estoque zerado.
- Exibição de estoque inicial e estoque atual no card do Controle de Lotes.

## Supabase

Migration criada:

- supabase/migrations/20260614053000_add_product_stock_control.sql

Colunas adicionadas em public.products:

- stock_initial
- stock_available
- cost_price
- lifecycle_type
- cycle_started_at
- cycle_closed_at
- cycle_unsold_quantity

Função RPC criada/substituída:

- public.create_sale_with_stock(...)

## Correção crítica validada

A venda passou a baixar estoque corretamente após normalização do identificador do produto:

- productId
- product_id
- id

A baixa automática foi validada manualmente após venda real pelo cardápio.

## Regras funcionais

### Perecível / consumo no dia

- Possui estoque inicial.
- Possui estoque atual.
- Possui custo unitário.
- Possui valor de venda.
- Possui início de ciclo.
- Ao encerrar ciclo, administrador informa sobra.
- Produto encerrado sai do cardápio.
- Resultado usa a regra:

resultado = (vendidos - sobras) × (venda - custo)

### Industrializado

- Possui estoque inicial.
- Possui estoque atual.
- Possui custo unitário.
- Possui valor de venda.
- Resultado acompanha margem sobre vendidos.
- Quando estoque chega a zero, o card recebe destaque azul.

## Validações técnicas

- git diff --check: OK
- npm.cmd run lint: OK
- npm.cmd run build: OK

## Validação manual final — Ciclo 50D

- Controle de Lotes abre corretamente.
- Cada card mostra Estoque inicial.
- Cada card mostra Estoque atual.
- Produto perecível criado com estoque inicial.
- Venda pelo cardápio realizada.
- Baixa no estoque atual confirmada.
- Ciclo encerrado com sobra.
- Produto encerrado removido do cardápio.
- Resultado por cor confirmado.
- Produto industrializado criado.
- Industrializado baixado até zero.
- Card/badge azul confirmado.

## Fora de escopo

- Deploy de produção.
- Reintrodução de Firebase.
- Reintrodução de Firestore.
- Reintrodução de dbService.
- QR/câmera/scanner.
- PWA/offline.
- Dashboard financeiro completo.

## Status

FASE_18_STATUS=VALIDADA_LOCALMENTE
SUPABASE_ONLY=MANTIDO
FIREBASE_RUNTIME=NAO_REINTRODUZIDO
ESTOQUE_CICLO_RESULTADO=IMPLEMENTADO
BAIXA_ESTOQUE=VALIDADA
CICLO_50D=APROVADO
DEPLOY=NAO_REALIZADO
