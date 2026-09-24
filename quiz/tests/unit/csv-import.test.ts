import { describe, it, expect } from "vitest";
import { parseCsv, parseQuestionsCsv, CSV_TEMPLATE } from "@/lib/quiz/csv-import";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and newlines inside quotes, CRLF and a BOM", () => {
    const text = '﻿a,b\r\n"x, y","say ""hi"""\r\n"multi\nline",z\r\n';
    expect(parseCsv(text)).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
      ["multi\nline", "z"],
    ]);
  });

  it("skips blank lines", () => {
    expect(parseCsv("a,b\n\n1,2\n,\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseQuestionsCsv", () => {
  it("parses rows with defaults for points and seconds", () => {
    const r = parseQuestionsCsv("question,a,b,c,answer\nCapital of India?,Mumbai,New Delhi,Kolkata,B\n");
    expect(r.errors).toEqual([]);
    expect(r.questions).toEqual([
      { text: "Capital of India?", options: ["Mumbai", "New Delhi", "Kolkata"], correctIndex: 1, points: 100, timeLimitSec: 20 },
    ]);
  });

  it("accepts header aliases and answer as a letter or the exact option text", () => {
    const csv = [
      "Question,Option A,Option B,Option C,Correct,Points,Time",
      "Q1,x,y,z,c,50,10",
      "Q2,x,y,z,y,,",
      "Q3,Red,Green,Blue, green ,1000,120",
    ].join("\n");
    const r = parseQuestionsCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.questions.map((q) => [q.correctIndex, q.points, q.timeLimitSec])).toEqual([
      [2, 50, 10],
      [1, 100, 20],
      [1, 1000, 120],
    ]);
  });

  it("treats a numeric answer as option text, not a position", () => {
    const r = parseQuestionsCsv("question,a,b,c,d,answer\nHow many continents?,4,5,6,7,7\n");
    expect(r.errors).toEqual([]);
    expect(r.questions[0].correctIndex).toBe(3);
  });

  it("reports every bad row with its spreadsheet row number and imports nothing", () => {
    const csv = [
      "question,a,b,c,answer,points,seconds",
      "Good,x,y,,A,,",
      ",x,y,,A,,",
      "Only one option,x,,,A,,",
      "Gap,x,,z,A,,",
      "Bad answer,x,y,,E,,",
      "Bad points,x,y,,A,abc,",
      "Too fast,x,y,,A,,2",
    ].join("\n");
    const r = parseQuestionsCsv(csv);
    expect(r.questions).toEqual([]);
    expect(r.errors.map((e) => e.row)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(r.errors[0].message).toMatch(/question/i);
    expect(r.errors[2].message).toMatch(/gap/i);
    expect(r.errors[3].message).toMatch(/answer/i);
  });

  it("rejects a file missing required columns", () => {
    const r = parseQuestionsCsv("text,a,b\nQ,x,y\n");
    expect(r.questions).toEqual([]);
    expect(r.errors).toEqual([{ row: 1, message: "Missing column: answer" }]);
  });

  it("rejects an empty file and more than 200 questions", () => {
    expect(parseQuestionsCsv("question,a,b,answer\n").errors).toEqual([{ row: 1, message: "No questions found" }]);
    const many = ["question,a,b,answer", ...Array.from({ length: 201 }, (_, i) => `Q${i},x,y,A`)].join("\n");
    expect(parseQuestionsCsv(many).errors).toEqual([{ row: 1, message: "Too many questions (max 200)" }]);
  });

  it("exposes a header-only template that round-trips", () => {
    expect(CSV_TEMPLATE.trim()).toBe("question,a,b,c,d,e,f,answer,points,seconds");
    expect(parseQuestionsCsv(CSV_TEMPLATE).errors).toEqual([{ row: 1, message: "No questions found" }]);
  });
});
