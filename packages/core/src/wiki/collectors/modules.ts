/**
 * Modules Collector - Collects TypeScript module information
 */

import { readdir } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { Project } from 'ts-morph';
import type { ExportKind, ExportSummary, ModuleSummary, PackageSummary } from '../../types/wiki.js';

const IGNORED_DIRECTORIES = new Set(['.git', '.eria', 'dist', 'node_modules']);

function normalizePath(path: string): string {
  if (!path || path === '.') return '.';
  return path.split(sep).join('/');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getPackageNameForPath(path: string, packages: PackageSummary[]): string | undefined {
  const matches = packages
    .filter((pkg) => pkg.directory !== '.' && path.startsWith(`${pkg.directory}/`))
    .sort((left, right) => right.directory.length - left.directory.length);

  return matches[0]?.name;
}

function getExportKind(kindName: string): ExportKind {
  if (kindName.includes('Class')) return 'class';
  if (kindName.includes('Function')) return 'function';
  if (kindName.includes('Interface')) return 'interface';
  if (kindName.includes('TypeAlias')) return 'type';
  if (kindName.includes('Variable')) return 'variable';
  if (kindName.includes('Enum')) return 'enum';
  return 'other';
}

async function findTypeScriptFiles(cwd: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      const relativePath = normalizePath(relative(cwd, absolutePath));

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          await walk(absolutePath);
        }
        continue;
      }

      if (
        entry.isFile() &&
        relativePath.startsWith('packages/') &&
        /\/src\/.+\.ts$/.test(relativePath)
      ) {
        files.push(relativePath);
      }
    }
  }

  await walk(cwd);
  return files.sort();
}

function relative(from: string, to: string): string {
  // Simple relative implementation for Node.js compatibility
  const fromParts = from.replace(/\\/g, '/').split('/');
  const toParts = to.replace(/\\/g, '/').split('/');

  let commonLength = 0;
  while (
    commonLength < fromParts.length &&
    commonLength < toParts.length &&
    fromParts[commonLength] === toParts[commonLength]
  ) {
    commonLength++;
  }

  const upCount = fromParts.length - commonLength;
  const ups = Array(upCount).fill('..');
  const downs = toParts.slice(commonLength);

  return [...ups, ...downs].join('/');
}

export async function collectModules(
  cwd: string,
  packages: PackageSummary[]
): Promise<ModuleSummary[]> {
  const tsFiles = await findTypeScriptFiles(cwd);
  const project = new Project({
    compilerOptions: {
      allowJs: false,
      declaration: true,
      module: 99,
      moduleResolution: 100,
      target: 9,
    },
    skipAddingFilesFromTsConfig: true,
  });

  const modules: ModuleSummary[] = [];

  for (const filePath of tsFiles) {
    const sourceFile = project.addSourceFileAtPath(join(cwd, filePath));
    const imports = unique(
      sourceFile.getImportDeclarations().map((declaration) => declaration.getModuleSpecifierValue())
    ).sort();
    const exportedDeclarations = sourceFile.getExportedDeclarations();
    const exports: ModuleSummary['exports'] = [];

    for (const [name, declarations] of exportedDeclarations.entries()) {
      const declaration = declarations[0];
      if (!declaration) continue;

      exports.push({
        name,
        kind: getExportKind(declaration.getKindName()),
        line: declaration.getSourceFile().getLineAndColumnAtPos(declaration.getStart()).line,
      });
    }

    modules.push({
      path: filePath,
      packageName: getPackageNameForPath(filePath, packages),
      imports,
      exports: exports.sort((left: ExportSummary, right: ExportSummary) =>
        left.name.localeCompare(right.name)
      ),
    });
  }

  return modules.sort((left, right) => left.path.localeCompare(right.path));
}
