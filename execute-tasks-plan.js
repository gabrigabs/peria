export const meta = {
  name: 'Execute Tasks Plan',
  description: 'Execute remaining tasks in TASKS.md with maximum effort using subagents',
  phases: [
    { title: 'Grounding', detail: 'Understand current state and dependencies' },
    { title: 'Research', detail: 'Research best practices and solutions' },
    { title: 'Advising', detail: 'Plan and execute tasks with commits' },
  ],
};

// Grounding phase - understand current state
phase('Grounding');
const grounding = await agent('Analyze current state of Peria project', {
  label: 'State Analysis',
  phase: 'Grounding',
  schema: {
    type: 'object',
    properties: {
      currentRenderer: { type: 'string', description: 'Current renderer implementation status' },
      publishedPackages: {
        type: 'array',
        items: { type: 'string' },
        description: 'Published packages and versions',
      },
      documentationIssues: {
        type: 'array',
        items: { type: 'string' },
        description: 'Documentation issues found',
      },
      artifacts: {
        type: 'array',
        items: { type: 'string' },
        description: 'Artifacts that need cleanup',
      },
    },
    required: ['currentRenderer', 'publishedPackages', 'documentationIssues', 'artifacts'],
  },
});

// Research phase - find solutions
phase('Research');
const research = await agent(
  'Research best practices for documentation cleanup and npm publishing',
  {
    label: 'Best Practices Research',
    phase: 'Research',
    schema: {
      type: 'object',
      properties: {
        npmPublishing: {
          type: 'object',
          properties: { bestPractices: { type: 'array', items: { type: 'string' } } },
        },
        documentation: {
          type: 'object',
          properties: { examples: { type: 'array', items: { type: 'string' } } },
        },
        cleanup: {
          type: 'object',
          properties: { patterns: { type: 'array', items: { type: 'string' } } },
        },
      },
      required: ['npmPublishing', 'documentation', 'cleanup'],
    },
  }
);

// Advising phase - plan and execute
phase('Advising');
const plan = await agent('Create execution plan for remaining tasks', {
  label: 'Execution Plan',
  phase: 'Advising',
  schema: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } },
            commitMessage: { type: 'string' },
          },
          required: ['id', 'title', 'description', 'steps', 'commitMessage'],
        },
      },
      order: { type: 'array', items: { type: 'string' } },
    },
    required: ['tasks', 'order'],
  },
});

// Execute tasks in parallel
const results = await pipeline(plan.tasks, async (task) => {
  const result = await agent(`Execute task: ${task.title}`, {
    label: task.id,
    phase: 'Advising',
    schema: {
      type: 'object',
      properties: {
        completed: { type: 'boolean' },
        output: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'string' } },
      },
      required: ['completed', 'output', 'artifacts'],
    },
  });
  return { ...task, result };
});

// Synthesize results
log('Execution completed');
return {
  grounding,
  research,
  plan,
  results: results.filter(r => r.result.completed)
}
