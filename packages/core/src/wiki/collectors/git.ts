/**
 * Git Collector - Collects Git metadata
 */

import { execFile } from 'node:child_process';
import type { GitMetadata } from '../types/wiki.js';

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

function parseGitCommits(value: string | null): GitMetadata['recentCommits'] {
  if (!value) return [];

  return value.split('\n').map((line) => {
    const [hash = '', date = '', author = '', subject = ''] = line.split('\t');
    return {
      hash,
      date,
      author,
      subject,
    };
  });
}

export async function collectGitMetadata(cwd: string): Promise<GitMetadata> {
  const [
    commit,
    shortCommit,
    branch,
    author,
    authorEmail,
    authoredAt,
    subject,
    status,
    recentCommits,
  ] = await Promise.all([
    runGit(cwd, ['rev-parse', 'HEAD']),
    runGit(cwd, ['rev-parse', '--short', 'HEAD']),
    runGit(cwd, ['branch', '--show-current']),
    runGit(cwd, ['log', '-1', '--pretty=format:%an']),
    runGit(cwd, ['log', '-1', '--pretty=format:%ae']),
    runGit(cwd, ['log', '-1', '--date=iso-strict', '--pretty=format:%ad']),
    runGit(cwd, ['log', '-1', '--pretty=format:%s']),
    runGit(cwd, ['status', '--short']),
    runGit(cwd, ['log', '--date=short', '--pretty=format:%h%x09%ad%x09%an%x09%s', '-12']),
  ]);

  const changedFiles = status
    ? status
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return {
    branch: branch ?? undefined,
    commit: commit ?? undefined,
    shortCommit: shortCommit ?? undefined,
    author: author ?? undefined,
    authorEmail: authorEmail ?? undefined,
    authoredAt: authoredAt ?? undefined,
    subject: subject ?? undefined,
    isDirty: changedFiles.length > 0,
    changedFiles,
    recentCommits: parseGitCommits(recentCommits),
  };
}
