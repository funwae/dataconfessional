# Testing Guide

## E2E Testing Setup

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up database and create test user:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

### Test User

The seed script creates a test user:
- **Email:** test@example.com
- **Password:** testpassword123

This user is used by all e2e tests.

### Running Tests

#### Run all e2e tests:
```bash
npm run test:e2e
```

#### Run with UI (interactive):
```bash
npm run test:e2e:ui
```

#### Run specific test file:
```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/project-flow.spec.ts
```

#### Run in headed mode (see browser):
```bash
npx playwright test --headed
```

#### Run specific test:
```bash
npx playwright test -g "should login with existing user"
```

### Test Coverage

#### Authentication Tests (`e2e/auth.spec.ts`)
- ✅ User registration
- ✅ User login with valid credentials
- ✅ Error handling for invalid credentials

#### Project Flow Tests (`e2e/project-flow.spec.ts`)
- ✅ Create new project
- ✅ Upload CSV file
- ✅ Add URL data source
- ✅ Generate dashboard and report
- ✅ AI Q&A functionality
- ✅ Tab navigation

### Test Structure

Tests are organized by feature:
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/project-flow.spec.ts` - Complete project workflow

### Writing New Tests

1. Create a new test file in `e2e/` directory
2. Import test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Use the test user credentials:
   ```typescript
   const TEST_USER = {
     email: 'test@example.com',
     password: 'testpassword123',
   };
   ```
4. Run tests with `npm run test:e2e`

### Notes

- Tests automatically start the dev server
- Tests use the seeded test user
- Some tests require LLM API access (set `OPENAI_API_KEY` in `.env`)
- File uploads use in-memory data for testing
- Tests wait for async operations (file processing, LLM calls)

### Troubleshooting

**Tests fail with "User already exists":**
- The seed script checks for existing users, this is normal
- Run `npm run db:seed` again - it will skip if user exists

**Tests timeout:**
- LLM API calls can be slow
- Increase timeout in test: `test.setTimeout(60000)`
- Check that `OPENAI_API_KEY` is set correctly

**Port already in use:**
- Make sure no other dev server is running
- Or set a different port in `playwright.config.ts`


