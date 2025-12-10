# E2E Tests

This directory contains end-to-end tests using Playwright.

## Test User

The tests use a seeded test user:
- **Email:** test@example.com
- **Password:** testpassword123

Create this user by running:
```bash
npm run db:seed
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests with UI
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

## Test Files

- `auth.spec.ts` - Authentication tests (login, register, error handling)
- `project-flow.spec.ts` - Full project workflow (create project, upload data, generate dashboard, AI Q&A)

## Test Scenarios

1. **Authentication**
   - User registration
   - User login
   - Invalid credentials handling

2. **Project Flow**
   - Create new project
   - Upload CSV file
   - Add URL data source
   - Generate dashboard and report
   - Ask AI questions
   - Navigate between tabs

## Notes

- Tests automatically start the dev server before running
- Tests use the test user created by the seed script
- Some tests may require LLM API access (dashboard generation, AI Q&A)
- File uploads are tested with in-memory CSV data


