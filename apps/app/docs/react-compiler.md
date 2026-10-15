# React Compiler

[React Compiler](https://react.dev/learn/react-compiler) ([LLM index](https://react.dev/llms.txt)) memoizes every component and hook in `src/` automatically, in dev and build (`reactCompilerPreset` through `@rolldown/plugin-babel` in `vite.config.ts`; ADR-0003).

Write plain React and let the compiler handle performance: no `useMemo`, `useCallback` or `React.memo`, and inline objects and callbacks in JSX are fine. Manual memoization only when a library needs a stable reference the compiler can't provide, with a comment saying why.

The compiler relies on the [Rules of React](https://react.dev/reference/rules). Code that breaks them still works but is silently skipped, so it loses memoization without any error. `'use no memo'` is a temporary escape hatch while fixing a component the compiler breaks, not a fix.

To confirm it's active: the "Memo ✨" badge in React DevTools, or `memo_cache_sentinel` in `dist/assets/*.js`.
