# Session 034: Advanced Task Sidebar - PLAN

**Planned Date**: 2025-01-03
**Estimated Duration**: 2.5 hours
**Type**: Frontend Enhancement - Excel-like Task Management
**Priority**: HIGH 🔥

## 📋 Executive Summary

Building on the robust backend infrastructure from Session 033, we'll transform the Gantt chart's task sidebar into a powerful Excel-like interface with 10+ editable columns, inline editing, bulk operations, and real-time updates. This will provide project managers with a familiar, efficient way to manage hundreds of tasks without leaving the Gantt view.

## 🎯 Primary Objectives

### 1. Enhanced Column System (45 mins)
- [ ] Add 10+ new columns to task grid
- [ ] Implement column show/hide toggles
- [ ] Add column reordering via drag-and-drop
- [ ] Implement column width persistence
- [ ] Add column sorting (multi-column support)

### 2. Excel-like Editing (60 mins)
- [ ] Implement inline cell editing (double-click or F2)
- [ ] Add keyboard navigation (arrows, Tab, Enter)
- [ ] Support different input types per column
- [ ] Add cell validation with error indicators
- [ ] Implement copy/paste functionality (Ctrl+C/V)

### 3. Bulk Operations (30 mins)
- [ ] Add row multi-select (Ctrl/Shift+Click)
- [ ] Implement bulk update dialog
- [ ] Add bulk delete with confirmation
- [ ] Support bulk assignment changes
- [ ] Add bulk progress updates

### 4. Real-time Integration (15 mins)
- [ ] Connect to GanttOrchestrationService
- [ ] Implement optimistic updates
- [ ] Add loading states per cell
- [ ] Handle validation errors gracefully
- [ ] Update activity log for all changes

## 📊 Column Specifications

### Essential Columns (Must Have)
1. **WBS** - Read-only, hierarchical display
2. **Task Name** - Text input, required
3. **Start Date** - Date picker
4. **End Date** - Date picker  
5. **Duration** - Number input (days)
6. **Progress** - Percentage slider/input
7. **Status** - Dropdown (NOT_STARTED, IN_PROGRESS, COMPLETED, etc.)
8. **Priority** - Dropdown (LOW, MEDIUM, HIGH, CRITICAL)
9. **Assigned To** - Multi-select users
10. **Dependencies** - Predecessor picker

### Advanced Columns (Nice to Have)
11. **Actual Start** - Date picker
12. **Actual End** - Date picker
13. **Cost** - Currency input
14. **Remaining Cost** - Currency input
15. **Notes** - Text area (expandable)
16. **Risk Level** - Dropdown
17. **Weather Impact** - Percentage display
18. **RAJUK Status** - Status badge
19. **Critical** - Checkbox/indicator
20. **Locked** - Lock/unlock toggle

## 🛠️ Technical Implementation

### 1. Grid Configuration Enhancement
```typescript
// gantt.config updates
gantt.config.columns = [
  { name: "wbs", label: "WBS", width: 60, template: wbsTemplate },
  { name: "text", label: "Task", tree: true, width: 200, editor: textEditor },
  { name: "start_date", label: "Start", width: 100, editor: dateEditor },
  { name: "duration", label: "Duration", width: 60, editor: durationEditor },
  { name: "progress", label: "Progress", width: 80, editor: progressEditor },
  { name: "status", label: "Status", width: 100, editor: selectEditor },
  { name: "priority", label: "Priority", width: 80, editor: selectEditor },
  { name: "assigned", label: "Assigned", width: 150, editor: multiSelectEditor },
  // ... more columns
];

// Enable inline editing
gantt.config.inline_editors = true;
gantt.config.inline_editors_date_processing = "date_only";
```

### 2. Custom Editors Implementation
```typescript
// Text editor with validation
const textEditor = {
  type: "text",
  map_to: "text",
  min_width: 100,
  focus: true,
  validator: (value) => {
    if (!value || value.trim().length === 0) {
      gantt.message({ text: "Task name is required", type: "error" });
      return false;
    }
    return true;
  }
};

// Date editor with constraints
const dateEditor = {
  type: "date",
  map_to: "start_date",
  min_width: 100,
  onchange: async (item, value) => {
    // Validate against project constraints
    // Update dependencies if needed
    await updateTaskWithOrchestration(item.id, { start_date: value });
  }
};

// Progress editor with slider
const progressEditor = {
  type: "custom",
  map_to: "progress",
  create: (item) => createProgressSlider(item.progress),
  save: (item, node) => saveProgressValue(node),
  get_value: (item, node) => getProgressValue(node)
};
```

### 3. Bulk Operations UI
```typescript
// Multi-select implementation
let selectedTasks: string[] = [];

gantt.attachEvent("onTaskClick", (id, e) => {
  if (e.ctrlKey || e.metaKey) {
    toggleTaskSelection(id);
  } else if (e.shiftKey) {
    selectTaskRange(lastSelectedId, id);
  } else {
    clearSelection();
    selectTask(id);
  }
  updateBulkOperationsToolbar();
  return true;
});

// Bulk update dialog
function openBulkUpdateDialog() {
  const dialog = {
    title: "Bulk Update Tasks",
    fields: [
      { type: "select", name: "status", label: "Status", options: statusOptions },
      { type: "select", name: "priority", label: "Priority", options: priorityOptions },
      { type: "number", name: "progress", label: "Progress (%)", min: 0, max: 100 },
      { type: "multiselect", name: "assigned", label: "Assign To", options: userOptions }
    ],
    buttons: [
      { label: "Apply", action: applyBulkUpdate },
      { label: "Cancel", action: closeBulkDialog }
    ]
  };
  showDialog(dialog);
}
```

### 4. Keyboard Navigation
```typescript
// Excel-like keyboard shortcuts
gantt.attachEvent("onKeyPress", (code, e) => {
  const cell = gantt.getState().editor;
  
  switch(e.key) {
    case "F2":
      startInlineEdit(cell);
      break;
    case "Enter":
      if (cell) {
        saveAndMoveDown(cell);
      } else {
        startInlineEdit(getCurrentCell());
      }
      break;
    case "Tab":
      if (e.shiftKey) {
        moveToPreviousCell();
      } else {
        moveToNextCell();
      }
      e.preventDefault();
      break;
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowLeft":
    case "ArrowRight":
      if (!cell) {
        navigateGrid(e.key);
        e.preventDefault();
      }
      break;
    case "Delete":
      if (selectedTasks.length > 0) {
        confirmBulkDelete();
      }
      break;
    case "c":
      if (e.ctrlKey) {
        copySelectedTasks();
      }
      break;
    case "v":
      if (e.ctrlKey) {
        pasteTaskData();
      }
      break;
  }
});
```

### 5. Column Customization
```typescript
// Column visibility management
const columnConfig = {
  visible: ["wbs", "text", "start_date", "duration", "progress"],
  hidden: ["actual_start", "actual_end", "cost", "notes"],
  widths: { text: 250, progress: 100 },
  order: ["wbs", "text", "start_date", "duration", "progress"]
};

// Save to GanttView model
async function saveColumnPreferences() {
  await fetch(`/api/v1/projects/${projectId}/gantt`, {
    method: "POST",
    body: JSON.stringify({
      action: "saveView",
      data: {
        viewName: "default",
        viewConfig: {
          columnConfig,
          filters: getActiveFilters(),
          sortOrder: getSortOrder()
        }
      }
    })
  });
}

// Column resize persistence
gantt.attachEvent("onColumnResize", (index, column, new_width) => {
  columnConfig.widths[column.name] = new_width;
  debounce(saveColumnPreferences, 1000)();
});
```

## 🎨 UI/UX Enhancements

### 1. Visual Feedback
- Highlight edited cells with subtle animation
- Show validation errors as red borders
- Display loading spinners during saves
- Use color coding for status/priority
- Add tooltips for truncated content

### 2. Context Menus
```typescript
gantt.attachEvent("onContextMenu", (taskId, linkId, e) => {
  const menu = [
    { text: "Edit Task", icon: "edit", action: () => editTask(taskId) },
    { text: "Add Subtask", icon: "add", action: () => addSubtask(taskId) },
    { divider: true },
    { text: "Copy", icon: "copy", shortcut: "Ctrl+C", action: () => copyTask(taskId) },
    { text: "Paste", icon: "paste", shortcut: "Ctrl+V", action: () => pasteTask(taskId) },
    { divider: true },
    { text: "Delete", icon: "delete", action: () => deleteTask(taskId) }
  ];
  
  if (selectedTasks.length > 1) {
    menu.unshift({ text: `${selectedTasks.length} tasks selected`, disabled: true });
    menu.push({ text: "Bulk Update...", icon: "edit-all", action: openBulkUpdateDialog });
  }
  
  showContextMenu(e.clientX, e.clientY, menu);
  e.preventDefault();
});
```

### 3. Filter & Search
```typescript
// Advanced filtering
const filterPanel = {
  status: ["IN_PROGRESS", "PENDING"],
  priority: ["HIGH", "CRITICAL"],
  dateRange: { start: "2025-01-01", end: "2025-12-31" },
  assigned: ["user1", "user2"],
  search: ""
};

// Real-time search
gantt.attachEvent("onSearchChange", (value) => {
  gantt.filter(task => {
    return task.text.toLowerCase().includes(value.toLowerCase()) ||
           task.wbs.includes(value) ||
           task.assigned?.some(u => u.name.toLowerCase().includes(value.toLowerCase()));
  });
});
```

## 📋 Testing Strategy

### 1. Unit Tests
- [ ] Column configuration tests
- [ ] Editor validation tests
- [ ] Keyboard navigation tests
- [ ] Bulk operation logic tests

### 2. Integration Tests
- [ ] API call verification
- [ ] Event bus integration
- [ ] Activity logging
- [ ] Error handling

### 3. E2E Tests with Playwright
```javascript
// Test inline editing
await page.dblClick('.gantt_cell[data-column="text"]');
await page.keyboard.type('Updated Task Name');
await page.keyboard.press('Enter');
await expect(page.locator('.gantt_cell')).toContainText('Updated Task Name');

// Test bulk operations
await page.click('.gantt_row[data-task-id="1"]');
await page.click('.gantt_row[data-task-id="2"]', { modifiers: ['Control'] });
await page.click('button:has-text("Bulk Update")');
await page.selectOption('[name="status"]', 'COMPLETED');
await page.click('button:has-text("Apply")');

// Test column customization
await page.click('button[aria-label="Column Settings"]');
await page.uncheck('input[value="cost"]');
await page.check('input[value="priority"]');
await page.click('button:has-text("Apply")');
```

## 🚀 Performance Considerations

1. **Virtual Scrolling**: Only render visible rows (already in dhtmlx)
2. **Debounced Saves**: Batch updates after 500ms of inactivity
3. **Optimistic Updates**: Update UI immediately, rollback on error
4. **Lazy Loading**: Load additional columns on demand
5. **Memoization**: Cache calculated values (WBS, critical path)

## ⚠️ Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| Performance degradation with many columns | Implement column virtualization |
| Data conflicts with concurrent edits | Use optimistic locking with version field |
| Complex validation rules | Client-side pre-validation + server validation |
| Browser compatibility | Test in Chrome, Firefox, Edge, Safari |
| Mobile usability | Provide simplified mobile view option |

## 📊 Success Metrics

- [ ] 10+ functional columns
- [ ] < 100ms response time for inline edits
- [ ] 100% keyboard navigable
- [ ] Zero data loss during bulk operations
- [ ] All changes logged in activity feed
- [ ] Column preferences persist across sessions

## 🎯 Deliverables

1. **Enhanced Task Grid** with 10+ editable columns
2. **Excel-like Navigation** with full keyboard support
3. **Bulk Operations** toolbar and dialogs
4. **Column Customization** panel
5. **Context Menus** for quick actions
6. **Real-time Updates** via event bus
7. **Comprehensive Tests** with Playwright

## 📚 Reference Materials

- [dhtmlx-gantt Inline Editors](https://docs.dhtmlx.com/gantt/desktop__inline_editing.html)
- [dhtmlx-gantt Custom Editors](https://docs.dhtmlx.com/gantt/desktop__inline_editing_custom_editor.html)
- [Excel Online Keyboard Shortcuts](https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f)
- [AG-Grid Cell Editing](https://www.ag-grid.com/javascript-data-grid/cell-editing/)

## 🔄 Dependencies

- Session 033 completed ✅ (Backend infrastructure ready)
- GanttOrchestrationService available ✅
- Event bus configured ✅
- Activity logging working ✅
- dhtmlx-gantt v8.0.10 installed ✅

## ⏱️ Timeline

| Task | Duration | Status |
|------|----------|--------|
| Column System | 45 mins | ⏳ |
| Excel-like Editing | 60 mins | ⏳ |
| Bulk Operations | 30 mins | ⏳ |
| Real-time Integration | 15 mins | ⏳ |
| **Total** | **2.5 hours** | ⏳ |

---

## 📝 Session System Prompt

**For Session 034 execution, use this system prompt:**

```
You are implementing Session 034: Advanced Task Sidebar for the Vextrus ERP Gantt chart module.

CONTEXT:
- Session 033 has created a robust backend with GanttOrchestrationService and event-driven architecture
- The Gantt chart currently displays 68 tasks with basic columns
- dhtmlx-gantt v8.0.10 is installed and configured
- The goal is to create an Excel-like editing experience

REQUIREMENTS:
1. Add 10+ editable columns to the task grid
2. Implement inline editing with keyboard navigation
3. Support bulk operations for multiple selected tasks
4. Integrate with GanttOrchestrationService for all updates
5. Persist column preferences in GanttView model
6. Test everything with Playwright

APPROACH:
1. Start by enhancing gantt.config.columns
2. Implement custom editors for each data type
3. Add keyboard event handlers for Excel-like navigation
4. Create bulk operation UI components
5. Connect to backend services via API
6. Test each feature incrementally with Playwright

TESTING:
- Use Playwright MCP to test inline editing immediately after implementation
- Verify bulk operations with multiple task selections
- Ensure keyboard navigation works as expected
- Confirm all updates are saved to database

QUALITY STANDARDS:
- TypeScript strict mode compliance
- No console errors
- All user actions provide visual feedback
- Changes must persist on page refresh
- Activity log must capture all operations
```

---

**Ready to execute Session 034!** 🚀