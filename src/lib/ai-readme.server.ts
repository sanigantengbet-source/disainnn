/**
 * README.md generation.
 * Two modes:
 *  - "plain": deterministic template built from the extracted tokens (no AI, no key)
 *  - AI: calls the user's OWN provider API key (OpenAI / Gemini / Anthropic)
 */

export type AiProvider = "openai" | "gemini" | "anthropic";

export type ReadmeInput = {
  url: string;
  title: string;
  description: string;
  md: string;
  fonts: string[];
  radii: string[];
  primary: { hex: string; count: number }[];
  neutral: { hex: string; count: number }[];
};

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  anthropic: "claude-3-5-sonnet-latest",
};

/** Ordered fallback chain used when the chosen model is out of quota (429) or unavailable (404). */
export const FALLBACK_MODELS: Record<AiProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"],
  gemini: [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ],
  anthropic: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
};

export function modelChain(provider: AiProvider, model?: string): string[] {
  const first = (model || "").trim() || DEFAULT_MODELS[provider];
  return [first, ...FALLBACK_MODELS[provider].filter((m) => m !== first)];
}

function isRetryable(message: string) {
  return (
    message.includes("[429]") ||
    message.includes("[404]") ||
    message.includes("[503]") ||
    message.includes("[500]")
  );
}

export function buildPlainReadme(i: ReadmeInput): string {
  const host = safeHost(i.url);
  const swatch = (c: { hex: string }) => `\`${c.hex}\``;
  return [
    `# ${host} — Design System Brief`,
    "",
    `> Paste this file into your AI agent (Lovable, Cursor, Claude Code…) as the design source of truth.`,
    "",
    "## Context",
    "",
    `- Source: ${i.url}`,
    i.title ? `- Page title: ${i.title}` : "",
    i.description ? `- Description: ${i.description}` : "",
    "",
    "## Design Tokens",
    "",
    `- Primary / brand colors: ${i.primary.length ? i.primary.slice(0, 6).map(swatch).join(", ") : "none detected"}`,
    `- Neutral colors: ${i.neutral.length ? i.neutral.slice(0, 8).map(swatch).join(", ") : "none detected"}`,
    `- Fonts: ${i.fonts.join(", ") || "—"}`,
    `- Radii: ${i.radii.map((r) => `\`${r}\``).join(", ") || "—"}`,
    "",
    "## Instructions for the AI agent",
    "",
    "1. Define every color, font and radius above as semantic design tokens in the global stylesheet — never hardcode raw values in components.",
    "2. Use the typography scale below for headings, body copy and UI labels.",
    "3. Keep the visual tone consistent with the source site: same contrast level, same density, same corner rounding.",
    "4. Do not introduce new brand colors or fonts that are not listed here.",
    "",
    "## Full extracted specification",
    "",
    i.md,
    "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const SYSTEM_PROMPT = `You are a senior design engineer. You receive a machine-extracted design specification (DESIGN.md) of a website.
Write a single README.md file, in English, ready to be pasted directly into an AI coding agent as the design source of truth.

Requirements:
- Output ONLY raw markdown. No code fences around the whole document, no preamble, no commentary.
- Start with "# <hostname> — Design System Brief".
- Sections: Overview, Design Tokens (colors with hex, typography scale, radii, spacing hints), Component Guidelines (buttons, cards, inputs, nav), Implementation Rules for the AI agent, and the full token reference tables.
- Be concrete and use the real values from the input. Never invent hex values or fonts that are not present.
- Keep it practical and under ~500 lines.`;

export async function generateAiReadme(opts: {
  provider: AiProvider;
  apiKey: string;
  model?: string;
  autoFallback?: boolean;
  input: ReadmeInput;
}): Promise<{ readme: string; model: string; fallbackFrom?: string }> {
  const chain = opts.autoFallback === false
    ? [modelChain(opts.provider, opts.model)[0]!]
    : modelChain(opts.provider, opts.model);
  const host = safeHost(opts.input.url);
  const userPrompt = `Website: ${opts.input.url} (hostname: ${host})
Title: ${opts.input.title}
Description: ${opts.input.description}
Fonts: ${opts.input.fonts.join(", ") || "—"}
Radii: ${opts.input.radii.join(", ") || "—"}

Extracted DESIGN.md:
---
${opts.input.md.slice(0, 60_000)}
---`;

  let lastError: Error | null = null;
  for (const model of chain) {
    try {
      const readme = await callProvider(opts.provider, opts.apiKey, model, userPrompt);
      return model === chain[0]
        ? { readme, model }
        : { readme, model, fallbackFrom: chain[0]! };
    } catch (e) {
      lastError = e as Error;
      if (!isRetryable(lastError.message)) throw lastError;
    }
  }
  throw lastError ?? new Error("AI request failed.");
}

async function callProvider(
  provider: AiProvider,
  apiKey: string,
  model: string,
  userPrompt: string,
): Promise<string> {
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    const json = await readJson(res, "OpenAI");
    const text = json?.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenAI returned an empty response.");
    return String(text);
  }

  if (provider === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        }),
      },
    );
    const json = await readJson(res, "Gemini");
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("");
    if (!text) throw new Error("Gemini returned an empty response.");
    return String(text);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const json = await readJson(res, "Claude");
  const text = json?.content?.map((c: { text?: string }) => c.text ?? "").join("");
  if (!text) throw new Error("Claude returned an empty response.");
  return String(text);
}

async function readJson(res: Response, label: string) {
  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    /* keep raw */
  }
  if (!res.ok) {
    const msg =
      json?.error?.message ?? json?.error?.[0]?.message ?? raw.slice(0, 300) ?? res.statusText;
    throw new Error(`${label} API error [${res.status}]: ${msg}`);
  }
  return json;
}

/** Lightweight connectivity/validity check for a user-supplied API key. */
export async function testAiConnection(opts: {
  provider: AiProvider;
  apiKey: string;
  model?: string;
}): Promise<
  | { ok: true; provider: AiProvider; model: string; message: string }
  | { ok: false; provider: AiProvider; model: string; message: string }
> {
  const model = (opts.model || "").trim() || DEFAULT_MODELS[opts.provider];
  try {

  if (opts.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${opts.apiKey}` },
      body: JSON.stringify({
        model,
        max_completion_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    await readJson(res, "OpenAI");
  } else if (opts.provider === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": opts.apiKey },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ping" }] }] }),
      },
    );
    await readJson(res, "Gemini");
  } else {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    await readJson(res, "Claude");
  }

    return { ok: true, provider: opts.provider, model, message: `Connected to ${model}` };
  } catch (e) {
    const raw = (e as Error)?.message || "Connection failed.";
    let message = raw;
    if (raw.includes("[429]")) {
      message = `Quota/rate limit reached for ${model}. Your API key has no remaining free-tier quota — enable billing on the provider account, wait for the quota window to reset, or try a lighter model.`;
    } else if (raw.includes("[401]") || raw.includes("[403]")) {
      message = `Key rejected (${raw.includes("[401]") ? "401" : "403"}). The API key is invalid, revoked, or suspended by the provider. Generate a new key and try again.`;
    } else if (raw.includes("[400]") && /api key|api_key/i.test(raw)) {
      message = `Key rejected (400). This API key is not valid for ${opts.provider}. Copy a fresh key from the provider console and try again.`;
    } else if (raw.includes("[404]")) {
      message = `Model ${model} is not available for this key. Pick another model from the list.`;
    }

    return { ok: false, provider: opts.provider, model, message };
  }
}
