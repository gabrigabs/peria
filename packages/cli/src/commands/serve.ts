/**
 * Serve command - local preview for generated docs
 */

import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { defineConfig, loadConfig } from '@peria/core';
import { logger } from '../utils/logger.js';

const DEFAULT_PORT = 4173;

export async function serveCommand(cwd: string): Promise<void> {
  const config = defineConfig((await loadConfig(cwd)) ?? {});
  const docsDir = resolve(cwd, config.docs.outputDir);
  const port = getPort();

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
    const filePath = resolveRequestedPath(docsDir, url.pathname);

    if (!filePath.startsWith(docsDir)) {
      response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    const content = await readFileOrIndex(filePath, docsDir);
    if (!content) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(`Could not find ${url.pathname}. Run "peria build" first.`);
      return;
    }

    response.writeHead(200, { 'content-type': getContentType(content.path) });
    response.end(content.data);
  });

  server.listen(port, () => {
    logger.header('Peria Serve');
    logger.success(`Serving ${config.docs.outputDir} at http://127.0.0.1:${port}`);
    logger.dim('Press Ctrl+C to stop');
  });
}

function getPort(): number {
  const rawPort = process.env.PERIA_PORT;
  if (!rawPort) return DEFAULT_PORT;

  const port = Number(rawPort);
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT;
}

function resolveRequestedPath(docsDir: string, pathname: string): string {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const relativePath = cleanPath || 'README.md';
  return resolve(join(docsDir, relativePath));
}

async function readFileOrIndex(
  filePath: string,
  docsDir: string
): Promise<{ path: string; data: Buffer } | null> {
  if (await isFile(filePath)) {
    return {
      path: filePath,
      data: await readFile(filePath),
    };
  }

  const indexPath = join(docsDir, 'index.html');
  if (extname(filePath) === '' && (await isFile(indexPath))) {
    return {
      path: indexPath,
      data: await readFile(indexPath),
    };
  }

  const readmePath = join(docsDir, 'README.md');
  if (extname(filePath) === '' && (await isFile(readmePath))) {
    return {
      path: readmePath,
      data: await readFile(readmePath),
    };
  }

  return null;
}

async function isFile(path: string): Promise<boolean> {
  try {
    const result = await stat(path);
    return result.isFile();
  } catch {
    return false;
  }
}

function getContentType(path: string): string {
  switch (extname(path)) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.md':
      return 'text/markdown; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'text/plain; charset=utf-8';
  }
}
