# Quiz UX Overhaul: Flow, Admin Console, Edge Cases

**Date:** 2026-09-28 · **Owner:** Aheen · **Branch:** `claude/beautiful-pascal-vruurk`
**Builds on:** [Firebase PRD](./2026-09-26-quiz-firebase-prd.md) (backend unchanged: Firestore, NextAuth bridge, API-only writes).
**Supersedes:** the host controls, phone states and projector states in that PRD §4 and in `docs/quiz-runbook.md`.

---

## 1. The event

- One run on event day, one auditorium, about 50 teams, one projector.
- **Two laptops:** the admin laptop runs `/admin`; the projector laptop runs `/present/470009` full screen. The admin screen is never projected.
- Organizers scan each member's QR pass at the SV Auditorium desk (main-site scanner). Only scanned members can sign in to the quiz.
- One member per team scans the projector QR, signs in, and becomes the team's player. **One phone per team.**
- Check-in closes when the admin presses Start. **Late teams cannot join.**
- Questions run strictly in order. The admin clicks through every step.

## 2. Decisions

| # | Topic | Decision |
|---|---|---|
| U1 | Desk scan | Required. Checked at Google sign-in, and again at the team's first quiz check-in (catches sessions signed in before the desk scan). Admins skip it (rehearsal). MongoDB is only touched before Start. |
| U2 | Quiz check-in | **None** (Harsh, 2026-09-28). The desk scan on the main site is the only check-in. The first desk-scanned member to open `/quiz` joins the team and binds the phone, at any time (setup, live, after a reset). The admin has no Open check-in or Pause; Start works straight from Setup. The projector QR is only a shortcut to `/quiz`. |
| U3 | One phone | The team has one seat: `takerEmail` + `deviceId`. Other members see "Playing on X's phone", not an error. |
| U4 | Seat recovery | Same account on a new phone: "Play here" moves the seat. Admin can **Switch player** (reserve the seat for a member) or **Free seat** (any member can tap "Play on this phone"). |
| U5 | Late teams | The desk scan is the check-in (Harsh, 2026-09-28): a desk-scanned member, or an admin, can check the team in at any time, even after Start or while check-in is paused. Members who were not desk-scanned can only check in while check-in is open. |
| U6 | Pacing | The primary button runs in order (Start, Question 1, Show results, ..., Final results). The Questions tab also has **Publish** on every question: while the quiz is live it jumps to that question (not in Setup or after the end; Harsh, de01baa). After the end, +15s or Restart reopens the last question. An open question left by a jump is not graded. Re-publishing a graded question clears its answers, and its next grading replaces the old result (no double counting). |
| U7 | Results | One step (reveal and leaderboard merged). Phones: verdict, points, time, rank, movement, top 10. Projector: correct answer + distribution, top 10 with **time on this question** and score. |
| U8 | Timer | Per question. The answer window closes on its own; the admin can +15s, close early, or restart. +15s and Restart also work after time is up, after results and after Final results: +15s reopens the question (answers kept), Restart clears its answers. Re-grading replaces the earlier result. Showing results while the timer runs asks for confirmation. |
| U9 | Admin answers | Hidden on the admin screen by default; one toggle reveals them. |
| U10 | Team sync | Admin console syncs every 3 minutes while the quiz is in setup or check-in, plus a manual button. Blocked after Start. Only changed teams are written. MongoDB cost: 2 queries per sync. |
| U11 | Testing | Aheen and Yogesh play as a real team. Admins may use the player side if they are on a team roster. |
| U12 | Reset | "Reset for event" clears scores, answers, check-ins and phones and returns to setup. Typed confirmation. For use after the rehearsal. |

## 3. State machine

`status`: `draft` (setup) → `lobby` (check-in) → `live` → `ended`.
`phase` while live: `idle` (starting) → `question` → `results` → `question` ...

| Action | Allowed from | Effect |
|---|---|---|
| `open_lobby` | draft | Check-in opens |
| `toggle_checkin` | lobby | Pause or resume check-in |
| `start` | lobby, 1+ questions | Live, phase `idle` ("Quiz is starting"), check-in closed |
| `next` | idle, or results with a next question | Opens the next question after a 3 s lead-in. Strictly `currentIndex + 1` |
| `extend` | question, still open | +15 s |
| `close_now` | question, still open | Stops answers now |
| `restart_question` | question | Clears this question's answers and reopens it with a new lead-in |
| `show_results` | question | Closes the question if open, grades it once, publishes answer, distribution and top 10 |
| `end` | lobby or live | Ended. Grades the current question if it is still ungraded. Primary action after the last results; emergency action otherwise |
| `reset_event` | any | Back to `draft`. Scores, answers, check-ins, seats cleared. Run archived under `runs/` |

Removed: `publish_question` (any question, any state), `reveal` + `show_leaderboard` (merged into `show_results`), `reset_session`.

## 4. Screens

### Phone (`/quiz`)
| State | Shows |
|---|---|
| Signed out | Sign in button |
| Setup | "Check-in opens soon" (updates on its own) |
| Check-in, joined | Team card, "You're playing" |
| Check-in, teammate | "Playing on X's phone" |
| Check-in closed, team not in | "Check-in closed" |
| Starting | "Quiz is starting" |
| Lead-in | 3-2-1 |
| Question | Timer, options, tap to select, Submit |
| Submitted | "Answer locked" |
| Results | Correct/Incorrect/No answer, points, your time, rank with movement, top 10 |
| Ended | Final rank card + top 10 |
| Seat lost | "Playing on another phone" + Play here |

Also: screen stays awake while live; sign-out is hidden while live; screens that were stuck until refresh (seat taken, check-in closed) update on their own; `/` redirects to `/quiz` (no polling); a hint to open in Chrome/Safari appears inside in-app browsers.

### Projector (`/present/470009`)
Setup/check-in: title, QR, "Scan to check in", teams in. Starting: "Quiz is starting". Question: countdown, options, answered count. Results: answer bars + top 10 with this question's time. Ended: podium with times + ranks 4-10. No join code anywhere.

### Admin (`/admin`)
- **Run tab:** stage strip, one primary button (label changes with the state, key `N`), secondary controls (+15s, Close early, Restart), timer, current question (answers hidden by default), answered count, standings.
- **Pre-start checklist** (setup/check-in): questions ready, last sync, teams in / eligible.
- **Teams panel** on the Run tab: search, filters (All, In, Not in, Needs attention), per team: player, phone, answered; actions Switch player, Free seat.
- **Questions tab:** edit, reorder (fixed), CSV import, bulk "set time/points for all". Locked after Start.
- **Danger zone:** End quiz now, Reset for event (type `RESET`).

## 5. Bugs fixed in this change

1. Landing page polled `/api/session/active` every 5 s per visitor (~36k Firestore reads for 150 people over 20 min). Removed.
2. Question reorder always failed: the reorder schema expected MongoDB ids.
3. After a restart, the phone kept showing "Answer Submitted" (optimistic state keyed only by question id).
4. `publish_question` worked from any state, skipped grading and could revive an ended quiz. Removed.
5. Loading `/admin` changed quiz state (draft to lobby, check-in forced open). Removed.
6. Team sync overwrote counter shards (race with live answers) and rewrote every team on every run. Now diff-only and blocked after Start.
7. Desk-scanned teams counted as quiz check-ins without a phone. Now the phone check-in is the only quiz check-in.
8. Correct answer shown on the admin screen during the question. Now hidden by default.
9. Reveal while the timer runs had no warning. Now confirms with the unanswered count.
10. Sign-out in the phone header mid-quiz silently freed the seat. Hidden while live.
11. "Device limit reached" and "Check-in closed" screens were stuck until refresh.
12. Dead "Live Standings" panels on question and waiting screens removed.
13. Projector showed an unusable join code.
14. Admins were blocked from the player side, so organizers could not rehearse.
15. Long paragraph error copy replaced with one-line messages.
16. Found during browser verification: phones could never read their own team document. Custom-token ID tokens carry no `email` claim, so the rule `token.email in memberEmails` always failed and every phone stayed on "Checking in". Rules now check the uid (the lowercased email).
17. The header and the page each ran their own Firebase sign-in; it is now one shared flow per page, and a denied document listener retries a few times before giving up.
18. `next build` rendered `/admin` and wrote the session to Firestore at build time. The page is now request-time only.

## 6. Out of scope

Void question, speed bonus, multiple rounds, question images, late check-in.

## 7. Testing checklist

### 7.1 Automated (`cd quiz && npm test`, needs Java 21)
- [ ] Engine: every allowed and refused transition in §3, strict order, last-question guard, `show_results` closes an open question.
- [ ] Grading: points, time clamp, unanswered = full time, shared ranks, `prevRank` and per-question time on standings.
- [ ] Join: check-in only while open; seat bound to first member; teammate role; reserved seat; free seat; same-account takeover; late team rejected after Start; venue check refuses an unscanned member.
- [ ] Answers: window + grace, taker and device checks, duplicates, restart clears answers.
- [ ] Sync: diff-only writes, counters untouched, blocked after Start, desk scan does not check a team in.
- [ ] Reset for event clears scores, answers, check-ins and seats and archives the run.
- [ ] Validation: reorder accepts Firestore ids.
- [ ] Rules tests unchanged and passing; `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run simulate`.

### 7.2 Manual run (Aheen + Yogesh, two laptops, two phones)
Full step-by-step script with expected results: [docs/quiz-manual-test.md](../../quiz-manual-test.md). Summary:
Roles: **A-laptop** = `/admin` (Aheen). **P-laptop** = `/present/470009` full screen. **Phone A** = Aheen. **Phone Y** = Yogesh. Use real Google login on the deployed quiz.

**Setup**
- [ ] `/admin` signed out shows organizer sign-in; a non-admin account sees "Admins only".
- [ ] Console shows Setup, pre-start checklist, last sync time. Team count matches the main site's confirmed + submitted teams for Hult Ascend.
- [ ] Add or import questions; reorder works; edit time/points; bulk set works.
- [ ] Opening `/admin` again does not change the state.

**Desk scan gate**
- [ ] Before Yogesh is scanned: Phone Y signs in and sees "Scan your pass at the desk" (Aheen is an admin and skips the desk check).
- [ ] Scan Yogesh on the main-site scanner. Phone Y signs in successfully.

**Check-in**
- [ ] While in Setup, Phone Y shows "Check-in opens soon".
- [ ] Admin presses Open check-in. P-laptop shows QR and "0 teams in".
- [ ] Phone Y scans the P-laptop QR, lands on `/quiz`, is checked in and "You're playing". P-laptop count becomes 1 without refresh.
- [ ] Phone A (scanned) opens `/quiz`: "Playing on Yogesh's phone". No error screen.
- [ ] Admin Teams panel: team In, player Yogesh, phone bound.
- [ ] Yogesh taps sign out (lobby only): Phone A shows "Play on this phone" without refresh. Aheen takes the seat. Hand it back the same way.
- [ ] Admin "Switch player" to Aheen: Phone A becomes the player on its own; Phone Y shows "Playing on Aheen's phone".
- [ ] Admin pauses check-in: P-laptop shows "Check-in paused". Resume.

**Start and questions**
- [ ] Admin presses Start (confirm). Phones and P-laptop show "Quiz is starting". A-laptop primary button reads "Question 1".
- [ ] Any account on a team that was not checked in now sees "Check-in closed".
- [ ] Question 1: 3-2-1 on both phones and P-laptop together; A-laptop hides the answer until the eye toggle.
- [ ] Player selects, then Submit: "Answer locked". Teammate phone shows the locked state. P-laptop answered 1/1.
- [ ] +15s moves every timer. Close early stops answers on the phone.
- [ ] Restart question: player can answer again (no stale "Answer locked").
- [ ] Show results while the timer runs asks for confirmation with the unanswered count.
- [ ] Results: phones show verdict, points, time, rank; P-laptop shows the answer bars and top 10 with time on this question.
- [ ] Question 2: do not answer. Results show "No answer" and full-time penalty.
- [ ] Refresh the player phone mid-question: same state, answer kept.
- [ ] Wi-Fi off 10 s on the player phone, then on: catches up.
- [ ] Player signs in on a laptop browser: laptop shows "Play here"; phone shows "Playing on another phone" after takeover. Move it back.
- [ ] Phone screen stays awake during a question.
- [ ] Double-click the primary button: only one step happens.

**End**
- [ ] After the last results, primary button reads "Final results". Phones show final rank; P-laptop shows the podium with times.
- [ ] Export CSV matches the standings.
- [ ] Reset for event (type RESET): back to Setup, scores and check-ins cleared, previous run archived. Repeat before the event.

**Venue**
- [ ] Repeat Check-in to End on venue Wi-Fi with 3+ phones, on a different day from the event (Firestore quota).
