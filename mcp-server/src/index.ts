#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { generateSchema, handleGenerate } from "./tools/generate.js";
import { scanSchema, handleScan } from "./tools/scan.js";
import { validateSchema, handleValidate } from "./tools/validate.js";

const server = new McpServer({
  name: "replay",
  version: "1.0.0",
});

// Tool: replay_generate — Video → React code
server.tool(
  "replay_generate",
  "Generate production-ready React + Tailwind code from a video recording of any UI. " +
    "Upload any screen recording and get complete HTML with GSAP animations and Alpine.js interactivity. " +
    "Costs 150 credits per call.",
  generateSchema.shape,
  async (args) => handleGenerate(args as any)
);

// Tool: replay_scan — Video → Structured UI data
server.tool(
  "replay_scan",
  "Analyze a video recording to extract UI structure: pages, navigation, colors, typography, and components. " +
    "Returns structured JSON without code generation. Costs 50 credits per call.",
  scanSchema.shape,
  async (args) => handleScan(args as any)
);

// Tool: replay_validate — Code + Design System → Validation
server.tool(
  "replay_validate",
  "Validate HTML/React code against a Replay Design System. " +
    "Returns errors for colors, fonts, and spacing that don't match design system tokens. Costs 5 credits per call.",
  validateSchema.shape,
  async (args) => handleValidate(args as any)
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Replay MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
