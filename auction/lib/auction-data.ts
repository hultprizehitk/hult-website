export interface IndustryItem {
  id: string;
  name: string;
  basePrice: number;
  occurrences: number;
  tier: "High Yield" | "Versatile" | "Niche";
  statePoints: Record<string, number>;
}

export interface StateSector {
  industryId: string;
  industryName: string;
  points: number;
  priority: "Co-Primary" | "Secondary" | "Emerging";
}

export interface StateItem {
  id: string;
  name: string;
  basePrice: number;
  sectors: StateSector[];
}

export const INDUSTRIES: IndustryItem[] = [
  {
    id: "cultural-heritage",
    name: "Cultural Heritage",
    basePrice: 35,
    occurrences: 4,
    tier: "High Yield",
    statePoints: {
      "west-bengal": 90,
      rajasthan: 90,
      "uttar-pradesh": 90,
      gujarat: 75,
    },
  },
  {
    id: "eco-tourism",
    name: "Eco-Tourism",
    basePrice: 35,
    occurrences: 4,
    tier: "High Yield",
    statePoints: {
      kerala: 90,
      "himachal-pradesh": 90,
      sikkim: 90,
      assam: 75,
    },
  },
  {
    id: "tea-coffee",
    name: "Tea & Coffee Estates",
    basePrice: 35,
    occurrences: 3,
    tier: "High Yield",
    statePoints: {
      "west-bengal": 90,
      assam: 90,
      kerala: 75,
    },
  },
  {
    id: "luxury-resorts",
    name: "Luxury Resorts",
    basePrice: 35,
    occurrences: 3,
    tier: "High Yield",
    statePoints: {
      rajasthan: 90,
      goa: 90,
      "himachal-pradesh": 75,
    },
  },
  {
    id: "pilgrimage-spiritual",
    name: "Pilgrimage & Spiritual",
    basePrice: 35,
    occurrences: 3,
    tier: "High Yield",
    statePoints: {
      "uttar-pradesh": 90,
      "tamil-nadu": 90,
      "himachal-pradesh": 75,
    },
  },
  {
    id: "wildlife-safari",
    name: "Wildlife & Safari",
    basePrice: 30,
    occurrences: 3,
    tier: "Versatile",
    statePoints: {
      assam: 90,
      rajasthan: 75,
      gujarat: 75,
    },
  },
  {
    id: "handicraft-textile",
    name: "Handicraft & Textile",
    basePrice: 30,
    occurrences: 3,
    tier: "Versatile",
    statePoints: {
      gujarat: 90,
      "west-bengal": 75,
      "tamil-nadu": 75,
    },
  },
  {
    id: "adventure-sports",
    name: "Adventure Sports",
    basePrice: 30,
    occurrences: 3,
    tier: "Versatile",
    statePoints: {
      "himachal-pradesh": 90,
      sikkim: 75,
      goa: 75,
    },
  },
  {
    id: "beach-coastal",
    name: "Beach & Coastal",
    basePrice: 30,
    occurrences: 3,
    tier: "Versatile",
    statePoints: {
      goa: 90,
      kerala: 75,
      "west-bengal": 60,
    },
  },
  {
    id: "mice-infra",
    name: "MICE Infrastructure",
    basePrice: 30,
    occurrences: 3,
    tier: "Versatile",
    statePoints: {
      gujarat: 90,
      "tamil-nadu": 75,
      rajasthan: 60,
    },
  },
  {
    id: "wellness-ayurveda",
    name: "Wellness & Ayurveda",
    basePrice: 30,
    occurrences: 3,
    tier: "Versatile",
    statePoints: {
      kerala: 90,
      sikkim: 75,
      "himachal-pradesh": 60,
    },
  },
  {
    id: "river-cruise",
    name: "River Cruise Tourism",
    basePrice: 30,
    occurrences: 3,
    tier: "Versatile",
    statePoints: {
      "west-bengal": 75,
      "uttar-pradesh": 75,
      assam: 75,
    },
  },
  {
    id: "culinary-food",
    name: "Culinary & Food",
    basePrice: 30,
    occurrences: 3,
    tier: "Versatile",
    statePoints: {
      rajasthan: 75,
      goa: 75,
      "uttar-pradesh": 75,
    },
  },
  {
    id: "agro-tourism",
    name: "Agro-Tourism",
    basePrice: 25,
    occurrences: 3,
    tier: "Niche",
    statePoints: {
      sikkim: 90,
      "uttar-pradesh": 60,
      assam: 60,
    },
  },
  {
    id: "medical-tourism",
    name: "Medical Tourism",
    basePrice: 25,
    occurrences: 3,
    tier: "Niche",
    statePoints: {
      "tamil-nadu": 90,
      kerala: 60,
      gujarat: 60,
    },
  },
  {
    id: "cinematic-film",
    name: "Cinematic & Film",
    basePrice: 25,
    occurrences: 3,
    tier: "Niche",
    statePoints: {
      goa: 60,
      sikkim: 60,
      "tamil-nadu": 60,
    },
  },
];

export const STATES: StateItem[] = [
  {
    id: "west-bengal",
    name: "West Bengal",
    basePrice: 30,
    sectors: [
      { industryId: "cultural-heritage", industryName: "Cultural Heritage", points: 90, priority: "Co-Primary" },
      { industryId: "tea-coffee", industryName: "Tea & Coffee Estates", points: 90, priority: "Co-Primary" },
      { industryId: "handicraft-textile", industryName: "Handicraft & Textile", points: 75, priority: "Secondary" },
      { industryId: "river-cruise", industryName: "River Cruise Tourism", points: 75, priority: "Secondary" },
      { industryId: "beach-coastal", industryName: "Beach & Coastal", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "rajasthan",
    name: "Rajasthan",
    basePrice: 30,
    sectors: [
      { industryId: "cultural-heritage", industryName: "Cultural Heritage", points: 90, priority: "Co-Primary" },
      { industryId: "luxury-resorts", industryName: "Luxury Resorts", points: 90, priority: "Co-Primary" },
      { industryId: "wildlife-safari", industryName: "Wildlife & Safari", points: 75, priority: "Secondary" },
      { industryId: "culinary-food", industryName: "Culinary & Food", points: 75, priority: "Secondary" },
      { industryId: "mice-infra", industryName: "MICE Infrastructure", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "kerala",
    name: "Kerala",
    basePrice: 30,
    sectors: [
      { industryId: "wellness-ayurveda", industryName: "Wellness & Ayurveda", points: 90, priority: "Co-Primary" },
      { industryId: "eco-tourism", industryName: "Eco-Tourism", points: 90, priority: "Co-Primary" },
      { industryId: "beach-coastal", industryName: "Beach & Coastal", points: 75, priority: "Secondary" },
      { industryId: "tea-coffee", industryName: "Tea & Coffee Estates", points: 75, priority: "Secondary" },
      { industryId: "medical-tourism", industryName: "Medical Tourism", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "goa",
    name: "Goa",
    basePrice: 30,
    sectors: [
      { industryId: "beach-coastal", industryName: "Beach & Coastal", points: 90, priority: "Co-Primary" },
      { industryId: "luxury-resorts", industryName: "Luxury Resorts", points: 90, priority: "Co-Primary" },
      { industryId: "culinary-food", industryName: "Culinary & Food", points: 75, priority: "Secondary" },
      { industryId: "adventure-sports", industryName: "Adventure Sports", points: 75, priority: "Secondary" },
      { industryId: "cinematic-film", industryName: "Cinematic & Film", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "gujarat",
    name: "Gujarat",
    basePrice: 30,
    sectors: [
      { industryId: "handicraft-textile", industryName: "Handicraft & Textile", points: 90, priority: "Co-Primary" },
      { industryId: "mice-infra", industryName: "MICE Infrastructure", points: 90, priority: "Co-Primary" },
      { industryId: "cultural-heritage", industryName: "Cultural Heritage", points: 75, priority: "Secondary" },
      { industryId: "wildlife-safari", industryName: "Wildlife & Safari", points: 75, priority: "Secondary" },
      { industryId: "medical-tourism", industryName: "Medical Tourism", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "uttar-pradesh",
    name: "Uttar Pradesh",
    basePrice: 30,
    sectors: [
      { industryId: "pilgrimage-spiritual", industryName: "Pilgrimage & Spiritual", points: 90, priority: "Co-Primary" },
      { industryId: "cultural-heritage", industryName: "Cultural Heritage", points: 90, priority: "Co-Primary" },
      { industryId: "culinary-food", industryName: "Culinary & Food", points: 75, priority: "Secondary" },
      { industryId: "river-cruise", industryName: "River Cruise Tourism", points: 75, priority: "Secondary" },
      { industryId: "agro-tourism", industryName: "Agro-Tourism", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "himachal-pradesh",
    name: "Himachal Pradesh",
    basePrice: 30,
    sectors: [
      { industryId: "adventure-sports", industryName: "Adventure Sports", points: 90, priority: "Co-Primary" },
      { industryId: "eco-tourism", industryName: "Eco-Tourism", points: 90, priority: "Co-Primary" },
      { industryId: "luxury-resorts", industryName: "Luxury Resorts", points: 75, priority: "Secondary" },
      { industryId: "pilgrimage-spiritual", industryName: "Pilgrimage & Spiritual", points: 75, priority: "Secondary" },
      { industryId: "wellness-ayurveda", industryName: "Wellness & Ayurveda", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "sikkim",
    name: "Sikkim",
    basePrice: 30,
    sectors: [
      { industryId: "eco-tourism", industryName: "Eco-Tourism", points: 90, priority: "Co-Primary" },
      { industryId: "agro-tourism", industryName: "Agro-Tourism", points: 90, priority: "Co-Primary" },
      { industryId: "adventure-sports", industryName: "Adventure Sports", points: 75, priority: "Secondary" },
      { industryId: "wellness-ayurveda", industryName: "Wellness & Ayurveda", points: 75, priority: "Secondary" },
      { industryId: "cinematic-film", industryName: "Cinematic & Film", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "tamil-nadu",
    name: "Tamil Nadu",
    basePrice: 30,
    sectors: [
      { industryId: "medical-tourism", industryName: "Medical Tourism", points: 90, priority: "Co-Primary" },
      { industryId: "pilgrimage-spiritual", industryName: "Pilgrimage & Spiritual", points: 90, priority: "Co-Primary" },
      { industryId: "handicraft-textile", industryName: "Handicraft & Textile", points: 75, priority: "Secondary" },
      { industryId: "mice-infra", industryName: "MICE Infrastructure", points: 75, priority: "Secondary" },
      { industryId: "cinematic-film", industryName: "Cinematic & Film", points: 60, priority: "Emerging" },
    ],
  },
  {
    id: "assam",
    name: "Assam",
    basePrice: 30,
    sectors: [
      { industryId: "tea-coffee", industryName: "Tea & Coffee Estates", points: 90, priority: "Co-Primary" },
      { industryId: "wildlife-safari", industryName: "Wildlife & Safari", points: 90, priority: "Co-Primary" },
      { industryId: "river-cruise", industryName: "River Cruise Tourism", points: 75, priority: "Secondary" },
      { industryId: "eco-tourism", industryName: "Eco-Tourism", points: 75, priority: "Secondary" },
      { industryId: "agro-tourism", industryName: "Agro-Tourism", points: 60, priority: "Emerging" },
    ],
  },
];

export const MINIMUM_BALANCE_THRESHOLD = 35; // ₹35 Cr mandatory reserve
export const INITIAL_TEAM_BUDGET = 200; // ₹200 Cr starting budget
export const ROUND1_MAX_BID = 135; // ₹135 Cr safe limit for Round 1
export const STATE_BASE_PRICE = 30; // ₹30 Cr base price for states

export interface TeamScoreCalculation {
  teamId: string;
  teamName: string;
  teamCode: string;
  quizRank: number;
  finalBalance: number;
  ownedStateId: string | null;
  ownedStateName: string;
  ownedIndustryIds: string[];
  matchedSectors: {
    industryId: string;
    industryName: string;
    points: number;
    priority: string;
  }[];
  unmatchedIndustryIds: string[];
  totalMatchPoints: number;
  isEligible: boolean;
  disqualificationReason?: string;
  rank: number;
}

export function evaluateTeamScore(
  team: {
    teamId: string;
    teamName: string;
    teamCode: string;
    quizRank: number;
    currentBalance: number;
    ownedState: string | null;
    ownedIndustries: string[];
    status: string;
  }
): TeamScoreCalculation {
  const result: TeamScoreCalculation = {
    teamId: team.teamId,
    teamName: team.teamName,
    teamCode: team.teamCode,
    quizRank: team.quizRank,
    finalBalance: team.currentBalance,
    ownedStateId: team.ownedState,
    ownedStateName: "None",
    ownedIndustryIds: team.ownedIndustries || [],
    matchedSectors: [],
    unmatchedIndustryIds: [],
    totalMatchPoints: 0,
    isEligible: true,
    rank: 0,
  };

  // Rule 1: Explicit Disqualification
  if (team.status === "disqualified") {
    result.isEligible = false;
    result.disqualificationReason = "Disqualified by auctioneer";
    return result;
  }

  // Rule 2: Minimum Balance Threshold Check
  if (team.currentBalance < MINIMUM_BALANCE_THRESHOLD) {
    result.isEligible = false;
    result.disqualificationReason = `Balance ₹${team.currentBalance} Cr is below the required ₹35 Cr reserve`;
    return result;
  }

  // Rule 3: Must own exactly 1 State and >= 1 Industry
  if (!team.ownedState) {
    result.isEligible = false;
    result.disqualificationReason = "Did not acquire a State";
    return result;
  }

  if (!team.ownedIndustries || team.ownedIndustries.length === 0) {
    result.isEligible = false;
    result.disqualificationReason = "Did not acquire any Industries";
    return result;
  }

  const stateObj = STATES.find((s) => s.id === team.ownedState);
  if (!stateObj) {
    result.isEligible = false;
    result.disqualificationReason = "Invalid State reference";
    return result;
  }

  result.ownedStateName = stateObj.name;

  // Calculate Feasibility Synergy Matches
  let pointsSum = 0;
  for (const indId of team.ownedIndustries) {
    const matchedSector = stateObj.sectors.find((sec) => sec.industryId === indId);
    if (matchedSector) {
      result.matchedSectors.push({
        industryId: indId,
        industryName: matchedSector.industryName,
        points: matchedSector.points,
        priority: matchedSector.priority,
      });
      pointsSum += matchedSector.points;
    } else {
      result.unmatchedIndustryIds.push(indId);
    }
  }

  result.totalMatchPoints = pointsSum;
  return result;
}

export function rankAllTeams(
  evaluated: TeamScoreCalculation[]
): TeamScoreCalculation[] {
  // Sort with multi-level criteria:
  // 1. Eligibility (Eligible > Ineligible/Disqualified)
  // 2. Primary: Total Match Points (descending)
  // 3. Tie-Breaker 1: Higher remaining cash balance (descending)
  // 4. Tie-Breaker 2 (Fallback): Quiz Rank (ascending, where Rank 1 > Rank 10)
  const sorted = [...evaluated].sort((a, b) => {
    if (a.isEligible !== b.isEligible) {
      return a.isEligible ? -1 : 1;
    }

    if (!a.isEligible && !b.isEligible) {
      return a.quizRank - b.quizRank;
    }

    // Compare Match Points
    if (b.totalMatchPoints !== a.totalMatchPoints) {
      return b.totalMatchPoints - a.totalMatchPoints;
    }

    // Tie-breaker 1: Cash balance
    if (b.finalBalance !== a.finalBalance) {
      return b.finalBalance - a.finalBalance;
    }

    // Tie-breaker 2: Quiz rank (lower rank number is better)
    return a.quizRank - b.quizRank;
  });

  return sorted.map((team, idx) => ({
    ...team,
    rank: idx + 1,
  }));
}
