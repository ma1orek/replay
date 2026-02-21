// Inline the UI bundle JS into a single HTML file for Figma plugin
const fs = require("fs");
const path = require("path");

const bundlePath = path.join(__dirname, "..", "dist", "ui-bundle.js");
const htmlTemplatePath = path.join(__dirname, "..", "ui", "index.html");
const outputPath = path.join(__dirname, "..", "dist", "ui.html");

const bundle = fs.readFileSync(bundlePath, "utf-8");
const template = fs.readFileSync(htmlTemplatePath, "utf-8");

// Replace the script placeholder with inlined bundle
const output = template.replace("<!-- BUNDLE_PLACEHOLDER -->", `<script>${bundle}</script>`);

fs.writeFileSync(outputPath, output);
console.log("Built dist/ui.html with inlined bundle");
