# **Hult Prize Quiz — Requirements Doc**

**Version:** 0.2 **Stack:** Next.js (frontend \+ API routes/server actions), Firebase (Firestore, real-time listeners, Cloud Functions)

---

## **1\. Format (as specified)**

* \~50 teams, in one auditorium, at the same time.  
* Each team scans a QR code to RSVP/check in on quiz day.  
* Exactly **one member per team** takes the quiz — no substitutions, no multiple entries.  
* \~10 MCQ questions, timed, variable points per question.  
* All teams start simultaneously when the organizer launches the quiz.  
* Ranking: top 10 by total points, tie-break by total time taken (faster wins).  
* A public ranking/leaderboard panel is shown once the quiz ends.

---

## **2\. QR Check-In**

* QR code on quiz day links to a check-in page (`/quiz/checkin`), which:  
  * Requires login.  
  * Confirms the logged-in user belongs to a registered team.  
  * Marks that team as "checked in" for the event (`quizSessions/{eventId}/checkins/{teamId}`).  
* **Decision needed:** does *any* team member scanning count as check-in, or does it have to be the specific person taking the quiz? Recommend: check-in is per-team (any member can confirm presence), but the quiz-taker is locked separately (below) — don't conflate the two.

## **3\. Designating the Quiz-Taker**

* The team needs a clear, fast way to lock in who takes the quiz — this has to happen *before* launch, not scrambled live.  
* Recommended: on the team's dashboard, before quiz day, the captain pre-assigns a "quiz representative" (changeable until check-in closes, then locked).  
* Once locked, only that member's account can enter the quiz room; other team members see a "your teammate is taking this" waiting screen.

## **4\. Synchronized Start**

Highest-risk part of the system:

* **Server-controlled clock, not client-controlled.** Never trust each device's local clock to decide "the quiz has started." One organizer action writes a single `status: "live", startTime: <server timestamp>` to a shared Firestore doc (`quizEvents/{eventId}`). All clients listen in real time (`onSnapshot`) and transition the instant they see `status: "live"`.  
* Use Firestore's `serverTimestamp()` for `startTime` as the one authoritative source of truth; clients compute their countdown relative to server time (with a small clock-offset correction), not `Date.now()`.  
* **Question delivery:** decide whether all 10 questions are sent to the client at once (obfuscated, revealed one at a time) or fetched one at a time from the server as the user progresses. One-at-a-time is safer against cheating but adds latency risk with 50 concurrent clients — needs load testing.  
* **Per-question or overall timer?** Clarify: time limit per question, or one overall timer for the whole set (used for tie-breaking)? Recommend one running overall timer — simplest, matches the stated tie-break rule — unless per-question pressure is actually wanted.

## **5\. Scoring**

* Each question has a fixed point value (define this list before build day).  
* Score \= sum of points for correct answers. Store per-team, per-question answers and timestamps (`quizAnswers/{eventId}/{teamId}/{questionId}`: chosen option, isCorrect, answeredAt) — not just the final score — so disputes can be audited afterward.  
* **Tie-break by time:** define precisely what "time" means — elapsed time from start to final submit is the cleanest option. Store one timestamp per team on submission, relative to server `startTime`. Lower elapsed time wins ties.

## **6\. Ranking Panel**

* A dedicated page (e.g. `/quiz/results` or `/leaderboard`) that goes live once the quiz ends (`status: "ended"`).  
* Shows top 10 teams ranked by score, tie-broken by time, pulled from a `quizResults/{eventId}/{teamId}` collection computed at end of quiz (totalScore, finishTime, rank).  
* Should update in real time as results are finalized (organizer ends quiz → Cloud Function computes final ranks → panel listens via `onSnapshot` and displays automatically) rather than needing a manual refresh or manual publish step.  
* Decide: does everyone see the full top 10, or does each team also see their own rank/score even if outside the top 10? Recommend showing both — public top 10, plus a "your team" card with their own score/rank regardless of placement.  
* Decide: is this panel public (viewable by anyone, e.g. projected on a screen in the auditorium) or does it require login? A public/projectable view is probably the point here.

## **7\. Edge Cases**

| Edge case | Decision needed |
| ----- | ----- |
| Quiz-taker's device disconnects/refreshes mid-quiz | Persist answers to Firestore as each question is answered, so a refresh reloads current state, not a blank quiz. |
| Quiz-taker's device crashes/dies entirely | Is there a designated backup per team, or is the team out of luck? Decide and communicate in advance. |
| Checked-in member not present at launch (bathroom, etc.) | Timer runs for all regardless — simplest and fairest — unless a grace period is explicitly wanted. |
| Two people try to submit for the same team | Lock the quiz session to one `uid` once started; reject submissions from any other uid on that team. |
| Organizer needs to end early / extend time | Build a kill-switch / time-extend control into the admin panel from day one. |
| Network congestion (50 devices on venue wifi at once) | Load-test with \~50 simulated concurrent clients before the event; coordinate with whoever controls venue networking. |
| Suspected cheating | Decide how much relies on physical proctors vs. technical safeguards (single active session, no copy-paste) — don't over-invest engineering in anti-cheat theater if proctors cover it. |
| Exact tie on both points AND time | Decide the fallback now (shared rank, or manual tiebreaker question) so it isn't improvised live. |

## **8\. Admin/Organizer Panel**

* View check-in status live, launch the quiz, monitor live progress (who's answered how many questions), see a live leaderboard, end the quiz manually, export final results, and extend time / reissue the start signal if something goes wrong.  
* This is as important to build well as the participant-facing quiz screen — it's the only lever for handling edge cases live.

---

## **9\. Data Model (Firestore, draft)**

quizEvents/{eventId}  
  status ("pending" | "live" | "ended"), startTime (serverTimestamp), endTime, questionSet

quizEvents/{eventId}/checkins/{teamId}  
  checkedInAt, checkedInByUid

quizAnswers/{eventId}/{teamId}/{questionId}  
  chosenOption, isCorrect, pointsAwarded, answeredAt

quizResults/{eventId}/{teamId}  
  totalScore, finishTime, rank

---

## **10\. Build Order (recommended)**

1. Quiz data model \+ question bank (author the 10 questions \+ point values)  
2. Quiz-taker designation flow (locks before event)  
3. QR check-in flow  
4. Live quiz screen: server-synced start, question flow, answer submission, persistence on refresh  
5. Live admin controls: launch, monitor, end, extend  
6. Scoring \+ tie-break logic  
7. Ranking panel (real-time, public-facing)  
8. Load test with \~50 simulated concurrent users on venue-like network conditions  
9. Dry run with real devices, ideally on actual venue wifi, before the live event

---

## **11\. Open Questions to Resolve Before Building**

1. Per-question timer vs. one overall timer.  
2. Exact point values per question.  
3. Exact definition of tie-break "time."  
4. Backup quiz-taker policy if the designated person's device fails.  
5. How much anti-cheat is proctor-based vs. technical.  
6. One-shot vs. paginated question delivery.  
7. Ranking panel access: public/projectable, or login-gated?  
8. Whether non-top-10 teams see their own rank/score.

