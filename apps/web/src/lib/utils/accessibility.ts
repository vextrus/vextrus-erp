/**
 * Accessibility Utilities
 *
 * Helper functions for creating accessible components
 */

/**
 * Generates an accessible ARIA label
 *
 * @param text - The text content
 * @param type - The type of element (e.g., 'button', 'link', 'input')
 * @returns Formatted ARIA label
 *
 * @example
 * ```tsx
 * aria-label={generateAriaLabel('Settings', 'button')}
 * // Returns: "Settings button"
 * ```
 */
export function generateAriaLabel(text: string, type: string): string {
  return `${text} ${type}`
}

/**
 * Creates a unique ID for accessibility purposes
 *
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 *
 * @example
 * ```tsx
 * const labelId = createId('form-label')
 * // Returns: "form-label-a7b3c9f2"
 * ```
 */
export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Gets common ARIA properties for form elements
 *
 * @param label - Accessible label for the element
 * @param describedBy - ID of element describing this element
 * @param required - Whether the field is required
 * @returns Object with ARIA properties
 *
 * @example
 * ```tsx
 * <input {...getAriaProps('Email address', 'email-help', true)} />
 * // Returns: {
 * //   'aria-label': 'Email address',
 * //   'aria-describedby': 'email-help',
 * //   'aria-required': true
 * // }
 * ```
 */
export function getAriaProps(
  label?: string,
  describedBy?: string,
  required?: boolean
) {
  return {
    ...(label && { 'aria-label': label }),
    ...(describedBy && { 'aria-describedby': describedBy }),
    ...(required && { 'aria-required': required }),
  }
}

/**
 * Creates ARIA props for a live region
 *
 * @param politeness - The politeness level ('polite' | 'assertive' | 'off')
 * @param atomic - Whether the entire region should be read
 * @returns Object with live region ARIA properties
 *
 * @example
 * ```tsx
 * <div {...getLiveRegionProps('polite', true)}>
 *   Form submitted successfully
 * </div>
 * ```
 */
export function getLiveRegionProps(
  politeness: 'polite' | 'assertive' | 'off' = 'polite',
  atomic: boolean = true
) {
  return {
    'aria-live': politeness,
    'aria-atomic': atomic,
  }
}

/**
 * Gets ARIA props for an expanded/collapsed element
 *
 * @param isExpanded - Whether the element is expanded
 * @param controls - ID of the element this controls
 * @returns Object with expansion ARIA properties
 *
 * @example
 * ```tsx
 * <button {...getExpandedProps(isOpen, 'menu-content')}>
 *   Toggle Menu
 * </button>
 * ```
 */
export function getExpandedProps(isExpanded: boolean, controls?: string) {
  return {
    'aria-expanded': isExpanded,
    ...(controls && { 'aria-controls': controls }),
  }
}

/**
 * Creates ARIA props for a disabled element
 *
 * @param disabled - Whether the element is disabled
 * @param label - Optional label explaining why it's disabled
 * @returns Object with disabled ARIA properties
 *
 * @example
 * ```tsx
 * <button {...getDisabledProps(true, 'Form must be completed first')}>
 *   Submit
 * </button>
 * ```
 */
export function getDisabledProps(disabled: boolean, label?: string) {
  return {
    'aria-disabled': disabled,
    ...(disabled && label && { 'aria-label': label }),
  }
}

/**
 * Checks if an element meets WCAG color contrast requirements
 *
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param level - WCAG level ('AA' | 'AAA')
 * @returns Whether the contrast ratio meets requirements
 *
 * @example
 * ```tsx
 * const isAccessible = meetsContrastRequirement('#000000', '#FFFFFF', 'AA')
 * // Returns: true
 * ```
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background)
  const threshold = level === 'AAA' ? 7 : 4.5
  return ratio >= threshold
}

/**
 * Calculates the contrast ratio between two colors
 * Based on WCAG 2.1 guidelines
 *
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns Contrast ratio
 */
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1)
  const l2 = getRelativeLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Calculates relative luminance of a color
 * Based on WCAG 2.1 formula
 *
 * @param hex - Color in hex format
 * @returns Relative luminance value
 */
function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Converts hex color to RGB
 *
 * @param hex - Color in hex format
 * @returns RGB values as array [r, g, b]
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0]
}
