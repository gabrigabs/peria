# Phase 3 Plan: OpenAPI Matching and Stoplight Elements Integration

**Goal**: Connect extracted routes to OpenAPI and render API Reference without rebuilding API docs from scratch.

---

## Current State

- **OpenAPI Parser** (`packages/core/src/parsers/openapi.ts`): ✅ Complete - extracts operations, schemas, parameters
- **Manifest Structure**: ✅ Has `routes[]`, `openapiOps[]`, `relations[]` - ready for matching
- **NestJS Adapter**: ✅ AST extraction works for routes, handlers, schemas
- **SDK Package**: ⚠️ Exists but no Stoplight integration yet
- **API Reference Package**: ❌ Does not exist

---

## Implementation Steps

### Step 1: Create OpenAPI Matching Engine

**File**: `packages/core/src/matcher/openapi-matcher.ts`

Match extracted routes to OpenAPI operations using:
- Path normalization (compare route paths to OpenAPI paths)
- HTTP method matching
- operationId matching when available
- Parameter matching for path/query/body parameters

**Output**: Update manifest with `route.openapiOp` and `openapiOp.route` relations.

```typescript
export interface RouteOpenAPIMatch {
  routeId: string;
  operationId: string | null;
  matchType: 'exact' | 'fuzzy' | 'operationId' | 'unmatched';
  confidence: Confidence;
  reason: string;
}

export interface UnmatchedRoute {
  route: RouteEntity;
  type: 'route_missing_in_openapi' | 'openapi_missing_route';
}

export async function matchRoutesToOpenAPI(
  routes: RouteEntity[],
  operations: OpenAPIOperation[]
): Promise<{
  matches: RouteOpenAPIMatch[];
  unmatchedRoutes: UnmatchedRoute[];
  unmatchedOperations: OpenAPIOperation[];
}>
```

---

### Step 2: Generate Enriched OpenAPI with x-peria Metadata

**File**: `packages/core/src/generators/enriched-openapi.ts`

Generate `.peria/openapi.enriched.json` that adds `x-peria` metadata to each operation:

```typescript
interface EnrichedOperation {
  // Standard OpenAPI fields
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  // ... all standard fields

  // x-peria enrichment
  'x-peria': {
    handler?: {
      className: string;
      methodName: string;
      file: string;
      line: number;
    };
    module?: string;
    docs: string[];
    schemas: string[];
    confidence: Confidence;
    drift?: 'aligned' | 'warning' | 'error';
  };
}
```

---

### Step 3: Create @peria/api-ref-stoplight Package

**Location**: `packages/api-ref-stoplight/`

```typescript
// packages/api-ref-stoplight/src/index.ts
export { StoplightRenderer } from './stoplight-renderer.js';
export type { StoplightConfig } from './stoplight-renderer.js';
```

**Components**:

1. **StoplightRenderer** - Wrapper component for Stoplight Elements
2. **APIReferencePage** - Full API reference page with navigation
3. **OperationContext** - Peria metadata panel for each operation
4. **DriftIndicator** - Shows drift status per operation

---

### Step 4: Integrate Stoplight Elements into SDK

**Files to modify**:
- `packages/sdk/src/server/embed.ts` - Add Stoplight mounting
- `packages/sdk/src/server/router.ts` - Add `/docs/api-reference` route

**API Reference Page Layout**:

```
┌─────────────────────────────────────────────────────────────────┐
│ API Reference                              [Stoplight Elements] │
├─────────────────────────────────────────────────────────────────┤
│ Operations     │  POST /users/:id/approve                        │
│ ─────────────  │                                                │
│ ▼ Users        │  Summary: Approve a user                       │
│   POST /users  │  Description: ...                              │
│   GET /users   │                                                │
│   POST /:id    │  Parameters ──────────────────────────────────  │
│ ▼ Auth         │  Path: id (string, required)                   │
│   POST /login  │                                                │
│                │  Request Body ──────────────────────────────  │
│                │  ApproveUserRequestDto                         │
│                │                                                │
│                │  Responses ──────────────────────────────────  │
│                │  200: ApproveUserResponseDto                   │
│                │  401: Unauthorized                            │
├────────────────┴───────────────────────────────────────────────┤
│ ┌─ Peria Evidence ─────────────────────────────────────────────┐│
│ │ Handler: UsersController.approve                              ││
│ │ Source: src/users/users.controller.ts:42                      ││
│ │ Module: UsersModule                                           ││
│ │ Confidence: high                                              ││
│ │ Drift: aligned                                                ││
│ └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 5: Update Config and Feature Flags

**File**: `packages/core/src/types/config.ts`

```typescript
export const DEFAULT_FEATURES: Required<FeatureFlags> = {
  // ... existing ...

  // Phase 3: Enable by default
  apiReference: true,  // Changed from false
  contextPacks: false,
  mermaid: false,
  embeddedDocsAdapters: false,
};
```

---

### Step 6: Update CLI for API Reference

**File**: `packages/cli/src/commands/scan.ts`

Add OpenAPI matching step:
1. Run framework adapter (Phase 2)
2. Load OpenAPI (if exists)
3. Match routes to operations
4. Generate enriched OpenAPI
5. Save manifest

---

### Step 7: Create API Reference Page Template

**File**: `packages/core/src/templates/api-reference.tsx` (or `.mdx`)

Template for `/docs/api-reference` that includes:
- Stoplight Elements component
- Peria metadata sidebar
- Operation context panel

---

### Step 8: Add Tests

**Test files**:
- `packages/core/src/__tests__/matcher/openapi-matcher.test.ts`
- `packages/core/src/__tests__/generators/enriched-openapi.test.ts`

**Coverage**:
- Exact path/method matching
- Fuzzy path matching (normalize params)
- operationId matching
- Unmatched detection
- Enriched metadata generation

---

### Step 9: Add Fixture OpenAPI for Testing

**File**: `fixtures/nestjs-api/openapi.yaml`

Create a test fixture with:
- Multiple endpoints
- Various parameter types
- Request/response schemas
- Tags for grouping

---

## File Structure Changes

```
packages/
├── api-ref-stoplight/           # NEW
│   ├── src/
│   │   ├── index.ts
│   │   ├── stoplight-renderer.ts
│   │   ├── operation-context.tsx
│   │   ├── drift-indicator.tsx
│   │   └── api-reference-page.tsx
│   ├── package.json
│   └── tsconfig.json
├── core/src/
│   ├── matcher/                  # NEW
│   │   ├── openapi-matcher.ts
│   │   └── index.ts
│   ├── generators/               # NEW
│   │   ├── enriched-openapi.ts
│   │   └── index.ts
│   ├── templates/               # NEW
│   │   ├── api-reference.tsx
│   │   └── index.ts
│   └── types/
│       └── config.ts           # MODIFIED
├── sdk/src/
│   ├── server/
│   │   ├── embed.ts           # MODIFIED
│   │   └── router.ts          # MODIFIED
│   └── types.ts               # MODIFIED
└── cli/src/
    └── commands/
        └── scan.ts            # MODIFIED
```

---

## Exit Criteria

1. **API Reference renders** - `/docs/api-reference` shows Stoplight Elements
2. **Matching works** - Routes link to OpenAPI operations with confidence
3. **Enriched OpenAPI generated** - `.peria/openapi.enriched.json` exists with x-peria metadata
4. **Missing detection** - Unmatched routes/operations are flagged
5. **Feature flag enabled** - `apiReference: true` by default
6. **Tests pass** - Matcher has test coverage
7. **Fixture works** - Can scan fixture NestJS app with OpenAPI

---

## Dependencies

- `@stoplight/elements` - API reference UI components
- `@stoplight/elements-core` - Core components
- `swagger-client` - Already used by OpenAPI parser, can reuse

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Stoplight Elements version conflicts | Pin to stable version, provide adapter pattern |
| Complex path matching | Start with exact matching, add fuzzy as Phase 4+ |
| Performance with large OpenAPI specs | Stream processing for large files |
