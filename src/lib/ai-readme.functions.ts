import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildPlainReadme, generateAiReadme } from "./ai-readme.server";

const ColorSchema = z.object({ hex: z.string(), count: z.number() });

const InputSchema = z.object({
  url: z.string().min(3),
  title: z.string().default(""),
  description: z.string().default(""),
  md: z.string().min(1),
  fonts: z.array(z.string()).default([]),
  radii: z.array(z.string()).default([]),
  primary: z.array(ColorSchema).default([]),
  neutral: z.array(ColorSchema).default([]),
  useAi: z.boolean().default(false),
  provider: z.enum(["openai", "gemini", "anthropic"]).default("openai"),
  apiKey: z.string().default(""),
  model: z.string().default(""),
  autoFallback: z.boolean().default(true),
});

export const generateReadme = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const input = {
      url: data.url,
      title: data.title,
      description: data.description,
      md: data.md,
      fonts: data.fonts,
      radii: data.radii,
      primary: data.primary,
      neutral: data.neutral,
    };

    if (!data.useAi || !data.apiKey.trim()) {
      return { readme: buildPlainReadme(input), mode: "plain" as const, warning: "", model: "" };
    }

    try {
      const res = await generateAiReadme({
        provider: data.provider,
        apiKey: data.apiKey.trim(),
        model: data.model,
        autoFallback: data.autoFallback,
        input,
      });
      return {
        readme: res.readme,
        mode: "ai" as const,
        model: res.model,
        warning: res.fallbackFrom
          ? `Model "${res.fallbackFrom}" tidak tersedia / kehabisan kuota — otomatis dialihkan ke "${res.model}".`
          : "",
      };
    } catch (e) {
      const raw = (e as Error)?.message || "AI request failed.";
      const warning = raw.includes("[429]")
        ? "AI skipped: semua model cadangan kehabisan kuota (429). Menampilkan DESIGN.md standar."
        : raw.includes("[401]") ||
            raw.includes("[403]") ||
            (raw.includes("[400]") && /api key|api_key/i.test(raw))
          ? "AI skipped: API key ditolak provider. Menampilkan DESIGN.md standar."
          : `AI skipped: ${raw}. Showing the standard DESIGN.md instead.`;

      return { readme: buildPlainReadme(input), mode: "plain" as const, warning, model: "" };
    }
  });

