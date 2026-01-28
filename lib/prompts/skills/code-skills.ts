// ============================================================================
// REPLAY.BUILD - CODE QUALITY SKILLS (from skills.sh ecosystem)
// Sources: typescript-advanced-types, api-design-principles, e2e-testing-patterns (wshobson/agents)
// ============================================================================

/**
 * TypeScript Advanced Types Skill
 * Based on: wshobson/agents
 */
export const TYPESCRIPT_ADVANCED_TYPES_SKILL = `
## TypeScript Best Practices

### Type Safety Patterns

**Prefer Interfaces for Object Types:**
\`\`\`typescript
// Good - extendable, clearer error messages
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions, intersections, mapped types
type Status = 'pending' | 'active' | 'completed';
type UserWithStatus = User & { status: Status };
\`\`\`

**Utility Types:**
\`\`\`typescript
// Pick specific properties
type UserSummary = Pick<User, 'id' | 'name'>;

// Omit properties
type CreateUserInput = Omit<User, 'id' | 'createdAt'>;

// Partial for updates
type UpdateUserInput = Partial<CreateUserInput>;

// Required for strict checks
type RequiredUser = Required<User>;

// Readonly for immutability
type ImmutableUser = Readonly<User>;
\`\`\`

**Discriminated Unions:**
\`\`\`typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    // TypeScript knows result.data exists
    console.log(result.data);
  } else {
    // TypeScript knows result.error exists
    console.error(result.error);
  }
}
\`\`\`

**Generic Constraints:**
\`\`\`typescript
// Ensure type has required properties
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// With default type
function createList<T = string>(items: T[]): T[] {
  return [...items];
}
\`\`\`

### Avoid These Patterns
- \`any\` without explicit justification comment
- Type assertions (\`as\`) when narrowing is possible
- \`!\` non-null assertion without runtime check
- Implicit \`any\` from missing types
`;

/**
 * API Design Principles Skill
 * Based on: wshobson/agents
 */
export const API_DESIGN_PRINCIPLES_SKILL = `
## API Design Best Practices

### RESTful Conventions

**Resource Naming:**
\`\`\`
GET    /api/projects          # List all
GET    /api/projects/:id      # Get single
POST   /api/projects          # Create
PATCH  /api/projects/:id      # Update partial
PUT    /api/projects/:id      # Replace
DELETE /api/projects/:id      # Delete
\`\`\`

**Nested Resources:**
\`\`\`
GET /api/projects/:projectId/files
POST /api/projects/:projectId/files
\`\`\`

### Response Format

**Success Response:**
\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "totalPages": 10,
    "totalCount": 100
  }
}
\`\`\`

**Error Response:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
\`\`\`

### HTTP Status Codes
- 200 OK - Successful GET, PUT, PATCH
- 201 Created - Successful POST
- 204 No Content - Successful DELETE
- 400 Bad Request - Validation error
- 401 Unauthorized - Missing auth
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource doesn't exist
- 429 Too Many Requests - Rate limited
- 500 Internal Server Error - Server failure

### Pagination Pattern
\`\`\`typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
\`\`\`

### Rate Limiting Headers
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
\`\`\`
`;

/**
 * E2E Testing Patterns Skill
 * Based on: wshobson/agents
 */
export const E2E_TESTING_PATTERNS_SKILL = `
## E2E Testing Best Practices

### Test Structure (Playwright)

\`\`\`typescript
import { test, expect } from '@playwright/test';

test.describe('Feature: User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    // Arrange
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    
    // Act
    await page.click('[data-testid="submit"]');
    
    // Assert
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'wrong@example.com');
    await page.fill('[data-testid="password"]', 'wrongpass');
    await page.click('[data-testid="submit"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );
  });
});
\`\`\`

### Page Object Pattern
\`\`\`typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="submit"]');
  }

  async getErrorMessage() {
    return this.page.locator('[data-testid="error-message"]').textContent();
  }
}

// In test
const loginPage = new LoginPage(page);
await loginPage.login('user@example.com', 'password');
\`\`\`

### Test Data Management
\`\`\`typescript
// fixtures/users.ts
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
  },
  regularUser: {
    email: 'user@test.com',
    password: 'user123',
    role: 'user',
  },
};
\`\`\`

### Selectors Best Practices
- Prefer \`data-testid\` attributes
- Avoid CSS classes (can change with styling)
- Avoid XPath (brittle)
- Use role-based selectors for accessibility testing
`;

/**
 * Error Handling Patterns Skill
 * Based on: wshobson/agents
 */
export const ERROR_HANDLING_PATTERNS_SKILL = `
## Error Handling Best Practices

### Custom Error Classes
\`\`\`typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string, public fields: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(\`\${resource} not found\`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
\`\`\`

### Try-Catch Pattern
\`\`\`typescript
async function fetchData<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return { 
        success: false, 
        error: \`HTTP \${response.status}: \${response.statusText}\` 
      };
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
\`\`\`

### Global Error Handler (Next.js)
\`\`\`typescript
// app/error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
\`\`\`

### Async Error Boundaries
\`\`\`typescript
// For React Server Components
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default function Page() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<Loading />}>
        <AsyncComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
\`\`\`
`;

/**
 * Combined Code Quality Skills for Gemini prompts
 */
export const COMBINED_CODE_SKILLS = `
═══════════════════════════════════════════════════════════════════════════════
💻 CODE QUALITY SKILLS (from skills.sh ecosystem)
═══════════════════════════════════════════════════════════════════════════════

${TYPESCRIPT_ADVANCED_TYPES_SKILL}

${API_DESIGN_PRINCIPLES_SKILL}

${E2E_TESTING_PATTERNS_SKILL}

${ERROR_HANDLING_PATTERNS_SKILL}
`;

export default COMBINED_CODE_SKILLS;
