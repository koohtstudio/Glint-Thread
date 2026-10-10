# Decisions log

One line each: decision, then reason.

- Node 24 LTS installed via nvm and pinned in `.nvmrc`; Sanity 6 and Vitest 5 require Node >= 22.12 and the machine default was 20.19.
- TypeScript 6.0.3 instead of 7.0: typescript-eslint (used by eslint-config-next) supports TS < 6.1 only.
- ESLint 9 instead of 10: eslint-plugin-react (in eslint-config-next 16.4) peers on ESLint <= 9.
- Kept Next 16 Cache Components and Partial Prefetching (create-next-app defaults); data functions use `use cache` + `cacheTag`, and webhook revalidation uses `revalidateTag(tag, { expire: 0 })` per the bundled docs.
- Task list lives in `TASKS.md` because this session has no built-in todo tool; it is updated at each milestone.
