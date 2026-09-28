# Quiz Manual Test Script

Real devices, the deployed quiz, real Google accounts. No emulators, no dev login.
Covers the full event flow in [the UX overhaul spec](./superpowers/specs/2026-09-28-quiz-ux-overhaul.md).

**Time:** about 60 minutes. **When:** a different day from the event (the rehearsal and the event share the free Firestore quota if run on the same day; it resets at 12:30 IST).

## 1. People and devices

| Label | Who | Device | Opens |
|---|---|---|---|
| **ADMIN** | Aheen | Laptop 1 (Chrome) | `https://<quiz-domain>/admin` |
| **PROJ** | anyone | Laptop 2, on the projector or a big screen, full screen (F11) | `https://<quiz-domain>/present/470009` |
| **P1** | Aheen | Phone (Chrome or Safari) | the projector QR |
| **P2** | Yogesh | Phone | the projector QR |
| **DESK** | an organizer with the scanner role | Phone or laptop | main-site admin scanner |
| **P3** (optional) | a third person on another test team | Phone | the projector QR |

## 2. Before you start

- [ ] The Aheen + Yogesh team is registered for **HULT ASCEND** on the main site, **confirmed** and **submitted**.
- [ ] Yogesh has **not** been scanned at the desk yet (step C2 tests the refusal). Aheen's account is an admin, so the desk check does not apply to Aheen; use Yogesh for the desk-scan steps.
- [ ] Both accounts are `@heritageit.edu.in` Google accounts.
- [ ] Have 3 test questions ready (one with a 10 s timer). A CSV works: `question,a,b,c,d,e,f,answer,points,seconds`.
- [ ] Firebase console: note today's Firestore reads before starting (Usage tab).
- [ ] On each phone, open the camera app, not Instagram/WhatsApp/Google Lens, to scan QR codes.

**How to record:** for every step, mark Pass or Fail. On a Fail, write the step ID, what you saw, the time, and take a screenshot of every device involved.

## 3. Test steps

### A. Console access

| ID | Who | Do | Expect |
|---|---|---|---|
| A1 | ADMIN | Open `/admin` signed out | Organizer sign-in page |
| A2 | Yogesh (any laptop) | Sign in to `/admin` with Yogesh's account | "Organizers only" message; no console |
| A3 | ADMIN | Sign in with Aheen's account | Console opens on the **Run** tab. "Now: Setup". Title "Hult Ascend Live Quiz" |
| A4 | ADMIN | Reload `/admin` twice | Nothing changes: still Setup, same version number (top right `v…`) |

### B. Setup

| ID | Who | Do | Expect |
|---|---|---|---|
| B1 | ADMIN | Look at the Teams panel (right) | "Synced … · auto every 3 min". Team count equals the main site's confirmed + submitted Hult Ascend teams |
| B2 | ADMIN | Press **Sync** | Toast "Synced: X eligible, 0 new, 0 changed" (0 changed if nothing moved on the site) |
| B3 | ADMIN | Search the Teams panel for "Yogesh" (name or email) | Your team appears, "Not in" |
| B4 | ADMIN | Questions tab: add 3 questions (or Import CSV). Use **Set for all** to set 100 pts | All questions show 100 pts |
| B5 | ADMIN | Move a question up/down with the arrows | Order changes and stays after reload |
| B6 | ADMIN | Back to Run. Read "Before start" | Questions ready, Teams synced ticked |
| B7 | PROJ | Open `/present/470009` | "Check-in opens soon", no QR yet |
| B8 | P2 | Open `https://<quiz-domain>/` | Redirects to `/quiz` |

### C. Desk scan gate

| ID | Who | Do | Expect |
|---|---|---|---|
| C1 | P2 | Sign in with Yogesh's Google account | Dialog "Scan your pass at the desk" |
| C2 | P2 | Tap Try again, sign in again | Same refusal (still not scanned) |
| C3 | DESK | Scan Yogesh's QR pass on the main-site scanner | Scanner confirms check-in |
| C4 | P2 | Sign in again | Signed in. Shows "Check-in opens soon" (check-in not open yet) and updates on its own |

### D. Check-in and one phone per team

| ID | Who | Do | Expect |
|---|---|---|---|
| D1 | ADMIN | Press **Open check-in** (or key N) | Now: "Check-in open". PROJ shows QR, "Scan to check in", "0 / N" |
| D2 | P2 | Nothing (already on `/quiz`) | Within a few seconds: "Checked in", team card, Yogesh marked **Playing** |
| D3 | PROJ | Watch | Count goes to 1 without refresh |
| D4 | ADMIN | Teams panel | Team "In", player Yogesh, phone "On" |
| D5 | P1 | Scan the projector QR, sign in as Aheen | "Playing on Yogesh's phone". No error screen, no answer buttons |
| D6 | P2 | Tap the sign-out icon (top right) | Signed out |
| D7 | P1 | Watch | "No one is playing for <team>" with **Play on this phone**. Tap it | P1 becomes the player ("Checked in", Aheen Playing) |
| D8 | P2 | Sign in again | "Playing on Aheen's phone" |
| D9 | ADMIN | Teams panel: change the player dropdown to Yogesh, confirm **Switch player** | P2 becomes the player on its own; P1 shows "Playing on Yogesh's phone" |
| D10 | ADMIN | **Pause check-in** | PROJ: "Check-in paused". Press **Resume check-in** |
| D11 | ADMIN | Filter **Attention** | Lists desk-scanned teams not in yet, and any team in without a phone |

### E. Start

| ID | Who | Do | Expect |
|---|---|---|---|
| E1 | ADMIN | Press **Start quiz** | Confirmation says how many teams are in and how many will be locked out. Confirm |
| E2 | all | Look | PROJ, P1, P2: **Quiz is starting**. ADMIN primary button reads **Question 1**. Sign-out icon hidden on the player phone |
| E3 | P3 (or any account on a team not checked in) | Open `/quiz` | "Check-in closed. The quiz has started" |
| E4 | ADMIN | Teams panel Sync bar | "locked after start", no Sync button |

### F. Questions

| ID | Who | Do | Expect |
|---|---|---|---|
| F1 | ADMIN | Press **Question 1** | PROJ and phones show 3-2-1 at the same moment |
| F2 | ADMIN | Look at the question card | Answer **hidden**. "Show answer" reveals it on the admin laptop only; toggle it back |
| F3 | P1 (teammate) | Look | "Playing on Yogesh's phone" (teammates never get answer buttons) |
| F4 | P2 | Tap an option, then **Submit answer** | "Answer locked". PROJ answered bar shows 1/1 |
| F5 | P2 | Refresh the page | Comes back to the same question, still "Answer locked" |
| F6 | ADMIN | Press **Show results** | P2: Correct/Incorrect, points, "Answered in X s", rank card, answer bars, top 10. PROJ: answer bars on the left, top 10 with **time on this question** on the right |
| F7 | ADMIN | Press **Question 2** (use the 10 s question if you have one). Do not answer | Timer runs out on all screens. PROJ shows "Time up" |
| F8 | ADMIN | **Show results** | P2: "No answer". Standings: "Last Q" shows "-" |
| F9 | ADMIN | Press **Question 3**. When it opens, press **Show results** straight away | Confirmation "Timer still running, 1 team not answered yet". Press **Cancel** |
| F10 | P2 | Answer | "Answer locked" |
| F11 | ADMIN | **Restart question**, confirm | 3-2-1 again on all screens. P2 can answer again (no stale "Answer locked") |
| F12 | ADMIN | While open: **+15s** | Every timer jumps up 15 s |
| F13 | ADMIN | **Close early** | Answer buttons stop on P2; PROJ "Time up" |
| F14 | ADMIN | Double-click the primary button quickly | Only one step happens |
| F15 | ADMIN | Press the **N** key instead of clicking | Same as the primary button |

### G. Recovery during the quiz

Do these during a question (Question 2 or 3), before Show results.

| ID | Who | Do | Expect |
|---|---|---|---|
| G1 | P2 | Turn Wi-Fi and data off for 10 s, then on | "Reconnecting" pill, then catches up with no error |
| G2 | Yogesh | Open `/quiz` on a laptop, signed in as Yogesh | Laptop: "Playing on another device" + **Play here**. Tap it | Laptop becomes the player; P2 shows "Playing on another device". Tap **Play here** on P2 to take it back |
| G3 | ADMIN | Teams panel: **Free seat** on your team, confirm | Both phones: "No one is playing for <team>" + **Play on this phone**. Tap it on P1 | P1 plays |
| G4 | ADMIN | Switch player back to Yogesh | P2 plays |
| G5 | P2 | Lock the screen for 30 s, unlock | Same state; during a question the screen stays awake while unlocked |
| G6 | ADMIN | Open the console in a second tab, press the primary button in one tab | The other tab updates within a second; no error toast |

### H. End

| ID | Who | Do | Expect |
|---|---|---|---|
| H1 | ADMIN | After the last results, press **Final results**, confirm | PROJ: podium with points and total time, ranks 4-10 below. Phones: "Final results", own rank card, top 10 |
| H2 | ADMIN | **CSV** (top right) | File downloads; ranks, scores and per-question answers match the standings |
| H3 | ADMIN | Open `/present/470009/board` on any screen | Final podium |

Optional, instead of H1: end early with **Danger zone > End quiz** during a question. The running question is graded and the podium shows.

### I. Reset for event

| ID | Who | Do | Expect |
|---|---|---|---|
| I1 | ADMIN | **Danger zone > Reset for event** | Dialog asks you to type RESET; the button stays disabled until you do |
| I2 | ADMIN | Type RESET, confirm | Now: Setup. Teams all "Not in". Standings gone. Questions kept |
| I3 | P1, P2 | Watch | "Check-in opens soon" |
| I4 | PROJ | Watch | "Check-in opens soon" |

### J. Venue rehearsal (separate session, venue Wi-Fi)

| ID | Do | Expect |
|---|---|---|
| J1 | Repeat D1 to H1 on the venue Wi-Fi with at least 3 phones on 2+ teams | Same results; rank movement arrows appear when teams swap places |
| J2 | Two teams answer the same question correctly at the same second | Tie shows the same rank |
| J3 | After the run, check the Firebase console Usage | Reads well under 50k for the day |
| J4 | **Reset for event** at the end | Clean state for event day |

## 4. After the test

- Send the Fail list (step ID, screenshot, time, device and browser) to Aheen.
- Record the Firestore reads used (Firebase console) next to the date.
- Leave the console on **Setup** after **Reset for event**.
