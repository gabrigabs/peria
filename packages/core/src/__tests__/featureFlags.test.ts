/**
 * Tests for FeatureFlags type and defaults
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_FEATURES, defineConfig } from '../types/config.js';

describe('DEFAULT_FEATURES', () => {
  it('has correct implemented feature flags', () => {
    expect(DEFAULT_FEATURES.embeddedDocs).toBe(true);
    expect(DEFAULT_FEATURES.codeMap).toBe(true);
    expect(DEFAULT_FEATURES.wiki).toBe(true);
    expect(DEFAULT_FEATURES.llms).toBe(true);
    expect(DEFAULT_FEATURES.driftCheck).toBe(true);
  });

  it('has correct unimplemented feature flags as false', () => {
    expect(DEFAULT_FEATURES.apiReference).toBe(false);
    expect(DEFAULT_FEATURES.contextPacks).toBe(false);
    expect(DEFAULT_FEATURES.mermaid).toBe(false);
    expect(DEFAULT_FEATURES.embeddedDocsAdapters).toBe(false);
  });

  it('has correct not-planned-for-mvp feature flags as false', () => {
    expect(DEFAULT_FEATURES.gitDiff).toBe(false);
    expect(DEFAULT_FEATURES.changeMap).toBe(false);
    expect(DEFAULT_FEATURES.patchNotes).toBe(false);
    expect(DEFAULT_FEATURES.github).toBe(false);
  });

  it('all keys are present', () => {
    const expectedKeys = [
      'embeddedDocs',
      'codeMap',
      'wiki',
      'llms',
      'driftCheck',
      'apiReference',
      'contextPacks',
      'mermaid',
      'embeddedDocsAdapters',
      'gitDiff',
      'changeMap',
      'patchNotes',
      'github',
    ];
    const keys = Object.keys(DEFAULT_FEATURES).sort();
    expect(keys).toEqual(expectedKeys.sort());
  });
});

describe('defineConfig', () => {
  it('applies defaults for missing values', () => {
    const config = defineConfig({});
    expect(config.framework).toBe('other');
    expect(config.entrypoint).toBe('src/index.ts');
    expect(config.features.embeddedDocs).toBe(true);
  });

  it('merges feature flags', () => {
    const config = defineConfig({
      features: {
        wiki: false,
        apiReference: true,
      },
    });
    expect(config.features.wiki).toBe(false); // overridden
    expect(config.features.llms).toBe(true); // default preserved
    expect(config.features.apiReference).toBe(true); // new value
  });

  it('merges project configuration', () => {
    const config = defineConfig({
      project: {
        name: 'Test Project',
      },
    });
    expect(config.project.name).toBe('Test Project');
    expect(config.project.tagline).toBeDefined(); // default preserved
  });
});
