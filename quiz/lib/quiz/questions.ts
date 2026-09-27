import type { Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { QuizError } from "./errors";
import { paths, type PlanItem, type QuestionDoc, type SessionDoc } from "./fs-types";
import { assertEditable } from "./sessions";
import type { QuestionLite } from "./types";
import type { QuestionInput } from "./validation";

const LOCKED = "Questions are locked once the quiz starts";

function toLite(id: string, d: QuestionDoc): QuestionLite {
  return { id, order: d.order, text: d.text, options: [...d.options], correctIndex: d.correctIndex, points: d.points, timeLimitSec: d.timeLimitSec };
}

export async function listQuestions(code: string): Promise<QuestionLite[]> {
  const snap = await adminDb().collection(paths.questions(code)).orderBy("order").get();
  return snap.docs.map((d) => toLite(d.id, d.data() as QuestionDoc));
}

async function editableSession(tx: Transaction, code: string) {
  const snap = await tx.get(adminDb().doc(paths.session(code)));
  if (!snap.exists) throw new QuizError("not_found", "Session not found");
  const s = snap.data() as SessionDoc;
  assertEditable(s, LOCKED);
  return { ref: snap.ref, s };
}

export async function addQuestion(code: string, input: QuestionInput): Promise<QuestionLite> {
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const { ref, s } = await editableSession(tx, code);
    const qRef = db.collection(paths.questions(code)).doc();
    const doc: QuestionDoc = { ...input, order: s.plan.length };
    tx.set(qRef, doc);
    tx.update(ref, { plan: [...s.plan, { id: qRef.id, timeLimitSec: input.timeLimitSec }] });
    return toLite(qRef.id, doc);
  });
}

export async function updateQuestion(code: string, id: string, input: QuestionInput): Promise<QuestionLite> {
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const { ref, s } = await editableSession(tx, code);
    const qSnap = await tx.get(db.doc(paths.question(code, id)));
    if (!qSnap.exists) throw new QuizError("not_found", "Question not found");
    const doc: QuestionDoc = { ...(qSnap.data() as QuestionDoc), ...input };
    tx.set(qSnap.ref, doc);
    tx.update(ref, { plan: s.plan.map((p) => (p.id === id ? { id, timeLimitSec: input.timeLimitSec } : p)) });
    return toLite(id, doc);
  });
}

export async function deleteQuestion(code: string, id: string): Promise<void> {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const { ref, s } = await editableSession(tx, code);
    if (!s.plan.some((p) => p.id === id)) throw new QuizError("not_found", "Question not found");
    const plan = s.plan.filter((p) => p.id !== id);
    tx.delete(db.doc(paths.question(code, id)));
    plan.forEach((p, i) => tx.update(db.doc(paths.question(code, p.id)), { order: i }));
    tx.update(ref, { plan });
  });
}

export async function reorderQuestions(code: string, ids: string[]): Promise<QuestionLite[]> {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const { ref, s } = await editableSession(tx, code);
    const byId = new Map(s.plan.map((p) => [p.id, p]));
    const sameSet = ids.length === s.plan.length && new Set(ids).size === ids.length && ids.every((id) => byId.has(id));
    if (!sameSet) throw new QuizError("invalid_input", "ids must list every question once");
    ids.forEach((id, i) => tx.update(db.doc(paths.question(code, id)), { order: i }));
    tx.update(ref, { plan: ids.map((id) => byId.get(id)!) });
  });
  return listQuestions(code);
}

/** Bulk insert (CSV import). "replace" deletes the session's existing questions first. */
export async function importQuestions(code: string, inputs: QuestionInput[], mode: "append" | "replace"): Promise<QuestionLite[]> {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const { ref, s } = await editableSession(tx, code);
    const base: PlanItem[] = mode === "replace" ? [] : s.plan;
    if (mode === "replace") s.plan.forEach((p) => tx.delete(db.doc(paths.question(code, p.id))));
    const added: PlanItem[] = inputs.map((q, i) => {
      const qRef = db.collection(paths.questions(code)).doc();
      tx.set(qRef, { ...q, order: base.length + i } satisfies QuestionDoc);
      return { id: qRef.id, timeLimitSec: q.timeLimitSec };
    });
    tx.update(ref, { plan: [...base, ...added] });
  });
  return listQuestions(code);
}
