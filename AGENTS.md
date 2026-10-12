# Repository Guidelines

## Project Structure & Module Organization

The API is written in TypeScript under `src/`. Keep HTTP route definitions in `src/routes/`, request handling in `src/controllers/`, validation schemas in `src/schemas/`, shared middleware in `src/middleware/`, and database code in `src/db/`. Utilities and shared types belong in `src/utils/` and `src/types/`. Database configuration is in `drizzle.config.ts`; design notes live in `docs/`.

## Build, Test, and Development Commands

- `npm run dev` starts the API with Node watch mode for local development.
- `npm start` runs the API once.
- `npm test` runs the Vitest suite; `npm run test:watch` runs it interactively.
- `npm run test:coverage` collects coverage while running tests.
- `npm run db:generate`, `npm run db:migrate`, and `npm run db:push` manage Drizzle migrations and schema updates. Use `npm run db:seed` to seed a configured database.

## Coding Style & Naming Conventions

Use TypeScript with the repository's Prettier settings: no semicolons and single quotes. Match existing module boundaries and use descriptive kebab-case filenames (for example, `habits-controller.ts`). Use PascalCase for types, camelCase for variables and functions, and keep route, controller, and schema names aligned by feature.

## Testing Guidelines

Tests use Vitest and are configured for sequential execution to avoid database conflicts. Add tests under `tests/` with descriptive `*.test.ts` names and isolate database-dependent cases using the existing setup conventions. Run `npm test` before submitting changes that affect behavior.

## Commit & Pull Request Guidelines

Write concise, imperative commit subjects that describe one change (for example, `Add habit validation`). Pull requests should explain the behavior changed, note database or environment impacts, link related issues, and include test results. Add screenshots only when a change has a visual component.

## Security & Configuration

Copy `.env.example` to a local environment file and provide required values without committing secrets. Keep credentials and tokens out of source, logs, and test fixtures. Use the test environment configuration for database-backed tests.
