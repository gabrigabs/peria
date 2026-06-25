declare module '@stoplight/elements-core' {
  import type { ComponentType } from 'react';

  export interface APIProps {
    apiDescriptionUrl?: string;
    apiDescriptionDocument?: Record<string, unknown>;
    basePath?: string;
    logo?: string;
    tryItCredentialsPolicy?: 'cors' | 'omit' | 'include';
    router?: 'history' | 'hash' | 'memory';
  }

  export const API: ComponentType<APIProps>;
}
