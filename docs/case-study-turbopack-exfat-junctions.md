# Case Study: Every API Route Returns 500 (Turbopack on an exFAT Drive)

**Date:** 2026-09-24
**App:** `quiz/` (Next.js 16.3.1)
**Symptom:** Pages rendered, but every route handler that imports `mongoose` (all of `/api/s/*` and `/api/admin/*`) returned a bare `500` with an empty body. Unit and service tests (Vitest) passed.

---

## TL;DR

| | |
|---|---|
| **What it looked like** | A bug in the new route handlers or the `handle()` error wrapper |
| **What it actually was** | The repo lives on an **exFAT** external SSD (`D:`, Samsung T7). Turbopack externalizes `mongoose` by creating a **junction** under `.next/dev/node_modules/`, and exFAT cannot store junctions or symlinks |
| **Fix** | Run the quiz on webpack: `next dev --webpack` / `next build --webpack` (the `quiz/package.json` scripts) |
| **Time to diagnose** | Minutes. The answer was in the dev-server log, not in the code |

---

## 1. Evidence

The browser only saw `500` with no JSON, which meant our `handle()` wrapper never ran: the module failed before any of our code executed. The dev-server log showed the actual failure:

```
FATAL: An unexpected Turbopack error occurred.
failed to create junction point at "\\?\D:\...\quiz\.next\dev\node_modules\mongoose-8b99e611e7552af3"
pointing to "\\?\D:\...\quiz\node_modules\mongoose"
Caused by:
- creation of a new symbolic link or junction point failed: Incorrect function. (os error 1)
```

Confirming the filesystem:

```powershell
Get-Volume -DriveLetter D   # FileSystemType : exFAT
```

Git had already hinted at this: `detected dubious ownership ... is on a file system that does not record ownership`. That warning is typical of exFAT and FAT32.

## 2. Why it happens

- Next.js keeps some server packages (`mongoose` is on the built-in list) **external**: they aren't bundled, just required at runtime.
- **Turbopack** wires each external package into `.next/dev/node_modules/<name>-<hash>` using a **junction** (Windows) or symlink.
- **exFAT has no reparse points**, so junction creation fails with `os error 1`. Every route that imports the package panics, and Next responds with a generic 500.
- **webpack** leaves externals as plain `require("mongoose")` calls, resolved from `node_modules` directly, so no links are needed.

Tests never hit it because Vitest doesn't use Turbopack.

## 3. Fix

`quiz/package.json`:

```json
"dev": "next dev --webpack -p 3001",
"build": "next build --webpack",
```

Then delete the half-written build output once: `rm -rf quiz/.next`.

## 4. Alternatives considered

| Option | Why not |
|---|---|
| Move the repo to an NTFS drive | Works, but it's the developer's machine choice and doesn't protect the next person on exFAT or FAT32 |
| Stop externalizing `mongoose` under Turbopack | Fights Next's defaults. `mongoose` is external for good reasons (native deps, a single connection cache) |
| Enable Developer Mode or admin symlink rights | Irrelevant. The filesystem, not permissions, is what can't store the link |

## 5. Lessons

1. **A bare 500 with no body means the handler never ran.** Go to the server log before touching route code.
2. **Check the filesystem when build tools misbehave on external drives.** exFAT and FAT32 lack symlinks, junctions, permissions, and ownership, and tools that assume them fail in odd ways.
3. The first webpack compile of a route on this drive takes about 35 s (Mongoose plus NextAuth over USB). After that, routes answer in milliseconds.
