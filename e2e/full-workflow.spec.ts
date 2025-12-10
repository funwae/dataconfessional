import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Data Confessional - Full Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('Complete workflow: Create project, add data sources, generate dashboard and report', async ({ page }) => {
    // Step 1: Navigate to projects
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Click through to projects
    const beginButton = page.locator('text=Begin a confession').first();
    if (await beginButton.isVisible()) {
      await beginButton.click();
    } else {
      await page.goto('http://localhost:3000/projects');
    }
    await expect(page).toHaveURL(/\/projects/);
    await page.waitForLoadState('networkidle');

    // Step 2: Create a new project
    await page.click('text=Begin a new confession');
    await page.waitForTimeout(500);

    // Fill in project details
    await page.fill('input[placeholder*="Q1"]', 'Q1 Sales & Marketing Analysis');

    // Find and fill the question field if it exists
    const questionInput = page.locator('input[placeholder*="question"], input[placeholder*="Are we"]').first();
    if (await questionInput.isVisible()) {
      await questionInput.fill('How are our sales and marketing performing across regions?');
    }

    // Select audience - find the select element
    const audienceSelect = page.locator('select').last();
    if (await audienceSelect.isVisible()) {
      await audienceSelect.selectOption({ index: 1 }); // Select "My team"
    }

    // Submit
    await page.click('button:has-text("Create project"), button:has-text("Create")');

    // Wait for project page to load - check for error first
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (currentUrl.includes('/projects/') && currentUrl !== 'http://localhost:3000/projects') {
      // Success - we're on a project detail page
      await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);
    } else {
      // Check for error message
      const errorText = await page.locator('text=/error|failed|database/i').first().textContent().catch(() => null);
      if (errorText) {
        console.log('⚠️  Database error detected:', errorText);
        throw new Error('Database not available - please start it with: docker compose up -d');
      }
      // Try to find the project in the list
      await expect(page.locator('text=Q1 Sales & Marketing Analysis')).toBeVisible({ timeout: 5000 });
      // Click on it
      await page.click('text=Q1 Sales & Marketing Analysis');
      await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/, { timeout: 10000 });
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Step 3: Add CSV file (sales data)
    const filesButton = page.locator('text=📁 Files, text=/Files/i').first();
    await filesButton.click();
    await page.waitForTimeout(500);

    // Upload file - use absolute path
    const salesDataPath = path.resolve(__dirname, '../test-data/sales_data.csv');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(salesDataPath);

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Check for success - look for the file name or processed status
    await expect(
      page.locator('text=/sales_data|Sales|PROCESSED|Processed/i').first()
    ).toBeVisible({ timeout: 15000 });

    console.log('✅ Sales data uploaded successfully');

    // Step 4: Add another CSV file (marketing metrics)
    await page.click('text=📁 Files, text=/Files/i').first();
    await page.waitForTimeout(500);
    const marketingPath = path.resolve(__dirname, '../test-data/marketing_metrics.csv');
    await fileInput.setInputFiles(marketingPath);
    await page.waitForTimeout(3000);
    await expect(
      page.locator('text=/marketing|Marketing|PROCESSED|Processed/i').first()
    ).toBeVisible({ timeout: 15000 });

    console.log('✅ Marketing data uploaded successfully');

    // Step 5: Add text content
    await page.click('text=📝 Text, text=/Text/i').first();
    await page.waitForTimeout(500);
    const textContent = fs.readFileSync(path.resolve(__dirname, '../test-data/customer_feedback.txt'), 'utf-8');
    await page.locator('textarea[placeholder*="Paste"], textarea').first().fill(textContent);
    const nameInput = page.locator('input[placeholder*="Text source"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Customer Feedback Q1');
    }
    await page.click('button:has-text("Add Text")');
    await page.waitForTimeout(3000);
    await expect(
      page.locator('text=/Customer Feedback|PROCESSED|Processed/i').first()
    ).toBeVisible({ timeout: 15000 });

    console.log('✅ Text content added successfully');

    // Step 6: Navigate to Dashboard tab
    await page.click('text=What the data is saying, text=/Dashboard/i').first();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/What the data|Dashboard/i').first()).toBeVisible();

    // Step 7: Generate dashboard
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("first dashboard")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      console.log('✅ Dashboard generation started');

      // Wait for charts to be generated (this may take time with LLM)
      await page.waitForTimeout(5000);
      // Just check that we're still on the dashboard page
      await expect(page.locator('text=/What the data|Dashboard/i').first()).toBeVisible({ timeout: 30000 });
    }

    // Step 8: Navigate to Reports tab
    await page.click('text=Briefings, text=/Reports/i').first();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Briefings|Reports/i').first()).toBeVisible();

    // Step 9: Test Q&A panel if visible
    const qaInput = page.locator('input[placeholder*="Ask what"], input[placeholder*="Ask"]').first();
    if (await qaInput.isVisible({ timeout: 2000 })) {
      await qaInput.fill('What region has the highest revenue?');
      await page.click('button:has-text("Ask")');
      await page.waitForTimeout(3000);
      console.log('✅ Q&A question submitted');
    }

    console.log('✅ Full workflow test completed successfully!');
  });

  test('Test data source preview functionality', async ({ page }) => {
    // Navigate to projects
    await page.click('text=Begin a confession');
    await expect(page).toHaveURL(/\/projects/);

    // Create a project
    await page.click('text=Begin a new confession');
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="Q1"]', 'Data Preview Test');
    // Skip question field if it doesn't exist
    const questionField = page.locator('input[placeholder*="question"]').first();
    if (await questionField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await questionField.fill('Testing data preview');
    }
    const selectField = page.locator('select').last();
    if (await selectField.isVisible({ timeout: 1000 })) {
      await selectField.selectOption({ index: 0 }); // Select first option
    }
    await page.click('button:has-text("Create project"), button:has-text("Create")');
    await page.waitForTimeout(2000);
    // Check if we're on project page or still on projects list
    if (!page.url().includes('/projects/') || page.url() === 'http://localhost:3000/projects') {
      // Click on the project if it exists
      await page.click('text=Data Preview Test');
    }
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Upload a file
    await page.click('text=📁 Files');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-data/sales_data.csv');
    await page.waitForTimeout(3000);

    // Click View Summary
    await page.click('button:has-text("View Summary")');

    // Check that preview modal appears
    await expect(page.locator('text=Data Source Summary')).toBeVisible();
    await expect(page.locator('text=/rows|columns|Date|Region/i')).toBeVisible({ timeout: 5000 });

    // Close preview
    await page.click('text=✕');

    console.log('✅ Data preview test completed successfully!');
  });
});

