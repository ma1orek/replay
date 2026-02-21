import { z } from "zod";
import { replayFetch } from "../client.js";

export const generateSchema = z.object({
  video_url: z.string().url().describe("Public URL to a video recording (MP4, WebM, MOV)"),
  style: z.string().optional().describe("Style preset name (minimal, brutalist, glassmorphism, etc.)"),
});

export async function handleGenerate(args: z.infer<typeof generateSchema>) {
  const { ok, data } = await replayFetch("/api/v1/generate", {
    video_url: args.video_url,
    style: args.style || "",
  });

  const d = data as any;
  if (!ok) {
    return { content: [{ type: "text" as const, text: `Error: ${d.error || "Generation failed"}` }] };
  }

  const summary = [
    `Generated ${(d.code?.length || 0).toLocaleString()} chars of React + Tailwind code.`,
    d.scan_data?.pages ? `Detected ${d.scan_data.pages.length} page(s).` : "",
    `Credits used: ${d.credits_used}`,
  ].filter(Boolean).join("\n");

  return {
    content: [
      { type: "text" as const, text: summary },
      { type: "text" as const, text: d.code || "" },
    ],
  };
}
