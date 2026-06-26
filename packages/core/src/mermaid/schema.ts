/**
 * Schema Diagram Generator
 *
 * Generate schema relationship diagrams in Mermaid ER diagram format.
 */

import type { MermaidDiagram, MermaidOptions } from './types.js';
import { generateDiagramId, DIAGRAM_TYPE_LABELS } from './types.js';
import type { PeriaManifest } from '../types/manifest.js';

/**
 * Generate schema diagrams
 */
export function generateSchemaDiagrams(
  manifest: PeriaManifest,
  options: MermaidOptions
): MermaidDiagram[] {
  const diagrams: MermaidDiagram[] = [];

  if (manifest.schemas.length === 0) {
    return diagrams;
  }

  // Generate overall schema diagram
  const overview = generateSchemaOverview(manifest.schemas.map((s) => ({
    name: s.name,
    id: s.id,
    file: s.file ?? 'unknown',
    properties: s.properties ?? [],
  })));

  if (overview) {
    diagrams.push(overview);
  }

  // Generate individual schema diagrams
  const maxPerType = options.maxPerType ?? 5;
  for (const schema of manifest.schemas.slice(0, maxPerType)) {
    const diagram = generateSchemaDetail(schema.name, schema.properties ?? [], schema.id);
    diagrams.push(diagram);
  }

  return diagrams;
}

/**
 * Generate overall schema overview
 */
function generateSchemaOverview(
  schemas: {
    name: string;
    id: string;
    file: string;
    properties: { name: string; type?: string; required?: boolean }[];
  }[]
): MermaidDiagram | null {
  if (schemas.length === 0) {
    return null;
  }

  const lines: string[] = [];

  lines.push('```mermaid');
  lines.push('erDiagram');

  // Limit to 15 schemas for overview
  const limitedSchemas = schemas.slice(0, 15);

  for (const schema of limitedSchemas) {
    const nodeId = schema.name.replace(/[^a-zA-Z0-9]/g, '');
    lines.push(`    ${nodeId} {`);
    lines.push('        string id PK');
    for (const prop of schema.properties.slice(0, 5)) {
      const type = prop.type ?? 'string';
      const required = prop.required ? 'NOT NULL' : 'NULL';
      lines.push(`        ${type} ${prop.name} ${required}`);
    }
    if (schema.properties.length > 5) {
      lines.push('        string _more_ "..."');
    }
    lines.push('    }');
  }

  lines.push('```');

  const content = lines.join('\n');

  return {
    id: generateDiagramId('schema', 'overview'),
    type: 'schema',
    title: `${DIAGRAM_TYPE_LABELS['schema']}: Overview`,
    content,
    sourceEntities: limitedSchemas.map((s) => s.id),
    confidence: 'high',
    evidence: [],
    lastGenerated: new Date().toISOString(),
  };
}

/**
 * Generate detailed schema diagram
 */
function generateSchemaDetail(
  schemaName: string,
  properties: { name: string; type?: string; required?: boolean }[],
  id: string
): MermaidDiagram {
  const lines: string[] = [];
  const nodeId = schemaName.replace(/[^a-zA-Z0-9]/g, '');

  lines.push('```mermaid');
  lines.push('erDiagram');
  lines.push(`    ${nodeId} {`);

  if (properties.length === 0) {
    lines.push('        string id PK');
  } else {
    for (const prop of properties) {
      const type = prop.type ?? 'string';
      const required = prop.required ? 'NOT NULL' : 'NULL';
      lines.push(`        ${type} ${prop.name} ${required}`);
    }
  }

  lines.push('    }');
  lines.push('```');

  const content = lines.join('\n');

  return {
    id: generateDiagramId('schema', schemaName),
    type: 'schema',
    title: `${DIAGRAM_TYPE_LABELS['schema']}: ${schemaName}`,
    content,
    sourceEntities: [id],
    confidence: 'high',
    evidence: [],
    lastGenerated: new Date().toISOString(),
  };
}
