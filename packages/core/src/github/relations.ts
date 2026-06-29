import type {
  DocPageEntity,
  DriftFinding,
  OpenAPIOperation,
  PackageEntity,
  RouteEntity,
  SchemaEntity,
  SourceFile,
  SourceRef,
} from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';
import {
  GITHUB_CACHE_VERSION,
  type GitHubCache,
  type GitHubCommit,
  type GitHubIssue,
  type GitHubMilestone,
  type GitHubPullRequest,
  type GitHubRelation,
  type GitHubRelationType,
  type GitHubRepository,
} from './types.js';

export interface CreateGitHubCacheOptions {
  repository?: Partial<GitHubRepository>;
  issues?: GitHubIssue[];
  pullRequests?: GitHubPullRequest[];
  milestones?: GitHubMilestone[];
  generatedAt?: string;
}

export interface CreateGitHubRelationsInput {
  manifest: PeriaManifest;
  commits: GitHubCommit[];
  issues: GitHubIssue[];
  pullRequests: GitHubPullRequest[];
  milestones: GitHubMilestone[];
  generatedAt?: string;
}

interface SourceEntityRef {
  id: string;
  file?: string;
  label: string;
}

export function createGitHubCacheFromManifest(
  manifest: PeriaManifest,
  options: CreateGitHubCacheOptions = {}
): GitHubCache {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const commits = createGitHubCommits(manifest);
  const pullRequests = mergePullRequests(
    options.pullRequests ?? [],
    inferPullRequestsFromCommits(commits, generatedAt)
  );
  const issues = mergeIssues(
    options.issues ?? [],
    inferIssuesFromPullRequests(pullRequests, generatedAt)
  );
  const milestones = options.milestones ?? [];
  const repository: GitHubRepository = {
    name: manifest.repo.name,
    currentBranch: manifest.repo.branch,
    ...options.repository,
  };

  return {
    cacheVersion: GITHUB_CACHE_VERSION,
    generatedAt,
    repository,
    issues,
    pullRequests,
    milestones,
    commits,
    relations: createGitHubRelations({
      manifest,
      commits,
      issues,
      pullRequests,
      milestones,
      generatedAt,
    }),
    sourceManifest: {
      generatedAt: manifest.generatedAt,
      commit: manifest.repo.commit,
      branch: manifest.repo.branch,
    },
  };
}

export function createGitHubRelations(input: CreateGitHubRelationsInput): GitHubRelation[] {
  const createdAt = input.generatedAt ?? new Date().toISOString();
  const relations: GitHubRelation[] = [];
  const entities = createSourceEntityRefs(input.manifest);

  for (const commit of input.commits) {
    for (const file of commit.files) {
      for (const entity of entities) {
        if (!entity.file || !sourceMatchesFile(entity.file, file)) {
          continue;
        }

        relations.push(
          createRelation({
            type: 'entity_changed_by_commit',
            sourceId: entity.id,
            targetId: commit.id,
            confidence: 'high',
            reason: `${entity.label} is backed by ${entity.file}, changed by commit ${commit.shortSha}.`,
            evidence: [{ file, commit: commit.sha }],
            createdAt,
          })
        );
      }
    }

    const pullRequest = input.pullRequests.find((pr) => pr.number === commit.pullRequestNumber);
    if (pullRequest) {
      relations.push(
        createRelation({
          type: 'commit_belongs_to_pr',
          sourceId: commit.id,
          targetId: pullRequest.id,
          confidence: 'high',
          reason: `Commit ${commit.shortSha} is associated with pull request #${pullRequest.number}.`,
          createdAt,
        })
      );
    }
  }

  for (const pullRequest of input.pullRequests) {
    for (const issueNumber of pullRequest.issueNumbers) {
      const issue = input.issues.find((item) => item.number === issueNumber);
      if (!issue) {
        continue;
      }

      relations.push(
        createRelation({
          type: 'pr_fixes_issue',
          sourceId: pullRequest.id,
          targetId: issue.id,
          confidence: 'medium',
          reason: `Pull request #${pullRequest.number} references issue #${issue.number} with a closing keyword.`,
          createdAt,
        })
      );
    }
  }

  for (const issue of input.issues) {
    if (issue.milestoneNumber) {
      const milestone = input.milestones.find((item) => item.number === issue.milestoneNumber);
      if (milestone) {
        relations.push(
          createRelation({
            type: 'issue_belongs_to_milestone',
            sourceId: issue.id,
            targetId: milestone.id,
            confidence: 'high',
            reason: `Issue #${issue.number} belongs to milestone "${milestone.title}".`,
            createdAt,
          })
        );
      }
    }

    const driftFinding = findDriftFinding(input.manifest.drift, issue);
    if (driftFinding) {
      relations.push(
        createRelation({
          type: 'drift_finding_opens_issue',
          sourceId: driftFinding.id,
          targetId: issue.id,
          confidence: issue.driftFindingId === driftFinding.id ? 'high' : 'medium',
          reason: `Drift finding ${driftFinding.id} is tracked by issue #${issue.number}.`,
          evidence: [driftFinding.source],
          createdAt,
        })
      );
    }
  }

  return dedupeRelations(relations);
}

function createGitHubCommits(manifest: PeriaManifest): GitHubCommit[] {
  const commits = new Map<string, GitHubCommit>();

  for (const change of manifest.git.recentChanges) {
    const sha = change.commit || change.id;
    if (!sha || sha === 'unknown') {
      continue;
    }

    const existing = commits.get(sha);
    const commit = existing ?? {
      id: `commit:${sha}`,
      sha,
      shortSha: sha.slice(0, 7),
      subject: change.subject ?? 'Commit without subject',
      author: change.author,
      date: change.date,
      files: [],
      pullRequestNumber: parsePullRequestNumber(change.subject),
      issueNumbers: parseClosingIssueNumbers(change.subject),
    };

    if (change.path && !commit.files.includes(change.path)) {
      commit.files.push(change.path);
    }

    commits.set(sha, commit);
  }

  if (commits.size === 0 && manifest.git.lastCommit !== 'unknown') {
    const sha = manifest.git.lastCommit;
    commits.set(sha, {
      id: `commit:${sha}`,
      sha,
      shortSha: manifest.git.shortCommit,
      subject: 'Repository snapshot commit',
      files: [],
      issueNumbers: [],
    });
  }

  return [...commits.values()];
}

function inferPullRequestsFromCommits(
  commits: GitHubCommit[],
  generatedAt: string
): GitHubPullRequest[] {
  const pullRequests = new Map<number, GitHubPullRequest>();

  for (const commit of commits) {
    if (!commit.pullRequestNumber) {
      continue;
    }

    const existing = pullRequests.get(commit.pullRequestNumber);
    if (existing) {
      if (!existing.commits.includes(commit.sha)) {
        existing.commits.push(commit.sha);
      }
      continue;
    }

    pullRequests.set(commit.pullRequestNumber, {
      id: `pr:${commit.pullRequestNumber}`,
      number: commit.pullRequestNumber,
      title: commit.subject,
      state: 'merged',
      labels: [],
      commits: [commit.sha],
      issueNumbers: commit.issueNumbers,
      mergeCommitSha: commit.sha,
      createdAt: generatedAt,
      updatedAt: generatedAt,
    });
  }

  return [...pullRequests.values()];
}

function inferIssuesFromPullRequests(
  pullRequests: GitHubPullRequest[],
  generatedAt: string
): GitHubIssue[] {
  const issues = new Map<number, GitHubIssue>();

  for (const pullRequest of pullRequests) {
    for (const issueNumber of pullRequest.issueNumbers) {
      if (issues.has(issueNumber)) {
        continue;
      }

      issues.set(issueNumber, {
        id: `issue:${issueNumber}`,
        number: issueNumber,
        title: `Issue #${issueNumber}`,
        state: 'closed',
        labels: [],
        createdAt: generatedAt,
        updatedAt: generatedAt,
      });
    }
  }

  return [...issues.values()];
}

function mergePullRequests(
  explicitPullRequests: GitHubPullRequest[],
  inferredPullRequests: GitHubPullRequest[]
): GitHubPullRequest[] {
  const merged = new Map<number, GitHubPullRequest>();

  for (const pullRequest of inferredPullRequests) {
    merged.set(pullRequest.number, pullRequest);
  }

  for (const pullRequest of explicitPullRequests) {
    merged.set(pullRequest.number, pullRequest);
  }

  return [...merged.values()];
}

function mergeIssues(explicitIssues: GitHubIssue[], inferredIssues: GitHubIssue[]): GitHubIssue[] {
  const merged = new Map<number, GitHubIssue>();

  for (const issue of inferredIssues) {
    merged.set(issue.number, issue);
  }

  for (const issue of explicitIssues) {
    merged.set(issue.number, issue);
  }

  return [...merged.values()];
}

function createSourceEntityRefs(manifest: PeriaManifest): SourceEntityRef[] {
  return [
    ...manifest.routes.map((route) => routeRef(route)),
    ...manifest.schemas.map((schema) => schemaRef(schema)),
    ...manifest.openapiOps.map((operation) => openApiRef(operation)),
    ...manifest.docsPages.map((page) => docsPageRef(page)),
    ...manifest.sourceFiles.map((file) => sourceFileRef(file)),
    ...manifest.packages.map((pkg) => packageRef(pkg)),
  ].filter((ref): ref is SourceEntityRef => Boolean(ref.file));
}

function routeRef(route: RouteEntity): SourceEntityRef {
  return {
    id: route.id,
    file: route.source.file,
    label: `${route.method} ${route.path}`,
  };
}

function schemaRef(schema: SchemaEntity): SourceEntityRef {
  return {
    id: schema.id,
    file: schema.file,
    label: schema.name,
  };
}

function openApiRef(operation: OpenAPIOperation): SourceEntityRef {
  return {
    id: operation.id,
    file: operation.source.file,
    label: `${operation.method} ${operation.path}`,
  };
}

function docsPageRef(page: DocPageEntity): SourceEntityRef {
  return {
    id: page.id,
    file: page.source.file,
    label: page.title,
  };
}

function sourceFileRef(file: SourceFile): SourceEntityRef {
  return {
    id: file.id,
    file: file.path,
    label: file.path,
  };
}

function packageRef(pkg: PackageEntity): SourceEntityRef {
  return {
    id: pkg.id,
    file: pkg.manifestPath,
    label: pkg.name,
  };
}

function createRelation(params: {
  type: GitHubRelationType;
  sourceId: string;
  targetId: string;
  confidence: GitHubRelation['confidence'];
  reason: string;
  evidence?: SourceRef[];
  createdAt: string;
}): GitHubRelation {
  return {
    id: relationId(params.type, params.sourceId, params.targetId),
    sourceId: params.sourceId,
    targetId: params.targetId,
    type: params.type,
    confidence: params.confidence,
    reason: params.reason,
    evidence: params.evidence,
    createdAt: params.createdAt,
  };
}

function dedupeRelations(relations: GitHubRelation[]): GitHubRelation[] {
  const byId = new Map<string, GitHubRelation>();

  for (const relation of relations) {
    byId.set(relation.id, relation);
  }

  return [...byId.values()];
}

function sourceMatchesFile(sourceFile: string, changedFile: string): boolean {
  const source = normalizePath(sourceFile);
  const changed = normalizePath(changedFile);

  return source === changed || source.startsWith(`${changed}/`) || changed.startsWith(`${source}/`);
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

function parsePullRequestNumber(subject: string | undefined): number | undefined {
  if (!subject) {
    return undefined;
  }

  const hashMatch = subject.match(/\(#(?<number>\d+)\)/);
  const mergeMatch = subject.match(/pull request #(?<number>\d+)/i);
  const number = hashMatch?.groups?.number ?? mergeMatch?.groups?.number;

  return number ? Number(number) : undefined;
}

function parseClosingIssueNumbers(text: string | undefined): number[] {
  if (!text) {
    return [];
  }

  const issues = new Set<number>();
  const pattern = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(?<number>\d+)/gi;
  let match = pattern.exec(text);

  while (match?.groups?.number) {
    issues.add(Number(match.groups.number));
    match = pattern.exec(text);
  }

  return [...issues];
}

function findDriftFinding(
  driftFindings: DriftFinding[],
  issue: GitHubIssue
): DriftFinding | undefined {
  if (issue.driftFindingId) {
    return driftFindings.find((finding) => finding.id === issue.driftFindingId);
  }

  return driftFindings.find((finding) => issue.body?.includes(finding.id));
}

function relationId(type: GitHubRelationType, sourceId: string, targetId: string): string {
  return `${type}:${sourceId}:${targetId}`.replace(/[^a-zA-Z0-9:./_-]/g, '-');
}
