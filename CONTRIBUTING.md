# Contributing to ClipNote

This project is designed to be AI-agent-friendly and human-friendly. Keep changes small, explicit, and well-typed.

## Branching and PRs

- Create feature branches off `main`
- Prefer small PRs (under ~300 lines changed)
- Include a short rationale and testing notes

## Coding standards

- TypeScript strict, no implicit `any`
- Prefer small modules and explicit message contracts
- Avoid global side effects; keep data flow predictable
- Use `import * as React from 'react'` in TSX (no default React import)

## Architecture patterns

- MV3 background service worker for coordination
- Content scripts for page interactions
- React popup for UI
- RxDB for offline data with Dexie storage
- Dynamic imports for heavy modules (e.g., OCR)

## Message contracts

Define all runtime messages in `src/background/messages.ts`. Keep them explicit and versioned when changing.

## Testing

- Manual checklist in `DEVELOPMENT.md` and `SETUP.md`
- Validate build: `npm run build`
- Type check: `npm run type-check`

## Common pitfalls

- React default import error: use `import * as React from 'react'`
- RxDB query chaining requires `RxDBQueryBuilderPlugin`
- Dynamic imports may need bundler tweaks; prefer static imports if needed

## Adding features

- Update schema/types in `src/db/`
- Extend messages and background routing
- Add content script or UI pieces as needed
- Keep docs updated: `docs/knowledge-base.md`
