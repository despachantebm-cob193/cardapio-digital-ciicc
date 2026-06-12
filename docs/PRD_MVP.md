# PRD — MVP Cardapio Digital CIICC

Data: 2026-06-12
Status: PRD_MVP_INICIAL
Fase: FASE_0
MVP_STATUS: NAO_INICIADO
Tipo: Documento de requisitos do produto

## 1. Resumo executivo

O Cardapio Digital CIICC sera um sistema interno de autoatendimento para venda e controle de retirada de produtos em ambiente de trabalho controlado.

O MVP deve permitir que colaboradores autenticados consultem produtos disponiveis, registrem a retirada, escolham uma forma de pagamento, enviem comprovante PIX quando necessario, declarem pagamento em dinheiro na caixinha ou registrem pagamento futuro. A administracao deve conseguir controlar produtos, categorias, estoque, lotes pereciveis, sobras, descartes, pagamentos pendentes e fechamento diario.

O produto deve priorizar simplicidade operacional, rastreabilidade e confianca. O sistema nao substitui um ERP completo; ele organiza o fluxo real de uma bancada compartilhada de quitandas, bolachas, salgadinhos, bebidas, doces e outros produtos, reduzindo perda de controle manual e divergencias entre retirada, pagamento e estoque.

## 2. Contexto e problema

### 2.1 Cenario atual

Existe uma operacao interna de venda de produtos em ambiente controlado. Os compradores retiram produtos de uma bancada ou ponto fisico e pagam por PIX, dinheiro ou combinacao de pagamento posterior. Sem sistema dedicado, o controle tende a depender de anotacoes, mensagens, conferencias manuais e memoria operacional.

### 2.2 Problemas principais

- Dificuldade para identificar quem retirou cada produto.
- Risco de retirada sem pagamento confirmado.
- Dificuldade para conferir PIX, dinheiro colocado na caixinha e pagamentos futuros.
- Baixa visibilidade de estoque disponivel.
- Dificuldade para controlar lotes pereciveis, sobras e descartes.
- Falta de fechamento diario confiavel.
- Risco de perda de historico ou divergencia entre retirada e baixa de estoque.
- Necessidade de operar mesmo com internet instavel no local.

### 2.3 Oportunidade

Criar um fluxo simples, instalavel como PWA, com login Google, banco Supabase, storage para comprovantes e suporte offline por IndexedDB com fila de sincronizacao. O MVP deve resolver o fluxo operacional essencial antes de qualquer refinamento visual ou automacao avancada.

## 3. Objetivos do MVP

### 3.1 Objetivos de produto

1. Permitir que um comprador autenticado registre uma retirada de produtos.
2. Registrar comprador, produtos, quantidades, valores e horario da retirada.
3. Permitir pagamento por PIX, dinheiro na caixinha ou pagamento futuro.
4. Permitir upload de comprovante PIX.
5. Permitir que admin confirme, rejeite ou mantenha pagamento pendente.
6. Controlar estoque atual por produto.
7. Controlar lotes pereciveis com quantidade inicial, vendidos, sobras e descarte.
8. Gerar movimentacoes de estoque auditaveis.
9. Permitir fechamento diario com total vendido, total confirmado, pendencias, dinheiro declarado, PIX declarado e divergencias.
10. Funcionar como PWA instalavel com suporte offline para registro local e sincronizacao posterior.

### 3.2 Objetivos tecnicos

1. Migrar o produto para React + Vite + TypeScript como base ativa.
2. Usar Supabase Postgres como banco principal.
3. Usar Supabase Auth com Google para identificacao dos compradores e administradores.
4. Usar Supabase Storage para comprovantes de pagamento.
5. Publicar em Vercel.
6. Implementar IndexedDB para operacao offline.
7. Implementar fila de sincronizacao com tratamento de conflito.
8. Aplicar RLS para isolamento de dados e protecao administrativa.

### 3.3 Objetivos de governanca

1. Manter fases separadas.
2. Evitar misturar documentacao, banco, autenticacao, UI, PWA e deploy na mesma entrega funcional.
3. Garantir que cada PR tenha escopo, fora de escopo, validacao, risco e criterio de aceite.
4. Manter TASKS.md e documentos de governanca atualizados quando o escopo mudar.

## 4. Nao objetivos do MVP

O MVP nao deve incluir:

- Gateway de pagamento automatico.
- Confirmacao automatica de PIX via API bancaria.
- Emissao fiscal.
- Marketplace externo.
- Entrega/delivery.
- Sistema multiempresa.
- Controle contatil completo.
- Integracao com ERP.
- Programa de fidelidade.
- Painel analitico avancado.
- Controle por codigo de barras obrigatorio.
- Reconhecimento automatico de produto por imagem.
- Chat, notificacoes push avancadas ou campanhas promocionais.

Esses itens podem ser avaliados depois do piloto interno.

## 5. Publico-alvo e personas

### 5.1 Comprador interno

Pessoa autorizada no ambiente de trabalho que retira produtos da bancada.

Necessidades:

- Ver rapidamente produtos disponiveis.
- Saber preco e disponibilidade.
- Registrar a retirada em poucos passos.
- Escolher a forma de pagamento correta.
- Enviar comprovante quando pagar por PIX.
- Consultar seu historico e pendencias.

### 5.2 Administrador operacional

Pessoa responsavel por cadastrar produtos, repor estoque, conferir pagamentos e fechar o dia.

Necessidades:

- Ver vendas do dia.
- Validar PIX e dinheiro declarado.
- Controlar pagamentos futuros.
- Atualizar estoque.
- Registrar lotes, sobras e descartes.
- Identificar divergencias.
- Gerar fechamento diario.

### 5.3 Auditor eventual / responsavel

Pessoa que precisa consultar historico e consistencia operacional.

Necessidades:

- Consultar vendas por periodo.
- Conferir pagamentos pendentes ou rejeitados.
- Conferir movimentos de estoque.
- Validar fechamento diario.

## 6. Escopo funcional do MVP

### 6.1 Autenticacao e perfis

O sistema deve permitir login pelo Google usando Supabase Auth.

Requisitos:

- Todo usuario autenticado deve ter um perfil em `profiles`.
- O perfil deve conter nome, e-mail, avatar quando disponivel, role e status.
- Roles minimas:
  - `customer`: comprador interno.
  - `admin`: administrador operacional.
- Apenas administradores devem acessar telas administrativas.
- Usuario cliente nao deve acessar dados sensiveis de outros clientes.
- Usuario bloqueado/inativo nao deve conseguir registrar novas retiradas.

### 6.2 Catalogo de produtos

O comprador deve visualizar produtos disponiveis para retirada.

Requisitos:

- Listar produtos ativos.
- Exibir nome, categoria, preco, imagem opcional, descricao curta e disponibilidade.
- Separar por categorias como quitandas, bolachas, salgadinhos, bebidas, doces e outros.
- Ocultar ou marcar como indisponivel produto sem estoque.
- Permitir busca simples por nome.
- Permitir filtro por categoria.

### 6.3 Carrinho / selecao de retirada

O comprador deve selecionar produtos e quantidades antes de confirmar.

Requisitos:

- Adicionar produto ao carrinho.
- Alterar quantidade.
- Remover produto.
- Exibir subtotal por item.
- Exibir total geral.
- Impedir quantidade maior que estoque disponivel conhecido.
- Avisar quando estoque estiver desatualizado ou pendente de sincronizacao offline.

### 6.4 Registro de retirada

A retirada e o evento central do MVP.

Requisitos:

- Registrar comprador autenticado.
- Registrar itens retirados, quantidades, precos unitarios e total.
- Registrar data/hora local e data/hora sincronizada quando houver.
- Gerar venda com status inicial coerente com a forma de pagamento.
- Baixar estoque ou criar movimento pendente quando offline.
- Permitir observacao opcional do comprador.

### 6.5 Pagamento PIX

O comprador deve poder declarar pagamento por PIX e enviar comprovante.

Requisitos:

- Exibir instrucao de PIX configurada pelo admin ou por variavel segura.
- Permitir upload de imagem/PDF do comprovante.
- Salvar comprovante no Supabase Storage quando online.
- Quando offline, manter comprovante local e sincronizar depois, se tecnicamente viavel no dispositivo.
- Status inicial recomendado: `proof_sent` quando houver comprovante; `declared` quando o cliente apenas declarar pagamento sem comprovante.
- Admin deve confirmar ou rejeitar.

### 6.6 Dinheiro na caixinha

O comprador deve declarar pagamento em dinheiro colocado na caixinha fisica.

Requisitos:

- Permitir selecionar forma `cash_box`.
- Registrar valor declarado.
- Permitir observacao opcional.
- Status inicial: `declared` ou `pending` ate conferencia administrativa.
- Admin deve confirmar o recebimento no fechamento ou na tela de pagamentos.

### 6.7 Pagamento futuro

O comprador deve poder registrar retirada com compromisso de pagamento posterior.

Requisitos:

- Permitir selecionar forma `pay_later`.
- Registrar venda como pendente.
- Exibir pendencia no historico do comprador.
- Exibir pendencia no painel admin.
- Permitir admin confirmar pagamento posteriormente.
- Permitir comprador anexar comprovante posteriormente quando pagar por PIX, se habilitado no fluxo.

### 6.8 Historico do comprador

O comprador deve acessar suas proprias retiradas.

Requisitos:

- Listar vendas do usuario autenticado.
- Exibir data, itens, total, forma de pagamento e status.
- Destacar pendencias.
- Permitir visualizar comprovante enviado pelo proprio usuario.
- Nao permitir acesso ao historico de outros usuarios.

### 6.9 Area administrativa

Admin deve ter acesso a operacao diaria.

Requisitos:

- Dashboard do dia com vendas, pagamentos, estoque baixo e pendencias.
- CRUD de produtos.
- CRUD de categorias.
- Controle de estoque.
- Controle de lotes pereciveis.
- Consulta de vendas.
- Consulta e validacao de pagamentos.
- Consulta de comprovantes.
- Fechamento diario.

### 6.10 Produtos e categorias

Requisitos:

- Cadastrar produto com nome, categoria, preco, status, imagem opcional e flag de perecivel.
- Ativar/desativar produto.
- Editar preco para novas vendas sem alterar historico de vendas antigas.
- Cadastrar categorias.
- Ordenar produtos para exibicao no catalogo.

### 6.11 Estoque

Requisitos:

- Todo produto controlado deve ter estoque atual.
- Venda confirmada ou retirada registrada deve gerar baixa de estoque.
- Ajuste manual deve gerar movimento de estoque.
- Entrada de reposicao deve gerar movimento de estoque.
- Admin deve consultar historico de movimentos.
- Deve haver alerta visual para estoque baixo.

### 6.12 Lotes pereciveis

Produtos pereciveis, como quitandas, podem exigir controle por lote diario.

Requisitos:

- Criar lote por produto, data, quantidade inicial e validade quando aplicavel.
- Registrar vendidos a partir do lote.
- Registrar sobra.
- Registrar descarte.
- Encerrar lote.
- Permitir relatorio de sobra/descarte por dia.
- Vendas devem preferencialmente consumir lote ativo mais antigo ou lote do dia, conforme regra tecnica definida na arquitetura.

### 6.13 Fechamento diario

O admin deve conseguir fechar o dia operacional.

Requisitos:

- Calcular total de vendas do periodo.
- Separar por forma de pagamento.
- Separar por status de pagamento.
- Mostrar PIX enviados, PIX confirmados, dinheiro declarado, dinheiro confirmado e pagamentos futuros.
- Mostrar pendencias e divergencias.
- Mostrar produtos vendidos por quantidade e valor.
- Mostrar sobras e descartes de lotes pereciveis.
- Permitir salvar fechamento diario.
- Fechamento salvo deve ser auditavel e nao deve apagar vendas.

## 7. Fluxos principais

### 7.1 Fluxo do comprador — retirada com PIX

1. Usuario acessa o PWA.
2. Faz login com Google.
3. Abre catalogo.
4. Seleciona produtos e quantidades.
5. Confere total.
6. Escolhe PIX.
7. Realiza pagamento fora do sistema.
8. Envia comprovante.
9. Confirma retirada.
10. Sistema registra venda, itens, pagamento e comprovante.
11. Admin valida posteriormente.

### 7.2 Fluxo do comprador — dinheiro na caixinha

1. Usuario faz login.
2. Seleciona produtos.
3. Escolhe dinheiro na caixinha.
4. Declara valor colocado.
5. Confirma retirada.
6. Sistema registra venda como declarada/pendente.
7. Admin confere dinheiro fisico e confirma.

### 7.3 Fluxo do comprador — pagamento futuro

1. Usuario faz login.
2. Seleciona produtos.
3. Escolhe pagamento futuro.
4. Confirma retirada.
5. Sistema registra pendencia.
6. Usuario ou admin regulariza depois.
7. Historico do comprador mostra pendencia ate confirmacao.

### 7.4 Fluxo admin — reposicao de estoque

1. Admin acessa area administrativa.
2. Seleciona produto.
3. Registra entrada ou cria lote.
4. Sistema atualiza estoque.
5. Sistema cria movimento de estoque.
6. Produto fica disponivel no catalogo.

### 7.5 Fluxo admin — fechamento diario

1. Admin acessa dashboard diario.
2. Confere vendas e pagamentos.
3. Valida PIX e dinheiro.
4. Registra sobras e descartes.
5. Analisa divergencias.
6. Salva fechamento diario.
7. Pendencias permanecem abertas para acompanhamento.

## 8. Requisitos de dados

### 8.1 Entidades minimas

O MVP deve conter, no minimo:

- `profiles`
- `product_categories`
- `products`
- `product_batches`
- `sales`
- `sale_items`
- `payments`
- `payment_proofs`
- `stock_movements`

### 8.2 Entidades recomendadas para fechamento

Para suportar fechamento diario com rastreabilidade, recomenda-se incluir na arquitetura tecnica:

- `daily_closings`
- `daily_closing_items` ou estrutura equivalente
- `app_settings` para configuracoes operacionais nao sensiveis
- `sync_queue_events` ou tabela equivalente de auditoria de sincronizacao, se necessario

A inclusao final dessas tabelas deve ser definida na Fase de arquitetura tecnica e modelo Supabase.

### 8.3 Status de pagamento

Status minimos recomendados:

- `declared`: comprador declarou pagamento ou acao.
- `proof_sent`: comprovante enviado.
- `confirmed`: admin confirmou.
- `pending`: pagamento pendente.
- `rejected`: admin rejeitou ou identificou problema.

### 8.4 Formas de pagamento

Formas minimas:

- `pix`
- `cash_box`
- `pay_later`

### 8.5 Movimentos de estoque

Tipos recomendados:

- `initial_balance`
- `purchase_entry`
- `sale_out`
- `manual_adjustment`
- `waste`
- `leftover`
- `correction`
- `sync_compensation`

Todo movimento deve conter motivo, usuario responsavel quando aplicavel, produto, lote quando aplicavel, quantidade e data.

## 9. Regras de negocio

### 9.1 Venda e pagamento

- Toda retirada deve gerar uma venda.
- Toda venda deve ter comprador autenticado.
- Toda venda deve ter pelo menos um item.
- O preco do item na venda deve ser congelado no momento da retirada.
- PIX e dinheiro declarados pelo comprador nao sao automaticamente confirmados.
- Pagamento futuro nasce como pendente.
- Admin pode confirmar, rejeitar ou manter pendente.
- Rejeicao deve permitir observacao administrativa.

### 9.2 Estoque

- Produto com estoque zero nao deve permitir nova retirada online.
- Produto com estoque desconhecido por operacao offline deve exigir alerta visual.
- Toda baixa de estoque deve estar ligada a venda ou ajuste auditavel.
- Ajuste manual deve exigir motivo.
- Produto perecivel deve permitir associacao a lote.

### 9.3 Lotes, sobras e descarte

- Lote perecivel deve registrar quantidade inicial.
- Quantidade vendida deve ser calculavel por venda ou movimento.
- Sobra e descarte devem ser registrados separadamente.
- Encerramento de lote deve preservar historico.
- Nao deve haver exclusao fisica de lote com movimentacao; preferir status inativo/encerrado.

### 9.4 Fechamento diario

- Fechamento diario deve refletir o estado das vendas no momento do fechamento.
- Fechamento nao deve impedir correcao posterior, mas toda correcao deve ficar auditavel.
- Pendencias devem continuar visiveis apos fechamento.
- Divergencias devem ser destacadas.

### 9.5 Offline e sincronizacao

- O app deve permitir registrar retirada offline quando o usuario ja estiver autenticado e houver dados locais suficientes.
- A operacao offline deve ser marcada como pendente de sincronizacao.
- O usuario deve saber claramente que a sincronizacao ainda nao ocorreu.
- Ao voltar online, a fila deve tentar enviar vendas, itens, pagamentos, comprovantes e movimentos relacionados.
- Conflitos de estoque devem ser tratados de forma conservadora: nao apagar registro local e exigir revisao administrativa quando necessario.

## 10. Requisitos nao funcionais

### 10.1 Usabilidade

- Fluxo de retirada deve ser simples e rapido.
- Deve funcionar bem em celular.
- Deve ser instalavel como PWA.
- Deve deixar evidente o status de pagamento.
- Deve deixar evidente quando uma acao esta pendente de sincronizacao.

### 10.2 Performance

- Catalogo deve abrir rapidamente com dados locais quando possivel.
- Operacoes comuns devem evitar telas bloqueantes longas.
- Imagens de produtos devem ser otimizadas.

### 10.3 Confiabilidade

- Falha de internet nao deve apagar carrinho nem retirada pendente.
- Dados offline devem ser persistidos em IndexedDB.
- Sincronizacao deve ser idempotente sempre que possivel.
- Cada venda criada offline deve ter identificador local unico para evitar duplicidade.

### 10.4 Seguranca

- Nao adicionar segredos reais ao repositorio.
- Usar variaveis de ambiente para chaves publicas permitidas e configuracoes.
- RLS deve restringir acesso por perfil.
- Cliente so pode ler seu proprio historico.
- Admin pode consultar dados operacionais.
- Comprovantes devem ter acesso controlado.
- Logs nao devem expor dados pessoais sensiveis.

### 10.5 Auditoria

- Vendas, pagamentos e movimentos de estoque devem preservar historico.
- Confirmacoes administrativas devem registrar responsavel e horario.
- Ajustes manuais devem exigir motivo.
- Fechamentos diarios devem ser consultaveis posteriormente.

## 11. Offline/PWA — comportamento esperado no MVP

### 11.1 Instalacao

- App deve ter manifest PWA.
- App deve possuir icones basicos.
- App deve poder ser instalado em dispositivos compativeis.

### 11.2 Cache

- Cache deve priorizar assets estaticos e shell da aplicacao.
- Dados de catalogo podem ser armazenados localmente para leitura offline.
- Dados sensiveis devem respeitar politicas de acesso e limpeza.

### 11.3 IndexedDB

Dados locais minimos recomendados:

- Catalogo sincronizado.
- Carrinho atual.
- Vendas pendentes.
- Pagamentos pendentes.
- Comprovantes pendentes, quando suportado.
- Metadados de sincronizacao.

### 11.4 Fila de sincronizacao

Cada item da fila deve conter:

- Tipo de operacao.
- Payload.
- Identificador local.
- Status.
- Tentativas.
- Ultimo erro.
- Data de criacao.
- Data da ultima tentativa.

### 11.5 Tratamento de conflito

Conflitos possiveis:

- Produto ficou sem estoque antes da sincronizacao.
- Produto foi desativado.
- Preco mudou entre cache local e sincronizacao.
- Comprovante falhou no upload.
- Venda duplicada por retentativa.

Comportamento esperado:

- Preservar registro local.
- Marcar conflito para revisao.
- Nao confirmar automaticamente venda conflitada.
- Exibir mensagem clara ao usuario/admin.

## 12. Telas do MVP

### 12.1 Area cliente

- Login.
- Catalogo.
- Busca/filtro por categoria.
- Carrinho.
- Confirmacao de retirada.
- Escolha de pagamento.
- Envio de comprovante PIX.
- Sucesso/pendencia de sincronizacao.
- Historico pessoal.
- Detalhe de venda pessoal.

### 12.2 Area admin

- Login/admin guard.
- Dashboard diario.
- Produtos.
- Categorias.
- Estoque.
- Lotes.
- Vendas.
- Pagamentos.
- Comprovantes.
- Fechamento diario.
- Pendencias/conflitos de sincronizacao.

## 13. Criterios de aceite do MVP

### 13.1 Cliente

- Usuario consegue fazer login com Google.
- Usuario consegue ver produtos ativos.
- Usuario consegue montar carrinho.
- Usuario consegue confirmar retirada com PIX e enviar comprovante.
- Usuario consegue confirmar retirada com dinheiro na caixinha.
- Usuario consegue confirmar retirada como pagamento futuro.
- Usuario consegue ver seu historico.
- Usuario nao consegue ver vendas de outros usuarios.
- Usuario entende quando uma venda esta pendente, confirmada, rejeitada ou aguardando sincronizacao.

### 13.2 Admin

- Admin consegue acessar dashboard diario.
- Admin consegue cadastrar e editar produto.
- Admin consegue cadastrar categoria.
- Admin consegue registrar entrada de estoque.
- Admin consegue criar e encerrar lote perecivel.
- Admin consegue registrar sobra e descarte.
- Admin consegue consultar vendas.
- Admin consegue validar, rejeitar ou manter pagamentos pendentes.
- Admin consegue visualizar comprovantes.
- Admin consegue salvar fechamento diario.
- Admin consegue identificar divergencias e pendencias.

### 13.3 Estoque

- Retirada gera baixa de estoque.
- Ajuste manual gera movimento de estoque.
- Entrada de estoque gera movimento de estoque.
- Produto sem estoque nao permite venda online.
- Movimento de estoque preserva auditoria.

### 13.4 Offline

- PWA instala corretamente.
- Catalogo abre com cache quando offline, se ja sincronizado antes.
- Retirada offline pode ser registrada localmente quando houver dados suficientes.
- Venda offline aparece como pendente de sincronizacao.
- Ao voltar online, fila sincroniza ou marca conflito.
- Conflitos nao somem silenciosamente.

### 13.5 Seguranca

- Nao ha segredo real versionado.
- RLS impede cliente de acessar dados de outros clientes.
- Admin e identificado por role.
- Comprovantes nao ficam publicos sem controle.
- Logs nao expõem dados pessoais de comprador ou URLs sensiveis de comprovante.

## 14. Metricas de sucesso do piloto

Durante o piloto interno, acompanhar:

- Numero de retiradas registradas no sistema.
- Percentual de vendas com pagamento confirmado.
- Valor pendente por comprador.
- Divergencia entre dinheiro declarado e dinheiro conferido.
- Quantidade de vendas offline sincronizadas com sucesso.
- Quantidade de conflitos de sincronizacao.
- Produtos com maior saida.
- Sobras e descartes por lote.
- Tempo medio para registrar retirada.
- Incidentes de uso reportados pelos compradores.

## 15. Riscos e mitigacoes

### 15.1 Risco: baixa adesao dos compradores

Mitigacao:

- Fluxo curto.
- Login simples.
- Interface mobile-first.
- Mensagens claras de pendencia e sucesso.

### 15.2 Risco: divergencia de estoque offline

Mitigacao:

- Cache com data de atualizacao.
- Aviso de operacao offline.
- Tratamento conservador de conflito.
- Revisao administrativa.

### 15.3 Risco: comprovantes sensiveis expostos

Mitigacao:

- Supabase Storage com politica controlada.
- URLs assinadas quando necessario.
- RLS e roles.
- Logs sanitizados.

### 15.4 Risco: PRs misturarem fases

Mitigacao:

- Seguir GOVERNANCE.md.
- Atualizar TASKS.md.
- Manter PRs pequenos.
- Documentar fora de escopo.

### 15.5 Risco: fechamento diario inconsistente

Mitigacao:

- Preservar vendas e movimentos.
- Nao apagar historico.
- Registrar responsavel e horario das confirmacoes.
- Exibir pendencias separadamente.

## 16. Dependencias tecnicas

- Projeto React + Vite + TypeScript limpo e funcional.
- Conta Supabase configurada.
- Google Auth habilitado no Supabase.
- Buckets de storage definidos para comprovantes e imagens de produtos.
- Variaveis de ambiente documentadas em `.env.example`.
- Projeto Vercel configurado.
- Politicas RLS definidas antes de liberar piloto.
- Estrategia PWA/offline validada em dispositivos reais.

## 17. Mapeamento por fases

### FASE 0 — Governanca e PRD

- Governanca.
- Roadmap.
- TASKS.
- PRD MVP.
- Arquitetura tecnica futura.
- Modelo de dados futuro.

### FASE 1 — Limpeza e identidade

- README real do produto.
- Titulo do app.
- `.env.example`.
- CI com lint/build.

### FASE 2 — Supabase Auth

- Cliente Supabase.
- Login Google.
- Perfil de usuario.
- Roles.
- Remocao do fluxo Firebase ativo.

### FASE 3 — Banco de dados

- Tabelas.
- Migrations.
- RLS.
- Storage.
- Seeds minimos quando necessario.

### FASE 4 — Area cliente

- Catalogo.
- Carrinho.
- Retirada.
- Pagamentos.
- Historico.

### FASE 5 — Area admin

- Dashboard.
- Produtos.
- Estoque.
- Lotes.
- Pagamentos.
- Fechamento diario.

### FASE 6 — PWA offline

- Manifest.
- Service worker.
- IndexedDB.
- Fila de sincronizacao.
- Conflitos.

### FASE 7 — Producao

- Vercel.
- Variaveis.
- Teste em producao.

### FASE 8 — Gate MVP

- Teste completo cliente.
- Teste completo admin.
- Teste estoque.
- Teste pagamentos.
- Teste offline.
- Piloto interno.

## 18. Decisoes abertas para a arquitetura tecnica

Estas decisoes nao bloqueiam o PRD, mas devem ser resolvidas antes da implementacao funcional:

1. Estrutura final das tabelas Supabase.
2. Politicas RLS por tabela.
3. Estrutura dos buckets de Storage.
4. Modelo de URLs assinadas para comprovantes.
5. Estrategia exata de consumo de lotes.
6. Estrategia de idempotencia para vendas offline.
7. Regras de conflito de estoque.
8. Campos obrigatorios de fechamento diario.
9. Estrutura de settings operacionais.
10. Se pagamento futuro podera ser regularizado pelo comprador diretamente ou apenas pelo admin.

## 19. Fora de escopo desta entrega documental

Esta entrega nao implementa:

- Banco Supabase.
- Migrations.
- RLS.
- Auth.
- Storage.
- Telas.
- PWA.
- Offline.
- Deploy.
- CI.
- Alteracoes funcionais no app.

## 20. Definicao de pronto do PRD

Este PRD e considerado pronto quando:

- Descreve problema, objetivos, nao objetivos e publico-alvo.
- Define escopo funcional do MVP.
- Define requisitos de cliente, admin, estoque, pagamentos, lotes, sobras e fechamento diario.
- Define requisitos offline/PWA.
- Define criterios de aceite do MVP.
- Lista riscos e dependencias.
- Mantem alinhamento com GOVERNANCE.md, TASKS.md e MVP_ROADMAP_CHECKLIST.md.

## 21. Status final da Fase 0 apos este PRD

FASE_0 permanece EM_ANDAMENTO ate a criacao da arquitetura tecnica e do modelo de dados Supabase.

MVP_STATUS permanece NAO_INICIADO ate a primeira fase funcional ser aberta e implementada.
