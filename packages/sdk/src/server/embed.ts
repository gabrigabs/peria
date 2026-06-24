/**
 * Embed server for Peria documentation
 *
 * Provides the embedded documentation UI with:
 * - Wiki pages (Fumadocs-powered)
 * - API reference (Stoplight Elements)
 * - Source evidence
 * - Drift status
 *
 * Framework-specific mounting functions are available but require the respective
 * framework packages to be installed.
 */

import type { PeriaOptions } from '../types.js';

/**
 * Framework-specific embed options
 */
export interface EmbedOptions extends PeriaOptions {
  /** Path where docs are served (default: /docs) */
  docsRoute?: string;
  /** Static files path for docs */
  staticPath?: string;
  /** Enable API reference (requires OpenAPI spec) */
  apiReference?: boolean;
  /** Path to OpenAPI spec file */
  openapiPath?: string;
}

/**
 * Create embed configuration from Peria options
 */
export function createEmbedConfig(options: EmbedOptions): {
  docsRoute: string;
  staticPath: string;
  apiReference: boolean;
  openapiPath: string | undefined;
} {
  return {
    docsRoute: options.docsPath || '/docs',
    staticPath: options.config?.docs?.outputDir || 'docs',
    apiReference: options.config?.features?.apiReference ?? true,
    openapiPath: options.config?.sources?.openapi || undefined,
  };
}

/**
 * Stoplight Elements API reference renderer
 *
 * This generates the HTML for the API reference page using Stoplight Elements.
 * In a full implementation, this would be generated at build time.
 */
export function generateAPIReferenceHTML(options: {
  specUrl?: string;
  title?: string;
  description?: string;
}): string {
  const { specUrl, title = 'API Reference', description = 'API documentation' } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>

  <!-- Stoplight Elements Styles -->
  <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body, #swagger-ui {
      height: 100%;
    }

    .api-reference-container {
      display: flex;
      height: 100vh;
    }

    .api-reference-sidebar {
      width: 280px;
      border-right: 1px solid #e5e7eb;
      background: #fff;
    }

    .api-reference-main {
      flex: 1;
      overflow: auto;
    }

    .api-reference-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
    }

    .api-reference-title {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }

    .api-reference-description {
      margin-top: 8px;
      color: #6b7280;
    }

    .peria-evidence-panel {
      position: fixed;
      right: 0;
      top: 0;
      width: 320px;
      height: 100vh;
      background: #f9fafb;
      border-left: 1px solid #e5e7eb;
      padding: 16px;
      overflow-y: auto;
    }

    .peria-evidence-header {
      font-weight: 600;
      margin-bottom: 12px;
      color: #374151;
    }

    .peria-evidence-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 13px;
    }

    .peria-evidence-key {
      color: #6b7280;
      min-width: 80px;
    }

    .peria-evidence-value {
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="api-reference-container">
    <div class="api-reference-sidebar">
      <div class="api-reference-header">
        <h1 class="api-reference-title">${title}</h1>
        <p class="api-reference-description">${description}</p>
      </div>
    </div>

    <div class="api-reference-main">
      <elements-api
        ${specUrl ? `apiDescriptionUrl="${specUrl}"` : ''}
        layout="sidebar"
        router="history"
      />
    </div>
  </div>

  <!-- Stoplight Elements -->
  <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
</body>
</html>`;
}

/**
 * Create the API reference HTML file path
 */
export function getAPIReferencePath(docsDir: string): string {
  return `${docsDir}/api-reference.html`;
}
