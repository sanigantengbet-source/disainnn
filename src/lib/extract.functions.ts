import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runExtraction, buildDesignMd } from "./extract.server";

export const extractDesign = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        url: z.string().min(3).max(300),
        multiPage: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const result = await runExtraction(data.url, data.multiPage);
    return {
      links: result.links,
      pages: result.pages.map((p) => ({ ...p, md: buildDesignMd(p) })),
    };
  });

