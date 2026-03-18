import Anthropic from "@anthropic-ai/sdk";
import { DealData } from "./types";

const client = new Anthropic({ timeout: 110_000 }); // 110s — just under route maxDuration

const SYSTEM_PROMPT = `You are a music publishing contract analyst. Given raw contract text, extract the following fields and return ONLY valid JSON — no preamble, no markdown fences.

Important rules for text fields:
- Summarize each timeline milestone (early_exit, catalog_reversion, unexploited_reversion, term_notes, advance_rollover_conditions) in plain English. Maximum 2 sentences, 25 words total. No legal terminology, no clause references, no parentheticals.
- Never include raw clause numbers, section references, or verbatim legal language in any string field.

{
  "deal_title": "string — parties involved e.g. Warner Chappell Music Canada — TOBi",
  "date": "string",
  "status": "string — e.g. Subject to contract and corporate approval",
  "term_years": "number — minimum term in years",
  "term_notes": "string — any extension or recoupment conditions",
  "early_exit": "string — conditions for early termination if any",
  "catalog_reversion": "string — when rights return to artist",
  "unexploited_reversion": "string — when unexploited compositions return",
  "scope_existing": "string",
  "scope_new": "string",
  "territory": "string",
  "royalty_calculation": "string — e.g. at source",
  "advance_initial_usd": "number",
  "advance_initial_notes": "string",
  "advance_rollover_usd": "number or null",
  "advance_rollover_conditions": "string or null",
  "recoupment_rate": "number — e.g. 120 meaning 120%",
  "royalties": [
    {
      "income_type": "string",
      "during_term_pct": "number",
      "post_term_pct": "number"
    }
  ],
  "accounting_frequency": "string",
  "accounting_days": "number — days after period end",
  "pipeline_calc_available": "boolean",
  "audit_rights": "string",
  "additional_notes": "string or null"
}

If you cannot confidently extract a field, set it to null. Return ONLY the JSON object, nothing else.`;

export async function parseDealWithClaude(text: string): Promise<DealData> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please extract the deal information from the following contract text:\n\n${text}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const raw = content.text.trim();
  // Strip markdown code fences if the model wraps the JSON anyway
  const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(jsonText) as DealData;
  return parsed;
}
