const BASE_URL = process.env.REPLAY_API_URL || "https://replay.build";

export async function replayFetch(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const apiKey = process.env.REPLAY_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 401, data: { error: "REPLAY_API_KEY environment variable not set" } };
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}
