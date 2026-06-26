/**
 * Wiki LLM Text - Generates llms.txt content
 */

import type { ContextFileSummary, WikiManifest } from '../types/wiki.js';

export function createLlmsText(manifest: WikiManifest, contextFiles: ContextFileSummary[]): string {
  const pageLines = manifest.pages.map(
    (page) => `- ${page.title}: docs/${page.path} - ${page.description}`
  );
  const contextLines = contextFiles.map(
    (file) => `- ${file.path}${file.exists ? '' : ' (missing)'}`
  );

  return [
    '# Peria Wiki Map',
    '',
    `${manifest.project.tagline}`,
    '',
    manifest.project.description,
    '',
    'This file is derived from the human wiki generated in /docs. Read the wiki pages first, then use source links inside each page for provenance.',
    '',
    `Generated: ${manifest.generatedAt}`,
    `Branch: ${manifest.git.branch ?? 'unknown'}`,
    `Commit: ${manifest.git.commit ?? 'unknown'}`,
    `Working tree: ${manifest.git.isDirty ? 'dirty' : 'clean'}`,
    '',
    '## Reading Tree',
    ...manifest.tree.flatMap((section) => [
      `- ${section.title}`,
      ...section.pages.map((slug) => {
        const page = manifest.pages.find((item) => item.slug === slug);
        return page ? `  - ${page.title}: docs/${page.path}` : `  - ${slug}`;
      }),
    ]),
    '',
    '## Pages',
    ...pageLines,
    '',
    '## Configured Agent Context Files',
    ...contextLines,
    '',
  ].join('\n');
}
