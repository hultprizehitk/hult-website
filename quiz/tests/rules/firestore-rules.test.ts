import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

let env: RulesTestEnvironment;
const S = "quizSessions/123456";

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-hult-quiz-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, S), { code: "123456", status: "live" });
    await setDoc(doc(db, `${S}/live/counts`), { checkedIn: 1 });
    await setDoc(doc(db, `${S}/questions/q1`), { text: "Q", correctIndex: 1 });
    await setDoc(doc(db, `${S}/teams/t1`), { memberEmails: ["a@heritageit.edu.in", "a2@heritageit.edu.in"] });
    await setDoc(doc(db, `${S}/teams/t2`), { memberEmails: ["b@heritageit.edu.in"] });
    await setDoc(doc(db, `${S}/answers/t1_q1`), { optionIndex: 1 });
    await setDoc(doc(db, "quizAdmins/boss@heritageit.edu.in"), { email: "boss@heritageit.edu.in" });
    await setDoc(doc(db, "other/x"), { a: 1 });
  });
});

afterAll(async () => {
  await env.cleanup();
});

const anon = () => env.unauthenticatedContext().firestore();
const member = (email: string) => env.authenticatedContext(email, { email }).firestore();
const admin = () => env.authenticatedContext("boss@heritageit.edu.in", { email: "boss@heritageit.edu.in", admin: true }).firestore();

describe("anonymous (projector)", () => {
  it("reads the public session and counts docs", async () => {
    await assertSucceeds(getDoc(doc(anon(), S)));
    await assertSucceeds(getDoc(doc(anon(), `${S}/live/counts`)));
  });
  it("reads nothing else", async () => {
    await assertFails(getDoc(doc(anon(), `${S}/questions/q1`)));
    await assertFails(getDoc(doc(anon(), `${S}/teams/t1`)));
    await assertFails(getDoc(doc(anon(), `${S}/answers/t1_q1`)));
    await assertFails(getDoc(doc(anon(), "quizAdmins/boss@heritageit.edu.in")));
    await assertFails(getDoc(doc(anon(), "other/x")));
  });
  it("cannot write anywhere", async () => {
    await assertFails(setDoc(doc(anon(), S), { status: "ended" }));
    await assertFails(updateDoc(doc(anon(), `${S}/live/counts`), { checkedIn: 99 }));
  });
});

describe("signed-in participant", () => {
  it("reads only their own team", async () => {
    await assertSucceeds(getDoc(doc(member("a2@heritageit.edu.in"), `${S}/teams/t1`)));
    await assertFails(getDoc(doc(member("a@heritageit.edu.in"), `${S}/teams/t2`)));
  });
  it("cannot read questions (no correctIndex leak), answers, admins, or list all teams", async () => {
    const db = member("a@heritageit.edu.in");
    await assertFails(getDoc(doc(db, `${S}/questions/q1`)));
    await assertFails(getDocs(collection(db, `${S}/questions`)));
    await assertFails(getDoc(doc(db, `${S}/answers/t1_q1`)));
    await assertFails(getDocs(collection(db, `${S}/teams`)));
    await assertFails(getDoc(doc(db, "quizAdmins/boss@heritageit.edu.in")));
  });
  it("cannot write, not even to their own team or answer", async () => {
    const db = member("a@heritageit.edu.in");
    await assertFails(updateDoc(doc(db, `${S}/teams/t1`), { score: 1000 }));
    await assertFails(setDoc(doc(db, `${S}/answers/t1_q2`), { optionIndex: 0 }));
    await assertFails(deleteDoc(doc(db, `${S}/answers/t1_q1`)));
  });
});

describe("admin token", () => {
  it("reads everything in a session", async () => {
    const db = admin();
    await assertSucceeds(getDoc(doc(db, `${S}/questions/q1`)));
    await assertSucceeds(getDocs(collection(db, `${S}/teams`)));
    await assertSucceeds(getDocs(collection(db, `${S}/answers`)));
    await assertSucceeds(getDoc(doc(db, "quizAdmins/boss@heritageit.edu.in")));
  });
  it("still cannot write from the client", async () => {
    await assertFails(updateDoc(doc(admin(), S), { status: "ended" }));
    await assertFails(setDoc(doc(admin(), `${S}/questions/q2`), { text: "x" }));
  });
  it("a forged claim without admin:true is not an admin", async () => {
    const db = env.authenticatedContext("x", { email: "boss@heritageit.edu.in", admin: false }).firestore();
    await assertFails(getDoc(doc(db, `${S}/questions/q1`)));
  });
});
