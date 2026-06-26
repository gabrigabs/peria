/**
 * Entrypoint selection prompts
 */

import { confirm, select, text } from '@clack/prompts';
import { DEFAULT_ENTRYPOINT_CANDIDATES } from '@peria/core';

const COMMON_ENTRYPOINTS = DEFAULT_ENTRYPOINT_CANDIDATES;

export async function promptEntrypoint(detected?: string): Promise<string> {
  if (detected) {
    const confirmed = await confirm({
      message: `Detected entrypoint: ${detected}. Is this correct?`,
      initialValue: true,
    });

    if (confirmed) {
      return detected;
    }
  }

  const useCommon = await confirm({
    message: 'Do you want to select from common entrypoints?',
    initialValue: true,
  });

  if (useCommon) {
    const selected = await select({
      message: 'Select your entrypoint:',
      options: COMMON_ENTRYPOINTS.map((value) => ({ value, label: value })),
    });

    return selected as string;
  }

  const custom = await text({
    message: 'Enter the path to your entrypoint:',
    placeholder: 'src/main.ts',
    validate: (value: string): string | undefined => {
      if (!value.trim()) return 'Entrypoint path is required';
      if (!value.endsWith('.ts') && !value.endsWith('.js')) {
        return 'Must be a .ts or .js file';
      }
      return undefined;
    },
  });

  return custom as string;
}
