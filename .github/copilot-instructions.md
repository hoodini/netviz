# Copilot Instructions — copilot-cc

## Project Overview
This is a **React + TypeScript** demo project built with Vite, used for a GitHub Copilot training workshop. The app being built is an interactive web visualization tool.

## Tech Stack & Conventions
- **Framework:** React 18+ with TypeScript (strict mode)
- **Build tool:** Vite
- **Styling:** Tailwind CSS with a dark theme by default
- **State:** React hooks (`useState`, `useReducer`, `useContext`) — no external state library unless complexity demands it
- **Data viz:** Recharts for charts, raw SVG/Canvas for custom animations

## Code Patterns
- Use **functional components only** — no class components
- Prefer `interface` over `type` for object shapes; use `type` for unions/intersections
- Name components in PascalCase, hooks with `use` prefix, utilities in camelCase
- Keep components under 150 lines — extract logic into custom hooks (`src/hooks/`) or utilities (`src/utils/`)
- Colocate component-specific types in the same file; shared types go in `src/types/`

## Project Structure
```
src/
  components/   # UI components (one folder per feature)
  hooks/        # Custom React hooks
  utils/        # Pure utility functions
  types/        # Shared TypeScript interfaces
  services/     # API calls, data fetching, external integrations
  assets/       # Static assets
```

## Git Workflow
- Atomic commits: one logical change per commit
- Commit format: `type: description` (e.g., `feat: add packet timeline`, `fix: correct color mapping`)
- Auto-push after every commit
- Tag stable milestones before risky changes: `git tag -a "stable-<feature>-v1" -m "description"`

## Testing
- Test files live next to source: `Component.test.tsx` beside `Component.tsx`
- Use Vitest + React Testing Library
- Focus tests on behavior, not implementation details

## What NOT to Do
- Don't add comments explaining obvious code — let types and naming speak
- Don't install packages without checking if the existing stack covers the need
- Don't use `any` — use `unknown` and narrow, or define a proper type
