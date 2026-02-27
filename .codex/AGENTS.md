# AGENTS.md

## Project Overview
This is a **Video Wall Size Calculator** built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

## Package Manager
**Always use `bun` — never use `npm`, `yarn`, or `pnpm`.**

- Install dependencies: `bun install`
- Add a package: `bun add <package>`
- Add a dev dependency: `bun add -d <package>`
- Run dev server: `bun dev`
- Build: `bun build`
- Run scripts: `bun run <script>`

## Project Structure
- `app/` — Next.js App Router pages and layouts
- `lib/` — Pure utility and calculation logic (unit conversion, cabinet grid search)
- `components/` — Reusable React components
- `types/` — Shared TypeScript types

## Code Style
- Use TypeScript for all files (`.ts` / `.tsx`)
- Use Tailwind utility classes for styling — no external CSS libraries
- Keep calculation logic in `lib/` as pure functions, separate from UI components
- Use named exports for utilities, default exports for components

## Key Domain Rules
- Two cabinet types: **16:9** (600mm × 337.5mm) and **1:1** (500mm × 500mm)
- Users select exactly **two** inputs at a time from: Aspect Ratio, Width, Height, Diagonal
- Supported units: `mm`, `meters`, `feet`, `inches` — conversions happen in `lib/units.ts`
- Cabinet grid search finds the closest **lower** and **upper** configurations based on size (not aspect ratio)
- All internal calculations must use **millimeters**; convert only at input/output boundaries

## Testing
- Run tests with: `bun test`
