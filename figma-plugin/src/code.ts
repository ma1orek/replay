/// <reference types="@figma/plugin-typings" />

import { extractColors } from "./extractors/colors";
import { extractTypography } from "./extractors/typography";
import { extractEffects } from "./extractors/effects";
import { extractSpacing } from "./extractors/spacing";
import { extractComponents } from "./extractors/components";
import type { UIMessage, ExtractionResult } from "./types";

// Show plugin UI
figma.showUI(__html__, { width: 440, height: 580, themeColors: true });

// Handle messages from UI iframe
figma.ui.onmessage = async (msg: UIMessage) => {
  if (msg.type === "extract") {
    try {
      // Step 1: Colors
      figma.ui.postMessage({ type: "extracting", status: "Extracting colors..." });
      const colors = extractColors();

      // Step 2: Typography
      figma.ui.postMessage({ type: "extracting", status: "Extracting typography..." });
      const typography = extractTypography();

      // Step 3: Effects (shadows)
      figma.ui.postMessage({ type: "extracting", status: "Extracting shadows & effects..." });
      const shadows = extractEffects();

      // Step 4: Spacing & border radius
      figma.ui.postMessage({ type: "extracting", status: "Extracting spacing & radii..." });
      const { spacing, borderRadius } = extractSpacing();

      // Step 5: Components
      figma.ui.postMessage({ type: "extracting", status: "Extracting components..." });
      const components = extractComponents();

      // Send complete result to UI
      const result: ExtractionResult = {
        fileName: figma.root.name,
        colors,
        typography,
        shadows,
        spacing,
        borderRadius,
        components,
      };

      figma.ui.postMessage({ type: "extraction-complete", data: result });
    } catch (error: any) {
      figma.ui.postMessage({
        type: "extraction-error",
        error: error.message || "Failed to extract design system",
      });
    }
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
