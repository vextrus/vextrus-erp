---
task: h-integrate-frontend-backend-finance-module
branch: feature/integrate-frontend-backend-finance
status: pending
created: 2025-10-14
modules: [web, api-gateway, auth, finance, organization, shared-ui]
priority: high
estimated_days: 10-14
complexity: 38
---

# High Priority: Integrate Frontend with Backend - Finance Module First Stage

## Problem/Goal

**Transform infrastructure into working application.** The backend is now stable with 40 services operational, authentication complete, and API Gateway ready. The frontend has 30+ UI components built but with ZERO backend integration. This task bridges the gap by implementing complete GraphQL integration and delivering the first fully functional business module (Finance) as proof-of-concept and pattern establishment.

**Core Objective**: Enable users to log in, view financial data, and manage invoices through a working web application connected to real backend services.

## Context

### Current State Analysis

**Backend Status: STABLE ✅**
- 40 Docker containers running (36 healthy)
- GraphQL Federation v2 operational at http://localhost:4000/graphql
- JWT authentication with guards on all resolvers (100% coverage)
- Finance service fully functional with:
  - Invoice management (CRUD operations)
  - Chart of accounts
  - Journal entries
  - All operations protected with authentication
- Apollo Sandbox working for GraphQL testing
- Observability stack complete (Grafana, Prometheus, Jaeger)

**Frontend Status: FOUNDATION READY 📦**
- Next.js 14.2.5 with App Router configured
- TypeScript + Tailwind CSS 3.4.7
- 30+ UI components built and tested:
  - Forms (React Hook Form + Zod)
  - Data tables (TanStack Table with virtualization)
  - Navigation (Sidebar, Header, Breadcrumbs)
  - Feedback (Alerts, Dialogs, Toast)
  - Loading states and skeletons
- Testing infrastructure (Vitest, Playwright, Storybook)
- Dependencies installed:
  - Apollo Client 3.11.4
  - TanStack Query 5.51.11
  - Zustand 5.0.8
  - Framer Motion 11.3.19

**Critical Gap: NO INTEGRATION ❌**
- No GraphQL queries or mutations defined
- No Apollo Client configured
- No authentication flow implemented
- No backend data displayed
- Just component demos and examples

**Available Documentation:**
- `docs/guides/FRONTEND_INTEGRATION_GUIDE.md` (850+ lines) - Complete integration patterns with:
  - Authentication flow examples
  - Apollo Client setup code
  - Query examples for all services
  - Error handling patterns
  - Token refresh implementation

### Why Finance Module First?

1. **Backend Maturity**: Finance service is fully operational with complete authentication
2. **Business Value**: Financial visibility is highest priority for ERP systems
3. **Complexity Balance**: Rich enough to establish patterns, not overwhelming
4. **Pattern Establishment**: Will define reusable patterns for:
   - GraphQL queries and mutations
   - Form handling with validation
   - Data tables with server-side operations
   - Real-time updates
   - Error handling and loading states

### Previous Work Reference

**Completed Task**: `h-implement-frontend-foundation-worldclass`
- Built comprehensive UI component library
- Established design system with Tailwind
- Set up testing infrastructure
- Configured build tooling

**Difference from Previous**:
- **Previous**: Built component library (87 complexity, 10 weeks)
- **This Task**: Connect components to backend (38 complexity, 2 weeks)
- **Previous**: Focus on design and UX
- **This Task**: Focus on integration and data flow

## Technical Architecture

### Technology Stack

**Core Integration Layer:**
```yaml
GraphQL Client: Apollo Client 3.11.4
  - @apollo/experimental-nextjs-app-support for App Router
  - registerApolloClient for Server Components
  - ApolloNextAppProvider for Client Components
  - SSRMultipartLink for server-side rendering

Type Generation: GraphQL Code Generator
  - @graphql-codegen/cli
  - @graphql-codegen/typescript
  - @graphql-codegen/typescript-operations
  - @graphql-codegen/typescript-react-apollo
  - Client preset for modern setup

State Management:
  - Apollo Client cache for GraphQL data
  - Zustand for client-side UI state
  - TanStack Query (optional, for REST endpoints)

Authentication:
  - JWT tokens from Auth service
  - HttpOnly cookies for token storage
  - Middleware for protected routes
  - Auto-refresh mechanism
```

**Next.js 14 App Router Patterns:**
```typescript
// Server Components (default)
- Initial data fetching with await
- React.cache for memoization
- Suspense boundaries for loading states

// Client Components ('use client')
- Interactive features (forms, mutations)
- Apollo hooks (useQuery, useMutation)
- Real-time updates with subscriptions

// Middleware
- Route protection
- Token validation
- Redirects for authentication
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Server Components (RSC)                               │ │
│  │  - Initial data fetching                               │ │
│  │  - SEO-friendly rendering                              │ │
│  │  - Suspense boundaries                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Client Components ('use client')                      │ │
│  │  - Forms and mutations                                 │ │
│  │  - Interactive features                                │ │
│  │  - Apollo hooks                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware                                            │ │
│  │  - Authentication checks                               │ │
│  │  - Route protection                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ GraphQL
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (Apollo Federation)                │
│              http://localhost:4000/graphql                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
        ┌──────────────┬──────────────┬──────────────┐
        │  Auth        │  Finance     │  Master Data │
        │  Service     │  Service     │  Service     │
        └──────────────┴──────────────┴──────────────┘
```

## Implementation Phases

### Phase 1: Backend Integration Foundation (3-4 days)

**Objective**: Set up Apollo Client and GraphQL infrastructure

**Tasks:**

1. **Install Dependencies**
   ```bash
   pnpm add @apollo/experimental-nextjs-app-support
   pnpm add -D @graphql-codegen/cli @graphql-codegen/client-preset
   pnpm add -D @graphql-codegen/typescript @graphql-codegen/typescript-operations
   pnpm add -D @graphql-codegen/typescript-react-apollo
   ```

2. **Configure Apollo Client**
   - Create `lib/apollo/apollo-client.ts` with:
     - Server-side client using `registerApolloClient`
     - Client-side provider using `ApolloNextAppProvider`
     - HTTP link pointing to API Gateway
     - Auth link for JWT token injection
     - Error link for token refresh logic
   - Update `app/providers.tsx` to include Apollo Provider

3. **Set Up GraphQL Code Generator**
   - Create `codegen.ts` configuration:
     - Schema: `http://localhost:4000/graphql`
     - Documents: `src/**/*.{ts,tsx}`
     - Generates: TypeScript types + React Apollo hooks
     - Client preset with typed document nodes
   - Add script: `"codegen": "graphql-codegen"`
   - Add script: `"codegen:watch": "graphql-codegen --watch"`

4. **Create GraphQL Operations**
   - Define queries in `lib/graphql/queries/`:
     - `auth.graphql` (login, me, register)
     - `finance.graphql` (invoices, accounts, journal entries)
   - Define mutations in `lib/graphql/mutations/`:
     - `auth.mutations.graphql` (login, logout, refresh)
     - `finance.mutations.graphql` (createInvoice, updateInvoice)
   - Run codegen to generate TypeScript types

5. **Test GraphQL Connection**
   - Create simple test component that fetches data
   - Verify types are generated correctly
   - Confirm data flows from backend to frontend

**Deliverables:**
- [ ] Apollo Client configured for both server and client
- [ ] GraphQL Code Generator working with watch mode
- [ ] TypeScript types generated from schema
- [ ] Test query successfully fetches data from backend

---

### Phase 2: Authentication Flow (3-4 days)

**Objective**: Implement complete user authentication system

**Tasks:**

1. **Create Authentication Context**
   - Create `lib/auth/auth-context.tsx`:
     - AuthProvider component
     - useAuth hook
     - User state management
     - Token storage in HttpOnly cookies
     - Auto-refresh logic

2. **Build Login Page**
   - Create `app/login/page.tsx`:
     - Login form with email/password
     - Form validation using Zod schema
     - Error handling and display
     - Loading states
     - Redirect after successful login
   - Use existing form components from component library

3. **Build Registration Page**
   - Create `app/register/page.tsx`:
     - Registration form with validation
     - Password strength indicator
     - Terms acceptance checkbox
     - Success message with redirect

4. **Implement Protected Routes**
   - Create `middleware.ts`:
     - Check for valid JWT token
     - Redirect unauthenticated users to login
     - Handle token expiration
     - Allow public routes (login, register)
   - Protected routes: `/dashboard`, `/finance`, `/settings`
   - Public routes: `/`, `/login`, `/register`

5. **Create Auth Utilities**
   - Create `lib/auth/session.ts`:
     - `getSession()` - Verify and decrypt session
     - `setSession()` - Set HttpOnly cookie
     - `deleteSession()` - Clear session on logout
   - Create `lib/auth/token-refresh.ts`:
     - Background token refresh
     - Handle refresh failures
     - Automatic logout on multiple failures

6. **Build User Menu Component**
   - Update `Header` component:
     - Display user info when authenticated
     - Logout button
     - User dropdown menu
     - Profile link
   - Integrate with existing `UserMenu` component

**Deliverables:**
- [ ] Users can register with email/password
- [ ] Users can log in and receive JWT token
- [ ] Protected routes require authentication
- [ ] Unauthenticated users redirected to login
- [ ] Logout functionality works correctly
- [ ] Token auto-refresh prevents session expiration
- [ ] User info displayed in header when logged in

---

### Phase 3: Application Shell (2-3 days)

**Objective**: Create main layout and navigation structure

**Tasks:**

1. **Build Main Layout**
   - Create `app/(dashboard)/layout.tsx`:
     - Sidebar navigation
     - Header with user menu
     - Main content area
     - Breadcrumb navigation
     - Mobile-responsive sidebar
   - Use existing `Sidebar` and `Header` components

2. **Create Navigation Configuration**
   - Create `lib/navigation/nav-config.ts`:
     - Define navigation items:
       ```typescript
       {
         label: 'Dashboard',
         href: '/dashboard',
         icon: HomeIcon,
       },
       {
         label: 'Finance',
         icon: DollarSignIcon,
         children: [
           { label: 'Invoices', href: '/finance/invoices' },
           { label: 'Chart of Accounts', href: '/finance/accounts' },
           { label: 'Journal Entries', href: '/finance/journal' },
         ]
       }
       ```
     - Role-based visibility
     - Active state detection

3. **Implement Theme Provider**
   - Integrate `next-themes` for dark/light mode:
     - Theme toggle in header
     - Persist theme preference
     - System theme detection
   - Update CSS variables for themes

4. **Create Loading States**
   - Create `app/(dashboard)/loading.tsx`:
     - Full-page skeleton
     - Use existing `Skeleton` components
   - Create route-specific loading states

5. **Create Error Boundaries**
   - Create `app/(dashboard)/error.tsx`:
     - Graceful error display
     - Retry button
     - Error logging
   - Create global error handler

6. **Build Dashboard Home Page**
   - Create `app/(dashboard)/dashboard/page.tsx`:
     - Welcome message with user name
     - Quick stats cards (placeholder for now)
     - Recent activity widget
     - Navigation shortcuts
   - Use existing `Card` components

**Deliverables:**
- [ ] Main dashboard layout with sidebar and header
- [ ] Navigation menu with Finance submenu
- [ ] Dark/light mode toggle working
- [ ] Loading states show while fetching data
- [ ] Error boundaries catch and display errors gracefully
- [ ] Dashboard home page accessible after login
- [ ] Breadcrumb navigation shows current location

---

### Phase 4: Finance Module Implementation (3-4 days)

**Objective**: Build complete Finance module with real backend integration

**Tasks:**

1. **Invoice List Page**
   - Create `app/(dashboard)/finance/invoices/page.tsx`:
     - Fetch invoices using `useQuery`
     - Display in data table with:
       - Columns: Invoice #, Customer, Date, Amount, Status
       - Sorting by date, amount, status
       - Filtering by status, date range
       - Search by invoice number or customer
       - Pagination (server-side)
     - Use existing `DataTable` component
     - Loading skeleton while fetching
     - Empty state when no invoices

2. **Invoice Detail Page**
   - Create `app/(dashboard)/finance/invoices/[id]/page.tsx`:
     - Fetch single invoice by ID
     - Display invoice details:
       - Header with invoice number and status
       - Customer information
       - Line items table
       - Totals (subtotal, tax, total)
       - Payment information
       - Audit trail (created, updated dates)
     - Actions: Edit, Delete, Print, Email
     - Use existing `Card`, `Badge`, `Button` components

3. **Create Invoice Form**
   - Create `app/(dashboard)/finance/invoices/new/page.tsx`:
     - Multi-step form wizard:
       - Step 1: Customer selection (searchable dropdown)
       - Step 2: Line items (dynamic add/remove)
       - Step 3: Totals and notes
       - Step 4: Review and submit
     - Form validation with Zod
     - Optimistic updates on submit
     - Success toast notification
     - Redirect to invoice detail after creation
   - Use existing `FormField`, `Input`, `Select` components

4. **Chart of Accounts Page**
   - Create `app/(dashboard)/finance/accounts/page.tsx`:
     - Fetch accounts using `useQuery`
     - Display in hierarchical tree structure:
       - Account code, name, type, balance
       - Collapsible parent accounts
       - Click to view account details
     - Search and filter functionality
     - Use existing `Accordion` or custom tree component

5. **Account Detail View**
   - Create `app/(dashboard)/finance/accounts/[id]/page.tsx`:
     - Account information
     - Recent transactions
     - Balance history chart (placeholder for now)
     - Edit account button

6. **Implement Real-time Features**
   - Add GraphQL subscriptions for:
     - New invoices created
     - Invoice status updates
   - Show toast notifications for real-time updates
   - Update cache automatically

7. **Add Error Handling**
   - Network error handling with retry
   - GraphQL error display (validation, auth errors)
   - Form submission error handling
   - Timeout handling for slow queries

**Deliverables:**
- [ ] Invoice list page with filtering, sorting, search
- [ ] Invoice detail page with full information
- [ ] Create invoice form with multi-step wizard
- [ ] Chart of accounts page with hierarchical view
- [ ] Account detail page with transactions
- [ ] Real-time updates for invoice changes
- [ ] Proper error handling throughout
- [ ] Loading states during all operations
- [ ] Success/error toast notifications

---

## Success Criteria

### Functional Requirements

**Authentication:**
- [ ] User can register new account
- [ ] User can log in with email/password
- [ ] Invalid credentials show appropriate error
- [ ] Token automatically refreshes before expiration
- [ ] User can log out successfully
- [ ] Protected routes redirect unauthenticated users
- [ ] User info displays in header when logged in

**Navigation:**
- [ ] Dashboard layout renders with sidebar and header
- [ ] Sidebar navigation shows Finance menu
- [ ] Clicking nav items navigates to correct pages
- [ ] Breadcrumbs show current location
- [ ] Active nav item is highlighted
- [ ] Mobile sidebar can be toggled

**Finance Module:**
- [ ] Invoice list displays data from backend
- [ ] User can filter invoices by status
- [ ] User can search invoices
- [ ] User can sort invoices by columns
- [ ] Pagination works correctly
- [ ] Clicking invoice opens detail view
- [ ] Invoice detail shows complete information
- [ ] User can create new invoice
- [ ] Form validation prevents invalid data
- [ ] New invoice appears in list after creation
- [ ] Chart of accounts displays all accounts
- [ ] Accounts show correct hierarchy
- [ ] Account detail shows transactions

### Technical Requirements

**Type Safety:**
- [ ] All GraphQL operations have generated TypeScript types
- [ ] No `any` types in GraphQL-related code
- [ ] Form schemas use Zod with proper typing
- [ ] Component props are properly typed

**Performance:**
- [ ] Initial page load < 3 seconds
- [ ] Route transitions < 500ms
- [ ] Data fetching shows loading states
- [ ] No unnecessary re-renders
- [ ] Images optimized with next/image

**Code Quality:**
- [ ] ESLint passes with no errors
- [ ] TypeScript compiles with no errors
- [ ] Components follow existing patterns
- [ ] Reusable utilities extracted to lib/
- [ ] No console.log statements in production code

**Testing:**
- [ ] Build completes successfully
- [ ] No runtime errors in browser console
- [ ] Works in Chrome, Firefox, Safari
- [ ] Responsive design works on mobile

### User Experience

**Loading States:**
- [ ] All data fetching shows skeleton or spinner
- [ ] Forms show loading state during submission
- [ ] Buttons disable during async operations

**Error Handling:**
- [ ] Network errors show user-friendly message
- [ ] Form validation errors display clearly
- [ ] GraphQL errors are properly formatted
- [ ] Retry option available for failed requests

**Feedback:**
- [ ] Success toast after creating invoice
- [ ] Confirmation dialog before destructive actions
- [ ] Form field errors show inline
- [ ] Optimistic updates for better perceived performance

## Reference Documentation

### Internal Documentation
- **Frontend Integration Guide**: `docs/guides/FRONTEND_INTEGRATION_GUIDE.md`
  - Complete authentication flow examples
  - Apollo Client setup code
  - Query examples for all services
  - Error handling patterns
  - Token refresh implementation

### External Resources
- [Apollo Client Next.js Integration](https://www.apollographql.com/blog/apollo-client-integration-nextjs-officially-released)
- [Next.js 14 App Router Docs](https://nextjs.org/docs/app)
- [GraphQL Code Generator Docs](https://the-guild.dev/graphql/codegen)
- [TanStack Query + GraphQL](https://tanstack.com/query/latest/docs/framework/react/graphql)

## Dependencies

### Backend Services Must Be Running
- API Gateway: http://localhost:4000/graphql
- Auth Service: http://localhost:3001/graphql
- Finance Service: http://localhost:3014/graphql
- PostgreSQL database operational
- Redis cache operational

### Environment Variables Required
```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:4000/graphql
NEXT_PUBLIC_API_GATEWAY_WS_URL=ws://localhost:4000/graphql
```

## Out of Scope (For This Task)

**Not Included:**
- ❌ Advanced data visualizations (charts, graphs)
- ❌ Reporting and analytics features
- ❌ Email notifications
- ❌ PDF generation and export
- ❌ Advanced search with filters
- ❌ Bulk operations
- ❌ Role-based access control UI
- ❌ Other business modules (Inventory, HR, etc.)
- ❌ PWA features
- ❌ Offline mode
- ❌ AI features
- ❌ Real-time collaboration
- ❌ Mobile app
- ❌ Advanced animations

**These Will Come Later:**
- Second stage will add more Finance features
- Third stage will implement additional modules
- Fourth stage will add advanced features

## Risk Mitigation

### Potential Risks & Solutions

**Risk 1: GraphQL Schema Changes**
- **Mitigation**: Use GraphQL Codegen to catch type mismatches early
- **Solution**: Run codegen in watch mode during development

**Risk 2: Authentication Token Issues**
- **Mitigation**: Comprehensive error handling in auth link
- **Solution**: Automatic retry with backoff for network errors

**Risk 3: Performance with Large Data Sets**
- **Mitigation**: Implement pagination from the start
- **Solution**: Use virtual scrolling for very large lists

**Risk 4: Apollo Client Cache Complexity**
- **Mitigation**: Start with simple cache policies
- **Solution**: Add normalization only when needed

**Risk 5: Time Estimates Too Optimistic**
- **Mitigation**: Break phases into smaller tasks
- **Solution**: Focus on MVP functionality first

## Next Steps After Completion

**Immediate Follow-up Tasks:**
1. Add more Finance features (payments, expenses, reports)
2. Implement Master Data module (customers, vendors, products)
3. Add Organization settings page
4. Implement user profile management
5. Add notification system

**Future Enhancements:**
1. Data visualization with charts
2. Advanced filtering and search
3. Bulk operations
4. Export functionality
5. Mobile-responsive optimizations

## Definition of Done

**Code Complete:**
- [ ] All phases implemented and tested
- [ ] All success criteria met
- [ ] No TypeScript or ESLint errors
- [ ] Build succeeds without warnings

**Documentation:**
- [ ] Code includes inline comments where needed
- [ ] Complex logic has JSDoc comments
- [ ] README updated with setup instructions

**Testing:**
- [ ] Manually tested all user flows
- [ ] Tested in multiple browsers
- [ ] Tested responsive design
- [ ] No console errors or warnings

**Review:**
- [ ] Code follows project conventions
- [ ] Reusable patterns extracted
- [ ] No duplicate code
- [ ] Performance is acceptable

**Deployment Ready:**
- [ ] Environment variables documented
- [ ] Build optimized for production
- [ ] No hard-coded URLs or credentials
- [ ] Error tracking configured

---

**Estimated Timeline**: 10-14 days
**Priority**: High (Unblocks entire frontend development)
**Complexity**: 38 points (Medium-High)

**Success Indicator**: A user can open the web app, log in, navigate to the Finance section, view existing invoices, and create a new invoice - all with data flowing from the real backend services.
