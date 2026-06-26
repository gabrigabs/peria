# Peria Overview

> Human-readable by default. LLM-ready by design.

Peria compiles code, configuration, docs, and Git history into a living technical wiki with traceable claims.

## Product Thesis

Most generated docs flatten a repo into indexes. Peria should preserve intent, ownership boundaries, and change history.

Current focus: Make the repository capable of documenting itself with a useful markdown wiki, visual reader, graph artifact, and agent context map.

## For Whom

Engineers maintaining a codebase and AI agents that need source-backed context before making changes.

## Editorial Notes

- The human wiki in /docs is the source of truth.
- The visual reader is generated from markdown instead of a parallel content model.
- Agent context files point back to the same wiki tree used by humans.
- Git metadata is part of the generated knowledge, not an afterthought.

## Current Snapshot

- Generated at: 2026-06-26T19:34:44.442Z
- Git branch: feat/self-documentation-bootstrap
- Git commit: d0a5f2266d97a31e0c775cc8a67e92a44c5b6d46
- Working tree: 28 changed files
- Packages documented: 7
- TypeScript modules mapped: 156
- CLI commands documented: 3 (3 implemented handlers)
- Adapters documented: 4 (0 placeholders)
- Feature flags documented: 13

## Wiki Tree Pattern

The generated markdown is the canonical knowledge layer. The visual site reads these markdown files, and `llms.txt` points agents back to the same pages instead of maintaining a separate AI-only truth.

## How To Use This Wiki

- Start with this overview for product intent and current maturity.
- Read Packages and CLI Commands to understand the public surface.
- Read TypeScript Modules and Adapters when changing code paths.
- Read Configuration And Features before changing defaults.
- Read History to connect generated claims to branch, author, commit, and working-tree state.
