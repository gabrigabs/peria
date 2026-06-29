/**
 * Git Scanner - Collects Git metadata
 */

import type { GitMetadata } from '../types/manifest.js';
import { runGit } from './index.js';

/**
 * Collect Git metadata
 */
export async function collectGitMetadata(cwd: string): Promise<GitMetadata> {
  const [lastCommit, shortCommit, branch, status, recentCommits] = await Promise.all([
    runGit(cwd, ['rev-parse', 'HEAD']),
    runGit(cwd, ['rev-parse', '--short', 'HEAD']),
    runGit(cwd, ['branch', '--show-current']),
    runGit(cwd, ['status', '--short', '--untracked-files=no']),
    runGit(cwd, ['log', '--oneline', '-20']),
  ]);

  const changedFiles = (status || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3));

  const recentChanges = (recentCommits || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, ...subjectParts] = line.split(' ');
      return {
        id: hash,
        path: '',
        type: 'modified' as const,
        status: 'M',
        commit: hash,
        subject: subjectParts.join(' '),
      };
    });

  return {
    lastCommit: lastCommit || 'unknown',
    shortCommit: shortCommit || 'unknown',
    branch: branch || 'unknown',
    isDirty: changedFiles.length > 0,
    changedFiles,
    recentChanges,
  };
}
