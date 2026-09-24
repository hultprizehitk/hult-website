import type { QuestionInput } from "@/lib/quiz/validation";

// Each question exercises an edge case; the comment says which.
export const DEV_QUESTIONS: QuestionInput[] = [
  // baseline: 4 options
  { text: "How many UN Sustainable Development Goals are there?", options: ["15", "17", "19", "21"], correctIndex: 1, points: 100, timeLimitSec: 20 },
  // 2 options, short timer
  { text: "True or false: the UN adopted the Sustainable Development Goals in 2015.", options: ["True", "False"], correctIndex: 0, points: 100, timeLimitSec: 10 },
  // 6 options (max)
  { text: "How many continents are there on Earth?", options: ["4", "5", "6", "7", "8", "9"], correctIndex: 3, points: 100, timeLimitSec: 20 },
  // 296-char question (limit 300)
  {
    text: "A startup in a coastal village builds low-cost filters that turn contaminated well water into safe drinking water, then trains local women to sell and maintain them, creating income while reducing waterborne disease. Which Sustainable Development Goal does its core product most directly address?",
    options: ["SDG 6: Clean Water and Sanitation", "SDG 7: Affordable and Clean Energy", "SDG 11: Sustainable Cities and Communities", "SDG 14: Life Below Water"],
    correctIndex: 0, points: 150, timeLimitSec: 30,
  },
  // 110-118 char options (limit 120)
  {
    text: "Which statement best describes a social enterprise?",
    options: [
      "A business whose main purpose is solving a social or environmental problem while earning revenue to sustain itself",
      "A charity that relies entirely on donations and grants and does not sell any products or services to its beneficiaries",
      "A government department that delivers public services funded through taxation and managed by elected officials",
      "A company that maximises profit for shareholders and donates a small share of its yearly earnings to local causes",
    ],
    correctIndex: 0, points: 150, timeLimitSec: 30,
  },
  // correct answer is the last option
  { text: "Which planet is the largest in our solar system?", options: ["Earth", "Saturn", "Neptune", "Jupiter"], correctIndex: 3, points: 100, timeLimitSec: 15 },
  // minimum points
  { text: "What is 12 × 12?", options: ["124", "144", "132", "154"], correctIndex: 1, points: 1, timeLimitSec: 15 },
  // maximum points
  { text: "What is the chemical symbol for gold?", options: ["Ag", "Gd", "Au", "Go"], correctIndex: 2, points: 1000, timeLimitSec: 15 },
  // minimum timer (5s) - the simulation also sends a late answer here
  { text: "Which city is Heritage Institute of Technology in?", options: ["Mumbai", "Kolkata", "Delhi", "Chennai"], correctIndex: 1, points: 100, timeLimitSec: 5 },
  // maximum timer (120s) - the host is expected to close early
  { text: "What is the binary number 1010 in decimal?", options: ["8", "10", "12", "5"], correctIndex: 1, points: 100, timeLimitSec: 120 },
  // non-ASCII symbols
  { text: "Which symbol represents the Indian rupee?", options: ["₹", "$", "€", "£"], correctIndex: 0, points: 100, timeLimitSec: 15 },
  // HTML-looking text must render literally
  { text: "Which HTML tag makes text bold?", options: ["<b>", "<i>", "<u>", "<s>"], correctIndex: 0, points: 100, timeLimitSec: 15 },
  // near-identical options
  { text: "Which spelling is correct?", options: ["Entrepreneur", "Entreprenuer", "Enterpreneur", "Entrepeneur"], correctIndex: 0, points: 100, timeLimitSec: 15 },
  // long option names
  {
    text: "Who wrote Gitanjali?",
    options: ["Rabindranath Tagore", "Bankim Chandra Chattopadhyay", "Sarat Chandra Chattopadhyay", "Kazi Nazrul Islam"],
    correctIndex: 0, points: 100, timeLimitSec: 15,
  },
  // final question
  { text: "Which gas do plants absorb from the air for photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctIndex: 2, points: 200, timeLimitSec: 20 },
];
