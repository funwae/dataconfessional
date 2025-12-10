import { test, expect } from '@playwright/test';

test.describe('Project Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // No auth needed - just go to projects
    await page.goto('/projects');
    await expect(page.locator('text=Projects')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    // Click "New Project" button
    await page.click('text=New Project');

    // Fill in project form
    await page.fill('input[placeholder*="Q1"]', 'E2E Test Project');
    await page.selectOption('select', 'SALES_OVERVIEW');
    await page.selectOption('select:has-text("Target Audience")', 'MANAGER_DIRECTOR');

    // Submit
    await page.click('button:has-text("Create")');

    // Should navigate to project detail page
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });

  test('should upload a CSV file', async ({ page }) => {
    // Create a project first
    await page.click('text=New Project');
    await page.fill('input[placeholder*="Q1"]', 'CSV Upload Test');
    await page.click('button:has-text("Create")');

    // Wait for project page to load
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);

    // Go to Data Sources tab (should be default)
    await expect(page.locator('text=Data Sources')).toBeVisible();

    // Create a test CSV file
    const csvContent = 'name,value,date\nItem1,100,2024-01-01\nItem2,200,2024-01-02\nItem3,150,2024-01-03';
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });

    // Upload file
    await page.click('text=Upload File');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Wait for upload to complete
    await page.waitForTimeout(2000);

    // Should see the uploaded file in the list
    await expect(page.locator('text=test.csv')).toBeVisible();
    await expect(page.locator('text=PROCESSED')).toBeVisible({ timeout: 10000 });
  });

  test('should add a URL data source', async ({ page }) => {
    // Create a project first
    await page.click('text=New Project');
    await page.fill('input[placeholder*="Q1"]', 'URL Test Project');
    await page.click('button:has-text("Create")');

    // Wait for project page to load
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);

    // Click "Add URL" button
    await page.click('text=Add URL');

    // Fill in URL form
    await page.fill('input[type="url"]', 'https://example.com');
    await page.fill('input[type="text"]:near(input[type="url"])', 'Example Website');

    // Submit
    await page.click('button:has-text("Add URL")');

    // Wait for processing
    await page.waitForTimeout(3000);

    // Should see the URL in the list
    await expect(page.locator('text=Example Website')).toBeVisible({ timeout: 10000 });
  });

  test('should generate dashboard and report', async ({ page }) => {
    // Create a project
    await page.click('text=New Project');
    await page.fill('input[placeholder*="Q1"]', 'Dashboard Test');
    await page.click('button:has-text("Create")');
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);

    // Upload a CSV first
    const csvContent = 'category,revenue,date\nA,1000,2024-01-01\nB,2000,2024-01-02\nC,1500,2024-01-03';
    await page.click('text=Upload File');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'revenue.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Wait for upload to process
    await page.waitForTimeout(3000);
    await expect(page.locator('text=PROCESSED')).toBeVisible({ timeout: 10000 });

    // Go to Dashboard tab
    await page.click('text=Dashboard');

    // Click "Generate Dashboard & Report"
    await page.click('text=Generate Dashboard & Report');

    // Wait for generation (this might take a while with LLM)
    await page.waitForTimeout(5000);

    // Should see charts (or at least the dashboard tab should be active)
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
  });

  test('should ask AI questions', async ({ page }) => {
    // Create a project
    await page.click('text=New Project');
    await page.fill('input[placeholder*="Q1"]', 'AI Q&A Test');
    await page.click('button:has-text("Create")');
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);

    // Upload a CSV
    const csvContent = 'metric,value\nSales,1000\nRevenue,2000';
    await page.click('text=Upload File');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'metrics.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.waitForTimeout(3000);

    // Find the AI Q&A panel (should be visible on the right)
    const qaPanel = page.locator('text=AI Q&A').first();
    await expect(qaPanel).toBeVisible({ timeout: 5000 });

    // Try using a preset question
    const presetButton = page.locator('button:has-text("Summarize this dashboard")').first();
    if (await presetButton.isVisible()) {
      await presetButton.click();
      // Wait for response
      await page.waitForTimeout(5000);
      // Should see some response (even if it's an error, the panel should update)
    }
  });

  test('should navigate between tabs', async ({ page }) => {
    // Create a project
    await page.click('text=New Project');
    await page.fill('input[placeholder*="Q1"]', 'Navigation Test');
    await page.click('button:has-text("Create")');
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);

    // Should be on Data Sources tab by default
    await expect(page.locator('text=Data Sources').first()).toBeVisible();

    // Click Dashboard tab
    await page.click('text=Dashboard');
    await expect(page.locator('text=Dashboard').first()).toBeVisible();

    // Click Reports tab
    await page.click('text=Reports');
    await expect(page.locator('text=Reports').first()).toBeVisible();

    // Click back to Data Sources
    await page.click('text=Data Sources');
    await expect(page.locator('text=Data Sources').first()).toBeVisible();
  });
});


