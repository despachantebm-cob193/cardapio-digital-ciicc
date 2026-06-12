# Criterios de Aceite — MVP Cardapio Digital CIICC

Data: 2026-06-12
Status: CRITERIOS_ACEITE_INICIAL
Fase: FASE_0
MVP_STATUS: NAO_INICIADO
Tipo: Documento de criterios de aceite

## 1. Objetivo

Este documento define os criterios de aceite finais do MVP e da Fase 0 do Cardapio Digital CIICC.

Esta entrega e documental. Nao implementa banco, telas, autenticacao, PWA, deploy, migrations ou regras funcionais.

## 2. Referencias oficiais

- docs/PRD_MVP.md
- docs/TECHNICAL_ARCHITECTURE_MVP.md
- docs/SUPABASE_DATA_MODEL_MVP.md
- docs/GOVERNANCE.md
- docs/MVP_ROADMAP_CHECKLIST.md
- TASKS.md

## 3. Criterios de aceite da Fase 0

A Fase 0 sera considerada concluida quando:

- A necessidade de negocio estiver documentada.
- O produto alvo estiver definido.
- A arquitetura alvo estiver definida.
- O roadmap do MVP estiver criado.
- A governanca do projeto estiver criada.
- O TASKS.md estiver criado e atualizado.
- O PRD completo do MVP estiver criado.
- A arquitetura tecnica do MVP estiver criada.
- O modelo de dados Supabase do MVP estiver criado.
- Este documento de criterios de aceite estiver criado.
- A PR documental da Fase 0 estiver aberta, revisada e pronta para merge.
- Nenhuma alteracao funcional tiver sido incluida na Fase 0.
- Nenhum segredo real tiver sido versionado.

## 4. Criterios de aceite do MVP — Cliente

O MVP sera aceitavel para o comprador interno quando:

- Usuario consegue acessar o app como PWA ou via navegador.
- Usuario consegue autenticar com Google.
- Usuario autenticado possui profile associado.
- Usuario consegue visualizar produtos ativos.
- Usuario consegue filtrar ou localizar produtos por categoria.
- Usuario consegue adicionar produtos ao carrinho.
- Usuario consegue alterar quantidade no carrinho.
- Usuario consegue remover item do carrinho.
- Usuario visualiza total da retirada antes de confirmar.
- Usuario consegue registrar retirada com PIX.
- Usuario consegue anexar comprovante PIX.
- Usuario consegue registrar retirada com dinheiro na caixinha.
- Usuario consegue registrar retirada com pagamento futuro.
- Usuario visualiza status de pagamento.
- Usuario visualiza status de sincronizacao quando offline.
- Usuario consegue consultar historico pessoal.
- Usuario nao consegue acessar vendas de outros usuarios.

## 5. Criterios de aceite do MVP — Admin

O MVP sera aceitavel para administracao quando:

- Admin consegue autenticar com Google.
- Admin e identificado por role.
- Admin acessa area administrativa protegida.
- Admin consegue visualizar dashboard diario.
- Admin consegue cadastrar categoria.
- Admin consegue cadastrar produto.
- Admin consegue editar produto.
- Admin consegue ativar/desativar produto.
- Admin consegue registrar entrada de estoque.
- Admin consegue consultar movimentos de estoque.
- Admin consegue criar lote perecivel.
- Admin consegue encerrar lote perecivel.
- Admin consegue registrar sobra.
- Admin consegue registrar descarte.
- Admin consegue consultar vendas.
- Admin consegue consultar pagamentos.
- Admin consegue visualizar comprovantes.
- Admin consegue confirmar pagamento.
- Admin consegue rejeitar pagamento com motivo.
- Admin consegue acompanhar pagamentos futuros.
- Admin consegue salvar fechamento diario.
- Admin consegue visualizar pendencias e divergencias.

## 6. Criterios de aceite — Pagamentos

### 6.1 PIX

- Venda com PIX registra forma `pix`.
- Comprovante pode ser anexado.
- Comprovante fica associado ao pagamento correto.
- Pagamento com comprovante inicia como `proof_sent` ou status equivalente.
- Admin consegue confirmar.
- Admin consegue rejeitar.
- Cliente visualiza status atualizado.

### 6.2 Dinheiro na caixinha

- Venda com dinheiro registra forma `cash_box`.
- Valor declarado e salvo.
- Pagamento nao e tratado como confirmado automaticamente.
- Admin consegue confirmar apos conferencia.
- Admin consegue manter pendente em caso de divergencia.

### 6.3 Pagamento futuro

- Venda com pagamento futuro registra forma `pay_later`.
- Pagamento nasce pendente.
- Cliente visualiza pendencia.
- Admin visualiza pendencia.
- Admin consegue regularizar posteriormente.

## 7. Criterios de aceite — Estoque

- Produto possui estoque atual.
- Produto sem estoque nao permite venda online.
- Retirada gera baixa de estoque.
- Entrada de estoque gera movimento.
- Ajuste manual gera movimento com motivo.
- Movimento preserva produto, quantidade, tipo, data e responsavel quando aplicavel.
- Historico de estoque e consultavel pelo admin.
- Estoque negativo deve ser impedido ou tratado como conflito administrativo.

## 8. Criterios de aceite — Lotes, sobras e descartes

- Produto perecivel pode ter lote.
- Lote registra quantidade inicial.
- Lote registra quantidade vendida.
- Lote registra sobra.
- Lote registra descarte.
- Lote pode ser encerrado.
- Lote encerrado preserva historico.
- Sobra e descarte aparecem no fechamento ou relatorio administrativo.

## 9. Criterios de aceite — Fechamento diario

- Admin consegue gerar fechamento por data.
- Fechamento mostra total vendido.
- Fechamento separa pagamentos por forma.
- Fechamento separa pagamentos por status.
- Fechamento mostra PIX confirmados.
- Fechamento mostra dinheiro declarado.
- Fechamento mostra dinheiro confirmado.
- Fechamento mostra pagamentos futuros.
- Fechamento mostra pendencias.
- Fechamento mostra rejeicoes.
- Fechamento mostra sobras e descartes.
- Fechamento salvo nao apaga vendas.
- Correcao posterior deve ser auditavel.

## 10. Criterios de aceite — Offline/PWA

- App possui manifest PWA.
- App pode ser instalado em dispositivo compativel.
- App carrega shell basico offline.
- Catalogo previamente sincronizado pode ser exibido offline.
- Carrinho nao e perdido por queda momentanea de internet.
- Retirada offline pode ser registrada quando houver dados locais suficientes.
- Venda offline recebe identificador local.
- Venda offline aparece como pendente de sincronizacao.
- Ao voltar online, fila tenta sincronizar.
- Venda sincronizada muda para status sincronizado.
- Conflito nao e apagado silenciosamente.
- Conflito aparece para revisao administrativa.

## 11. Criterios de aceite — Seguranca e RLS

- Nenhum segredo real esta versionado.
- Variaveis sensiveis nao aparecem no repositorio.
- Cliente so le seus proprios dados sensiveis.
- Admin acessa dados operacionais por role.
- Comprovantes nao ficam publicos sem decisao explicita.
- Upload de comprovante e restrito a comprador dono ou admin.
- Logs nao expõem dados pessoais sensiveis.
- RLS deve estar ativa nas tabelas sensiveis antes do piloto.

## 12. Criterios de aceite — Deploy

- App publicado em Vercel.
- Variaveis de ambiente configuradas.
- Build de producao executa com sucesso.
- Login Google funciona em ambiente de producao.
- Supabase Auth possui redirect correto.
- Storage funciona em producao.
- Fluxo cliente funciona em producao.
- Fluxo admin funciona em producao.

## 13. Criterios de aceite — Governanca de PRs

Cada PR futura deve conter:

- Fase identificada.
- Objetivo.
- Escopo.
- Fora de escopo.
- Arquivos afetados.
- Riscos.
- Criterios de aceite.
- Evidencias de validacao.
- Confirmacao de que nao ha segredos reais.
- Confirmacao de que nao mistura fases sem justificativa.

## 14. Criterios bloqueantes para o piloto

O piloto interno nao deve iniciar se:

- Auth Google nao estiver funcionando.
- RLS nao estiver configurada.
- Cliente conseguir ver dados de outro cliente.
- Admin nao conseguir validar pagamentos.
- Estoque nao baixar em retirada.
- Comprovante ficar publico sem controle.
- Venda offline puder duplicar sem idempotencia.
- Fechamento diario nao preservar historico.
- Houver segredo real no repositorio.

## 15. Evidencias esperadas no Gate MVP

No Gate MVP, registrar:

- Resultado do teste cliente.
- Resultado do teste admin.
- Resultado do teste pagamentos.
- Resultado do teste estoque.
- Resultado do teste lotes.
- Resultado do teste fechamento diario.
- Resultado do teste offline.
- Resultado do teste RLS.
- Resultado do teste deploy.
- Pendencias conhecidas.
- Decisao final sobre liberar piloto interno.

## 16. Fora de escopo deste documento

Este documento nao implementa:

- Codigo.
- Banco.
- Migrations.
- RLS.
- Auth.
- Storage.
- Deploy.
- PWA.
- Offline.

## 17. Estado final

- FASE_0=EM_ANDAMENTO
- CRITERIOS_ACEITE_STATUS=CRIADOS
- MVP_STATUS=NAO_INICIADO
- IMPLEMENTACAO_FUNCIONAL=NAO
