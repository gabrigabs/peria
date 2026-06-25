/**
 * Wiki Graph - Builds the knowledge graph
 */

import type {
  AdapterSummary,
  Claim,
  CliCommandSummary,
  Entity,
  EntityRelation,
  EntityType,
  FeatureSummary,
  GitMetadata,
  KnowledgeGraphArtifact,
  ModuleSummary,
  PackageSummary,
  Provenance,
  WikiPage,
} from '../types/wiki.js';

const GRAPH_VERSION = '0.1.0';

function provenance(
  source: string,
  line: number | undefined,
  commit: string | undefined
): Provenance {
  return {
    source,
    line,
    commit,
  };
}

export function createGraph(input: {
  generatedAt: string;
  commit?: string;
  git: GitMetadata;
  packages: PackageSummary[];
  modules: ModuleSummary[];
  cliCommands: CliCommandSummary[];
  features: FeatureSummary[];
  adapters: AdapterSummary[];
  pages: WikiPage[];
}): KnowledgeGraphArtifact {
  const claims: Claim[] = [];
  const entities: Entity[] = [];
  let claimCount = 0;

  function claim(
    subject: string,
    predicate: string,
    object: string,
    provenanceVal: Provenance,
    confidence: Claim['confidence'] = 'high'
  ): Claim {
    claimCount += 1;
    const nextClaim: Claim = {
      id: `claim:${claimCount}`,
      subject,
      predicate,
      object,
      confidence,
      provenance: provenanceVal,
      timestamp: input.generatedAt,
    };
    claims.push(nextClaim);
    return nextClaim;
  }

  function entity(
    id: string,
    name: string,
    type: EntityType,
    path: string | undefined,
    description: string,
    entityClaims: Claim[],
    relations: EntityRelation[] = []
  ): void {
    entities.push({
      id,
      name,
      type,
      path,
      description,
      claims: entityClaims,
      relations,
    });
  }

  for (const pkg of input.packages) {
    const id = `package:${pkg.name}`;
    entity(
      id,
      pkg.name,
      'package',
      pkg.manifestPath,
      pkg.description ?? `Workspace package ${pkg.name}`,
      [
        claim(id, 'defined_in', pkg.manifestPath, provenance(pkg.manifestPath, 1, input.commit)),
        claim(
          id,
          'has_scripts',
          Object.keys(pkg.scripts).join(', ') || 'none',
          provenance(pkg.manifestPath, 1, input.commit)
        ),
      ]
    );
  }

  for (const module of input.modules) {
    const id = `module:${module.path}`;
    const exportNames = module.exports.map((item) => item.name).join(', ') || 'none';
    entity(
      id,
      module.path,
      'source-file',
      module.path,
      `TypeScript module with ${module.exports.length} exported declarations.`,
      [claim(id, 'exports', exportNames, provenance(module.path, 1, input.commit))]
    );

    for (const item of module.exports) {
      const exportId = `export:${module.path}:${item.name}`;
      entity(
        exportId,
        item.name,
        'export',
        module.path,
        `${item.kind} exported from ${module.path}.`,
        [
          claim(
            exportId,
            'exported_from',
            module.path,
            provenance(module.path, item.line, input.commit)
          ),
        ]
      );
    }
  }

  for (const command of input.cliCommands) {
    const id = `cli-command:${command.name}`;
    entity(id, command.name, 'cli-command', command.source, command.description, [
      claim(
        id,
        'registered_in',
        command.source,
        provenance(command.source, command.line, input.commit)
      ),
      claim(
        id,
        'described_as',
        command.description,
        provenance(command.source, command.line, input.commit)
      ),
    ]);
  }

  for (const feature of input.features) {
    const id = `feature:${feature.name}`;
    entity(
      id,
      feature.name,
      'feature',
      feature.source,
      `Feature flag ${feature.name} is ${feature.enabled ? 'enabled' : 'disabled'}.`,
      [
        claim(
          id,
          'enabled',
          String(feature.enabled),
          provenance(feature.source, feature.line, input.commit)
        ),
      ]
    );
  }

  for (const adapter of input.adapters) {
    const id = `adapter:${adapter.name}`;
    entity(
      id,
      adapter.name,
      'adapter',
      adapter.source,
      `Framework adapter exported from ${adapter.source}.`,
      [claim(id, 'defined_in', adapter.source, provenance(adapter.source, 1, input.commit))]
    );
  }

  for (const page of input.pages) {
    const id = `wiki-page:${page.slug}`;
    entity(id, page.title, 'wiki-page', page.path, page.description, [
      claim(
        id,
        'generated_from',
        page.sourcePaths.join(', '),
        provenance(page.sourcePaths[0] ?? page.path, 1, input.commit),
        'medium'
      ),
    ]);
  }

  return {
    version: GRAPH_VERSION,
    generatedAt: input.generatedAt,
    commit: input.commit,
    git: input.git,
    entities,
    claims,
  };
}
