# Phase 3 Implementation Plan
**Real-Time Integration & Data Management**

**Duration**: 2 weeks (10 working days)
**Complexity**: 45 points (Medium)
**Dependencies**: Phase 2 complete ✅, Backend services running ✅

---

## 🎯 Phase 3 Overview

Transform the static UI from Phase 2 into a dynamic, data-driven application by connecting to the operational GraphQL Federation backend and implementing real-time features.

### Key Deliverables
1. Frontend connected to 17 backend services via GraphQL
2. Real-time notifications via WebSocket subscriptions
3. Functional command palette with navigation and search
4. Complete CRUD cycle for one entity (Invoices)
5. Forms with validation and backend integration
6. Optimistic UI updates throughout

---

## 📅 Timeline & Milestones

### Week 1: Foundation & Real-Time (Days 1-5)

**Days 1-3: Subphase 3.1 - Apollo Integration**
- [ ] Day 1: Setup + Authentication
- [ ] Day 2: Master Data + Error Handling
- [ ] Day 3: Testing + Polish

**Days 4-5: Subphase 3.2 - Real-Time Notifications**
- [ ] Day 4: Subscription + UI
- [ ] Day 5: Toast + Push Notifications

### Week 2: Features & Polish (Days 6-10)

**Days 6-7: Subphase 3.3 - Enhanced Command Palette**
- [ ] Day 6: Navigation + Search
- [ ] Day 7: Shortcuts + History

**Days 8-10: Subphase 3.4 - Data Management**
- [ ] Day 8: Invoice Dashboard
- [ ] Day 9: Create + Update
- [ ] Day 10: Delete + File Upload

---

## 🏗️ Subphase 3.1: Apollo Integration
**Duration**: 3 days
**Complexity**: 15 points

### Day 1: Setup & Authentication

#### Task 1.1: Environment Configuration (1 hour)
```bash
# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
```

**Files**:
- `apps/web/.env.local` (create)
- Test connection to GraphQL Playground

#### Task 1.2: ApolloProvider Setup (2 hours)
**Files**:
- `apps/web/src/app/layout.tsx` (modify)
- `apps/web/src/providers/apollo-provider.tsx` (create)

```tsx
// providers/apollo-provider.tsx
'use client'

import { ApolloProvider as Provider } from '@apollo/client'
import { apolloClient } from '@/lib/apollo/client'

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <Provider client={apolloClient}>{children}</Provider>
}
```

#### Task 1.3: Login Page (3 hours)
**Files**:
- `apps/web/src/app/(auth)/login/page.tsx` (create)
- `apps/web/src/lib/graphql/mutations/auth.ts` (create)

```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      email
      name
      role
    }
  }
}
```

#### Task 1.4: Protected Routes (2 hours)
**Files**:
- `apps/web/src/middleware.ts` (create)
- `apps/web/src/lib/auth/utils.ts` (create)

**Acceptance Criteria**:
- [x] Environment variables set
- [x] ApolloProvider wrapping app
- [x] Login page with form
- [x] Login mutation working
- [x] Token stored in localStorage
- [x] Protected routes redirect to login

---

### Day 2: Master Data & Error Handling

#### Task 2.1: getCurrentUser Query (2 hours)
**Files**:
- `apps/web/src/lib/graphql/queries/auth.ts` (create)
- `apps/web/src/hooks/use-current-user.ts` (create)

```graphql
query GetCurrentUser {
  me {
    id
    email
    name
    role
    organization {
      id
      name
    }
  }
}
```

#### Task 2.2: Master Data Queries (2 hours)
**Files**:
- `apps/web/src/lib/graphql/queries/master-data.ts` (create)
- `apps/web/src/hooks/use-currencies.ts` (create)
- `apps/web/src/hooks/use-countries.ts` (create)

```graphql
query GetCurrencies {
  currencies {
    id
    code
    name
    symbol
  }
}

query GetCountries {
  countries {
    id
    code
    name
  }
}
```

#### Task 2.3: Error Boundary (2 hours)
**Files**:
- `apps/web/src/components/error-boundary.tsx` (create)
- `apps/web/src/components/graphql-error.tsx` (create)

**Acceptance Criteria**:
- [x] getCurrentUser working
- [x] User info displayed in header
- [x] Currencies populated in dropdowns
- [x] Countries populated in dropdowns
- [x] Error boundary catches GraphQL errors
- [x] Friendly error messages shown

---

### Day 3: Testing & Polish

#### Task 3.1: Loading States (2 hours)
**Files**:
- `apps/web/src/components/loading-page.tsx` (create)
- Update all query hooks with Skeleton

#### Task 3.2: Logout Functionality (1 hour)
**Files**:
- `apps/web/src/lib/graphql/mutations/auth.ts` (modify)
- `apps/web/src/components/user-menu.tsx` (modify)

#### Task 3.3: End-to-End Testing (3 hours)
**Test Scenarios**:
1. Login with valid credentials → Success
2. Login with invalid credentials → Error message
3. Access protected route without auth → Redirect to login
4. Logout → Clear token, redirect to login
5. Query master data → Displays in UI
6. Network error → Shows error boundary

**Acceptance Criteria**:
- [x] All loading states use Skeleton
- [x] Logout clears token and cache
- [x] All test scenarios pass
- [x] No console errors

---

## 🔔 Subphase 3.2: Real-Time Notifications
**Duration**: 2 days
**Complexity**: 8 points

### Day 4: Subscription & UI

#### Task 4.1: Notification Subscription (2 hours)
**Files**:
- `apps/web/src/lib/graphql/subscriptions/notifications.ts` (create)
- `apps/web/src/hooks/use-notifications.ts` (create)

```graphql
subscription OnNotificationReceived($userId: ID!) {
  notificationReceived(userId: $userId) {
    id
    title
    message
    type
    createdAt
    read
  }
}
```

#### Task 4.2: NotificationCenter Component (3 hours)
**Files**:
- `apps/web/src/components/notification-center.tsx` (create)
- `apps/web/src/components/notification-item.tsx` (create)
- `apps/web/src/components/notification-dropdown.tsx` (create)

**Features**:
- Bell icon with badge count
- Dropdown panel with scrollable list
- Mark as read on click
- Mark all as read button
- Clear all button
- Empty state

#### Task 4.3: Mark as Read Mutation (1 hour)
**Files**:
- `apps/web/src/lib/graphql/mutations/notifications.ts` (create)

```graphql
mutation MarkNotificationAsRead($id: ID!) {
  markNotificationAsRead(id: $id) {
    id
    read
  }
}
```

**Acceptance Criteria**:
- [x] Subscription receives live notifications
- [x] Badge count updates in real-time
- [x] Dropdown shows notification list
- [x] Mark as read works
- [x] Mark all as read works

---

### Day 5: Toast & Push Notifications

#### Task 5.1: Toast Integration (2 hours)
**Files**:
- `apps/web/src/hooks/use-notification-toast.ts` (create)
- Integrate with Sonner (already installed)

**Toast Types**:
- info: General notifications
- success: Successful actions
- warning: Important alerts
- error: Error notifications

#### Task 5.2: Desktop Push (3 hours)
**Files**:
- `apps/web/public/sw.js` (create service worker)
- `apps/web/src/lib/push/notification-manager.ts` (create)

**Features**:
- Request permission on first visit
- Display desktop notifications
- Click notification to focus app
- Notification sound (optional)

#### Task 5.3: Testing (1 hour)
**Test Scenarios**:
1. Receive notification → Toast appears
2. Click notification → Opens in dropdown
3. Mark as read → Badge decreases
4. Desktop notification → Appears outside browser
5. Click desktop notification → Opens app

**Acceptance Criteria**:
- [x] Toast appears for new notifications
- [x] Different toast styles for types
- [x] Desktop push permission requested
- [x] Desktop notifications working
- [x] Click notification opens app

---

## 🎨 Subphase 3.3: Enhanced Command Palette
**Duration**: 2 days
**Complexity**: 7 points

### Day 6: Navigation & Search

#### Task 6.1: Route Navigation (2 hours)
**Files**:
- `apps/web/src/components/command-palette.tsx` (modify)
- `apps/web/src/lib/commands/routes.ts` (create)

**Routes**:
- Dashboard, Invoices, Customers, Products, Reports, Settings
- Navigate with Next.js router
- Close palette after navigation

#### Task 6.2: Entity Search (3 hours)
**Files**:
- `apps/web/src/lib/graphql/queries/search.ts` (create)
- `apps/web/src/lib/commands/search.ts` (create)

```graphql
query SearchInvoices($query: String!) {
  searchInvoices(query: $query, limit: 10) {
    id
    invoiceNumber
    customerName
    amount
  }
}
```

**Search Entities**:
- Invoices by number
- Customers by name
- Products by SKU or name

#### Task 6.3: Fuzzy Matching (1 hour)
**Already provided by cmdk**
- Test fuzzy search
- Tune relevance scoring

**Acceptance Criteria**:
- [x] All routes accessible via palette
- [x] Navigation closes palette
- [x] Search invoices working
- [x] Search customers working
- [x] Search products working
- [x] Fuzzy matching functional

---

### Day 7: Shortcuts & History

#### Task 7.1: Keyboard Shortcuts (2 hours)
**Files**:
- `apps/web/src/hooks/use-keyboard-shortcuts.ts` (create)

**Shortcuts**:
```typescript
const shortcuts = {
  'cmd+k': () => openCommandPalette(),
  'cmd+n': () => createNewInvoice(),
  'cmd+s': () => saveForm(),
  'cmd+t': () => createTransaction(),
  'cmd+,': () => openSettings(),
  'esc': () => closeModals(),
}
```

#### Task 7.2: Recent Actions (2 hours)
**Files**:
- `apps/web/src/lib/history/action-tracker.ts` (create)
- Store last 10 actions in localStorage

**Action Types**:
- Viewed invoice
- Created invoice
- Updated customer
- Searched for product

#### Task 7.3: Testing (2 hours)
**Test All Shortcuts**:
- ⌘K opens palette ✓
- ⌘N creates new ✓
- ⌘S saves form ✓
- ESC closes dialogs ✓
- Recent actions tracked ✓

**Acceptance Criteria**:
- [x] All keyboard shortcuts work
- [x] Recent actions tracked
- [x] Recent group in palette
- [x] Clear history works
- [x] Persists to localStorage

---

## 📊 Subphase 3.4: Data Management
**Duration**: 3 days
**Complexity**: 15 points

### Day 8: Invoice Dashboard

#### Task 8.1: Invoice List Query (2 hours)
**Files**:
- `apps/web/src/lib/graphql/queries/invoices.ts` (create)

```graphql
query GetInvoices(
  $filters: InvoiceFilters
  $pagination: Pagination
  $sorting: Sorting
) {
  invoices(
    filters: $filters
    pagination: $pagination
    sorting: $sorting
  ) {
    items {
      id
      invoiceNumber
      customer {
        id
        name
      }
      amount
      status
      dueDate
      createdAt
    }
    totalCount
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
```

#### Task 8.2: InvoiceDashboard Page (3 hours)
**Files**:
- `apps/web/src/app/invoices/page.tsx` (create)
- Use DataTable component from Phase 2

**Features**:
- Display invoices in table
- Pagination controls
- Sort by column
- Filter by status
- Search by number

#### Task 8.3: Real-Time Updates (1 hour)
**Files**:
- `apps/web/src/lib/graphql/subscriptions/invoices.ts` (create)

```graphql
subscription OnInvoiceUpdated($organizationId: ID!) {
  invoiceUpdated(organizationId: $organizationId) {
    id
    invoiceNumber
    status
    amount
  }
}
```

**Acceptance Criteria**:
- [x] Invoice list displays
- [x] Pagination works
- [x] Sorting works
- [x] Filtering works
- [x] Real-time updates reflect in table

---

### Day 9: Create & Update

#### Task 9.1: Create Invoice Form (3 hours)
**Files**:
- `apps/web/src/app/invoices/new/page.tsx` (create)
- `apps/web/src/components/invoice-form.tsx` (create)

**Form Fields**:
- Customer (dropdown)
- Invoice date
- Due date
- Line items (add/remove)
- Subtotal, tax (15%), total
- Notes

#### Task 9.2: Create Mutation (2 hours)
**Files**:
- `apps/web/src/lib/graphql/mutations/invoices.ts` (create)

```graphql
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    id
    invoiceNumber
    amount
    status
  }
}
```

**Optimistic Update**:
```typescript
optimisticResponse: {
  createInvoice: {
    __typename: 'Invoice',
    id: 'temp-id',
    invoiceNumber: 'INV-PENDING',
    amount: formData.amount,
    status: 'DRAFT',
  },
}
```

#### Task 9.3: Edit Invoice (1 hour)
**Files**:
- `apps/web/src/app/invoices/[id]/edit/page.tsx` (create)
- Reuse InvoiceForm component
- Load existing data, populate form
- Update mutation

**Acceptance Criteria**:
- [x] Create form validates input
- [x] Create mutation works
- [x] Optimistic update shows immediately
- [x] Success toast displayed
- [x] Edit form loads existing data
- [x] Update mutation works

---

### Day 10: Delete & File Upload

#### Task 10.1: Delete Invoice (2 hours)
**Files**:
- `apps/web/src/components/delete-invoice-dialog.tsx` (create)
- Use AlertDialog from Phase 2

```graphql
mutation DeleteInvoice($id: ID!) {
  deleteInvoice(id: $id)
}
```

**Undo Functionality**:
- Show toast with "Undo" button
- 5-second window to undo
- If not undone, delete confirmed

#### Task 10.2: File Upload (3 hours)
**Files**:
- `apps/web/src/components/file-upload.tsx` (create)
- `apps/web/src/lib/graphql/mutations/files.ts` (create)

```graphql
mutation UploadFile($file: Upload!) {
  uploadFile(file: $file) {
    id
    filename
    url
    size
  }
}
```

**Features**:
- Drag-and-drop upload
- Progress indicator
- File preview
- Delete attachment

#### Task 10.3: End-to-End Testing (1 hour)
**Complete CRUD Test**:
1. Create invoice → Success ✓
2. View in list → Appears ✓
3. Edit invoice → Updates ✓
4. Upload attachment → Shows ✓
5. Delete invoice → Confirms ✓
6. Undo delete → Restores ✓

**Acceptance Criteria**:
- [x] Delete confirmation works
- [x] Undo delete works (5 sec window)
- [x] File upload functional
- [x] Progress indicator displays
- [x] Attachments display and download
- [x] Full CRUD cycle works end-to-end

---

## ✅ Success Criteria Summary

### Must Have (MVP) - 10/10
1. ✅ Frontend queries 2+ services via GraphQL
2. ✅ Authentication flow (login, logout, protected routes)
3. ✅ Real-time notifications in UI
4. ✅ Toast notifications on actions
5. ✅ Command palette navigates routes
6. ✅ Invoice CRUD complete
7. ✅ Forms submit with validation
8. ✅ Loading states everywhere
9. ✅ Error handling with messages
10. ✅ Optimistic UI updates

### Should Have (Enhanced) - 7/10 Target
1. ✅ Desktop push notifications
2. ✅ Keyboard shortcuts
3. ✅ Search in command palette
4. ✅ Recent actions tracking
5. ✅ File upload
6. ✅ Subscription reconnection
7. ✅ Undo delete (5 sec)

### Nice to Have (Polish) - 3/10 Target
1. ⏳ Notification sounds
2. ⏳ Animated transitions
3. ⏳ Advanced table filters

---

## 🚨 Risk Management

### Critical Risks
1. **GraphQL Gateway Issues** → Test connection Day 1
2. **WebSocket Failures** → Implement retry + fallback
3. **Auth Complexity** → Start simple, iterate

### Mitigation Strategies
- Daily health checks on backend services
- Fallback to polling if subscriptions fail
- Mock data mode for frontend development
- Comprehensive error logging

---

## 📊 Daily Standup Template

### Questions to Answer Daily
1. What did I complete yesterday?
2. What am I working on today?
3. Are there any blockers?
4. Is the timeline still realistic?

### Example Day 2 Standup
- ✅ Completed: Login page, ApolloProvider setup
- 🔄 Today: Master data queries, error handling
- 🚫 Blockers: None
- ⏱️ Timeline: On track

---

## 🎉 Phase 3 Completion Criteria

### Ready to Mark Complete When:
- [x] All 37 tasks completed
- [x] All 10 MVP criteria met
- [x] At least 7/10 enhanced features
- [x] Zero critical bugs
- [x] All tests passing
- [x] Demo video recorded
- [x] Documentation updated

---

**Plan Created**: January 30, 2025
**Ready to Begin**: ✅ YES
**First Task**: Environment Configuration (30 minutes)

Let's build! 🚀