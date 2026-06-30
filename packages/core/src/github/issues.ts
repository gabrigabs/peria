import { createHash } from 'node:crypto';
import type { DriftFinding } from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';
import { createGitHubCacheFromManifest } from './relations.js';
import type { GitHubCache, GitHubIssue } from './types.js';

const DEFAULT_DRIFT_LABELS = ['peria', 'docs-drift'];

export interface CreateDriftIssuesOptions {
  labels?: string[];
  generatedAt?: string;
  reproduceCommand?: string;
}

export interface CreateDriftIssuesResult {
  cache: GitHubCache;
  findings: number;
  created: number;
  updated: number;
}

export function createDriftIssuesFromFindings(
  manifest: PeriaManifest,
  existingCache: GitHubCache | null,
  findings: DriftFinding[],
  options: CreateDriftIssuesOptions = {}
): CreateDriftIssuesResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const baseCache =
    existingCache ??
    createGitHubCacheFromManifest(manifest, {
      generatedAt,
    });
  const issues = [...baseCache.issues];
  let created = 0;
  let updated = 0;

  for (const finding of findings) {
    const fingerprint = createDriftIssueFingerprint(finding);
    const nextIssue = createIssueFromFinding(finding, {
      fingerprint,
      number: nextIssueNumber(issues),
      labels: createLabels(finding, options.labels ?? []),
      generatedAt,
      reproduceCommand: options.reproduceCommand ?? 'peria check --json',
    });
    const existingIndex = issues.findIndex(
      (issue) => issue.fingerprint === fingerprint || issue.driftFindingId === finding.id
    );

    if (existingIndex === -1) {
      issues.push(nextIssue);
      created++;
      continue;
    }

    issues[existingIndex] = {
      ...issues[existingIndex],
      title: nextIssue.title,
      body: nextIssue.body,
      state: 'open',
      labels: unique([...issues[existingIndex].labels, ...nextIssue.labels]),
      driftFindingId: finding.id,
      fingerprint,
      source: finding.source,
      updatedAt: generatedAt,
    };
    updated++;
  }

  return {
    cache: createGitHubCacheFromManifest(manifest, {
      repository: baseCache.repository,
      issues,
      pullRequests: baseCache.pullRequests,
      milestones: baseCache.milestones,
      generatedAt,
    }),
    findings: findings.length,
    created,
    updated,
  };
}

export function createDriftIssueFingerprint(finding: DriftFinding): string {
  return createHash('sha1')
    .update(
      JSON.stringify({
        type: finding.type,
        entityId: finding.entityId,
        entityType: finding.entityType,
        problem: finding.problem,
        expected: finding.expected,
        actual: finding.actual,
        file: finding.source.file,
        line: finding.source.line,
      })
    )
    .digest('hex')
    .slice(0, 16);
}

function createIssueFromFinding(
  finding: DriftFinding,
  input: {
    fingerprint: string;
    number: number;
    labels: string[];
    generatedAt: string;
    reproduceCommand: string;
  }
): GitHubIssue {
  return {
    id: `issue:drift:${input.fingerprint}`,
    number: input.number,
    title: createIssueTitle(finding),
    state: 'open',
    body: createIssueBody(finding, input.fingerprint, input.reproduceCommand),
    labels: input.labels,
    driftFindingId: finding.id,
    fingerprint: input.fingerprint,
    source: finding.source,
    createdAt: input.generatedAt,
    updatedAt: input.generatedAt,
  };
}

function createIssueTitle(finding: DriftFinding): string {
  const prefix = `[${finding.severity}] ${finding.type}`;
  const title = `${prefix}: ${finding.problem}`;

  return title.length > 120 ? `${title.slice(0, 117)}...` : title;
}

function createIssueBody(
  finding: DriftFinding,
  fingerprint: string,
  reproduceCommand: string
): string {
  return [
    '## Drift finding',
    '',
    `- Fingerprint: \`${fingerprint}\``,
    `- Severity: \`${finding.severity}\``,
    `- Type: \`${finding.type}\``,
    finding.entityId ? `- Entity: \`${finding.entityId}\`` : '- Entity: not linked',
    '',
    '## Source',
    '',
    `- File: \`${formatSource(finding)}\``,
    '',
    '## Impact',
    '',
    finding.problem,
    '',
    ...(finding.expected || finding.actual
      ? [
          '## Expected vs actual',
          '',
          finding.expected ? `- Expected: ${finding.expected}` : '- Expected: not specified',
          finding.actual ? `- Actual: ${finding.actual}` : '- Actual: not specified',
          '',
        ]
      : []),
    '## Reproduce',
    '',
    '```sh',
    reproduceCommand,
    '```',
    '',
    '## Suggested fix',
    '',
    ...(finding.suggestions.length > 0
      ? finding.suggestions.map((suggestion) => `- ${suggestion}`)
      : ['- Review the source and update the generated knowledge artifact.']),
    '',
  ].join('\n');
}

function createLabels(finding: DriftFinding, extraLabels: string[]): string[] {
  return unique([...DEFAULT_DRIFT_LABELS, `severity:${finding.severity}`, ...extraLabels]);
}

function nextIssueNumber(issues: GitHubIssue[]): number {
  return issues.reduce((highest, issue) => Math.max(highest, issue.number), 0) + 1;
}

function formatSource(finding: DriftFinding): string {
  const { file, line, column } = finding.source;
  const linePart = line ? `:${line}` : '';
  const columnPart = column ? `:${column}` : '';

  return `${file}${linePart}${columnPart}`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
