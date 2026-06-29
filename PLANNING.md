# Peria Execution Plan

## Research Summary

### M0 - Higiene (IMEDIATO)
- **T0.3 CRÍTICO**: 4 arquivos `.tgz` no repo + `.gitignore` não ignora `*.tgz`
- **T0.2**: renderer/README.md promete Fumadocs (mentira)
- **T0.1**: core local=0.1.0 pode divergir do npm
- **T0.4**: dogfood via npm não executado

### M1 - Renderer Fumadocs (PÓS-M0)
- Decisão atual: seguir apenas com Fumadocs, sem fallback estático público
- `peria build` deve gerar conteúdo compatível com Fumadocs e rejeitar renderer não suportado
- Diff mínimo: `docs.renderer` default `fumadocs`, CLI valida `--renderer`, e renderer gera MDX/meta/source config
- **NÃO**: busca customizada, theming, i18n agora

### M2-7 Status
- **M2**: Mermaid existe (`packages/core/src/mermaid/`) mas não integrado no build
- **M3**: Dogfood não existe (depende de M1 + M2 + M4)
- **M4**: Adapters publicados com 3 frameworks (Express/Fastify/NestJS) - bom estado base
- **M5**: GitHub sync não existe (longo alcance)
- **M6-7**: DX/UX e adoção pública (polish final)

---

## Commits Sugeridos (Ordem de Execução)

```
1. docs: add detailed product task backlog ✅
2. chore: remove release artifacts from source tree     (T0.3)
3. chore: reconcile published package versions           (T0.1)
4. docs: align public docs with shipped behavior        (T0.2)
5. test: add fresh npm install dogfood validation      (T0.4)
6. feat(renderer): add renderer mode selection         (T1.1)
7. feat(renderer): generate fumadocs-compatible output (T1.2)
8. feat(core): embed mermaid diagrams into wiki build  (T2.1)
9. feat(core): add application map artifact            (T2.2)
10. test(adapters): dogfood nestjs adapter             (T4.2)
11. feat(github): add auth status and read-only sync   (T5.x)
12. feat(github): create issues from drift findings    (T5.4)
```

---

## Ações Mínimas por Milestone

### M0 (4 commits)
```
git rm packages/*/*.tgz
echo "*.tgz" >> .gitignore
# Fix renderer/README.md
# Fix PUBLISHING.md
# Fix README principal (remover Hono/Elysia)
```

### M1 (2 commits)
- Adicionar `docs.renderer` ao config schema com default `fumadocs`
- CLI propaga e valida `--renderer fumadocs`
- Remover caminho público do renderer estático
- Gerar conteúdo Fumadocs-compatible a partir das páginas da wiki

### M2 (2 commits)
- Integrar Mermaid no build principal (flag `features.mermaid`)
- Gerar `application-map.json`
- Diagramas: route-flow, package-deps, schema relations

### M3 (dogfood)
- Script que instala `@peria/cli@latest` em tmpdir
- Valida scan → build → serve → check
- Publish docs gerados

### M4 (adapters)
- Dogfood NestJS com fixture existente
- Validar endpoints: `/docs`, `wiki-manifest.json`, `llms.txt`

### M5 (GitHub - longo alcance)
- `peria github auth status`
- Cache em `.peria/github.json`
- Read-only sync + create issues from drift

### M6-7 (polish)
- Melhorar `peria init`
- README end-to-end
- CHANGELOG

---

## Critério de Done

### Dogfooding pronto
- [x] Instalação npm fora monorepo
- [x] `init → scan → build → serve → check` funciona
- [x] Wiki útil para humanos
- [x] `llms.txt` útil para agentes
- [x] Diagramas no fluxo principal
- [x] Adapter NestJS serve docs reais
- [x] README descreve só o que funciona
- [x] Limitações documentadas
- [x] CI detecta regressão de pacote

### Beta público pronto
- [x] Dogfood Peria passa no CI
- [x] Dogfood NestJS passa no CI
- [x] Renderer Fumadocs ou fallback com qualidade aceitável
- [x] GitHub sync read-only ou claramente marcado como futuro
- [x] Issues de drift com deduplicação
- [x] Versões coerentes
- [x] CHANGELOG existe
- [x] Exemplo end-to-end existe
- [x] Sem placeholders como API estável

---

## O QUE NÃO FAZER AGORA

- NÃO publicar `@peria/sdk` antes de dogfoodar adapters + CLI
- NÃO adicionar Hono/Elysia sem teste real
- NÃO GitHub Projects v2
- NÃO substituir renderer de uma vez sem fallback
- NÃO prometer drift detection automático sem limites claros
