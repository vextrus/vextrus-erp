import { useState } from 'react'

/**
 * Custom hook for copying text to clipboard
 * @returns [copiedText, copy] - The copied text and a function to copy text
 *
 * @example
 * const [copiedText, copy] = useCopyToClipboard()
 * const handleCopy = async () => {
 *   const success = await copy('Text to copy')
 *   if (success) {
 *     console.log('Copied:', copiedText)
 *   }
 * }
 */
export function useCopyToClipboard(): [
  string | null,
  (text: string) => Promise<boolean>
] {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copy = async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported')
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopiedText(null)
      return false
    }
  }

  return [copiedText, copy]
}
