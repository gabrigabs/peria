/**
 * Features Collector - Collects feature flags information
 */

import { readFile } from 'node:fs/promises';
import type { FeatureSummary } from '../types/wiki.js';
import type { ResolvedPeriaConfig } from '../types/config.js';

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function findLineNumber(content: string, search: string): number | undefined {
  const index = content.indexOf(search);
  if (index === -1) return undefined;
  return getLineNumber(content, index);
}

function findFeatureLineNumber(content: string, featureName: string): number | undefined {
  const blockStart = content.search(/features:\s*{/);
  if (blockStart === -1) return undefined;

  const featureIndex = content.indexOf(`${featureName}:`, blockStart);
  if (featureIndex === -1) return undefined;

  return getLineNumber(content, featureIndex);
}

export async function collectFeatures(
  cwd: string,
  config: ResolvedPeriaConfig
): Promise<FeatureSummary[]> {
  const configSource = 'peria.config.ts';
  const defaultSource = 'packages/core/src/types/config.ts';
  const configContent = await readTextFile(join(cwd, configSource));
  const defaultContent = await readTextFile(join(cwd, defaultSource));

  return Object.entries(config.features)
    .map(([name, enabled]) => {
      const configLine = configContent ? findFeatureLineNumber(configContent, name) : undefined;
      const defaultLine = defaultContent ? findLineNumber(defaultContent, `${name}:`) : undefined;

      return {
        name,
        enabled,
        source: configLine ? configSource : defaultSource,
        line: configLine ?? defaultLine,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function join(cwd: string, ...paths: string[]): string {
  return cwd.replace(/\\/g, '/').replace(/\/$/, '') + '/' + paths.join('/').replace(/\/+/g, '/');
}
