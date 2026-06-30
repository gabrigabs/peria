import { createGitHubCacheFromManifest } from './relations.js';
import type { GitHubCache, GitHubIssue, GitHubMilestone } from './types.js';
import type { PeriaManifest } from '../types/manifest.js';

export type GitHubIssueProgressStatus = 'open' | 'closed' | 'done' | 'blocked';

export interface GitHubMilestoneProgress {
  milestone: GitHubMilestone;
  issues: GitHubIssue[];
  commits: string[];
  pullRequests: number[];
  status: Record<GitHubIssueProgressStatus, number>;
}

export interface RoadmapSyncResult {
  cache: GitHubCache;
  milestones: number;
  issues: number;
}

interface ParsedMilestone {
  number: number;
  title: string;
  body: string[];
}

interface ParsedTask {
  id: string;
  title: string;
  body: string[];
  milestoneNumber: number;
}

export function syncRoadmapMilestonesFromTasks(
  manifest: PeriaManifest,
  existingCache: GitHubCache | null,
  tasksMarkdown: string,
  generatedAt = new Date().toISOString()
): RoadmapSyncResult {
  const baseCache =
    existingCache ??
    createGitHubCacheFromManifest(manifest, {
      generatedAt,
    });
  const roadmap = createRoadmapEntitiesFromTasks(tasksMarkdown, generatedAt);
  const issues = [
    ...baseCache.issues.filter((issue) => !issue.labels.includes('roadmap')),
    ...roadmap.issues,
  ];
  const milestones = [
    ...baseCache.milestones.filter((milestone) => milestone.source?.file !== 'TASKS.md'),
    ...roadmap.milestones,
  ];

  return {
    cache: createGitHubCacheFromManifest(manifest, {
      repository: baseCache.repository,
      issues,
      pullRequests: baseCache.pullRequests,
      milestones,
      generatedAt,
    }),
    milestones: roadmap.milestones.length,
    issues: roadmap.issues.length,
  };
}

export function createMilestoneProgress(cache: GitHubCache): GitHubMilestoneProgress[] {
  return cache.milestones.map((milestone) => {
    const issues = cache.issues.filter((issue) => issue.milestoneNumber === milestone.number);
    const pullRequestNumbers = new Set<number>();
    const commits = new Set<string>();

    for (const issue of issues) {
      for (const relation of cache.relations) {
        if (relation.type === 'pr_fixes_issue' && relation.targetId === issue.id) {
          const pr = cache.pullRequests.find((item) => item.id === relation.sourceId);
          if (pr) {
            pullRequestNumbers.add(pr.number);
          }
        }
      }
    }

    for (const pullRequestNumber of pullRequestNumbers) {
      for (const commit of cache.commits) {
        if (commit.pullRequestNumber === pullRequestNumber) {
          commits.add(commit.sha);
        }
      }
    }

    return {
      milestone,
      issues,
      commits: [...commits],
      pullRequests: [...pullRequestNumbers],
      status: countIssueStatuses(issues),
    };
  });
}

export function createRoadmapEntitiesFromTasks(
  tasksMarkdown: string,
  generatedAt: string
): { milestones: GitHubMilestone[]; issues: GitHubIssue[] } {
  const parsedMilestones = parseMilestones(tasksMarkdown);
  const issues: GitHubIssue[] = [];
  const milestones: GitHubMilestone[] = [];

  for (const milestone of parsedMilestones) {
    const tasks = parseTasks(milestone);
    const milestoneIssues = tasks.map((task, index) =>
      createRoadmapIssue(task, issueNumberForTask(milestone.number, index), generatedAt)
    );
    const closed = milestoneIssues.length > 0 && milestoneIssues.every((issue) => issue.state === 'closed');

    milestones.push({
      id: `milestone:tasks:${milestone.number}`,
      number: milestone.number,
      title: milestone.title,
      state: closed ? 'closed' : 'open',
      description: `Roadmap milestone parsed from TASKS.md (${milestoneIssues.length} tasks).`,
      createdAt: generatedAt,
      updatedAt: generatedAt,
      source: {
        file: 'TASKS.md',
      },
    });
    issues.push(...milestoneIssues);
  }

  return { milestones, issues };
}

function parseMilestones(markdown: string): ParsedMilestone[] {
  const milestones: ParsedMilestone[] = [];
  let current: ParsedMilestone | undefined;

  for (const line of markdown.split('\n')) {
    const match = line.match(/^## Milestone (?<number>\d+) - (?<title>.+)$/);
    if (match?.groups) {
      current = {
        number: Number(match.groups.number),
        title: match.groups.title.trim(),
        body: [],
      };
      milestones.push(current);
      continue;
    }

    current?.body.push(line);
  }

  return milestones;
}

function parseTasks(milestone: ParsedMilestone): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  let current: ParsedTask | undefined;

  for (const line of milestone.body) {
    const match = line.match(/^### (?<id>T\d+(?:\.\d+)?) (?<title>.+)$/);
    if (match?.groups) {
      current = {
        id: match.groups.id,
        title: match.groups.title.trim(),
        body: [],
        milestoneNumber: milestone.number,
      };
      tasks.push(current);
      continue;
    }

    current?.body.push(line);
  }

  return tasks;
}

function createRoadmapIssue(task: ParsedTask, number: number, generatedAt: string): GitHubIssue {
  const status = detectTaskStatus(task.body);

  return {
    id: `issue:task:${task.id}`,
    number,
    title: `${task.id} ${task.title}`,
    state: status === 'done' || status === 'closed' ? 'closed' : 'open',
    body: createTaskIssueBody(task, status),
    labels: ['peria', 'roadmap', `status:${status}`],
    milestoneNumber: task.milestoneNumber,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    source: {
      file: 'TASKS.md',
    },
  };
}

function detectTaskStatus(lines: string[]): GitHubIssueProgressStatus {
  const body = lines.join('\n').toLowerCase();
  const openItems = lines.filter((line) => /^\s*-\s+\[ \]/.test(line)).length;
  const doneItems = lines.filter((line) => /^\s*-\s+\[x\]/i.test(line)).length;

  if (body.includes('blocked') || body.includes('bloqueado')) {
    return 'blocked';
  }

  if (doneItems > 0 && openItems === 0) {
    return 'done';
  }

  return 'open';
}

function createTaskIssueBody(task: ParsedTask, status: GitHubIssueProgressStatus): string {
  const openItems = task.body.filter((line) => /^\s*-\s+\[ \]/.test(line)).length;
  const doneItems = task.body.filter((line) => /^\s*-\s+\[x\]/i.test(line)).length;

  return [
    '## Roadmap task',
    '',
    `- Task: \`${task.id}\``,
    `- Milestone: \`${task.milestoneNumber}\``,
    `- Status: \`${status}\``,
    `- Done checklist items: ${doneItems}`,
    `- Open checklist items: ${openItems}`,
    '',
    '## Source',
    '',
    '- File: `TASKS.md`',
    '',
    '## Original section',
    '',
    ...task.body.slice(0, 60),
    '',
  ].join('\n');
}

function countIssueStatuses(issues: GitHubIssue[]): Record<GitHubIssueProgressStatus, number> {
  const status: Record<GitHubIssueProgressStatus, number> = {
    open: 0,
    closed: 0,
    done: 0,
    blocked: 0,
  };

  for (const issue of issues) {
    const issueStatus = getIssueStatus(issue);
    status[issueStatus]++;

    if (issue.state === 'closed' && issueStatus !== 'closed') {
      status.closed++;
    }
  }

  return status;
}

function getIssueStatus(issue: GitHubIssue): GitHubIssueProgressStatus {
  if (issue.labels.includes('status:blocked') || issue.labels.includes('blocked')) {
    return 'blocked';
  }

  if (issue.labels.includes('status:done') || issue.labels.includes('done')) {
    return 'done';
  }

  if (issue.state === 'closed') {
    return 'closed';
  }

  return 'open';
}

function issueNumberForTask(milestoneNumber: number, index: number): number {
  return 10_000 + milestoneNumber * 100 + index + 1;
}
