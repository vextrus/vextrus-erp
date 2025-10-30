import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('File Upload Flow - Complete Storage System', () => {
  let page: Page;
  const testFiles = {
    document: path.join(__dirname, '../fixtures/test-document.pdf'),
    image: path.join(__dirname, '../fixtures/test-image.jpg'),
    spreadsheet: path.join(__dirname, '../fixtures/test-data.xlsx'),
    largeFile: path.join(__dirname, '../fixtures/large-file-100mb.zip'),
  };

  test.beforeAll(async () => {
    // Create test files if they don't exist
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create dummy test files
    if (!fs.existsSync(testFiles.document)) {
      fs.writeFileSync(testFiles.document, Buffer.from('PDF content'));
    }
    if (!fs.existsSync(testFiles.image)) {
      fs.writeFileSync(testFiles.image, Buffer.from('JPEG content'));
    }
    if (!fs.existsSync(testFiles.spreadsheet)) {
      fs.writeFileSync(testFiles.spreadsheet, Buffer.from('Excel content'));
    }
  });

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@test.bd');
    await page.fill('[data-testid="password-input"]', 'Test123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Complete file upload → processing → storage → retrieval flow', async () => {
    // Step 1: Navigate to file upload
    await page.goto('/files/upload');
    
    // Step 2: Upload document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles.document);
    
    // Set metadata
    await page.fill('[data-testid="file-title"]', 'Project Contract');
    await page.selectOption('[data-testid="file-category"]', 'Legal Documents');
    await page.fill('[data-testid="file-tags"]', 'contract, dhaka-metro, 2025');
    await page.selectOption('[data-testid="file-project"]', 'Dhaka Metro Rail');
    
    // Set permissions
    await page.click('[data-testid="file-permissions-tab"]');
    await page.check('[data-testid="role-project-manager"]');
    await page.check('[data-testid="role-site-engineer"]');
    await page.uncheck('[data-testid="role-viewer"]');
    
    // Upload
    await page.click('[data-testid="upload-button"]');
    
    // Step 3: Monitor upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-progress"]')).toHaveAttribute('value', '100', { timeout: 10000 });
    
    // Step 4: Verify processing
    await expect(page.locator('[data-testid="processing-status"]')).toContainText('Processing');
    await expect(page.locator('[data-testid="processing-status"]')).toContainText('Complete', { timeout: 5000 });
    
    // Get file ID from response
    const fileId = await page.locator('[data-testid="file-id"]').textContent();
    
    // Step 5: Verify storage in MinIO
    await page.goto(`/files/${fileId}`);
    await expect(page.locator('[data-testid="file-storage-info"]')).toContainText('MinIO');
    await expect(page.locator('[data-testid="file-bucket"]')).toContainText('vextrus-documents');
    
    // Step 6: Test file retrieval
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeEnabled();
    
    // Start download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toBe('Project Contract.pdf');
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Step 7: Test presigned URL generation
    await page.click('[data-testid="share-button"]');
    await page.selectOption('[data-testid="share-duration"]', '24h');
    await page.click('[data-testid="generate-link-button"]');
    
    const shareLink = await page.locator('[data-testid="share-link"]').inputValue();
    expect(shareLink).toMatch(/^https?:\/\/.+\/.*\?.*signature=/);
    
    // Step 8: Test file versioning
    await page.click('[data-testid="upload-new-version"]');
    await fileInput.setInputFiles(testFiles.document); // Upload same file as new version
    await page.fill('[data-testid="version-notes"]', 'Updated terms and conditions');
    await page.click('[data-testid="upload-version-button"]');
    
    await expect(page.locator('[data-testid="version-count"]')).toContainText('2 versions');
    
    // View version history
    await page.click('[data-testid="version-history-button"]');
    await expect(page.locator('[data-testid="version-list"] > li')).toHaveCount(2);
  });

  test('Image upload with thumbnail generation', async () => {
    await page.goto('/files/upload');
    
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles.image);
    
    await page.fill('[data-testid="file-title"]', 'Construction Site Photo');
    await page.selectOption('[data-testid="file-category"]', 'Site Documentation');
    await page.click('[data-testid="upload-button"]');
    
    // Wait for processing
    await expect(page.locator('[data-testid="processing-status"]')).toContainText('Complete', { timeout: 10000 });
    
    // Verify thumbnails generated
    await expect(page.locator('[data-testid="thumbnail-small"]')).toBeVisible();
    await expect(page.locator('[data-testid="thumbnail-medium"]')).toBeVisible();
    await expect(page.locator('[data-testid="thumbnail-large"]')).toBeVisible();
    
    // Check image metadata
    await expect(page.locator('[data-testid="image-dimensions"]')).toContainText(/\d+x\d+/);
    await expect(page.locator('[data-testid="image-format"]')).toContainText('JPEG');
    
    // Test thumbnail URLs
    const smallThumbUrl = await page.locator('[data-testid="thumbnail-small"]').getAttribute('src');
    expect(smallThumbUrl).toContain('150x150');
  });

  test('Bulk file upload with progress tracking', async () => {
    await page.goto('/files/bulk-upload');
    
    // Select multiple files
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles([
      testFiles.document,
      testFiles.image,
      testFiles.spreadsheet,
    ]);
    
    // Set bulk metadata
    await page.selectOption('[data-testid="bulk-category"]', 'Project Files');
    await page.selectOption('[data-testid="bulk-project"]', 'Dhaka Metro Rail');
    await page.click('[data-testid="bulk-upload-button"]');
    
    // Monitor individual file progress
    await expect(page.locator('[data-testid="file-progress-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-progress-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-progress-2"]')).toBeVisible();
    
    // Wait for all uploads to complete
    await expect(page.locator('[data-testid="bulk-upload-status"]')).toContainText('3 of 3 files uploaded', { timeout: 15000 });
    
    // Verify all files in list
    await page.goto('/files');
    await expect(page.locator('text=Project Contract')).toBeVisible();
    await expect(page.locator('text=Construction Site Photo')).toBeVisible();
    await expect(page.locator('text=test-data.xlsx')).toBeVisible();
  });

  test('File upload with virus scanning', async () => {
    await page.goto('/files/upload');
    
    // Create a test file that mimics malware signature (EICAR test string)
    const eicarTestString = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const maliciousFile = path.join(__dirname, '../fixtures/test-virus.txt');
    fs.writeFileSync(maliciousFile, eicarTestString);
    
    // Try to upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(maliciousFile);
    await page.click('[data-testid="upload-button"]');
    
    // Should be rejected
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Virus detected');
    await expect(page.locator('[data-testid="upload-status"]')).toContainText('Failed');
    
    // Clean up
    fs.unlinkSync(maliciousFile);
  });

  test('Storage quota enforcement', async () => {
    await page.goto('/settings/storage');
    
    // Check current usage
    const usageText = await page.locator('[data-testid="storage-usage"]').textContent();
    const usage = parseFloat(usageText?.match(/[\d.]+/)?.[0] || '0');
    
    const quotaText = await page.locator('[data-testid="storage-quota"]').textContent();
    const quota = parseFloat(quotaText?.match(/[\d.]+/)?.[0] || '0');
    
    expect(usage).toBeLessThan(quota);
    
    // Try to upload when near quota
    if (usage > quota * 0.9) {
      await page.goto('/files/upload');
      await expect(page.locator('[data-testid="quota-warning"]')).toContainText('Storage quota nearly exceeded');
    }
  });

  test('Multi-tenant file isolation', async () => {
    // Tenant 1 uploads file
    await page.goto('/files/upload');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles.document);
    await page.fill('[data-testid="file-title"]', 'Tenant1 Confidential');
    await page.click('[data-testid="upload-button"]');
    
    await expect(page.locator('[data-testid="upload-status"]')).toContainText('Complete');
    const tenant1FileId = await page.locator('[data-testid="file-id"]').textContent();
    
    // Logout and login as different tenant
    await page.goto('/logout');
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@tenant2.bd');
    await page.fill('[data-testid="password-input"]', 'Test456!');
    await page.click('[data-testid="login-button"]');
    
    // Try to access Tenant 1's file
    await page.goto(`/files/${tenant1FileId}`);
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Access denied');
    
    // Verify file not in Tenant 2's file list
    await page.goto('/files');
    await expect(page.locator('text=Tenant1 Confidential')).not.toBeVisible();
  });

  test('File retention and lifecycle policies', async () => {
    // Upload temporary file
    await page.goto('/files/upload');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFiles.document);
    
    await page.fill('[data-testid="file-title"]', 'Temporary Report');
    await page.selectOption('[data-testid="retention-policy"]', '30-days');
    await page.click('[data-testid="upload-button"]');
    
    await expect(page.locator('[data-testid="upload-status"]')).toContainText('Complete');
    
    // Check retention info
    await expect(page.locator('[data-testid="retention-info"]')).toContainText('Expires in 30 days');
    await expect(page.locator('[data-testid="auto-delete-warning"]')).toBeVisible();
    
    // Upload permanent file
    await page.goto('/files/upload');
    await fileInput.setInputFiles(testFiles.document);
    await page.fill('[data-testid="file-title"]', 'Legal Contract');
    await page.selectOption('[data-testid="retention-policy"]', 'permanent');
    await page.check('[data-testid="compliance-retention"]');
    await page.click('[data-testid="upload-button"]');
    
    await expect(page.locator('[data-testid="retention-info"]')).toContainText('Permanent storage');
    await expect(page.locator('[data-testid="compliance-badge"]')).toContainText('Compliance hold');
  });

  test('File search and filtering', async () => {
    await page.goto('/files');
    
    // Search by filename
    await page.fill('[data-testid="search-input"]', 'contract');
    await page.click('[data-testid="search-button"]');
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Project Contract');
    
    // Filter by category
    await page.selectOption('[data-testid="filter-category"]', 'Legal Documents');
    await expect(page.locator('[data-testid="file-list"] > li')).toHaveCount(1);
    
    // Filter by date range
    await page.fill('[data-testid="filter-date-from"]', '2025-01-01');
    await page.fill('[data-testid="filter-date-to"]', '2025-01-31');
    await page.click('[data-testid="apply-filters"]');
    
    // Filter by project
    await page.selectOption('[data-testid="filter-project"]', 'Dhaka Metro Rail');
    await page.click('[data-testid="apply-filters"]');
    
    // Advanced search with tags
    await page.click('[data-testid="advanced-search-toggle"]');
    await page.fill('[data-testid="tag-search"]', 'dhaka-metro');
    await page.click('[data-testid="search-button"]');
    
    await expect(page.locator('[data-testid="search-results"]')).toContainText('1 file found');
  });
});