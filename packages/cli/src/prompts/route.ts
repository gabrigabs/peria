/**
 * Docs route selection prompts
 */

import { text } from '@clack/prompts';
import { DEFAULT_DOCS } from '@peria/core';

export async function promptDocsRoute(defaultRoute?: string): Promise<string> {
  const route = await text({
    message: `Docs route (default: ${defaultRoute ?? DEFAULT_DOCS.route}):`,
    placeholder: defaultRoute ?? DEFAULT_DOCS.route,
    defaultValue: defaultRoute ?? DEFAULT_DOCS.route,
    validate: (value: string): string | undefined => {
      if (!value.trim()) return 'Route is required';
      if (!value.startsWith('/')) return 'Route must start with /';
      return undefined;
    },
  });

  return (route as string).trim();
}
