/**
 * Task Context Generator
 *
 * Generate task-oriented context packs for common development tasks.
 */

import type { TaskContextPack, ContextPackOptions, TaskType } from './types.js';
import { TASK_TEMPLATES, generateContextPackId } from './types.js';
import type { RouteEntity, PackageEntity, SchemaEntity } from '../types/graph.js';

/**
 * Default maximum lines for task context
 */
const DEFAULT_MAX_LINES = 200;

/**
 * Generate task-oriented context
 */
export function generateTaskContext(
  task: TaskType | string,
  options: ContextPackOptions & {
    relevantRoutes?: RouteEntity[];
    relevantPackages?: PackageEntity[];
    relevantSchemas?: SchemaEntity[];
  }
): TaskContextPack {
  const maxLines = options.maxSize ?? DEFAULT_MAX_LINES;
  const template = TASK_TEMPLATES[task as TaskType];
  const instructions = template?.instructions ? [...template.instructions] : [];

  const content = buildTaskContextContent(task, instructions, options);
  const truncatedContent = truncateToLines(content, maxLines);

  return {
    id: generateContextPackId('task', task),
    variant: 'task',
    title: template?.title ?? `Task: ${task}`,
    description: `Context for ${task} task`,
    generatedAt: new Date().toISOString(),
    content: truncatedContent,
    sourceFiles: [],
    relatedEntities: [
      ...(options.relevantRoutes?.map((r) => r.id) ?? []),
      ...(options.relevantPackages?.map((p) => p.id) ?? []),
      ...(options.relevantSchemas?.map((s) => s.id) ?? []),
    ],
    confidence: 'medium',
    task,
    relevantRoutes: options.relevantRoutes?.map((r) => r.id) ?? [],
    relevantPackages: options.relevantPackages?.map((p) => p.id) ?? [],
    relevantSchemas: options.relevantSchemas?.map((s) => s.id) ?? [],
  };
}

/**
 * Build the content string for a task context
 */
function buildTaskContextContent(
  task: string,
  instructions: string[],
  options: {
    relevantRoutes?: RouteEntity[];
    relevantPackages?: PackageEntity[];
    relevantSchemas?: SchemaEntity[];
  }
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Task Context: ${task}`);
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  // Relevant Routes
  if (options.relevantRoutes && options.relevantRoutes.length > 0) {
    lines.push('## Relevant Routes');
    lines.push('');
    for (const route of options.relevantRoutes.slice(0, 10)) {
      lines.push(`- \`${route.method} ${route.path}\``);
    }
    if (options.relevantRoutes.length > 10) {
      lines.push(`*... and ${options.relevantRoutes.length - 10} more routes*`);
    }
    lines.push('');
  }

  // Relevant Packages
  if (options.relevantPackages && options.relevantPackages.length > 0) {
    lines.push('## Relevant Packages');
    lines.push('');
    for (const pkg of options.relevantPackages) {
      lines.push(`- **${pkg.name}** (${pkg.directory})`);
    }
    lines.push('');
  }

  // Instructions
  lines.push('## Instructions');
  lines.push('');
  for (let i = 0; i < instructions.length; i++) {
    lines.push(`${i + 1}. ${instructions[i]}`);
  }
  lines.push('');

  // Post-task checklist
  lines.push('## Post-Task Checklist');
  lines.push('');
  lines.push('After completing the task:');
  lines.push('');
  lines.push('- [ ] Run tests to verify changes');
  lines.push('- [ ] Run `peria check` to detect drift');
  lines.push('- [ ] Update manifest if needed (`peria scan`)');
  lines.push('');

  return lines.join('\n');
}

/**
 * Truncate content to a maximum number of lines
 */
function truncateToLines(content: string, maxLines: number): string {
  const lines = content.split('\n');
  if (lines.length <= maxLines) {
    return content;
  }

  const truncated = lines.slice(0, maxLines);
  truncated.push('');
  truncated.push('---');
  truncated.push(`*[Content truncated: ${lines.length - maxLines} lines omitted]*`);

  return truncated.join('\n');
}
