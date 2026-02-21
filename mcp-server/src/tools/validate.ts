import { z } from "zod";
import { replayFetch } from "../client.js";

export const validateSchema = z.object({
  code: z.string().describe("HTML or React code to validate against the design system"),
  design_system_id: z.string().describe("UUID of the imported Design System in Replay"),
});

export async function handleValidate(args: z.infer<typeof validateSchema>) {
  const { ok, data } = await replayFetch("/api/v1/validate", {
    code: args.code,
    design_system_id: args.design_system_id,
  });

  const d = data as any;
  if (!ok) {
    return { content: [{ type: "text" as const, text: `Error: ${d.error || "Validation failed"}` }] };
  }

  if (d.valid) {
    return { content: [{ type: "text" as const, text: `✅ Code is valid against design system "${d.design_system}". No issues found.` }] };
  }

  const errorList = (d.errors || [])
    .map((e: any, i: number) => `${i + 1}. [${e.type}] ${e.message}`)
    .join("\n");

  return {
    content: [
      { type: "text" as const, text: `❌ ${d.errors?.length || 0} issue(s) found against "${d.design_system}":\n\n${errorList}` },
    ],
  };
}
