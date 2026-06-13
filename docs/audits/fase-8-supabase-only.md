# Auditoria Fase 8 — Supabase-only

Data: 2026-06-13
Branch: `feat/fase-8-supabase-only`

## Objetivo

Concluir a migração controlada do runtime ativo para Supabase-only, removendo Firebase/Auth/Firestore do fluxo ativo, do `src` e das dependências npm.

## Estado anterior

- A branch já continha a base Supabase da Fase 8 até `077fef1`.
- Cliente já usava Supabase Auth para login/cadastro e Supabase DB para criação de vendas.
- `App.tsx` já carregava produtos/settings do Supabase.
- `AdminPanel.tsx` ainda consumia `dbService`/`firebase` para settings, produtos, vendas e lotes.
- `src/dbService.ts`, `src/firebase.ts` e a dependência npm `firebase` ainda existiam.

## Commits principais da fase

- `2a751ee` — `fix(auth): force google account selection`
- `da6c2b8` — `feat(supabase): add supabase only core data model`
- `f5321f1` — `feat(supabase): add core data services`
- `a0f6624` — `feat(app): load products and settings from supabase`
- `8c241c3` — `feat(customer): use supabase auth for registration gate`
- `a2e10f1` — `fix(app): sign out customer with supabase`
- `132a418` — `feat(customer): create sales with supabase`
- `077fef1` — `feat(supabase): add admin data operations`
- `5a5eabb` — `feat(admin): use supabase data operations`
- `8e24842` — `chore(firebase): remove legacy runtime dependency`

## Tabelas Supabase envolvidas

- `store_settings`
- `products`
- `sales`
- `sale_items`
- `profiles`

## Arquivos migrados/removidos

- `src/App.tsx`
- `src/components/AdminPanel.tsx`
- `src/components/AdminLogin.tsx`
- `src/components/CustomerRegistrationGate.tsx`
- `src/components/CustomerView.tsx`
- `src/features/auth/supabaseAuthService.ts`
- `src/features/supabase/supabaseCoreDataService.ts`
- `src/constants/defaults.ts`
- `src/types.ts`
- `src/dbService.ts` removido
- `src/firebase.ts` removido
- `package.json` e `package-lock.json` sem `firebase`

## Confirmações técnicas

- Cliente usa Supabase Auth e `profiles` para identificação/autorização.
- Cliente cria vendas em `sales` e `sale_items` via Supabase.
- Admin usa Supabase para settings, produtos, listagem de vendas e baixa de comandas.
- Supabase Auth é o único auth ativo.
- Supabase Postgres é a única persistência ativa.
- Firebase foi removido do runtime ativo e das dependências npm.

## Validação

Comandos executados durante a fase:

```powershell
npm.cmd run lint
npm.cmd run build
rg -n "from './dbService'|from '../dbService'|from './firebase'|from '../firebase'|firebase|Firebase|Firestore|dbService" src package.json package-lock.json
```

Resultado:

- `npm.cmd run lint`: OK
- `npm.cmd run build`: OK
- Grep runtime sanitizado: sem ocorrências em `src`, `package.json` e `package-lock.json`.

Observações:

- Em PowerShell, `npm run ...` direto foi bloqueado pela política local de execução de scripts; `npm.cmd` foi usado sem alterar a configuração da máquina.
- O build segue emitindo aviso de chunk maior que 500 kB, mas conclui com sucesso.
- `npm.cmd uninstall firebase` reportou vulnerabilidades altas remanescentes em dependências não relacionadas à remoção Firebase; não foi executado `npm audit fix --force` por estar fora do escopo e poder alterar versões de forma ampla.

## Pendências honestas

- Controle de lotes ficou desabilitado no AdminPanel, com mensagem explícita de fora de escopo, porque a migração Supabase atual não cria tabela/policies de lotes.
- Estoque, pagamentos completos, comprovantes, Storage e PWA/offline real continuam fora do escopo desta Fase 8 Supabase-only.

## Conclusão

A Fase 8 conclui a troca do runtime ativo para Supabase-only. O histórico Firebase permanece documentado nas auditorias antigas, mas não há uso ativo de Firebase/Firestore no código fonte ou nas dependências npm.
