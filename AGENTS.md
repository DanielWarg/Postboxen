# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds App Router entries, server functions, and the landing experience; keep feature logic co-located with its route segment.
- `app/components/` contains marketing-specific sections, while `components/ui/` mirrors the shadcn/ui primitives—extend these instead of duplicating styling.
- Shared hooks live under `hooks/`, cross-cutting helpers (e.g., `cn`) stay in `lib/utils.ts`, and global styling resides in `styles/globals.css`.
- Static assets belong in `public/`; reference them with root-relative paths (e.g., `/placeholder.svg`). Avoid committing `.next/` or `.venv/` artifacts.

## Build, Test, and Development Commands
- `pnpm install` resolves dependencies (pnpm is implied by the committed `pnpm-lock.yaml`).
- `pnpm dev` starts the Next.js dev server with hot reload. Use this for local QA.
- `pnpm build` generates an optimized production bundle; confirm it succeeds before releases.
- `pnpm start` serves the build output locally, mirroring the production runtime.
- `pnpm lint` runs `next lint`; treat warnings as blockers and fix autofixable issues with `pnpm lint --fix` when necessary.

## Coding Style & Naming Conventions
- TypeScript is mandatory; keep component files as `.tsx` and server utilities as `.ts`.
- Follow the existing 2-space indentation and prefer `PascalCase` for React components, `camelCase` for functions/variables, and `SCREAMING_SNAKE_CASE` only for constants that map to env values.
- Compose UI with Tailwind classes; centralize reusable variants with `class-variance-authority` in `components/ui/` or helper utilities.
- Use the `@/` alias for imports instead of relative traversal, and keep props typed explicitly for public components.

## Testing Guidelines
- Automated tests are not configured yet; when introducing them, colocate `*.test.ts(x)` beside the unit under test and add a `pnpm test` script.
- Until a harness exists, rely on `pnpm lint` and interaction testing in `pnpm dev`; document manual QA steps in your PR.
- Maintain mock API responses in `app/api/` to avoid flakey network calls during manual verification.

## Commit & Pull Request Guidelines
- Write concise, descriptive commit subjects (67 characters or fewer) using sentence case with optional context after a colon, e.g., `Refine hero call-to-action`.
- Squash fixup commits locally; each PR should read as a coherent story from the history.
- PRs must include: purpose summary, screenshots or clips for UI-facing changes, linked issue or ticket, manual testing notes, and a risk callout.
- Request review from the domain owner for any modifications under `components/ui/` or shared hooks to preserve design consistency.
