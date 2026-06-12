# Mapa de Evolucao ate o MVP

Status geral: PLANEJAMENTO_INICIAL

## Produto alvo

Sistema de autoatendimento interno para controle de retirada de mercadorias, pagamento, estoque, lotes, sobras e pendencias em ambiente de trabalho controlado.

## Arquitetura alvo

- React + Vite + TypeScript
- Supabase Postgres
- Supabase Auth com Google
- Supabase Storage
- Vercel
- PWA instalavel com suporte offline

## Fases

### FASE 0 — Governanca e PRD
- [x] Consolidar necessidade de negocio
- [x] Definir arquitetura alvo
- [x] Criar mapa de evolucao
- [x] Criar governanca
- [x] Criar TASKS
- [x] Criar PRD completo
- [x] Criar arquitetura tecnica
- [x] Criar modelo de dados Supabase
- [x] Criar criterios finais de aceite

### FASE 1 — Limpeza e identidade
- [ ] Atualizar README
- [ ] Atualizar titulo do app
- [ ] Criar .env.example
- [ ] Criar CI com lint e build

### FASE 2 — Supabase Auth
- [ ] Instalar Supabase client
- [ ] Criar cliente Supabase
- [ ] Configurar login Google
- [ ] Criar perfil de usuario
- [ ] Criar controle de admin por role
- [ ] Remover Firebase do fluxo ativo

### FASE 3 — Banco de dados
- [ ] Criar produtos
- [ ] Criar categorias
- [ ] Criar lotes
- [ ] Criar vendas
- [ ] Criar itens de venda
- [ ] Criar pagamentos
- [ ] Criar comprovantes
- [ ] Criar movimentos de estoque
- [ ] Ativar RLS

### FASE 4 — Area cliente
- [ ] Login
- [ ] Perfil
- [ ] Lista de produtos
- [ ] Carrinho
- [ ] Confirmacao de retirada
- [ ] Historico pessoal

### FASE 5 — Area admin
- [ ] Dashboard diario
- [ ] Produtos
- [ ] Estoque
- [ ] Lotes
- [ ] Vendas
- [ ] Pagamentos
- [ ] Fechamento diario

### FASE 6 — PWA offline
- [ ] Manifest
- [ ] Service worker
- [ ] IndexedDB
- [ ] Fila offline
- [ ] Sincronizacao
- [ ] Tratamento de conflito

### FASE 7 — Vercel
- [ ] Configurar deploy
- [ ] Configurar variaveis
- [ ] Testar producao

### FASE 8 — Gate MVP
- [ ] Teste completo cliente
- [ ] Teste completo admin
- [ ] Teste offline
- [ ] Teste seguranca
- [ ] Liberar piloto interno
