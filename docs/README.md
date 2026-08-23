# Hult Prize Website — Engineering Docs

Docs about problems we hit, how we diagnosed them, and the reusable tooling built along the way.

| Doc | What it covers |
|---|---|
| [Debug Logger Guide](./debug-logger.md) | The categorized console logger (`lib/debug-logger.ts`): usage, enabling/disabling, how to add categories |
| [Case Study: Stuck on Intro Page](./case-study-stuck-on-intro-page.md) | Site frozen on loading screen on one laptop — full investigation from wrong hypotheses to root cause (`prefers-reduced-motion`), plus lessons for any Three.js/GSAP project |

## Quick reference

- Debug logs on any page: append `?debug=intro` (or `?debug=all`) to the URL
- Disable/reset: `?debug=none`
- In-console control: `__hultDebug.enable("intro")`, `__hultDebug.categories()`
