import type { Confidence, SourceRef } from '../types/graph.js';

export const GITHUB_CACHE_VERSION = '0.1.0';

export type GitHubIssueState = 'open' | 'closed';
export type GitHubPullRequestState = 'open' | 'closed' | 'merged';
export type GitHubMilestoneState = 'open' | 'closed';

export type GitHubRelationType =
  | 'entity_changed_by_commit'
  | 'commit_belongs_to_pr'
  | 'pr_fixes_issue'
  | 'issue_belongs_to_milestone'
  | 'drift_finding_opens_issue';

export interface GitHubRepository {
  owner?: string;
  name: string;
  url?: string;
  defaultBranch?: string;
  currentBranch?: string;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  state: GitHubIssueState;
  body?: string;
  labels: string[];
  assignees?: string[];
  author?: string;
  milestoneNumber?: number;
  driftFindingId?: string;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
  url?: string;
  source?: SourceRef;
}

export interface GitHubPullRequest {
  id: string;
  number: number;
  title: string;
  state: GitHubPullRequestState;
  body?: string;
  labels: string[];
  commits: string[];
  issueNumbers: number[];
  author?: string;
  headRef?: string;
  baseRef?: string;
  mergeCommitSha?: string;
  milestoneNumber?: number;
  createdAt?: string;
  updatedAt?: string;
  mergedAt?: string;
  closedAt?: string;
  url?: string;
  source?: SourceRef;
}

export interface GitHubMilestone {
  id: string;
  number: number;
  title: string;
  state: GitHubMilestoneState;
  description?: string;
  dueOn?: string;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
  url?: string;
  source?: SourceRef;
}

export interface GitHubCommit {
  id: string;
  sha: string;
  shortSha: string;
  subject: string;
  body?: string;
  author?: string;
  date?: string;
  files: string[];
  pullRequestNumber?: number;
  issueNumbers: number[];
  url?: string;
  source?: SourceRef;
}

export interface GitHubRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: GitHubRelationType;
  confidence: Confidence;
  reason: string;
  evidence?: SourceRef[];
  createdAt?: string;
}

export interface GitHubCache {
  cacheVersion: string;
  generatedAt: string;
  repository: GitHubRepository;
  issues: GitHubIssue[];
  pullRequests: GitHubPullRequest[];
  milestones: GitHubMilestone[];
  commits: GitHubCommit[];
  relations: GitHubRelation[];
  sourceManifest?: {
    generatedAt: string;
    commit: string;
    branch: string;
  };
}
