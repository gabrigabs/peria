# Peria NestJS API Example

This example is the public end-to-end path for trying Peria against a small NestJS API.

It includes:

- NestJS routes in `src/users/users.controller.ts`
- DTO/schema source in `src/users/dto/approve-user-request.dto.ts`
- OpenAPI source in `openapi.yaml`
- Peria project metadata in `peria.config.ts`
- Generated docs in `docs/`
- A mounted docs adapter in `src/main.ts`

## Run It

```sh
npm install
npm run peria:scan
npm run peria:build
npm run peria:scan
npm run peria:check
npm run build
npm start
```

Then open:

- API route: `http://127.0.0.1:3000/api/users`
- Generated docs root: `http://127.0.0.1:3000/docs`
- Wiki manifest: `http://127.0.0.1:3000/docs/wiki-manifest.json`
- Agent map: `http://127.0.0.1:3000/docs/llms.txt`

## Validate From The Monorepo

From the Peria repository root:

```sh
bun run example:nest
```

The validation script copies this example to a temporary directory, installs local packed Peria packages, regenerates docs, checks drift, compiles the NestJS app, starts it, and validates the API and docs routes.

## What Peria Should Find

- Framework: NestJS
- Routes:
  - `GET /users`
  - `POST /users`
  - `GET /users/:id`
  - `POST /users/:id/approve`
- Schemas:
  - `ApproveUserRequestDto`
  - OpenAPI component schemas from `openapi.yaml`
- Docs:
  - Markdown wiki pages in `docs/pages/`
  - Fumadocs-compatible MDX in `docs/content/docs/`
  - `docs/wiki-manifest.json`
  - `llms.txt`
