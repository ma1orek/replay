import { mapToReplayTokens } from "./mappers/to-replay-tokens";
import { mapToReplayComponents } from "./mappers/to-replay-components";
import type { SandboxMessage, ExtractionResult, ReplayDesignTokens, ReplayComponentSpec } from "./types";

// ============================================
// State
// ============================================
let extractionData: ExtractionResult | null = null;
let replayTokens: ReplayDesignTokens | null = null;
let replayComponents: ReplayComponentSpec[] = [];

// ============================================
// DOM Helpers
// ============================================
const $ = (id: string) => document.getElementById(id)!;

function showScreen(name: string) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(`screen-${name}`).classList.add("active");
}

function getApiKey(): string {
  return ($("api-key") as HTMLInputElement).value.trim();
}

function getApiUrl(): string {
  return ($("api-url") as HTMLInputElement).value.trim().replace(/\/$/, "");
}

function getDsName(): string {
  return ($("ds-name") as HTMLInputElement).value.trim();
}

// ============================================
// Load saved settings
// ============================================
const savedKey = localStorage.getItem("replay-api-key");
const savedUrl = localStorage.getItem("replay-api-url");
if (savedKey) ($("api-key") as HTMLInputElement).value = savedKey;
if (savedUrl) ($("api-url") as HTMLInputElement).value = savedUrl;

// ============================================
// Screen 1: Connect & Extract
// ============================================
$("btn-connect").addEventListener("click", () => {
  const apiKey = getApiKey();
  if (!apiKey.startsWith("rk_live_")) {
    $("connect-error").style.display = "block";
    $("connect-error").textContent = "API key must start with rk_live_";
    return;
  }

  // Save settings
  localStorage.setItem("replay-api-key", apiKey);
  localStorage.setItem("replay-api-url", getApiUrl());

  $("connect-error").style.display = "none";
  showScreen("extracting");

  // Request extraction from sandbox
  parent.postMessage({ pluginMessage: { type: "extract" } }, "*");
});

// ============================================
// Screen 2: Extraction progress
// ============================================
const progressSteps: Record<string, number> = {
  "Extracting colors...": 20,
  "Extracting typography...": 40,
  "Extracting shadows & effects...": 55,
  "Extracting spacing & radii...": 70,
  "Extracting components...": 85,
};

// ============================================
// Listen for messages from sandbox
// ============================================
window.onmessage = (event) => {
  const msg = event.data.pluginMessage as SandboxMessage;
  if (!msg) return;

  if (msg.type === "extracting") {
    $("extract-status").textContent = msg.status;
    const progress = progressSteps[msg.status] || 50;
    ($("progress-fill") as HTMLElement).style.width = `${progress}%`;
  }

  if (msg.type === "extraction-complete") {
    extractionData = msg.data;

    // Map to Replay formats
    replayTokens = mapToReplayTokens(extractionData);
    replayComponents = mapToReplayComponents(extractionData.components);

    // Populate preview screen
    $("file-name").textContent = extractionData.fileName;
    ($("ds-name") as HTMLInputElement).value = extractionData.fileName;
    $("stat-colors").textContent = String(extractionData.colors.length);
    $("stat-typography").textContent = String(extractionData.typography.length);
    $("stat-shadows").textContent = String(extractionData.shadows.length);
    $("stat-spacing").textContent = String(extractionData.spacing.length);
    $("stat-radii").textContent = String(extractionData.borderRadius.length);
    $("stat-components").textContent = String(extractionData.components.length);

    // Color swatches
    const swatchContainer = $("color-swatches");
    swatchContainer.innerHTML = "";
    extractionData.colors.slice(0, 30).forEach((c) => {
      const swatch = document.createElement("div");
      swatch.className = "color-swatch";
      swatch.style.backgroundColor = c.hex;
      swatch.title = `${c.name}: ${c.hex}`;
      swatchContainer.appendChild(swatch);
    });

    showScreen("preview");
  }

  if (msg.type === "extraction-error") {
    $("extract-status").textContent = `Error: ${msg.error}`;
    ($("progress-fill") as HTMLElement).style.width = "0%";
    ($("progress-fill") as HTMLElement).style.background = "#ef4444";
  }
};

// ============================================
// Screen 3: Preview — Re-extract
// ============================================
$("btn-re-extract").addEventListener("click", () => {
  showScreen("extracting");
  ($("progress-fill") as HTMLElement).style.width = "10%";
  ($("progress-fill") as HTMLElement).style.background = "#7c3aed";
  parent.postMessage({ pluginMessage: { type: "extract" } }, "*");
});

// ============================================
// Screen 3: Preview — Send to Replay
// ============================================
$("btn-send").addEventListener("click", async () => {
  if (!replayTokens) return;

  const name = getDsName() || extractionData?.fileName || "Figma Design System";
  const apiKey = getApiKey();
  const apiUrl = getApiUrl();

  if (!apiKey) {
    $("preview-error").style.display = "block";
    $("preview-error").textContent = "API key is missing. Go back and enter it.";
    return;
  }

  $("preview-error").style.display = "none";
  showScreen("sending");

  try {
    const response = await fetch(`${apiUrl}/api/design-systems/import/figma`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name,
        tokens: replayTokens,
        components: replayComponents,
        source_url: `figma://file/${extractionData?.fileName || "unknown"}`,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Show success
    $("success-details").textContent = `"${data.designSystem.name}" with ${data.designSystem.component_count} components is ready!`;

    $("success-stats").innerHTML = `
      <div class="stat-card">
        <div class="stat-value" style="color:#10b981;">${Object.keys(replayTokens.colors).length}</div>
        <div class="stat-label">Colors synced</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#10b981;">${data.components}</div>
        <div class="stat-label">Components synced</div>
      </div>
    `;

    showScreen("success");
  } catch (error: any) {
    $("send-status").textContent = `Error: ${error.message}`;
    ($("send-progress") as HTMLElement).style.background = "#ef4444";

    // Go back to preview after 3s
    setTimeout(() => {
      $("preview-error").style.display = "block";
      $("preview-error").textContent = `Sync failed: ${error.message}`;
      showScreen("preview");
    }, 3000);
  }
});

// ============================================
// Screen 5: Success
// ============================================
$("btn-open-replay").addEventListener("click", () => {
  window.open(`${getApiUrl()}/settings/design-systems`, "_blank");
});

$("btn-done").addEventListener("click", () => {
  parent.postMessage({ pluginMessage: { type: "close" } }, "*");
});
