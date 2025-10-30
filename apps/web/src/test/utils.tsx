import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

// Add any providers here that components need
interface WrapperProps {
  children: ReactNode
}

function Wrapper({ children }: WrapperProps) {
  return <>{children}</>
}

// Custom render function that includes providers
function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { render }
