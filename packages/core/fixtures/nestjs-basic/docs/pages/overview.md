# Peria Overview

> Human-readable by default. LLM-ready by design.

Peria turns codebase knowledge into a traceable technical wiki.

## Product Thesis

Codebases lose practical knowledge when architecture, commands, docs, and Git history live in separate places.

Current focus: Build a local-first self-documenting wiki pipeline before adding hosted integrations.

## For Whom

Engineers and AI coding agents who need reliable codebase context.

## Editorial Notes

- Markdown wiki pages are the canonical artifact.
- llms.txt is a compact reading map derived from the human wiki.
- Every generated claim should trace back to source files, line numbers, and Git context.

## Current Snapshot

- Generated at: 2026-06-26T15:28:18.661Z
- Git branch: feat/self-documentation-bootstrap
- Git commit: 21a32206ba7c6081591c36990c3b19bf3f9d79b1
- Working tree: 14 changed files
- Packages documented: 1
- TypeScript modules mapped: 0
- CLI commands documented: 0 (0 implemented handlers)
- Adapters documented: 0 (0 placeholders)
- Feature flags documented: 13

## Wiki Tree Pattern

The generated markdown is the canonical knowledge layer. The visual site reads these markdown files, and `llms.txt` points agents back to the same pages instead of maintaining a separate AI-only truth.

## How To Use This Wiki

- Start with this overview for product intent and current maturity.
- Read Packages and CLI Commands to understand the public surface.
- Read TypeScript Modules and Adapters when changing code paths.
- Read Configuration And Features before changing defaults.
- Read History to connect generated claims to branch, author, commit, and working-tree state.
