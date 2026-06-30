# Diagrams

These Mermaid diagrams are generated during `peria build` with the same Mermaid engine used by `peria diagram`.

Generated at: 2026-06-29T21:28:14.907Z

## Coverage

| Diagram type | Count |
| --- | --- |
| `route-flow` | 2 |
| `module-graph` | 0 |
| `package-deps` | 2 |
| `schema` | 6 |
| `endpoint-handler` | 0 |

## System Overview

- ID: `diagram-route-flow-system-overview`
- Type: `route-flow`
- Confidence: high
- Source entities: [route:GET:/users](/docs/application-map), [route:POST:/users](/docs/application-map), [route:GET:/users/:id](/docs/application-map), [route:POST:/users/:id/approve](/docs/application-map), [schema:CreateUserRequest](/docs/application-map), [schema:User](/docs/application-map), [schema:User](/docs/application-map), `param:op:getUserById:id`, [schema:ApproveUserRequest](/docs/application-map), [schema:User](/docs/application-map), and 4 more
- Markdown artifact: `.peria/diagrams/route-flow/diagram-route-flow-system-overview.md`
- Mermaid source: `.peria/diagrams/route-flow/diagram-route-flow-system-overview.mmd`

```mermaid
graph TD
    subgraph "System Overview"
        routes["📡 Routes"]
        routes_text["4 endpoints"]
        routes --> routes_text
        style routes fill:#61affe,stroke:#2563eb,color:#fff
        schemas["📋 Schemas"]
        schemas_text["9 types"]
        schemas --> schemas_text
        style schemas fill:#fca130,stroke:#ea580c,color:#fff
        packages["📦 Packages"]
        packages_text["1 modules"]
        packages --> packages_text
        style packages fill:#6366f1,stroke:#4338ca,color:#fff
        openapi["📖 OpenAPI"]
        openapi_text["4 operations"]
        openapi --> openapi_text
        style openapi fill:#49cc90,stroke:#16a34a,color:#fff
    end
```

## Route Flow: /users

- ID: `diagram-route-flow--users`
- Type: `route-flow`
- Confidence: high
- Source entities: [route:GET:/users](/docs/application-map), [route:POST:/users](/docs/application-map), [route:GET:/users/:id](/docs/application-map), [route:POST:/users/:id/approve](/docs/application-map)
- Markdown artifact: `.peria/diagrams/route-flow/diagram-route-flow--users.md`
- Mermaid source: `.peria/diagrams/route-flow/diagram-route-flow--users.mmd`

```mermaid
graph LR
    subgraph "/users"
        route_route_GET__users["`GET /users`"]
        style route_route_GET__users fill:#61affe,stroke:#333,stroke-width:2px
        route_route_POST__users["`POST /users`"]
        style route_route_POST__users fill:#49cc90,stroke:#333,stroke-width:2px
        route_route_GET__users__id["`GET /users/:id`"]
        style route_route_GET__users__id fill:#61affe,stroke:#333,stroke-width:2px
        route_route_POST__users__id_approve["`POST /users/:id/approve`"]
        style route_route_POST__users__id_approve fill:#49cc90,stroke:#333,stroke-width:2px
    end
```

## Package Dependencies: Overview

- ID: `diagram-package-deps-overview`
- Type: `package-deps`
- Confidence: high
- Source entities: [package:peria-example-nestjs-api](/docs/packages)
- Markdown artifact: `.peria/diagrams/package-deps/diagram-package-deps-overview.md`
- Mermaid source: `.peria/diagrams/package-deps/diagram-package-deps-overview.mmd`

```mermaid
graph LR
    subgraph "Packages"
        pkg_peria_example_nestjs_api["peria-example-nestjs-api"]
        style pkg_peria_example_nestjs_api fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff
    end
```

## Package Dependencies: peria-example-nestjs-api

- ID: `diagram-package-deps-peria-example-nestjs-api`
- Type: `package-deps`
- Confidence: high
- Source entities: [package:peria-example-nestjs-api](/docs/packages)
- Markdown artifact: `.peria/diagrams/package-deps/diagram-package-deps-peria-example-nestjs-api.md`
- Mermaid source: `.peria/diagrams/package-deps/diagram-package-deps-peria-example-nestjs-api.mmd`

```mermaid
graph TD
    subgraph "peria-example-nestjs-api"
        pkg["📦 peria-example-nestjs-api"]
        style pkg fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff
        version["v0.1.0"]
        pkg --> version
    end
    subgraph "Dependencies"
        dep__nestjs_common["@nestjs/common"]
        dep__nestjs_core["@nestjs/core"]
        dep__nestjs_platform_express["@nestjs/platform-express"]
        dep__peria_adapters["@peria/adapters"]
        dep__peria_cli["@peria/cli"]
        dep__peria_core["@peria/core"]
        dep__types_node["@types/node"]
        dep_reflect_metadata["reflect-metadata"]
        dep_rxjs["rxjs"]
        dep_typescript["typescript"]
    end
```

## Schema Diagram: Overview

- ID: `diagram-schema-overview`
- Type: `schema`
- Confidence: high
- Source entities: [schema:CreateUserRequest](/docs/application-map), [schema:User](/docs/application-map), [schema:User](/docs/application-map), `param:op:getUserById:id`, [schema:ApproveUserRequest](/docs/application-map), [schema:User](/docs/application-map), `param:op:approveUser:id`, [schema:CreateUserDto](/docs/application-map), [schema:ApproveUserRequestDto](/docs/application-map)
- Markdown artifact: `.peria/diagrams/schema/diagram-schema-overview.md`
- Mermaid source: `.peria/diagrams/schema/diagram-schema-overview.mmd`

```mermaid
erDiagram
    CreateUserRequest {
        string id PK
    }
    User {
        string id PK
    }
    User {
        string id PK
    }
    id {
        string id PK
    }
    ApproveUserRequest {
        string id PK
    }
    User {
        string id PK
    }
    id {
        string id PK
    }
    CreateUserDto {
        string id PK
        string email NOT NULL
        string name NOT NULL
    }
    ApproveUserRequestDto {
        string id PK
        string approvedAt NOT NULL
        string approvedBy NULL
    }
```

## Schema Diagram: CreateUserRequest

- ID: `diagram-schema-CreateUserRequest`
- Type: `schema`
- Confidence: high
- Source entities: [schema:CreateUserRequest](/docs/application-map)
- Markdown artifact: `.peria/diagrams/schema/diagram-schema-CreateUserRequest.md`
- Mermaid source: `.peria/diagrams/schema/diagram-schema-CreateUserRequest.mmd`

```mermaid
erDiagram
    CreateUserRequest {
        string id PK
    }
```

## Schema Diagram: User

- ID: `diagram-schema-User`
- Type: `schema`
- Confidence: high
- Source entities: [schema:User](/docs/application-map)
- Markdown artifact: `.peria/diagrams/schema/diagram-schema-User.md`
- Mermaid source: `.peria/diagrams/schema/diagram-schema-User.mmd`

```mermaid
erDiagram
    User {
        string id PK
    }
```

## Schema Diagram: User

- ID: `diagram-schema-User`
- Type: `schema`
- Confidence: high
- Source entities: [schema:User](/docs/application-map)
- Markdown artifact: `.peria/diagrams/schema/diagram-schema-User.md`
- Mermaid source: `.peria/diagrams/schema/diagram-schema-User.mmd`

```mermaid
erDiagram
    User {
        string id PK
    }
```

## Schema Diagram: id

- ID: `diagram-schema-id`
- Type: `schema`
- Confidence: high
- Source entities: `param:op:getUserById:id`
- Markdown artifact: `.peria/diagrams/schema/diagram-schema-id.md`
- Mermaid source: `.peria/diagrams/schema/diagram-schema-id.mmd`

```mermaid
erDiagram
    id {
        string id PK
    }
```

## Schema Diagram: ApproveUserRequest

- ID: `diagram-schema-ApproveUserRequest`
- Type: `schema`
- Confidence: high
- Source entities: [schema:ApproveUserRequest](/docs/application-map)
- Markdown artifact: `.peria/diagrams/schema/diagram-schema-ApproveUserRequest.md`
- Mermaid source: `.peria/diagrams/schema/diagram-schema-ApproveUserRequest.mmd`

```mermaid
erDiagram
    ApproveUserRequest {
        string id PK
    }
```
