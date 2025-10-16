# Custom Hooks

This document describes the custom React hooks available in the Vextrus ERP application and patterns for creating new hooks.

## Available Custom Hooks

### 1. useLocalStorage

Synchronize state with localStorage.

```typescript
import { useLocalStorage } from '@/lib/hooks'

function UserPreferences() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark')
  const [language, setLanguage] = useLocalStorage('language', 'en')

  return (
    <div>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="bn">বাংলা</option>
      </select>
    </div>
  )
}
```

**Features:**
- Type-safe with generics
- SSR-safe (checks for window)
- Error handling
- Automatic JSON serialization

**API:**
```typescript
useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void]
```

### 2. useDebounce

Debounce a value to delay updates.

```typescript
import { useDebounce } from '@/lib/hooks'

function SearchInput() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    if (debouncedQuery) {
      // API call only after user stops typing for 500ms
      searchAPI(debouncedQuery)
    }
  }, [debouncedQuery])

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

**Features:**
- Customizable delay
- Cleanup on unmount
- Performance optimization

**API:**
```typescript
useDebounce<T>(value: T, delay?: number): T
```

**Default delay:** 500ms

### 3. useMediaQuery

Detect media query matches.

```typescript
import { useMediaQuery } from '@/lib/hooks'

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  if (isMobile) {
    return <MobileView />
  }

  if (isTablet) {
    return <TabletView />
  }

  return <DesktopView />
}
```

**Features:**
- Reactive to window resize
- Multiple queries supported
- Common breakpoints

**API:**
```typescript
useMediaQuery(query: string): boolean
```

**Common Queries:**
```typescript
const isMobile = useMediaQuery('(max-width: 768px)')
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
const isDesktop = useMediaQuery('(min-width: 1025px)')
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
```

### 4. useToggle

Manage boolean state with toggle function.

```typescript
import { useToggle } from '@/lib/hooks'

function Sidebar() {
  const [isOpen, toggle, setIsOpen] = useToggle(true)

  return (
    <div>
      <button onClick={toggle}>Toggle Sidebar</button>
      <button onClick={() => setIsOpen(false)}>Close</button>
      {isOpen && <SidebarContent />}
    </div>
  )
}
```

**Features:**
- Toggle function (no arguments needed)
- Explicit setter function
- Type-safe

**API:**
```typescript
useToggle(initialState?: boolean): [boolean, () => void, (value: boolean) => void]
```

**Returns:**
- `[0]`: Current state
- `[1]`: Toggle function
- `[2]`: Set function

### 5. useCopyToClipboard

Copy text to clipboard.

```typescript
import { useCopyToClipboard } from '@/lib/hooks'

function ShareButton({ text }: { text: string }) {
  const [copiedText, copy] = useCopyToClipboard()

  const handleCopy = async () => {
    const success = await copy(text)
    if (success) {
      console.log('Copied:', copiedText)
    }
  }

  return (
    <button onClick={handleCopy}>
      {copiedText === text ? 'Copied!' : 'Copy'}
    </button>
  )
}
```

**Features:**
- Async clipboard API
- Success/failure feedback
- Browser compatibility check

**API:**
```typescript
useCopyToClipboard(): [string | null, (text: string) => Promise<boolean>]
```

**Returns:**
- `[0]`: Last copied text
- `[1]`: Copy function (returns Promise<boolean>)

### 6. useClickOutside

Detect clicks outside an element.

```typescript
import { useClickOutside } from '@/lib/hooks'
import { useRef } from 'react'

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropdownRef, () => {
    setIsOpen(false)
  })

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <DropdownMenu />}
    </div>
  )
}
```

**Features:**
- Mouse and touch events
- Ref-based detection
- Cleanup on unmount

**API:**
```typescript
useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
): void
```

## Creating Custom Hooks

### Hook Naming Convention

All hooks must start with `use`:

```typescript
// ✅ Good
useAuth()
useInvoices()
useDebounce()

// ❌ Bad
getAuth()
fetchInvoices()
debounce()
```

### Hook Structure Template

```typescript
import { useState, useEffect } from 'react'

/**
 * Description of what the hook does
 *
 * @param param1 - Description
 * @param param2 - Description
 * @returns Description of return value
 *
 * @example
 * ```tsx
 * const result = useCustomHook(arg1, arg2)
 * ```
 */
export function useCustomHook(param1: string, param2: number) {
  const [state, setState] = useState<YourType>(initialValue)

  useEffect(() => {
    // Side effects here

    return () => {
      // Cleanup here
    }
  }, [param1, param2])

  // Helper functions
  const helperFunction = () => {
    // Logic here
  }

  // Return value
  return { state, helperFunction }
}
```

### Best Practices

#### 1. Single Responsibility

Each hook should do one thing well:

```typescript
// ✅ Good: Focused hooks
const user = useUser(userId)
const permissions = usePermissions(user)
const canEdit = useCanEdit(user, resource)

// ❌ Avoid: Kitchen sink hook
const { user, permissions, canEdit, theme, notifications } = useEverything()
```

#### 2. Return Consistent Types

```typescript
// ✅ Good: Tuple for 2-3 values
export function useToggle(initial: boolean): [boolean, () => void, (v: boolean) => void] {
  // Implementation
}

// ✅ Good: Object for 4+ values or named returns
export function useInvoices() {
  return {
    invoices,
    isLoading,
    error,
    refetch,
    create,
    update,
    delete,
  }
}
```

#### 3. Handle Cleanup

Always cleanup side effects:

```typescript
export function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setInterval(callback, delay)

    // Cleanup function
    return () => clearInterval(id)
  }, [callback, delay])
}
```

#### 4. Type Safety

Use TypeScript generics for reusable hooks:

```typescript
export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Implementation

  return { data, loading, error }
}

// Usage
const { data } = useFetch<Invoice[]>('/api/invoices')
// data is typed as Invoice[] | null
```

#### 5. Document with Examples

Always include usage examples:

```typescript
/**
 * Hook for managing pagination state
 *
 * @example
 * ```tsx
 * function DataTable() {
 *   const { page, pageSize, setPage, setPageSize } = usePagination()
 *
 *   return (
 *     <div>
 *       <table>{/* ... */}</table>
 *       <Pagination
 *         page={page}
 *         pageSize={pageSize}
 *         onPageChange={setPage}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function usePagination(initialPage = 1, initialPageSize = 10) {
  // Implementation
}
```

## Common Hook Patterns

### 1. Data Fetching Hook

```typescript
export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchInvoices() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/invoices')
        const data = await response.json()

        if (!cancelled) {
          setInvoices(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchInvoices()

    return () => {
      cancelled = true
    }
  }, [])

  return { invoices, isLoading, error }
}
```

### 2. Form Field Hook

```typescript
export function useFormField<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [error, setError] = useState<string>('')
  const [touched, setTouched] = useState(false)

  const handleChange = (newValue: T) => {
    setValue(newValue)
    if (touched) {
      setError('')
    }
  }

  const handleBlur = () => {
    setTouched(true)
  }

  const validate = (validator: (value: T) => string | undefined) => {
    const error = validator(value)
    setError(error || '')
    return !error
  }

  const reset = () => {
    setValue(initialValue)
    setError('')
    setTouched(false)
  }

  return {
    value,
    error,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
  }
}
```

### 3. Previous Value Hook

```typescript
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

// Usage
const [count, setCount] = useState(0)
const previousCount = usePrevious(count)
```

### 4. Window Size Hook

```typescript
export function useWindowSize() {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}
```

### 5. Mounted Hook

```typescript
export function useIsMounted() {
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  return isMounted
}

// Usage
const isMounted = useIsMounted()

async function fetchData() {
  const data = await api.getData()
  if (isMounted.current) {
    setData(data)
  }
}
```

## Testing Custom Hooks

### Using @testing-library/react-hooks

```typescript
import { renderHook, act } from '@testing-library/react'
import { useToggle } from './useToggle'

describe('useToggle', () => {
  it('should toggle boolean value', () => {
    const { result } = renderHook(() => useToggle(false))

    expect(result.current[0]).toBe(false)

    act(() => {
      result.current[1]() // Toggle
    })

    expect(result.current[0]).toBe(true)
  })

  it('should set explicit value', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[2](true) // Set to true
    })

    expect(result.current[0]).toBe(true)
  })
})
```

## Summary

**Available Hooks:**
- `useLocalStorage` - Sync state with localStorage
- `useDebounce` - Delay value updates
- `useMediaQuery` - Detect media query matches
- `useToggle` - Manage boolean state
- `useCopyToClipboard` - Copy to clipboard
- `useClickOutside` - Detect outside clicks

**Hook Best Practices:**
1. ✅ Start with `use` prefix
2. ✅ Single responsibility
3. ✅ Type-safe with TypeScript
4. ✅ Handle cleanup
5. ✅ Document with examples
6. ✅ Return consistent types
7. ✅ Write tests

**Quick Reference:**
```typescript
import {
  useLocalStorage,
  useDebounce,
  useMediaQuery,
  useToggle,
  useCopyToClipboard,
  useClickOutside,
} from '@/lib/hooks'
```
