/**
 * Features selection prompts
 */

import { select } from '@clack/prompts'

export interface FeatureFlags {
  embeddedDocs?: boolean
  codeMap?: boolean
  apiReference?: boolean
  wiki?: boolean
  llms?: boolean
  gitDiff?: boolean
  changeMap?: boolean
  driftCheck?: boolean
  patchNotes?: boolean
  github?: boolean
  contextPacks?: boolean
  mermaid?: boolean
}

interface FeatureOption {
  value: keyof FeatureFlags
  label: string
  description: string
  default: boolean
}

const FEATURE_OPTIONS: FeatureOption[] = [
  {
    value: 'embeddedDocs',
    label: 'Embedded /docs',
    description: 'Serve documentation at /docs in your API',
    default: true,
  },
  {
    value: 'codeMap',
    label: 'Code Map',
    description: 'Map routes, handlers, controllers, schemas',
    default: true,
  },
  {
    value: 'apiReference',
    label: 'API Reference',
    description: 'Read OpenAPI and connect to code',
    default: true,
  },
  {
    value: 'wiki',
    label: 'Wiki Generator',
    description: 'Generate technical wiki from Markdown',
    default: true,
  },
  {
    value: 'llms',
    label: 'llms.txt',
    description: 'Generate LLM-readable output',
    default: true,
  },
  {
    value: 'gitDiff',
    label: 'Git Diff Mapper',
    description: 'Identify impacted files from changes',
    default: true,
  },
  {
    value: 'driftCheck',
    label: 'Docs Drift Checker',
    description: 'Detect outdated documentation',
    default: true,
  },
  {
    value: 'mermaid',
    label: 'Mermaid Support',
    description: 'Preserve and render Mermaid diagrams',
    default: true,
  },
  {
    value: 'changeMap',
    label: 'Change Map',
    description: 'Transform diffs into semantic changes',
    default: false,
  },
  {
    value: 'patchNotes',
    label: 'Patch Notes Generator',
    description: 'Generate changelogs from commits',
    default: false,
  },
  {
    value: 'github',
    label: 'GitHub Integration',
    description: 'Connect issues, PRs, releases',
    default: false,
  },
  {
    value: 'contextPacks',
    label: 'Context Packs',
    description: 'Generate context by route, diff, PR',
    default: false,
  },
]

// Create presets for quick selection
const PRESETS = [
  {
    label: 'Default (recommended)',
    value: 'default',
    features: FEATURE_OPTIONS.filter((f) => f.default).map((f) => f.value),
  },
  {
    label: 'Minimal (only essential)',
    value: 'minimal',
    features: ['embeddedDocs', 'codeMap', 'apiReference'] as (keyof FeatureFlags)[],
  },
  {
    label: 'Full (all features)',
    value: 'full',
    features: FEATURE_OPTIONS.map((f) => f.value),
  },
]

export async function promptFeatures(): Promise<FeatureFlags> {
  const preset = await select({
    message: 'Select feature preset:',
    options: [
      ...PRESETS.map((p) => ({ value: p.value, label: p.label })),
      { value: 'custom', label: 'Custom selection' },
    ],
  })

  let selectedFeatures: (keyof FeatureFlags)[]

  if (preset === 'default') {
    selectedFeatures = PRESETS[0].features
  } else if (preset === 'minimal') {
    selectedFeatures = PRESETS[1].features
  } else if (preset === 'full') {
    selectedFeatures = PRESETS[2].features
  } else {
    // Custom: let user select individually (loop until done)
    const selected = new Set<keyof FeatureFlags>()

    while (true) {
      const options = [
        ...FEATURE_OPTIONS.filter((opt) => !selected.has(opt.value)).map((opt) => ({
          value: opt.value,
          label: `${opt.label} - ${opt.description}`,
        })),
        { value: '__done__', label: 'Done - continue' },
      ]

      const selected_item = await select({
        message: `Select features (${selected.size} selected):`,
        options,
      })

      if (selected_item === '__done__') {
        break
      }

      selected.add(selected_item as keyof FeatureFlags)
    }

    selectedFeatures = Array.from(selected)
  }

  const features: FeatureFlags = {}
  for (const opt of FEATURE_OPTIONS) {
    features[opt.value] = selectedFeatures.includes(opt.value)
  }

  return features
}

export function getFeatureSummary(features: FeatureFlags): string[] {
  const enabled: string[] = []

  for (const opt of FEATURE_OPTIONS) {
    if (features[opt.value]) {
      enabled.push(opt.label)
    }
  }

  return enabled
}
