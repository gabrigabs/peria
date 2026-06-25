/**
 * History Collector - Collects Git history
 */

import { execFile } from 'node:child_process';

function runGit(cwd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      resolve(stdout.trim() || null);
    });
  });
}

export async function getRecentHistory(cwd: string): Promise<string[]> {
  const result = await runGit(cwd, ['log', '--date=short', '--pretty=format:%h %ad %s', '-12']);
  return result ? result.split('\n') : [];
}
