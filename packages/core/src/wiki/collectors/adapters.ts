/**
 * Adapters Collector - Collects adapter information
 */

import { readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import type { AdapterSummary, ModuleSummary } from '../../types/wiki.js';

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

export async function collectAdapters(
  cwd: string,
  modules: ModuleSummary[]
): Promise<AdapterSummary[]> {
  // Filter adapter modules and read all contents in parallel
  const adapterModules = modules.filter(
    (module) =>
      module.path.startsWith('packages/adapters/src/') &&
      basename(module.path, extname(module.path)) !== 'index'
  );

  const contents = await Promise.all(
    adapterModules.map((module) => readTextFile(join(cwd, module.path)))
  );

  return adapterModules
    .map((module, index) => ({
      name: basename(module.path, extname(module.path)),
      source: module.path,
      exports: module.exports,
      status: (contents[index]?.includes('coming soon') ? 'placeholder' : 'implemented') as
        | 'placeholder'
        | 'implemented',
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
