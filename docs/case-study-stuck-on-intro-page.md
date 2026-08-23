# Case Study: Stuck on the Intro Page

**Date:** August 2026
**Symptom:** On one Windows 11 laptop, the site stayed on the loading screen (big H monogram + black/pink fluid backdrop) forever. The same build ran perfectly on a Mac and a Windows desktop with a discrete GPU.

---

## TL;DR

| | |
|---|---|
| **What it looked like** | Weak GPU / Three.js too heavy / software rendering |
| **What it actually was** | `prefers-reduced-motion: reduce` active in the browser (Windows "Animation effects" toggle off) |
| **Why that broke everything** | The intro → home handoff depended on a CSS `animationend` event; our own reduced-motion CSS killed all animations, so the event never fired and the sequence stalled |
| **Fixes** | Categorized debug logger, 3s watchdog on the intro handoff, removed all reduce-motion gating (product decision: this is a cinematic site — always animate) |

---

## 1. Wrong hypotheses first (and why they were reasonable)

Before instrumenting anything, the working theories were:

1. **Three.js is too heavy for integrated GPUs** — plausible, wrong
2. **The laptop fell back to software rendering (SwiftShader)** — plausible, wrong
3. **WebGL context creation failed silently** — plausible, wrong

Lesson: every one of these was testable in minutes with logging. Guessing cost more time than the logger took to build.

## 2. Step 1 — Build instrumentation, not theories

We built [`lib/debug-logger.ts`](../client/lib/debug-logger.ts) (see [Debug Logger Guide](./debug-logger.md)) and instrumented every checkpoint of the intro → home handoff:

```
HultLogoIntro mounted            ← CSS animations start
  animationend: hultRightTextReveal   ← THE handoff signal
onEnded -> setIntroLogoEnded(true)
+400ms -> cloud transition starts
Cloud renderer created OK
Cloud COVERED screen at 1.06s    <- fires onCovered
Cloud COMPLETE at 2.42s          <- fires onComplete
```

Plus an environment snapshot on mount: GPU renderer string (via `WEBGL_debug_renderer_info`), cores, memory, DPR, and **`reducedMotion`**.

## 3. Step 2 — First log batch eliminated three theories at once

```
INTRO +1189ms AnimatedGradient: webgl2 context acquired
INTRO +1195ms AnimatedGradient: shaders compiled OK
INTRO +1207ms AnimatedGradient: render loop started
```

WebGL was healthy. Context acquired, shaders compiled on hardware acceleration. **Three.js was never the problem.**

But the log had a hole: `animationend fired: hultRightTextReveal` **never appeared**. No handoff signal → `introLogoEnded` stayed false → cloud transition never scheduled → stuck forever.

## 4. Step 3 — Watchdog safety net (fail-open)

We added a 3-second watchdog in `page.tsx`: if the intro hasn't ended naturally within 3s of mount, force it to end anyway:

```tsx
useEffect(() => {
  if (introLogoEnded) return;
  const timer = setTimeout(() => {
    debug.warn("intro", "Watchdog: forcing intro end after 3000ms");
    setIntroLogoEnded(true);
  }, 3000);
  return () => clearTimeout(timer);
}, [introLogoEnded]);
```

Result: the page proceeded past the intro... but the landing page rendered **completely static** — no birds, no banners, no sky animation. That "broken" state was the biggest clue of the whole investigation.

## 5. Step 4 — Correlating symptoms revealed the root cause

Everything pointed the same direction:

| Observation | Explanation |
|---|---|
| `animationend` never fired | No animation was running to end |
| H appeared instantly, fully filled white | Our reduced-motion fallback rules force final states (`width: 495px !important` etc.) |
| Landing static: no birds, no banners, no sky/cloud/hero motion | `globals.css` killed all CSS animations under reduced motion; `ThreeBirds.tsx` and `ClothWindOverlay.tsx` explicitly early-return on `prefers-reduced-motion: reduce` |
| Env log showed `reducedMotion=true` | Confirmed at runtime |

The user's Windows laptop had **Settings → Accessibility → Visual effects → Animation effects = OFF**, so Chrome reports `prefers-reduced-motion: reduce`.

One-line confirmation from DevTools console:

```js
matchMedia("(prefers-reduced-motion: reduce)").matches // true
```

This also explains why Mac + gaming desktop were fine: those machines have OS animations enabled.

### Why this matters more than people think

`prefers-reduced-motion: reduce` is not rare on Windows. Users (or OEM power profiles) disable animation effects for performance/battery/motion-sensitivity reasons. If your site gates behavior on it — or waits on events that only exist when animations run — a meaningful slice of Windows visitors hits exactly these bugs while your dev machine looks perfect.

## 6. Fixes applied

1. **Debug logger infrastructure** (kept permanently) — categorized, toggleable, env snapshot. See [debug-logger.md](./debug-logger.md).
2. **Watchdog on time-based sequences** (kept) — any chain that depends on events outside your control should fail open, never trap the user.
3. **Product decision: always animate** — removed all reduce-motion gating:
   - deleted the entire `@media (prefers-reduced-motion: reduce)` block in `globals.css`
   - removed the early returns in `ThreeBirds.tsx` and `ClothWindOverlay.tsx`
   - rationale: this is a cinematic brand site; a half-degraded static version was worse than either extreme

## 7. Gotchas hit along the way (all visible in real logs)

### React StrictMode double-mounts (dev-only)

```
INTRO +931ms HultLogoIntro mounted -> CSS animations starting
INTRO +971ms HultLogoIntro mounted -> CSS animations starting   <- again!
```

Effects run setup→cleanup→setup twice in dev StrictMode. Benign; don't chase ghosts. Note which components log once vs twice (effects gated by other state may legitimately run only in the second pass).

### Stale closure in the watchdog

First watchdog version read `introLogoEnded` inside a `setTimeout` created in a `[]`-deps effect — so the callback saw the value from the first render (`false`) forever, even after the intro ended naturally:

```
+2620ms animationend fired: hultRightTextReveal   <- ended naturally
+4666ms Watchdog: forcing intro end after 3000ms  <- still fired (wrong)
```

Fix: depend on `[introLogoEnded]`, early-return when already ended, clear the timer in cleanup. Now the watchdog disarms itself the moment the intro completes naturally. **General rule: a timeout callback must never read React state through a closure captured at setup time.**

---

## Checklist for cross-device animation bugs (Three.js / GSAP)

1. Instrument before theorizing — categorized logs at lifecycle, external events, resource init, milestones
2. Log the environment once per session: GPU renderer string, DPR, cores, `matchMedia("(prefers-reduced-motion: reduce)")`
3. Never let a sequence depend solely on an event that can be suppressed (`animationend`, transitionend) — add a watchdog that fails open
4. Wrap WebGL context/renderer creation in try/catch; log and rethrow (or degrade gracefully) — never let it die silently
5. Remember `prefers-reduced-motion` is commonly ON for whole Windows machines via the OS accessibility toggle — test with it both ways (`chrome://settings` or emulate in DevTools → Rendering → Emulate CSS media feature prefers-reduced-motion)
6. Test across *settings*, not just hardware — two laptops with identical specs can behave differently
