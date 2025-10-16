import { test, expect, Page } from '@playwright/test';

test.describe('Notification Workflow - Multi-Channel Delivery', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.bd');
    await page.fill('[data-testid="password-input"]', 'Admin123!');
    await page.click('[data-testid="login-button"]');
  });

  test('Complete notification workflow: trigger → queue → delivery → confirmation', async () => {
    // Step 1: Trigger notification from project approval
    await page.goto('/projects/1');
    await page.click('[data-testid="approve-project-button"]');
    
    // Fill approval details
    await page.fill('[data-testid="approval-notes"]', 'Project approved for immediate execution');
    await page.check('[data-testid="notify-stakeholders"]');
    await page.check('[data-testid="notify-email"]');
    await page.check('[data-testid="notify-sms"]');
    await page.check('[data-testid="notify-push"]');
    await page.click('[data-testid="confirm-approval"]');
    
    // Step 2: Verify notification queued
    await page.goto('/admin/notifications/queue');
    await expect(page.locator('[data-testid="queue-status"]')).toContainText('Processing');
    await expect(page.locator('[data-testid="pending-notifications"]')).toContainText('3'); // Email, SMS, Push
    
    // Step 3: Monitor delivery status
    await page.waitForTimeout(2000); // Wait for processing
    await page.reload();
    
    // Check email delivery
    await expect(page.locator('[data-testid="email-status"]')).toContainText('Delivered');
    await expect(page.locator('[data-testid="email-provider"]')).toContainText('SendGrid');
    
    // Check SMS delivery (Bangladesh)
    await expect(page.locator('[data-testid="sms-status"]')).toContainText('Delivered');
    await expect(page.locator('[data-testid="sms-provider"]')).toContainText('Alpha SMS');
    await expect(page.locator('[data-testid="sms-cost"]')).toContainText('0.30 BDT');
    
    // Check push notification
    await expect(page.locator('[data-testid="push-status"]')).toContainText('Delivered');
    await expect(page.locator('[data-testid="push-platform"]')).toContainText('FCM');
    
    // Step 4: Verify delivery confirmation
    await page.goto('/notifications/delivery-report');
    await expect(page.locator('[data-testid="total-sent"]')).toContainText('3');
    await expect(page.locator('[data-testid="total-delivered"]')).toContainText('3');
    await expect(page.locator('[data-testid="delivery-rate"]')).toContainText('100%');
  });

  test('Bangladesh SMS integration with provider failover', async () => {
    await page.goto('/notifications/send');
    
    // Send SMS to Bangladesh number
    await page.selectOption('[data-testid="notification-type"]', 'SMS');
    await page.fill('[data-testid="recipient-phone"]', '+8801712345678');
    await page.fill('[data-testid="message-text"]', 'আপনার প্রকল্প অনুমোদিত হয়েছে'); // Bengali text
    await page.click('[data-testid="send-button"]');
    
    // Check primary provider attempt
    await page.goto('/notifications/logs');
    await expect(page.locator('[data-testid="provider-attempt-1"]')).toContainText('Alpha SMS');
    
    // Simulate primary provider failure
    await page.goto('/admin/providers');
    await page.click('[data-testid="disable-alpha-sms"]');
    
    // Send another SMS - should use fallback
    await page.goto('/notifications/send');
    await page.selectOption('[data-testid="notification-type"]', 'SMS');
    await page.fill('[data-testid="recipient-phone"]', '+8801898765432');
    await page.fill('[data-testid="message-text"]', 'Meeting reminder: 3 PM');
    await page.click('[data-testid="send-button"]');
    
    // Verify fallback provider used
    await page.goto('/notifications/logs');
    await expect(page.locator('[data-testid="provider-attempt-2"]')).toContainText('SMS.NET.BD');
    await expect(page.locator('[data-testid="failover-reason"]')).toContainText('Primary provider unavailable');
  });

  test('Bulk notification with rate limiting', async () => {
    await page.goto('/notifications/bulk');
    
    // Upload recipient list
    await page.setInputFiles('[data-testid="recipient-file"]', './fixtures/recipients-500.csv');
    
    // Configure notification
    await page.selectOption('[data-testid="template"]', 'payslip_notification');
    await page.check('[data-testid="channel-email"]');
    await page.check('[data-testid="channel-sms"]');
    
    // Set rate limiting
    await page.fill('[data-testid="rate-limit"]', '100'); // 100 per hour
    await page.selectOption('[data-testid="rate-unit"]', 'hour');
    
    // Schedule delivery
    await page.click('[data-testid="schedule-toggle"]');
    await page.fill('[data-testid="schedule-date"]', '2025-01-15');
    await page.fill('[data-testid="schedule-time"]', '09:00');
    
    await page.click('[data-testid="send-bulk-button"]');
    
    // Verify bulk job created
    await expect(page.locator('[data-testid="bulk-job-status"]')).toContainText('Scheduled');
    await expect(page.locator('[data-testid="total-recipients"]')).toContainText('500');
    await expect(page.locator('[data-testid="estimated-completion"]')).toContainText('5 hours');
    
    // Check rate limiting in action
    await page.goto('/notifications/bulk/monitor');
    await page.waitForTimeout(3600); // Wait 1 minute
    await page.reload();
    
    // Should have sent ~1.67 notifications (100/hour = ~1.67/min)
    const sentCount = await page.locator('[data-testid="sent-count"]').textContent();
    expect(parseInt(sentCount || '0')).toBeLessThanOrEqual(2);
  });

  test('Email template with dynamic content', async () => {
    await page.goto('/notifications/templates');
    
    // Create new template
    await page.click('[data-testid="create-template"]');
    await page.fill('[data-testid="template-name"]', 'project_update');
    await page.selectOption('[data-testid="template-language"]', 'bn'); // Bengali
    
    // Design template with variables
    await page.fill('[data-testid="template-subject"]', 'প্রকল্প আপডেট: {{project_name}}');
    await page.fill('[data-testid="template-body"]', `
      প্রিয় {{user_name}},
      
      আপনার প্রকল্প "{{project_name}}" এর স্ট্যাটাস আপডেট হয়েছে।
      নতুন স্ট্যাটাস: {{status}}
      বাজেট: {{budget}} টাকা
      
      ধন্যবাদ,
      {{company_name}}
    `);
    
    await page.click('[data-testid="save-template"]');
    
    // Test template with data
    await page.click('[data-testid="test-template"]');
    await page.fill('[data-testid="test-data"]', JSON.stringify({
      user_name: 'রহিম উদ্দিন',
      project_name: 'ঢাকা মেট্রো রেল',
      status: 'অনুমোদিত',
      budget: '৫০,০০,০০০',
      company_name: 'ভেক্সট্রাস কনস্ট্রাকশন'
    }));
    
    await page.click('[data-testid="preview-button"]');
    
    // Verify rendered content
    await expect(page.locator('[data-testid="preview-subject"]')).toContainText('প্রকল্প আপডেট: ঢাকা মেট্রো রেল');
    await expect(page.locator('[data-testid="preview-body"]')).toContainText('রহিম উদ্দিন');
    await expect(page.locator('[data-testid="preview-body"]')).toContainText('৫০,০০,০০০');
  });

  test('Push notification with deep linking', async () => {
    await page.goto('/notifications/send');
    
    // Configure push notification
    await page.selectOption('[data-testid="notification-type"]', 'Push');
    await page.fill('[data-testid="push-title"]', 'New Task Assigned');
    await page.fill('[data-testid="push-body"]', 'You have been assigned to review project documents');
    
    // Set deep link
    await page.fill('[data-testid="deep-link"]', 'vextrus://projects/123/tasks/456');
    
    // Add action buttons
    await page.click('[data-testid="add-action"]');
    await page.fill('[data-testid="action-1-title"]', 'View Task');
    await page.fill('[data-testid="action-1-link"]', 'vextrus://tasks/456');
    
    await page.click('[data-testid="add-action"]');
    await page.fill('[data-testid="action-2-title"]', 'Mark Complete');
    await page.fill('[data-testid="action-2-link"]', 'vextrus://tasks/456/complete');
    
    // Set priority and TTL
    await page.selectOption('[data-testid="push-priority"]', 'high');
    await page.fill('[data-testid="push-ttl"]', '86400'); // 24 hours
    
    // Select target devices
    await page.check('[data-testid="target-android"]');
    await page.check('[data-testid="target-ios"]');
    await page.check('[data-testid="target-web"]');
    
    await page.click('[data-testid="send-button"]');
    
    // Verify delivery to FCM
    await expect(page.locator('[data-testid="fcm-response"]')).toContainText('Success');
    await expect(page.locator('[data-testid="devices-reached"]')).toContainText('3');
  });

  test('Notification preferences and opt-out', async () => {
    // User sets preferences
    await page.goto('/settings/notifications');
    
    // Email preferences
    await page.check('[data-testid="email-project-updates"]');
    await page.uncheck('[data-testid="email-marketing"]');
    await page.check('[data-testid="email-security-alerts"]');
    
    // SMS preferences
    await page.check('[data-testid="sms-urgent-only"]');
    await page.fill('[data-testid="sms-quiet-hours-start"]', '22:00');
    await page.fill('[data-testid="sms-quiet-hours-end"]', '07:00');
    
    // Push preferences
    await page.check('[data-testid="push-enabled"]');
    await page.selectOption('[data-testid="push-sound"]', 'default');
    await page.check('[data-testid="push-vibrate"]');
    
    await page.click('[data-testid="save-preferences"]');
    
    // Test opt-out link
    await page.goto('/notifications/test-optout?token=abc123');
    await page.click('[data-testid="optout-all"]');
    await expect(page.locator('[data-testid="optout-confirmation"]')).toContainText('You have been unsubscribed');
    
    // Verify preferences updated
    await page.goto('/settings/notifications');
    await expect(page.locator('[data-testid="all-notifications-disabled"]')).toBeVisible();
  });

  test('Notification analytics and reporting', async () => {
    await page.goto('/notifications/analytics');
    
    // Date range
    await page.fill('[data-testid="date-from"]', '2025-01-01');
    await page.fill('[data-testid="date-to"]', '2025-01-31');
    await page.click('[data-testid="apply-filter"]');
    
    // Check metrics
    await expect(page.locator('[data-testid="total-sent"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="delivery-rate"]')).toContainText(/\d+%/);
    await expect(page.locator('[data-testid="open-rate"]')).toContainText(/\d+%/);
    await expect(page.locator('[data-testid="click-rate"]')).toContainText(/\d+%/);
    
    // Channel breakdown
    await expect(page.locator('[data-testid="email-sent"]')).toBeVisible();
    await expect(page.locator('[data-testid="sms-sent"]')).toBeVisible();
    await expect(page.locator('[data-testid="push-sent"]')).toBeVisible();
    
    // Cost analysis (Bangladesh specific)
    await expect(page.locator('[data-testid="sms-cost-bdt"]')).toContainText(/[\d,]+ BDT/);
    await expect(page.locator('[data-testid="email-cost-usd"]')).toContainText(/\$[\d.]+/);
    
    // Export report
    await page.selectOption('[data-testid="export-format"]', 'pdf');
    await page.click('[data-testid="export-report"]');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-report"]'),
    ]);
    
    expect(download.suggestedFilename()).toMatch(/notification-report-.*\.pdf/);
  });
});