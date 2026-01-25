import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL_NAME = "gemini-3-flash-preview"; // Flash to save API quota

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// E2E TEST GENERATOR
// Purpose: Generate Playwright/Cypress tests from user journey analysis
// Value: QA team gets ready-to-run test suites that verify 1:1 behavior
// ═══════════════════════════════════════════════════════════════════════════════

const E2E_TESTS_PROMPT = `You are a Senior QA Automation Engineer generating E2E test suites from UI behavior analysis.

**YOUR MISSION:** Generate production-ready Playwright and Cypress tests that verify the reconstructed UI behaves identically to the legacy system.

From the behavior scan, you can generate tests for:
- Navigation flows (clicking menu items)
- Form submissions (validation, success/error states)
- Data display (tables, charts showing correct data)
- Loading states (spinners, skeletons)
- User interactions (hover effects, modals, dropdowns)

**OUTPUT JSON:**
{
  "meta": {
    "generatedAt": "ISO date",
    "framework": "playwright",
    "totalTests": 15,
    "coverage": {
      "navigation": 5,
      "forms": 3,
      "dataDisplay": 4,
      "interactions": 3
    }
  },
  
  "playwright": {
    "config": "// playwright.config.ts\\nimport { defineConfig } from '@playwright/test';\\n\\nexport default defineConfig({\\n  testDir: './tests',\\n  use: {\\n    baseURL: 'http://localhost:3000',\\n    screenshot: 'only-on-failure',\\n  },\\n});",
    "tests": [
      {
        "name": "User can navigate to Payments page",
        "file": "navigation.spec.ts",
        "category": "navigation",
        "sourceEvidence": "Video timestamp 00:05 - user clicks Payments in sidebar",
        "code": "import { test, expect } from '@playwright/test';\\n\\ntest('navigate to payments', async ({ page }) => {\\n  await page.goto('/');\\n  \\n  // Click on Payments in sidebar\\n  await page.click('[data-testid=\"nav-payments\"]');\\n  \\n  // Verify navigation\\n  await expect(page).toHaveURL('/payments');\\n  await expect(page.locator('h1')).toContainText('Payments');\\n});"
      },
      {
        "name": "Sidebar shows correct menu items",
        "file": "navigation.spec.ts",
        "category": "navigation",
        "sourceEvidence": "Scan data shows 8 menu items in sidebar",
        "code": "test('sidebar has all menu items', async ({ page }) => {\\n  await page.goto('/');\\n  \\n  const menuItems = page.locator('[data-testid=\"sidebar\"] nav a');\\n  await expect(menuItems).toHaveCount(8);\\n  \\n  // Verify specific items\\n  await expect(page.locator('text=Dashboard')).toBeVisible();\\n  await expect(page.locator('text=Payments')).toBeVisible();\\n});"
      },
      {
        "name": "Form validation shows error for empty required fields",
        "file": "forms.spec.ts",
        "category": "forms",
        "sourceEvidence": "Video timestamp 00:25 - error shown on submit",
        "code": "test('form validates required fields', async ({ page }) => {\\n  await page.goto('/create');\\n  \\n  // Submit empty form\\n  await page.click('button[type=\"submit\"]');\\n  \\n  // Verify error message\\n  await expect(page.locator('.error-message')).toBeVisible();\\n  await expect(page.locator('.error-message')).toContainText('required');\\n});"
      },
      {
        "name": "Table displays correct data",
        "file": "data-display.spec.ts",
        "category": "dataDisplay",
        "sourceEvidence": "Scan data shows table with 10 rows",
        "code": "test('table shows data rows', async ({ page }) => {\\n  await page.goto('/');\\n  \\n  // Wait for table to load\\n  await page.waitForSelector('table tbody tr');\\n  \\n  // Verify row count\\n  const rows = page.locator('table tbody tr');\\n  await expect(rows).toHaveCount(10);\\n});"
      },
      {
        "name": "Chart renders with correct type",
        "file": "data-display.spec.ts",
        "category": "dataDisplay",
        "sourceEvidence": "Scan data shows area chart",
        "code": "test('chart renders correctly', async ({ page }) => {\\n  await page.goto('/');\\n  \\n  // Verify Recharts rendered\\n  await expect(page.locator('.recharts-wrapper')).toBeVisible();\\n  await expect(page.locator('.recharts-area')).toBeVisible();\\n});"
      },
      {
        "name": "Loading state shows skeleton",
        "file": "states.spec.ts",
        "category": "interactions",
        "sourceEvidence": "Behavior scan shows skeleton during load",
        "code": "test('shows loading skeleton', async ({ page }) => {\\n  // Intercept API to delay response\\n  await page.route('**/api/**', route => {\\n    setTimeout(() => route.continue(), 1000);\\n  });\\n  \\n  await page.goto('/');\\n  \\n  // Verify skeleton is shown\\n  await expect(page.locator('[data-testid=\"skeleton\"]')).toBeVisible();\\n});"
      }
    ]
  },
  
  "cypress": {
    "config": "// cypress.config.ts\\nimport { defineConfig } from 'cypress';\\n\\nexport default defineConfig({\\n  e2e: {\\n    baseUrl: 'http://localhost:3000',\\n    supportFile: false,\\n  },\\n});",
    "tests": [
      {
        "name": "User can navigate to Payments page",
        "file": "navigation.cy.ts",
        "category": "navigation",
        "code": "describe('Navigation', () => {\\n  it('navigates to payments', () => {\\n    cy.visit('/');\\n    cy.get('[data-testid=\"nav-payments\"]').click();\\n    cy.url().should('include', '/payments');\\n    cy.get('h1').should('contain', 'Payments');\\n  });\\n});"
      },
      {
        "name": "Form validation shows error",
        "file": "forms.cy.ts",
        "category": "forms",
        "code": "describe('Form Validation', () => {\\n  it('shows error for empty required fields', () => {\\n    cy.visit('/create');\\n    cy.get('button[type=\"submit\"]').click();\\n    cy.get('.error-message').should('be.visible');\\n  });\\n});"
      }
    ]
  },
  
  "testIds": {
    "recommended": [
      { "element": "Sidebar navigation", "testId": "data-testid=\"sidebar\"" },
      { "element": "Nav items", "testId": "data-testid=\"nav-{name}\"" },
      { "element": "Data table", "testId": "data-testid=\"data-table\"" },
      { "element": "Chart container", "testId": "data-testid=\"chart-{id}\"" },
      { "element": "Form submit", "testId": "data-testid=\"submit-btn\"" },
      { "element": "Loading skeleton", "testId": "data-testid=\"skeleton\"" }
    ],
    "note": "Add these data-testid attributes to the generated code for reliable test selectors"
  },
  
  "summary": {
    "totalTests": 15,
    "playwrightTests": 10,
    "cypressTests": 5,
    "coverageAreas": ["navigation", "forms", "dataDisplay", "interactions"],
    "estimatedRunTime": "45 seconds",
    "recommendation": "Run with CI/CD on every deployment"
  }
}

**TEST GENERATION RULES:**
1. Each user journey step → one or more test cases
2. Each form → validation tests (required, format, submit)
3. Each table → data display, pagination, filter tests
4. Each navigation → URL change, content verification
5. Loading states → skeleton/spinner visibility tests

Generate REAL tests based on the actual behavior scan:`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { scanData, projectName, generatedCode } = body;

    if (!scanData && !generatedCode) {
      return NextResponse.json({ error: "Scan data or generated code required" }, { status: 400 });
    }

    console.log("[E2E-Tests] Generating test suite...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 16384,
      },
    });

    const context = `
PROJECT: ${projectName || "Legacy Application"}

**SCAN DATA (UI Structure & Behavior):**
${scanData ? JSON.stringify(scanData, null, 2) : "Not provided"}

**GENERATED CODE (for selector hints):**
${generatedCode ? generatedCode.substring(0, 8000) : "Not provided"}

Generate comprehensive E2E test suites based on the detected UI structure and behavior:`;

    const result = await model.generateContent([
      { text: E2E_TESTS_PROMPT },
      { text: context }
    ]);

    const responseText = result.response.text();
    
    // Extract JSON
    let tests: any;
    try {
      tests = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        tests = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          tests = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[E2E-Tests] Generated in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: tests,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[E2E-Tests] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate E2E tests" },
      { status: 500 }
    );
  }
}
