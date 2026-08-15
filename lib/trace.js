// trace.js — the public trace store.
// Every tool call Vette makes is recorded here with its input and output,
// so every claim in a verdict can be followed back to a real check.

import fs from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "data", "traces");
const INDEX_FILE = path.join(process.cwd(), "data", "index.json");

function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true });
}

function readIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeIndex(entries) {
  try {
    fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
    fs.writeFileSync(INDEX_FILE, JSON.stringify(entries.slice(0, 50), null, 1));
  } catch {}
}

export function makeId() {
  return "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const memory = new Map(); // id -> { meta, steps[] }

export function beginTrace(id, meta) {
  memory.set(id, { meta: { ...meta, startedAt: Date.now() }, steps: [] });
  return id;
}

export function record(id, tool, input, output, note) {
  const t = memory.get(id);
  if (!t) return;
  t.steps.push({
    i: t.steps.length + 1,
    tool,
    input,
    output,
    note: note || null,
    at: Date.now(),
  });
}

export function getTrace(id) {
  const m = memory.get(id);
  if (m) return m;
  try {
    const raw = fs.readFileSync(path.join(DIR, id + ".json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function finishTrace(id, summary) {
  const t = memory.get(id);
  if (!t) return;
  t.meta.finishedAt = Date.now();
  t.meta.summary = summary;
  t.meta.durationMs = t.meta.finishedAt - t.meta.startedAt;
  // persist
  try {
    ensureDir();
    fs.writeFileSync(path.join(DIR, id + ".json"), JSON.stringify(t, null, 1));
    const idx = readIndex();
    idx.unshift({
      id,
      target: t.meta.target,
      verdict: summary.verdict,
      score: summary.score,
      checks: t.steps.length,
      at: new Date().toISOString(),
    });
    writeIndex(idx);
  } catch {}
}

export function recentAudits() {
  return readIndex();
}
