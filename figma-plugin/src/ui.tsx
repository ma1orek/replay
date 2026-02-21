import { mapToReplayTokens } from "./mappers/to-replay-tokens";
import { mapToReplayComponents } from "./mappers/to-replay-components";
import type { SandboxMessage, ExtractionResult, ReplayDesignTokens, ReplayComponentSpec } from "./types";

// ============================================
// State
// ============================================
var extractionData: ExtractionResult | null = null;
var replayTokens: ReplayDesignTokens | null = null;
var replayComponents: ReplayComponentSpec[] = [];

// ============================================
// DOM Helpers
// ============================================
function $(id: string): HTMLElement {
  var el = document.getElementById(id);
  if (!el) {
    console.error("[Replay] Element not found: #" + id);
  }
  return el as HTMLElement;
}

function showScreen(name: string) {
  console.log("[Replay] showScreen:", name);
  var screens = document.querySelectorAll(".screen");
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove("active");
  }
  $("screen-" + name).classList.add("active");
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
// Init
// ============================================
console.log("[Replay] Plugin UI initializing...");

try {
  // Load saved settings
  var savedKey = localStorage.getItem("replay-api-key");
  var savedUrl = localStorage.getItem("replay-api-url");
  if (savedKey) ($("api-key") as HTMLInputElement).value = savedKey;
  if (savedUrl) ($("api-url") as HTMLInputElement).value = savedUrl;
  console.log("[Replay] Loaded saved settings");
} catch (e) {
  console.error("[Replay] Failed to load saved settings:", e);
}

// ============================================
// Screen 1: Connect & Extract
// ============================================
try {
  $("btn-connect").onclick = function () {
    console.log("[Replay] Connect button clicked");
    var apiKey = getApiKey();
    console.log("[Replay] API key length:", apiKey.length, "starts with:", apiKey.substring(0, 8));

    if (!apiKey || apiKey.length < 5) {
      $("connect-error").style.display = "block";
      $("connect-error").textContent = "Please enter your API key";
      return;
    }

    // Save settings
    try {
      localStorage.setItem("replay-api-key", apiKey);
      localStorage.setItem("replay-api-url", getApiUrl());
    } catch (e) {
      console.error("[Replay] Failed to save settings:", e);
    }

    $("connect-error").style.display = "none";
    showScreen("extracting");

    // Request extraction from sandbox
    console.log("[Replay] Sending extract message to sandbox");
    parent.postMessage({ pluginMessage: { type: "extract" } }, "*");
  };
  console.log("[Replay] Connect button handler registered");
} catch (e) {
  console.error("[Replay] Failed to register connect handler:", e);
}

// ============================================
// Screen 2: Extraction progress
// ============================================
var progressSteps: Record<string, number> = {
  "Extracting colors...": 20,
  "Extracting typography...": 40,
  "Extracting shadows & effects...": 55,
  "Extracting spacing & radii...": 70,
  "Extracting components...": 85,
};

// ============================================
// Listen for messages from sandbox
// ============================================
window.onmessage = function (event: MessageEvent) {
  try {
    var pluginMessage = event.data.pluginMessage;
    if (!pluginMessage) return;

    var msg = pluginMessage as SandboxMessage;
    console.log("[Replay] Received message:", msg.type);

    if (msg.type === "extracting") {
      $("extract-status").textContent = msg.status;
      var progress = progressSteps[msg.status] || 50;
      $("progress-fill").style.width = progress + "%";
    }

    if (msg.type === "extraction-complete") {
      extractionData = msg.data;
      console.log("[Replay] Extraction complete:", {
        colors: extractionData.colors.length,
        typography: extractionData.typography.length,
        shadows: extractionData.shadows.length,
        spacing: extractionData.spacing.length,
        borderRadius: extractionData.borderRadius.length,
        components: extractionData.components.length,
      });

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
      var swatchContainer = $("color-swatches");
      swatchContainer.innerHTML = "";
      var colorsToShow = extractionData.colors.slice(0, 30);
      for (var i = 0; i < colorsToShow.length; i++) {
        var c = colorsToShow[i];
        var swatch = document.createElement("div");
        swatch.className = "color-swatch";
        swatch.style.backgroundColor = c.hex;
        swatch.title = c.name + ": " + c.hex;
        swatchContainer.appendChild(swatch);
      }

      showScreen("preview");
    }

    if (msg.type === "extraction-error") {
      console.error("[Replay] Extraction error:", msg.error);
      $("extract-status").textContent = "Error: " + msg.error;
      $("progress-fill").style.width = "0%";
      $("progress-fill").style.background = "#ef4444";
    }
  } catch (e) {
    console.error("[Replay] Error in message handler:", e);
  }
};

// ============================================
// Screen 3: Preview — Re-extract
// ============================================
try {
  $("btn-re-extract").onclick = function () {
    showScreen("extracting");
    $("progress-fill").style.width = "10%";
    $("progress-fill").style.background = "linear-gradient(90deg, #FF6E3C, #FF8F5C)";
    parent.postMessage({ pluginMessage: { type: "extract" } }, "*");
  };
} catch (e) {
  console.error("[Replay] Failed to register re-extract handler:", e);
}

// ============================================
// Screen 3: Preview — Send to Replay
// ============================================
try {
  $("btn-send").onclick = async function () {
    if (!replayTokens) return;

    var name = getDsName() || (extractionData ? extractionData.fileName : null) || "Figma Design System";
    var apiKey = getApiKey();
    var apiUrl = getApiUrl();

    if (!apiKey) {
      $("preview-error").style.display = "block";
      $("preview-error").textContent = "API key is missing. Go back and enter it.";
      return;
    }

    $("preview-error").style.display = "none";
    showScreen("sending");

    try {
      console.log("[Replay] Sending to:", apiUrl + "/api/design-systems/import/figma");
      var response = await fetch(apiUrl + "/api/design-systems/import/figma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey,
        },
        body: JSON.stringify({
          name: name,
          tokens: replayTokens,
          components: replayComponents,
          source_url: "figma://file/" + (extractionData ? extractionData.fileName : "unknown"),
        }),
      });

      var data = await response.json();
      console.log("[Replay] Server response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "HTTP " + response.status);
      }

      // Show success
      $("success-details").textContent = '"' + data.designSystem.name + '" with ' + data.designSystem.component_count + " components is ready!";

      $("success-stats").innerHTML =
        '<div class="success-stat"><div class="stat-value">' +
        Object.keys(replayTokens.colors).length +
        '</div><div class="stat-label">Colors synced</div></div>' +
        '<div class="success-stat"><div class="stat-value">' +
        data.components +
        '</div><div class="stat-label">Components synced</div></div>';

      showScreen("success");
    } catch (error: any) {
      console.error("[Replay] Sync error:", error);
      $("send-status").textContent = "Error: " + error.message;
      $("send-progress").style.background = "#ef4444";

      // Go back to preview after 3s
      setTimeout(function () {
        $("preview-error").style.display = "block";
        $("preview-error").textContent = "Sync failed: " + error.message;
        showScreen("preview");
      }, 3000);
    }
  };
} catch (e) {
  console.error("[Replay] Failed to register send handler:", e);
}

// ============================================
// Screen 5: Success
// ============================================
try {
  $("btn-open-replay").onclick = function () {
    window.open(getApiUrl() + "/settings/design-systems", "_blank");
  };

  $("btn-done").onclick = function () {
    parent.postMessage({ pluginMessage: { type: "close" } }, "*");
  };
} catch (e) {
  console.error("[Replay] Failed to register success handlers:", e);
}

console.log("[Replay] Plugin UI ready!");
