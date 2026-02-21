import { z } from "zod";
import { replayFetch } from "../client.js";

export const scanSchema = z.object({
  video_url: z.string().url().describe("Public URL to a video recording"),
});

export async function handleScan(args: z.infer<typeof scanSchema>) {
  const { ok, data } = await replayFetch("/api/v1/scan", {
    video_url: args.video_url,
  });

  const d = data as any;
  if (!ok) {
    return { content: [{ type: "text" as const, text: `Error: ${d.error || "Scan failed"}` }] };
  }

  return {
    content: [
      { type: "text" as const, text: JSON.stringify(d, null, 2) },
    ],
  };
}
