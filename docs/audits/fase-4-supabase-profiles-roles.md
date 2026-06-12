# Auditoria — Fase 4: Perfis e Roles Supabase

## Estado

FASE_4=EM_ANDAMENTO  
ESCOPO=PERFIS_E_ROLES_SUPABASE  
MVP_FUNCIONAL=NAO_INICIADO  
IMPLEMENTACAO_FUNCIONAL_DE_NEGOCIO=NAO_INICIADA  
FIREBASE_LEGADO_ATIVO=SIM  

## Objetivo

Consolidar a base inicial de perfis e roles Supabase antes de iniciar qualquer funcionalidade de negócio do MVP.

A Fase 4 prepara o sistema para distinguir usuários comuns e administradores usando a tabela alvo `profiles`, definida no modelo de dados Supabase do MVP.

## Escopo executado

- Gate pós-merge da Fase 3 executado.
- `main` sincronizada com `origin/main` em `df5b71d`.
- Branch criada: `feat/fase-4-supabase-profiles-roles`.
- Auditoria dos pontos atuais de autenticação:
  - `src/App.tsx`
  - `src/components/AdminLogin.tsx`
  - `src/components/CustomerRegistrationGate.tsx`
  - `src/features/auth/authTypes.ts`
  - `src/features/auth/supabaseAuthService.ts`
  - `src/lib/supabaseClient.ts`
- Criação de `src/features/auth/supabaseProfileService.ts`.
- Implementação de leitura de profile por `auth_user_id`.
- Implementação de helper para validar profile admin ativo.
- Ajuste em `App.tsx` para não liberar admin apenas por sessão Supabase.
- Admin via Supabase agora exige:
  - sessão Supabase válida;
  - profile existente;
  - `role = admin`;
  - `status = active`.

## Comportamento esperado

Quando houver sessão Supabase, o app tenta carregar o profile correspondente em `profiles`.

Se o profile existir e for admin ativo, o painel admin é liberado.

Se o profile não existir, estiver inativo, bloqueado ou não for admin, o acesso admin via Supabase não é liberado.

## Firebase legado

Firebase permanece como legado ativo nesta fase.

Esta fase não remove:

- Firebase Auth;
- Firebase Firestore;
- fluxo legado do comprador;
- fallback local controlado por PIN;
- persistências atuais do protótipo.

## Fora de escopo confirmado

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

## Validações locais

- `npm run lint` — OK.
- `npm run build` — OK.

Observação: o build Vite pode emitir warning de chunk acima de 500 kB. Esse warning não bloqueia a Fase 4.

## Riscos remanescentes

- A tabela `profiles` ainda depende de estrutura Supabase real/migration futura.
- RLS final ainda não foi aplicada.
- O fluxo comprador ainda usa Firebase legado.
- O fallback PIN ainda existe como mecanismo controlado temporário.
- O AdminPanel ainda possui persistências e textos legados ligados ao Firebase.

## Próximos passos recomendados

1. Finalizar documentação e commit da Fase 4.
2. Abrir PR separada.
3. Validar CI remoto.
4. Só depois decidir a próxima fase de migrations/RLS ou migração gradual do comprador.
