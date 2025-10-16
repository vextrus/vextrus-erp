import { useState, useCallback } from 'react'

/**
 * Custom hook for managing boolean toggle state
 * @param initialState - The initial boolean state (default: false)
 * @returns [state, toggle, set] - The state, toggle function, and setter function
 *
 * @example
 * const [isOpen, toggleOpen, setOpen] = useToggle(false)
 * toggleOpen() // toggles the state
 * setOpen(true) // sets the state to true
 */
export function useToggle(
  initialState: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [state, setState] = useState(initialState)

  const toggle = useCallback(() => setState((state) => !state), [])
  const set = useCallback((value: boolean) => setState(value), [])

  return [state, toggle, set]
}
