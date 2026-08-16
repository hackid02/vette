// llm.js — optional model narration.
// Deterministic by default. If ANTHROPIC_API_KEY is configured, the model
// writes the narrative WORDS; the engine still decides every number, level,
// and verdict. No key = template narration. Both are honest about it.

export function llmConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function narrateWithLlm(audit) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const findings = (audit.findings || []).map((f) => ({
    level: f.level,
    title: f.title,
    detail: f.detail,
  }));

  const facts = {
    verdict: audit.verdict,
    score: audit.score,
    target: audit.target,
    wallet: audit.wallet,
    claimsFound: audit.claimsFound,
    mandateExplicit: audit.mandateExplicit,
  };

  const system =
    "You are the narrator of a deterministic blockchain safety engine called VETTE. " +
    "You write the plain-English explanation of an audit. HARD RULES: " +
    "1. You may only use facts present in the input JSON — never add numbers, dates, or claims of your own. " +
    "2. Every sentence you write must be traceable to a finding or a wallet stat in the input. " +
    "3. If the input says a scan was incomplete or evidence is missing, say so plainly; never soften it. " +
    "4. No hype, no hedging, no financial advice. " +
    "5. Write 4-7 sentences as plain text, one per line.";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 400,
        system,
        messages: [
          {
            role: "user",
            content: JSON.stringify({ facts, findings }),
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null; // fall back to template — never fail the audit over narration
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) return null;
    return text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 8);
  } catch {
    return null;
  }
}
