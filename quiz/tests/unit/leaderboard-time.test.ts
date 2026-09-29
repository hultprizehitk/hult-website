import { describe, it, expect } from "vitest";
import { formatMs } from "@/lib/format";
import { rankStandings } from "@/lib/quiz/scoring";
import { standingsFromTeams } from "@/lib/quiz/client-state";
import { emptyTeamState, type TeamDoc, type Ts } from "@/lib/quiz/fs-types";

const ts = (ms: number): Ts => ({ toMillis: () => ms });
const T0 = 1_800_000_000_000;

function team(over: Partial<TeamDoc> = {}): TeamDoc {
  return {
    teamId: "t1",
    teamName: "Team 1",
    teamCode: "T1",
    leadEmail: "lead@x.in",
    members: [{ name: "Lead Player", email: "lead@x.in" }],
    memberEmails: ["lead@x.in"],
    eligible: true,
    syncedAt: ts(T0),
    ...emptyTeamState(),
    checkedInAt: ts(T0),
    takerEmail: "lead@x.in",
    deviceId: "dev-1",
    ...over,
  };
}

describe("formatMs formatting", () => {
  it("formats zero and fractional seconds correctly", () => {
    expect(formatMs(0)).toBe("0.0s");
    expect(formatMs(500)).toBe("0.5s");
    expect(formatMs(1234)).toBe("1.2s");
    expect(formatMs(2350)).toBe("2.4s");
    expect(formatMs(60000)).toBe("60.0s");
  });
});

describe("Leaderboard standings time and ranking", () => {
  it("ranks teams by score desc, then total time asc as tie-breaker", () => {
    const standings = rankStandings([
      { teamId: "t1", teamName: "Alpha", score: 200, totalTimeMs: 5000, answeredCount: 2, correctCount: 2 },
      { teamId: "t2", teamName: "Beta", score: 200, totalTimeMs: 3200, answeredCount: 2, correctCount: 2 },
      { teamId: "t3", teamName: "Gamma", score: 100, totalTimeMs: 1500, answeredCount: 1, correctCount: 1 },
    ]);

    expect(standings[0].teamName).toBe("Beta");
    expect(standings[0].rank).toBe(1);
    expect(standings[0].totalTimeMs).toBe(3200);

    expect(standings[1].teamName).toBe("Alpha");
    expect(standings[1].rank).toBe(2);
    expect(standings[1].totalTimeMs).toBe(5000);

    expect(standings[2].teamName).toBe("Gamma");
    expect(standings[2].rank).toBe(3);
  });

  it("handles exact score and time ties with shared ranks", () => {
    const standings = rankStandings([
      { teamId: "t1", teamName: "Alpha", score: 100, totalTimeMs: 2500, answeredCount: 1, correctCount: 1 },
      { teamId: "t2", teamName: "Beta", score: 100, totalTimeMs: 2500, answeredCount: 1, correctCount: 1 },
      { teamId: "t3", teamName: "Gamma", score: 50, totalTimeMs: 3000, answeredCount: 1, correctCount: 0 },
    ]);

    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(1);
    expect(standings[2].rank).toBe(3);
  });

  it("extracts current question time (lastMs) and correctness from team docs", () => {
    const teams = [
      team({
        teamId: "t1",
        teamName: "Team One",
        score: 100,
        totalTimeMs: 1850,
        lastResult: { qid: "q1", optionIndex: 2, correct: true, points: 100, ms: 1850 },
      }),
      team({
        teamId: "t2",
        teamName: "Team Two",
        score: 0,
        totalTimeMs: 5000,
        lastResult: { qid: "q1", optionIndex: null, correct: false, points: 0, ms: 5000 },
      }),
    ];

    const standings = standingsFromTeams(teams);
    expect(standings).toHaveLength(2);

    // Team 1 answered in 1.85s correctly
    const s1 = standings.find((s) => s.teamId === "t1")!;
    expect(s1.lastMs).toBe(1850);
    expect(s1.lastCorrect).toBe(true);
    expect(s1.totalTimeMs).toBe(1850);

    // Team 2 did not answer (optionIndex null)
    const s2 = standings.find((s) => s.teamId === "t2")!;
    expect(s2.lastMs).toBeNull();
    expect(s2.lastCorrect).toBe(false);
    expect(s2.totalTimeMs).toBe(5000);
  });

  it("assigns accurate ranks to teams outside the top 10 (e.g. rank 11..20)", () => {
    // Generate 15 teams with different scores
    const teams = Array.from({ length: 15 }, (_, i) =>
      team({
        teamId: `t${i + 1}`,
        teamName: `Team ${i + 1}`,
        score: (15 - i) * 10,
        totalTimeMs: 1000 + i * 100,
        lastResult: { qid: "q1", optionIndex: 0, correct: true, points: 10, ms: 1000 },
      }),
    );

    const standings = standingsFromTeams(teams);
    expect(standings).toHaveLength(15);

    // Top 10 are ranks 1 through 10
    expect(standings[0].rank).toBe(1);
    expect(standings[9].rank).toBe(10);

    // Team 11 is rank 11
    expect(standings[10].teamName).toBe("Team 11");
    expect(standings[10].rank).toBe(11);

    // Team 15 is rank 15
    expect(standings[14].teamName).toBe("Team 15");
    expect(standings[14].rank).toBe(15);
  });

  it("resolves playerName and teamCode in standingsFromTeams", () => {
    const t = team({
      teamId: "team-test",
      teamName: "Alpha Squad",
      teamCode: "HULT-ALPH",
      score: 100,
      totalTimeMs: 2500,
      takerEmail: "player@college.edu",
      members: [
        { name: "Team Lead", email: "lead@college.edu" },
        { name: "Quiz Player", email: "player@college.edu" },
      ],
      lastResult: { qid: "q1", optionIndex: 1, correct: true, points: 100, ms: 2500 },
    });

    const [s] = standingsFromTeams([t]);
    expect(s.teamCode).toBe("HULT-ALPH");
    expect(s.playerName).toBe("Quiz Player");
    expect(s.rank).toBe(1);
    expect(s.score).toBe(100);
  });
});
