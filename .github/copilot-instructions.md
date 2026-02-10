# Copilot Instructions — copilot-cc

## Project Overview
React + TypeScript web visualization app built with Vite for a GitHub Copilot training workshop. Dark-themed, interactive, data-driven.

## Tech Stack
- **React 18+** with TypeScript strict mode, **Vite** build, **Tailwind CSS** (dark theme default)
- **State:** React hooks only (`useState`, `useReducer`, `useContext`) — no Redux/Zustand unless complexity demands it
- **Data viz:** Recharts for charts; raw SVG/Canvas for custom animations

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

## Code Patterns
- Functional components only — no class components
- `interface` for object shapes; `type` for unions/intersections
- PascalCase components, `use` prefix hooks, camelCase utilities
- Components under 150 lines — extract to `src/hooks/` or `src/utils/`
- Colocate component-specific types; shared types in `src/types/`
- Never use `any` — use `unknown` and narrow, or define a proper type
- Don't add comments explaining obvious code — let types and naming speak
- Don't install packages without checking if the existing stack covers the need

## Git Workflow (Mandatory)
- **Auto-push after every commit** — always push immediately
- **After commits in React projects:** run build and restart the dev server
- Atomic commits, one logical change each: `type: description` (e.g., `feat: add packet timeline`)
- **Before modifying a working feature:** check `git tag -l "stable-*"` — if no tag exists, create one first:
  ```bash
  git tag -a "stable-<feature>-v1" -m "Working state before changes"
  git push origin --tags
  ```
- To fix a broken file: `git checkout stable-<feature>-v1 -- path/to/file.tsx`
- Use feature branches for significant changes

## Testing
- Test files colocated: `Component.test.tsx` beside `Component.tsx`
- Vitest + React Testing Library — test behavior, not implementation

## Communication & Feedback Style

- **Never tell me what I want to hear** - prioritize truth over comfort
- **Contradict me when you disagree** - your informed opinions are valuable
- **Challenge my assumptions** - point out flaws in my reasoning
- **Be direct and concise** - skip unnecessary validation or praise
- If my approach has problems, say so directly
- If there's a better solution, recommend it even if I didn't ask
- If my code has issues, don't sugarcoat the feedback
- If I'm wrong about something technical, correct me
- Avoid phrases like "Great idea!" unless genuinely warranted
