# Peria Tasks

> Backlog técnico para levar Peria do estado experimental atual até dogfooding real e um primeiro ciclo de uso público honesto.

Última revisão: 2026-06-29
Branch base: `main`

## Leitura crítica do estado atual

Peria já tem um núcleo promissor: CLI, scanner, gerador de wiki, auditoria de drift, context packs, diagramas Mermaid e pacotes npm iniciais. O produto, porém, ainda não deve ser vendido como "pronto para adoção ampla". O risco principal não é falta de ideias, é desalinhamento entre promessa pública, documentação, pacotes publicados e experiência real de instalação/uso.

Estado verificado nesta revisão:

| Área | Status realista | Observação |
| --- | --- | --- |
| `@peria/core` | Publicado e reconciliado localmente | npm reportou `0.1.1`; manifesto local ajustado para `0.1.1`. |
| `@peria/cli` | Publicado e instalável | npm reportou `0.1.2`. |
| `@peria/renderer` | Publicado e agora focado em Fumadocs | npm reportou `0.1.1`; código local removeu o caminho público de renderer estático. |
| `@peria/adapters` | Publicado, mas precisa dogfood e documentação final | npm reportou `0.1.1`; manifesto local ajustado para `0.1.1`. |
| `@peria/sdk` | Não pronto para publicar | API pública e dependências ainda parecem prematuras. |
| `@peria/api-reference` | Não pronto para publicar | Precisa decisão de produto e integração real antes de virar pacote público. |
| Renderer/Fumadocs | Conteúdo compatível gerado | `peria build` gera MDX, meta e source config compatíveis com Fumadocs; ainda falta app/preview Fumadocs completo. |
| Diagramas | Integrado ao build da wiki | `peria build` gera página `diagrams`, links para entidades detectadas, `.mmd` e grafo de módulos quando `features.mermaid = true`; ainda faltam commits/áreas e fixtures com schemas. |
| Dogfooding | Incompleto | Precisa usar pacotes publicados e validar Peria documentando Peria. |
| GitHub sync | Ideia correta, ainda não produto | Precisa design de modelo, auth, issues/milestones e rastreabilidade. |

## Princípios de execução

- Não afirmar capacidade como entregue antes de existir no fluxo principal.
- Cada tarefa precisa terminar com validação local clara.
- Priorizar dogfooding sobre novas features abstratas.
- Publicar apenas pacotes com API pública minimamente estável.
- Resolver primeiro inconsistências de release antes de ampliar superfície.
- Manter o produto focado: conhecimento técnico rastreável, não apenas site de docs.

## Sequência recomendada

1. Higiene de release e contrato público.
2. Renderer em Fumadocs com conteúdo mais rico.
3. Diagramas e mapa da aplicação dentro da wiki.
4. Dogfood real no próprio repositório Peria.
5. Adapters com contrato final e dogfood NestJS.
6. GitHub auth/sync para issues, milestones e histórico.
7. Usabilidade, DX e documentação de adoção.

---

## Milestone 0 - Higiene de release e verdade pública

Objetivo: eliminar inconsistências entre README, `PUBLISHING.md`, manifests locais, npm e comportamento real da CLI.

### T0.1 Reconciliar versões locais com npm

**Problema:** npm mostra versões mais novas do que alguns manifests locais. Isso cria risco de publicar patch errado ou instalar dependência inesperada.

**Tarefas:**

- [x] Verificar versões atuais:
  - [x] `npm view @peria/core version` → 0.1.1 ✅
  - [x] `npm view @peria/cli version` → 0.1.2 ✅
  - [x] `npm view @peria/renderer version` → 0.1.1 ✅
  - [x] `npm view @peria/adapters version` → 0.1.1 ✅
- [x] Atualizar manifests locais para refletir a verdade publicada ou preparar bump coerente.
- [x] Garantir que dependências internas apontam para versões publicadas corretas quando o pacote for publicado.
- [x] Documentar a política de versionamento enquanto não houver changesets/release automation.

**Nota:** versões npm verificadas em 2026-06-29 com `npm view`.

**Aceite:**

- [x] `package.json` dos pacotes publicados não divergem silenciosamente do npm.
- [x] `npm pack --dry-run` mostra conteúdo esperado em cada pacote.
- [x] `PUBLISHING.md` descreve a ordem real de publicação.

**Validação:**

```sh
bun run build
bun run typecheck
bun run test
npm view @peria/core version
npm view @peria/cli version
npm view @peria/renderer version
npm view @peria/adapters version
```

### T0.2 Corrigir documentação pública que promete mais do que existe

**Problema:** `README.md` e `packages/renderer/README.md` ainda podem induzir o usuário a acreditar que Fumadocs já está integrado ao renderer.

**Tarefas:**

- [x] Corrigir o README do renderer para dizer o comportamento atual ou implementar Fumadocs antes.
- [x] Atualizar `PUBLISHING.md` para remover "Adapters = Future" se o pacote já estiver publicado.
- [x] Revisar a tabela de adapters do README:
  - [x] manter somente Express, Fastify e NestJS se Hono/Elysia não estiverem no pacote;
  - [x] mover Hono/Elysia para roadmap, não para status principal.
- [x] Revisar a seção "Self-Documentation" para garantir que números de módulos/testes sejam gerados ou fáceis de atualizar.

**Aceite:**

- [x] Um usuário novo consegue ler o README e executar exatamente o que está documentado.
- [x] Nenhum README mostra import inexistente ou feature ainda não implementada como entregue.

### T0.3 Limpar artefatos acidentais do repositório

**Problema:** existe tarball dentro de `packages/renderer` (`peria-renderer-0.1.1.tgz`). Artefatos de release não devem ficar versionados no pacote fonte.

**Tarefas:**

- [x] Remover tarballs e outputs locais do repositório.
- [x] Garantir `.gitignore` cobre `*.tgz`, `dist`, caches e artefatos temporários relevantes.
- [x] Rodar `git status --short` antes e depois.

**Aceite:**

- [x] `rg --files | rg '\.tgz$'` não retorna artefatos de pacote.

### T0.4 Fresh install real com pacotes publicados

**Problema:** build local não prova que npm está bom.

**Tarefas:**

- [x] Criar diretório temporário limpo.
- [x] Instalar `@peria/cli@latest`.
- [x] Rodar `npx peria --help`.
- [x] Rodar `npx peria --version`.
- [ ] Rodar `npx peria init`, `scan`, `build`, `check` em fixture mínima.
  - [ ] `init` ainda precisa harness TTY ou validação manual.
  - [x] `scan`, `build`, `scan`, `check --json` passaram em fixture mínima com config manual.
- [x] Registrar resultado no `PUBLISHING.md`.

**Aceite:**

- [x] A instalação via npm funciona sem workspace, sem Bun global e sem links locais.

---

## Milestone 1 - Renderer Fumadocs de verdade

Objetivo: substituir o renderer estático atual por uma experiência Fumadocs real, com navegação, busca, conteúdo denso e suporte a páginas geradas.

### T1.1 Decidir arquitetura do renderer

**Decisão necessária:** Fumadocs pode entrar de três formas:

1. Gerar um app Fumadocs/Next em `docs/`.
2. Gerar uma pasta consumível por uma app Fumadocs existente.
3. Manter renderer estático como fallback e adicionar modo `--renderer fumadocs`.

**Decisão em 2026-06-29:** seguir apenas com Fumadocs. O CLI aceita `fumadocs` como renderer e rejeita `static` com erro acionável. O renderer gera arquivos compatíveis para uma app Fumadocs existente; a app/preview completa ainda é próxima etapa.

**Tarefas:**

- [x] Definir interface de renderer:
  - [x] `fumadocs`
  - [ ] futuro `headless`
- [x] Modelar config:
  - [x] `docs.renderer`
  - [x] `docs.outputDir`
  - [x] `docs.route` como base URL pública
- [x] Decidir se o pacote `@peria/renderer` deve depender de Fumadocs diretamente ou gerar arquivos compatíveis.

**Aceite:**

- [x] Existe ADR curta ou seção no `TASKS.md`/docs explicando a decisão.
- [x] CLI mostra erro acionável quando usuário seleciona renderer não suportado.

### T1.2 Criar modo Fumadocs mínimo

**Tarefas:**

- [x] Gerar estrutura de conteúdo compatível com Fumadocs.
- [x] Converter páginas wiki para MDX ou markdown aceito pelo Fumadocs.
- [x] Gerar árvore/sidebar a partir do manifest da wiki.
- [ ] Preservar links para fontes:
  - [x] arquivos;
  - [ ] rotas;
  - [ ] schemas;
  - [ ] commits quando disponíveis.
- [x] Garantir que `llms.txt` continue sendo gerado no root esperado.

**Aceite:**

- [ ] `peria build --renderer fumadocs` gera uma documentação navegável em app Fumadocs.
- [x] O modo antigo foi removido conforme decisão de produto.
- [x] Links internos entre páginas funcionam.

**Validação:**

```sh
bun run build
bun run typecheck
bun run test
node packages/cli/bin/peria.js build --renderer fumadocs
```

### T1.3 Melhorar UX da documentação gerada

**Problema:** a utilidade do Peria depende de leitura rápida, não só de gerar arquivos.

**Tarefas:**

- [ ] Página inicial com:
  - [x] resumo do projeto;
  - [x] stack detectada;
  - [x] comandos disponíveis;
  - [ ] últimos commits relevantes;
  - [x] riscos/drift encontrados.
- [ ] Página de rotas com filtros por método/status/fonte.
- [ ] Página de pacotes com grafo de dependência.
- [x] Página de módulos com responsabilidade, exports e relações.
- [ ] Página de drift com severidade e ação recomendada.
- [x] Página de contexto para agentes.

**Aceite:**

- [ ] Um mantenedor consegue responder "o que eu posso mudar sem quebrar?" olhando a wiki.
- [ ] Cada afirmação importante aponta para fonte verificável.

### T1.4 Busca e navegação

**Tarefas:**

- [x] Integrar busca do Fumadocs ou gerar índice compatível.
- [ ] Indexar entidades, rotas, schemas, pacotes e páginas.
- [ ] Adicionar breadcrumbs e relações "related".
- [ ] Garantir que nomes canônicos resolvem aliases.

**Aceite:**

- [ ] Buscar por uma rota, service, schema ou pacote leva a uma página útil.

---

## Milestone 2 - Mais conteúdo, diagramas e mapa da aplicação

Objetivo: transformar a wiki em um mapa técnico navegável, não apenas páginas estáticas.

### T2.1 Incorporar Mermaid no build principal

**Problema:** o módulo Mermaid existe, mas precisa entrar no fluxo normal da documentação.

**Tarefas:**

- [x] Gerar diagramas durante `peria build` quando `features.mermaid = true`.
- [x] Incluir diagramas na página inicial.
- [x] Criar página `diagrams`.
- [x] Linkar diagramas a entidades reais do manifest.
- [ ] Permitir export:
  - [x] `.mmd`;
  - [x] markdown embutido;
  - [ ] SVG/PNG somente se houver dependência justificada.

**Diagramas mínimos:**

- [ ] Fluxo de rotas.
- [x] Dependências entre pacotes.
- [ ] Relações entre schemas.
- [x] Mapa de módulos.
- [ ] Mudanças por commit/área.

**Aceite:**

- [x] `peria build` gera páginas que mostram os diagramas.
- [x] `peria diagram` e `peria build` compartilham o mesmo motor.

### T2.2 Criar application map

**Tarefas:**

- [x] Definir tipo `ApplicationMap`.
- [x] Agregar:
  - [x] entrypoints;
  - [x] frameworks;
  - [x] pacotes;
  - [x] rotas;
  - [x] schemas;
  - [x] módulos;
  - [x] arquivos markdown;
  - [x] OpenAPI;
  - [x] relações Git básicas.
- [x] Serializar em `.peria/application-map.json`.
- [x] Renderizar página dedicada.

**Aceite:**

- [x] O mapa responde "quais partes existem e como se conectam?" sem ler o código.

### T2.3 Melhorar qualidade das claims

**Tarefas:**

- [ ] Cada claim relevante deve ter:
  - [ ] texto específico;
  - [ ] fonte;
  - [ ] data/contexto;
  - [ ] relação com entidade;
  - [ ] confiança.
- [ ] Criar teste para impedir claim sem fonte.
- [ ] Expor claims na UI.

**Aceite:**

- [ ] A wiki deixa claro o que foi detectado, inferido ou configurado manualmente.

---

## Milestone 3 - Dogfood real em Peria

Objetivo: Peria precisa documentar Peria usando o pacote instalado como um usuário externo usaria.

### T3.1 Dogfood usando npm, não workspace

**Tarefas:**

- [x] Criar script de dogfood que instala `@peria/cli@latest` em ambiente temporário.
- [ ] Rodar contra o próprio checkout do Peria.
- [x] Gerar docs em diretório controlado.
- [x] Comparar saída com fixtures esperadas.
- [x] Rodar `peria check` contra a saída gerada.

**Aceite:**

- [x] O resultado não depende de `workspace:*`.
- [x] O comando falha se pacote publicado estiver quebrado.

### T3.2 Publicar os docs dogfoodados

**Tarefas:**

- [x] Decidir destino:
  - [x] `docs/` versionado;
  - [ ] GitHub Pages;
  - [ ] release artifact;
  - [ ] todos, em fases.
- [x] Garantir que docs gerados não geram ruído impossível de revisar.
- [ ] Criar comando:
  - [x] `bun run docs:generate`;
  - [x] `bun run docs:check`;
  - [x] `bun run docs:serve`.

**Aceite:**

- [x] Um contribuidor consegue abrir a documentação do próprio Peria localmente.
- [ ] CI consegue detectar quando docs estão obsoletos.

### T3.3 Usar a wiki para guiar desenvolvimento

**Tarefas:**

- [x] Criar página "Development Map".
- [x] Criar página "Release Status".
- [x] Criar página "Known Gaps".
- [ ] Linkar issues/milestones quando GitHub sync existir.

**Aceite:**

- [x] A documentação gerada passa a ser insumo real de manutenção, não vitrine.

---

## Milestone 4 - Adapters e dogfood NestJS

Objetivo: provar que adapters funcionam em apps reais e publicar apenas o que tem contrato testado.

### T4.1 Revalidar pacote `@peria/adapters`

**Tarefas:**

- [x] Confirmar exports publicados:
  - [x] `.`
  - [x] `./express`
  - [x] `./fastify`
  - [x] `./nest`
- [x] Garantir que Hono/Elysia não aparecem em package exports se forem placeholders.
- [x] Testar consumo em app externo temporário.
- [x] Ajustar README com exemplos completos.

**Aceite:**

- [x] `npm install @peria/adapters` funciona fora do monorepo.
- [x] Express, Fastify e NestJS conseguem servir manifest, `llms.txt` e artefatos Fumadocs gerados.

### T4.2 Dogfood em NestJS

**Tarefas:**

- [x] Criar fixture NestJS realista ou usar fixture existente.
- [x] Instalar `@peria/cli` e `@peria/adapters`.
- [x] Gerar docs.
- [x] Servir docs dentro da aplicação NestJS.
- [x] Validar endpoint:
  - [x] `/docs`
  - [x] `/docs/wiki-manifest.json`
  - [x] `/docs/llms.txt`
  - [x] artefatos Fumadocs.
- [x] Cobrir cenário com prefixo global de rota.
- [x] Cobrir cenário com app em subpath.

**Aceite:**

- [x] O adapter NestJS funciona com app real, não só teste smoke.
- [x] Erros comuns são acionáveis:
  - [x] docs não gerados;
  - [x] caminho errado;
  - [x] asset ausente;
  - [x] permissão de leitura.

### T4.3 Decidir futuro do SDK

**Problema:** SDK e adapters se sobrepõem. Publicar SDK cedo pode congelar uma API errada.

**Tarefas:**

- [x] Mapear diferenças entre `@peria/sdk` e `@peria/adapters`.
- [x] Decidir se SDK será:
  - [x] API programática futura para scan/build/check;
  - [x] não será camada de adapters;
  - [x] pacote privado/deferido por enquanto.
- [x] Remover dependências prematuras se não houver caso real.

**Aceite:**

- [x] SDK não é publicado até ter contrato e teste de consumo.

---

## Milestone 5 - GitHub auth, issues, milestones e sincronização

Objetivo: conectar provenance e planejamento ao GitHub sem transformar Peria em clone de issue tracker.

### T5.1 Definir escopo do GitHub sync

**Escopo recomendado para primeira versão:**

- Ler issues, PRs, milestones e commits.
- Relacionar entidades detectadas a commits/PRs/issues.
- Criar issues a partir de drift findings.
- Sincronizar status de tasks na documentação.

**Fora de escopo inicialmente:**

- Editar PRs complexos.
- Gerenciar projetos GitHub Projects v2.
- Fazer automação de release completa.
- Substituir Linear/Jira.

### T5.2 Autenticação GitHub

**Tarefas:**

- [x] Suportar `gh auth token` quando GitHub CLI estiver logado.
- [x] Suportar `GITHUB_TOKEN`.
- [x] Suportar token em config local ignorada por git, se necessário.
- [x] Nunca gravar token em `.peria/manifest.json`, docs ou logs.
- [x] Adicionar comando de diagnóstico:
  - [x] `peria github auth status`
  - [x] `peria github auth login` somente se fizer sentido delegar ao `gh`.

**Aceite:**

- [x] Usuário entende exatamente qual credencial está sendo usada.
- [x] Falha de auth sugere correção objetiva.

### T5.3 Modelo de dados GitHub

**Tarefas:**

- [x] Criar tipos:
  - [x] `GitHubIssue`
  - [x] `GitHubPullRequest`
  - [x] `GitHubMilestone`
  - [x] `GitHubCommit`
  - [x] `GitHubRelation`
- [x] Persistir cache em `.peria/github.json`.
- [x] Linkar GitHub ao knowledge graph:
  - [x] `entity changed_by commit`
  - [x] `commit belongs_to pr`
  - [x] `pr fixes issue`
  - [x] `issue belongs_to milestone`
  - [x] `drift finding opens issue`

**Aceite:**

- [ ] A UI consegue mostrar por que uma rota/schema/módulo mudou.

### T5.4 Criar issues a partir de drift

**Tarefas:**

- [ ] Adicionar comando:
  - [ ] `peria github issues create-from-check`
  - [ ] ou `peria check --create-issues`
- [ ] Deduplicar issues por fingerprint.
- [ ] Adicionar labels configuráveis:
  - [ ] `peria`
  - [ ] `docs-drift`
  - [ ] severidade.
- [ ] Escrever corpo da issue com:
  - [ ] achado;
  - [ ] fonte;
  - [ ] impacto;
  - [ ] comando para reproduzir;
  - [ ] sugestão de correção.

**Aceite:**

- [ ] Rodar duas vezes não duplica issues.
- [ ] Issues abertas aparecem na wiki.

### T5.5 Milestones e organização de tarefas

**Tarefas:**

- [ ] Mapear milestones GitHub para páginas de roadmap.
- [ ] Sincronizar status:
  - [ ] open;
  - [ ] closed;
  - [ ] done;
  - [ ] blocked, via label se existir.
- [ ] Expor página "Milestones".
- [ ] Linkar commits e PRs recentes a cada milestone.

**Aceite:**

- [ ] Peria consegue gerar um relatório de progresso técnico rastreável.

### T5.6 Logs de commits melhores

**Tarefas:**

- [ ] Melhorar extração de commits locais.
- [ ] Agrupar commits por pacote/área afetada.
- [ ] Detectar Conventional Commits.
- [ ] Relacionar commits a issues por referência `#123`.
- [ ] Mostrar impacto esperado do diff.

**Aceite:**

- [ ] A documentação responde "o que mudou recentemente e que docs/rotas isso afeta?".

---

## Milestone 6 - Usabilidade e DX

Objetivo: reduzir atrito para o primeiro usuário real.

### T6.1 Melhorar `peria init`

**Tarefas:**

- [ ] Detectar framework com confiança.
- [ ] Sugerir config mínima.
- [ ] Explicar o que será criado.
- [ ] Não sobrescrever arquivo sem confirmação.
- [ ] Gerar config com comentários úteis e poucos campos.

**Aceite:**

- [ ] Um usuário consegue iniciar em menos de 2 minutos.

### T6.2 Melhorar mensagens de erro

**Tarefas:**

- [ ] Revisar erros de:
  - [ ] config ausente;
  - [ ] package.json ausente;
  - [ ] OpenAPI inválido;
  - [ ] docs ausentes;
  - [ ] renderer inválido;
  - [ ] token GitHub ausente.
- [ ] Adicionar código de erro quando útil.
- [ ] Garantir que cada erro tem próxima ação.

**Aceite:**

- [ ] Um erro comum não exige abrir o código-fonte para resolver.

### T6.3 CI de qualidade

**Tarefas:**

- [ ] Rodar em CI:
  - [ ] `bun install`
  - [ ] `bun run build`
  - [ ] `bun run typecheck`
  - [ ] `bun run test`
  - [ ] dogfood npm fresh install.
- [ ] Adicionar job de pack validation.
- [ ] Adicionar job de docs drift.

**Aceite:**

- [ ] Nenhum pacote novo é publicado sem teste de consumo.

---

## Milestone 7 - Preparação para adoção pública

Objetivo: transformar o projeto em algo que outra pessoa consegue experimentar, entender e avaliar.

### T7.1 README orientado a uso real

**Tarefas:**

- [ ] Separar "shipped" de "roadmap".
- [ ] Adicionar exemplo real de saída.
- [ ] Adicionar screenshot ou GIF da wiki gerada quando renderer estiver bom.
- [ ] Adicionar seção "When to use Peria".
- [ ] Adicionar seção "Limitations".

**Aceite:**

- [ ] README não parece maior que o produto.
- [ ] Limitações aumentam confiança em vez de esconder lacunas.

### T7.2 Exemplo end-to-end

**Tarefas:**

- [ ] Criar exemplo `examples/nestjs-api`.
- [ ] Incluir:
  - [ ] rotas;
  - [ ] DTOs/schemas;
  - [ ] OpenAPI;
  - [ ] README;
  - [ ] docs gerados;
  - [ ] adapter NestJS.
- [ ] Adicionar script de validação do exemplo.

**Aceite:**

- [ ] O exemplo é o principal caminho para testar Peria.

### T7.3 Release notes e changelog

**Tarefas:**

- [ ] Criar `CHANGELOG.md`.
- [ ] Documentar versões já publicadas.
- [ ] Registrar breaking changes enquanto API ainda é experimental.
- [ ] Definir política de beta.

**Aceite:**

- [ ] Usuário sabe o que mudou entre `0.1.x`.

---

## Ordem de commits sugerida

1. `docs: add detailed product task backlog`
2. `chore: reconcile published package versions`
3. `docs: align public docs with shipped package behavior`
4. `chore: remove release artifacts from source tree`
5. `test: add fresh npm install dogfood validation`
6. `feat(renderer): add renderer mode selection`
7. `feat(renderer): generate fumadocs-compatible output`
8. `feat(core): embed mermaid diagrams into wiki build`
9. `feat(core): add application map artifact`
10. `test(adapters): dogfood nestjs adapter with generated docs`
11. `feat(github): add auth status and read-only sync`
12. `feat(github): create issues from drift findings`

## Comandos de validação padrão

Use este bloco no fim de cada mudança relevante:

```sh
bun run build
bun run typecheck
bun run test
node packages/cli/bin/peria.js scan
node packages/cli/bin/peria.js build
node packages/cli/bin/peria.js check --json
```

Para release:

```sh
npm pack --dry-run --workspace packages/core
npm pack --dry-run --workspace packages/renderer
npm pack --dry-run --workspace packages/cli
npm pack --dry-run --workspace packages/adapters
```

Para dogfood publicado:

```sh
tmpdir="$(mktemp -d)"
cd "$tmpdir"
npm init -y
npm install -D @peria/cli@latest @peria/adapters@latest
npx peria --help
npx peria --version
```

## Critérios para dizer "pronto para dogfooding"

- [ ] Instalação via npm funciona fora do monorepo.
- [ ] `peria init -> scan -> build -> serve -> check` funciona em projeto real.
- [ ] Wiki renderizada é útil para humanos.
- [ ] `llms.txt` e context packs são úteis para agentes.
- [ ] Diagramas aparecem no fluxo principal.
- [x] Adapter NestJS serve docs reais.
- [ ] README descreve apenas o que funciona.
- [ ] Limitações conhecidas estão documentadas.
- [ ] CI pega regressão de pacote publicado.

## Critérios para dizer "pronto para beta público"

- [ ] Dogfood em Peria passa no CI.
- [ ] Dogfood em NestJS passa no CI.
- [ ] Renderer Fumadocs ou fallback estático tem qualidade aceitável.
- [ ] GitHub sync read-only funciona ou está claramente marcado como futuro.
- [ ] Issues criadas por drift têm deduplicação.
- [ ] Pacotes publicados têm versões coerentes.
- [ ] Changelog existe.
- [ ] Exemplo end-to-end existe.
- [ ] Não há placeholders publicados como API estável.

## O que eu não faria agora

- Não publicaria `@peria/sdk` antes de dogfoodar adapters e CLI.
- Não publicaria `@peria/api-reference` antes de decidir se Stoplight é parte central ou plugin opcional.
- Não adicionaria Hono/Elysia de volta sem teste real e exemplo.
- Não faria GitHub Projects v2 agora.
- Não substituiria o renderer atual de uma vez sem fallback.
- Não prometeria "drift detection automático" sem explicar exatamente quais checks existem e seus limites.
