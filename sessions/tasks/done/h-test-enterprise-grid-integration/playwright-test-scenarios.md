# Playwright E2E Test Scenarios

## Setup
```javascript
// Use Playwright MCP for browser automation
// Connect to test database with seed data
// Mock external services where needed
```

## Test Suites

### 1. Grid Basic Functionality
```javascript
test.describe('Task Grid Basic Operations', () => {
  test('should load grid with tasks', async () => {
    // Navigate to projects page
    // Select a project
    // Verify grid renders
    // Check task count matches database
  });

  test('should display all 40+ columns', async () => {
    // Count visible columns
    // Verify each column header
    // Check column order
  });

  test('should sort by different columns', async () => {
    // Click column headers
    // Verify sort order changes
    // Test multiple column sorts
  });

  test('should filter tasks', async () => {
    // Apply text filter
    // Apply status filter
    // Apply date range filter
    // Verify filtered results
  });
});
```

### 2. Inline Editing
```javascript
test.describe('Grid Inline Editing', () => {
  test('should edit task title', async () => {
    // Double-click cell
    // Enter new text
    // Press Enter
    // Verify database update
    // Check UI reflects change
  });

  test('should validate input', async () => {
    // Try invalid date
    // Try negative progress
    // Try empty required field
    // Verify error messages
  });

  test('should handle edit cancellation', async () => {
    // Start editing
    // Press Escape
    // Verify no changes saved
  });
});
```

### 3. Service Integration
```javascript
test.describe('Service Data Display', () => {
  test('should show CPM calculations', async () => {
    // Check critical path highlighting
    // Verify slack values
    // Test float calculations
  });

  test('should display WBS hierarchy', async () => {
    // Verify WBS codes
    // Check parent-child relationships
    // Test roll-up calculations
  });

  test('should show weather impact', async () => {
    // Check weather indicators
    // Verify monsoon periods
    // Test delay calculations
  });

  test('should display resource conflicts', async () => {
    // Check overallocation warnings
    // Verify utilization percentages
    // Test resource leveling
  });
});
```

### 4. Custom Renderers
```javascript
test.describe('Custom Cell Renderers', () => {
  test('ProgressBarRenderer displays correctly', async () => {
    // Take screenshot
    // Verify gradient colors
    // Check percentage text
    // Test different progress values
  });

  test('StatusBadgeRenderer shows all statuses', async () => {
    // Verify each status color
    // Check icon display
    // Test status transitions
  });

  test('WeatherImpactRenderer shows severity', async () => {
    // Check weather icons
    // Verify severity colors
    // Test tooltip information
  });
});
```

### 5. Theme System
```javascript
test.describe('Theme Switching', () => {
  test('should toggle between light and dark modes', async () => {
    // Click theme toggle
    // Take screenshot in light mode
    // Toggle to dark mode
    // Take screenshot in dark mode
    // Verify CSS variables change
  });

  test('should persist theme preference', async () => {
    // Set dark mode
    // Refresh page
    // Verify dark mode active
  });
});
```

### 6. Performance Tests
```javascript
test.describe('Performance', () => {
  test('should handle 1000+ tasks', async () => {
    // Load large dataset
    // Measure render time
    // Test scroll performance
    // Check memory usage
  });

  test('should efficiently update single cell', async () => {
    // Edit single cell
    // Measure update time
    // Verify no full re-render
  });

  test('should handle rapid updates', async () => {
    // Simulate 10 quick edits
    // Verify all save correctly
    // Check no data loss
  });
});
```

### 7. Export Functionality
```javascript
test.describe('Data Export', () => {
  test('should export to CSV', async () => {
    // Click export button
    // Select CSV format
    // Download file
    // Verify file contents
  });

  test('should export to Excel', async () => {
    // Click export button
    // Select Excel format
    // Download file
    // Verify formatting preserved
  });
});
```

### 8. Error Handling
```javascript
test.describe('Error Recovery', () => {
  test('should handle network failures', async () => {
    // Simulate offline mode
    // Try to save changes
    // Verify queuing mechanism
    // Restore connection
    // Verify sync
  });

  test('should handle service failures', async () => {
    // Mock service error
    // Verify error message
    // Check fallback behavior
    // Test retry mechanism
  });
});
```

### 9. Mobile Responsiveness
```javascript
test.describe('Mobile View', () => {
  test('should adapt to mobile viewport', async () => {
    // Set mobile viewport
    // Check responsive layout
    // Test touch interactions
    // Verify horizontal scroll
  });
});
```

### 10. Integration with Gantt
```javascript
test.describe('Grid-Gantt Synchronization', () => {
  test('should sync selection', async () => {
    // Select task in grid
    // Verify Gantt highlights
    // Select in Gantt
    // Verify grid selection
  });

  test('should sync updates', async () => {
    // Edit in grid
    // Verify Gantt updates
    // Drag in Gantt
    // Verify grid updates
  });
});
```

## Visual Regression Testing
```javascript
// Capture screenshots for:
// - Default grid view
// - Each custom renderer
// - Light vs dark mode
// - Different data states
// - Error states
// - Loading states
```

## Accessibility Testing
```javascript
test.describe('Accessibility', () => {
  test('should be keyboard navigable', async () => {
    // Tab through grid
    // Use arrow keys
    // Enter to edit
    // Escape to cancel
  });

  test('should work with screen readers', async () => {
    // Check ARIA labels
    // Verify announcements
    // Test landmark regions
  });
});
```

## Test Data Requirements
- Minimum 100 tasks with varied data
- Tasks with all status types
- Tasks with weather impacts
- Tasks with resource conflicts
- Critical path tasks
- Parent-child relationships
- Different priority levels
- Various progress percentages

## Success Metrics
- All tests pass consistently
- No flaky tests
- Execution time < 5 minutes
- Visual regression detection working
- Coverage > 80% of user paths