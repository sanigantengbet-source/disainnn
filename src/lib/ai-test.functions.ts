import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { testAiConnection } from "./ai-readme.server";

const InputSchema = z.object({
  provider: z.enum(["openai", "gemini", "anthropic"]),
  apiKey: z.string().min(1),
  model: z.string().default(""),
});

export const testAiKey = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) =>
    testAiConnection({
      provider: data.provider,
      apiKey: data.apiKey.trim(),
      model: data.model,
    }),
  );
