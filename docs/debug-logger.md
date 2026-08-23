# Debug Logger Guide

`client/lib/debug-logger.ts`

A thin, categorized wrapper around the browser console. No UI, no dependencies — it exists so we never scatter raw `console.log()` calls through components, and so device-specific bugs can be diagnosed from logs a user pastes back to us.

## Why not console.log directly?

- **Categorization**: every log belongs to a subsystem (`intro`, later: `birds`, `cloth`, `clouds`, `register`...). You can focus on one problem at a time.
- **Toggleable**: enable only what you need, per session, without code changes.
- **Context**: every entry is stamped with elapsed time and a colored category badge, and the first log of a session captures the device environment (GPU string, cores, memory, DPR, reduced-motion).
- **Shareable**: logs are self-describing when pasted into chat.

## Usage

```ts
import { debug } from "@/lib/debug-logger";

debug.log("intro", "Home mounted");
debug.info("intro", "something informational", extraData);
debug.warn("intro", "Watchdog fired");
debug.error("intro", "shader compile failed", gl.getShaderInfoLog(shader));

// one-time device snapshot (GPU renderer, cores, memoryGB, screen/dpr,
// prefers-reduced-motion, online) — logged flat so nothing gets truncated
debug.env("intro");
```

Output looks like:

```
INTRO +2620ms animationend fired: hultRightTextReveal
```

(`INTRO` is a styled badge; time is ms since page load via `performance.now()`.)

## Enabling categories

All categories are **off by default** — zero noise in production and for normal users.

| Method | How |
|---|---|
| URL param | `http://localhost:3000/?debug=intro` |
| Multiple | `?debug=intro,birds` |
| Everything | `?debug=all` |
| Reset/disable all + clear saved prefs | `?debug=none` |
| From DevTools console | `__hultDebug.enable("intro")` / `.disable("intro")` / `.enableAll()` / `.disableAll()` / `.categories()` |

URL-param and console choices persist in `localStorage` under key `hult-debug:categories`, so they survive reloads until you clear them with `?debug=none`.

## Adding a new category

1. Open `lib/debug-logger.ts`
2. One line:

```ts
export const DEBUG_CATEGORIES = {
  intro: { id: "intro", label: "INTRO", color: "#f20089" },
  birds: { id: "birds", label: "BIRDS", color: "#38bdf8" }, // new
};
```

The type `DebugCategory` is derived from the registry keys, so TypeScript will autocomplete and reject typos everywhere.

## Conventions — what to log

When instrumenting a subsystem, cover these checkpoint types:

1. **Lifecycle**: mount/unmount of the component ("X mounted -> animations starting")
2. **External event callbacks**: every `animationend`, transition end, video `ended`, IntersectionObserver fire — with the event name/payload. *This is what caught our intro bug.*
3. **Resource init results**: WebGL context acquired/null, renderer created/threw, shader compile/link OK/failed (include info logs), render loop started
4. **Sequence milestones with timing**: "covered screen at 1.06s", "transition complete at 2.41s"
5. **State-machine transitions**: each flag flip that gates rendering ("revealing landing")
6. **Environment snapshot once per session** (`debug.env`)

Log **before and after** risky calls (e.g. wrap `new THREE.WebGLRenderer(...)` in try/catch, log the error, rethrow). The gap between two consecutive logs tells you where execution died.
