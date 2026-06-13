# Governanca do Projeto — Cardapio Digital CIICC

Data: 2026-06-12
Status: REFERENCIA_OFICIAL_INICIAL

## 1. Finalidade

Este documento deve orientar todas as alteracoes do projeto ate o MVP. Ele existe para evitar perda de contexto entre chats, branches e PRs.

## 2. Produto oficial

Sistema de autoatendimento interno para controle de retirada de mercadorias em uma bancada compartilhada dentro de ambiente de trabalho controlado.

O sistema deve registrar comprador, produtos retirados, quantidade, forma de pagamento, comprovante quando houver, valor declarado, pendencias, baixa de estoque, lotes pereciveis, sobras e fechamento diario.

## 3. Arquitetura alvo

- React + Vite + TypeScript
- Supabase Postgres
- Supabase Auth com Google
- Supabase Storage
- Vercel
- PWA instalavel
- Offline com IndexedDB e fila de sincronizacao

## 4. Regras de escopo

Toda tarefa deve indicar fase, objetivo, arquivos afetados, risco, criterio de aceite e evidencias de validacao.

Nao misturar fases. Mudancas de UI, banco, autenticacao, deploy e PWA devem ser separadas sempre que possivel.

## 5. Fontes de verdade por chat

Todo novo chat deve considerar estes arquivos:

1. docs/MVP_ROADMAP_CHECKLIST.md
2. docs/GOVERNANCE.md
3. TASKS.md
4. PRD vigente, quando existir
5. estado atual do repositorio

## 6. Regras de branch e PR

- Nao trabalhar direto na main para mudancas relevantes.
- Usar branches pequenas por fase.
- Cada PR deve ter resumo, escopo, fora de escopo, validacoes e riscos.
- Atualizar documentacao quando uma decisao mudar o escopo do MVP.

## 7. Regras de seguranca

- Nao adicionar segredos reais ao repositorio.
- Usar .env.example para variaveis.
- Admin deve depender de login Google e role no banco.
- Cliente nao deve acessar dados sensiveis de outros clientes.
- Logs nao devem expor dados pessoais.
- Uploads de comprovante devem ter acesso controlado.

## 8. Modelo minimo de dados

Entidades minimas do MVP:

- profiles
- products
- product_categories
- product_batches
- sales
- sale_items
- payments
- payment_proofs
- stock_movements

Toda venda deve permitir auditoria entre comprador, itens, pagamento e baixa de estoque.

## 9. Formas de pagamento

Formas de pagamento do MVP:

- pix
- cash_box
- pay_later

Status recomendados:

- declared
- proof_sent
- confirmed
- pending
- rejected

PIX e dinheiro informados pelo cliente precisam de validacao administrativa antes de serem tratados como confirmados.

## 10. Estoque e lotes

Todo produto controlado deve ter estoque atual. Produto perecivel deve ter lote diario com quantidade inicial, vendido, sobra e descarte.

Toda venda deve gerar movimento de estoque. Ajustes manuais tambem devem gerar movimento de estoque.

## 11. Gate antes de cada PR

- [ ] Fase correta identificada.
- [ ] Alteracao dentro do escopo da fase.
- [ ] TASKS.md atualizado quando necessario.
- [ ] Nenhum segredo adicionado.
- [ ] Risco documentado.
- [ ] Criterio de aceite descrito.

## 12. Estado oficial inicial

FASE_0=EM_ANDAMENTO
MVP_STATUS=NAO_INICIADO
BANCO_ALVO=SUPABASE
DEPLOY_ALVO=VERCEL
APP_ALVO=PWA
AUTH_ALVO=GOOGLE_SUPABASE_AUTH

## 13. Estado atual apos Fase 8

FASE_ATUAL=FASE_8_SUPABASE_ONLY_CONCLUIDA_TECNICAMENTE
RUNTIME_ATUAL=SUPABASE_ONLY
AUTH_ATIVO=SUPABASE_AUTH_GOOGLE
PERSISTENCIA_ATIVA=SUPABASE_POSTGRES
FIREBASE_RUNTIME=REMOVIDO

O historico Firebase/Firestore permanece documentado nas auditorias das fases anteriores, mas nao faz parte do runtime ativo atual.
