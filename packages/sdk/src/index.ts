/**
 * @peria/sdk is intentionally private until Peria has a stable programmatic API.
 *
 * Planned scope: scan/build/check orchestration for tools that need Peria without
 * shelling out to the CLI. Framework docs serving belongs in @peria/adapters.
 */

export interface PeriaSdkRoadmap {
  status: 'deferred';
  plannedSurface: 'programmatic-api';
}

export const periaSdkRoadmap: PeriaSdkRoadmap = {
  status: 'deferred',
  plannedSurface: 'programmatic-api',
};
