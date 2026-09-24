import { questionInputSchema, type QuestionInput } from "./validation";

export const MAX_IMPORT_QUESTIONS = 200;
export const CSV_TEMPLATE = "question,a,b,c,d,e,f,answer,points,seconds\n";

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  questions: QuestionInput[];
  errors: ImportRowError[];
}

interface CsvRecord {
  line: number;
  cells: string[];
}

/** RFC 4180 parser: quoted cells, "" escapes, commas/newlines inside quotes, CRLF, UTF-8 BOM. Blank rows dropped. */
function parseRecords(text: string): CsvRecord[] {
  const src = text.replace(/^﻿/, "");
  const records: CsvRecord[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let recordLine = 1;

  const endRecord = () => {
    cells.push(cell);
    if (cells.some((c) => c.trim() !== "")) records.push({ line: recordLine, cells });
    cells = [];
    cell = "";
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        if (ch === "\n") line++;
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      endRecord();
      line++;
      recordLine = line;
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || cells.length > 0) endRecord();
  return records;
}

export function parseCsv(text: string): string[][] {
  return parseRecords(text).map((r) => r.cells);
}

const OPTION_KEYS = ["a", "b", "c", "d", "e", "f"] as const;
type Field = "question" | "answer" | "points" | "seconds" | (typeof OPTION_KEYS)[number];

const HEADER_ALIASES: Record<string, Field> = {
  question: "question", questiontext: "question", text: "question", q: "question",
  answer: "answer", correct: "answer", correctanswer: "answer", correctoption: "answer", key: "answer",
  points: "points", pts: "points", score: "points", marks: "points",
  seconds: "seconds", secs: "seconds", time: "seconds", timelimit: "seconds", timelimitsec: "seconds", timer: "seconds", duration: "seconds",
};
for (const k of OPTION_KEYS) {
  HEADER_ALIASES[k] = k;
  HEADER_ALIASES[`option${k}`] = k;
  HEADER_ALIASES[`opt${k}`] = k;
  HEADER_ALIASES[`choice${k}`] = k;
}

const REQUIRED: Field[] = ["question", "a", "b", "answer"];

const FIELD_MESSAGES: Record<string, string> = {
  text: "Question must be 1-300 characters",
  options: "Each option must be 1-120 characters",
  correctIndex: "Answer does not match an option",
  points: "Points must be 1-1000",
  timeLimitSec: "Seconds must be 5-120",
};

function parseWholeNumber(raw: string, label: string): number | undefined | string {
  const v = raw.trim();
  if (v === "") return undefined;
  if (!/^\d+$/.test(v)) return `${label} must be a whole number`;
  return Number(v);
}

/** Answer is a letter A-F (checked first) or the exact text of an option (case-insensitive). */
function resolveAnswer(raw: string, options: string[]): number | null {
  const v = raw.trim();
  if (/^[a-f]$/i.test(v)) {
    const idx = v.toLowerCase().charCodeAt(0) - 97;
    return idx < options.length ? idx : null;
  }
  const idx = options.findIndex((o) => o.toLowerCase() === v.toLowerCase());
  return idx >= 0 ? idx : null;
}

/** Parse a questions CSV. All-or-nothing: if any row has an error, `questions` is empty. */
export function parseQuestionsCsv(text: string): ImportResult {
  const records = parseRecords(text);
  if (records.length === 0) return { questions: [], errors: [{ row: 1, message: "File is empty" }] };

  const [header, ...rows] = records;
  const columns = new Map<Field, number>();
  header.cells.forEach((h, i) => {
    const field = HEADER_ALIASES[h.toLowerCase().replace(/[^a-z0-9]/g, "")];
    if (field && !columns.has(field)) columns.set(field, i);
  });
  const missing = REQUIRED.filter((f) => !columns.has(f));
  if (missing.length > 0) {
    return { questions: [], errors: [{ row: header.line, message: `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}` }] };
  }
  if (rows.length === 0) return { questions: [], errors: [{ row: 1, message: "No questions found" }] };
  if (rows.length > MAX_IMPORT_QUESTIONS) {
    return { questions: [], errors: [{ row: 1, message: `Too many questions (max ${MAX_IMPORT_QUESTIONS})` }] };
  }

  const get = (cells: string[], f: Field) => {
    const i = columns.get(f);
    return i === undefined ? "" : (cells[i] ?? "");
  };

  const questions: QuestionInput[] = [];
  const errors: ImportRowError[] = [];

  for (const { line, cells } of rows) {
    const fail = (message: string) => errors.push({ row: line, message });
    const text = get(cells, "question").trim();
    if (!text) {
      fail("Question text is required");
      continue;
    }

    const raw = OPTION_KEYS.map((k) => get(cells, k).trim());
    const last = raw.reduce((acc, v, i) => (v ? i : acc), -1);
    const gap = raw.slice(0, last + 1).findIndex((v) => !v);
    if (gap >= 0) {
      fail(`Options must be filled left to right (gap at ${OPTION_KEYS[gap].toUpperCase()})`);
      continue;
    }
    const options = raw.slice(0, last + 1);
    if (options.length < 2) {
      fail("At least 2 options (A and B) are required");
      continue;
    }

    const answerRaw = get(cells, "answer");
    const correctIndex = resolveAnswer(answerRaw, options);
    if (correctIndex === null) {
      fail(`Answer "${answerRaw.trim()}" does not match an option (use A-${OPTION_KEYS[options.length - 1].toUpperCase()} or the option text)`);
      continue;
    }

    const points = parseWholeNumber(get(cells, "points"), "Points");
    const seconds = parseWholeNumber(get(cells, "seconds"), "Seconds");
    if (typeof points === "string" || typeof seconds === "string") {
      fail([points, seconds].filter((v) => typeof v === "string").join("; "));
      continue;
    }

    const parsed = questionInputSchema.safeParse({ text, options, correctIndex, points, timeLimitSec: seconds });
    if (!parsed.success) {
      const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
      fail(fields.map((f) => FIELD_MESSAGES[f] ?? f).join("; "));
      continue;
    }
    questions.push(parsed.data);
  }

  return errors.length > 0 ? { questions: [], errors } : { questions, errors };
}
