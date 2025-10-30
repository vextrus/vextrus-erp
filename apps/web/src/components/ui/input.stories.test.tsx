import { describe, it, expect } from 'vitest'
import { composeStories } from '@storybook/react'
import { render, screen } from '@/test/utils'
import * as stories from './input.stories'

// Compose all stories from input.stories.tsx
const {
  Default,
  WithValue,
  Email,
  Password,
  SearchType,
  Number,
  WithLeftIcon,
  WithRightIcon,
  WithBothIcons,
  ErrorState,
  ErrorWithIcon,
  Disabled,
  DisabledWithValue,
  ReadOnly,
  Required,
  WithMaxLength,
} = composeStories(stories)

describe('Input Stories Tests', () => {
  describe('Story Rendering', () => {
    it('renders Default story', () => {
      render(<Default />)
      const input = screen.getByPlaceholderText('Enter text...')
      expect(input).toBeInTheDocument()
    })

    it('renders WithValue story', () => {
      render(<WithValue />)
      const input = screen.getByDisplayValue('Hello, World!')
      expect(input).toBeInTheDocument()
    })

    it('renders Email story', () => {
      render(<Email />)
      const input = screen.getByPlaceholderText('you@example.com')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders Password story', () => {
      render(<Password />)
      const input = screen.getByPlaceholderText(/password/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renders SearchType story', () => {
      render(<SearchType />)
      const input = screen.getByPlaceholderText(/search/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'search')
    })

    it('renders Number story', () => {
      render(<Number />)
      const input = screen.getByPlaceholderText('0')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })
  })

  describe('Story Icons', () => {
    it('renders WithLeftIcon story with icon', () => {
      render(<WithLeftIcon />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      // Icon should be present as sibling or parent
      const container = input.parentElement
      const icon = container?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders WithRightIcon story with icon', () => {
      render(<WithRightIcon />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      // Icon should be present
      const container = input.parentElement
      const icon = container?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders WithBothIcons story with icons', () => {
      render(<WithBothIcons />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      // Both icons should be present
      const container = input.parentElement
      const icons = container?.querySelectorAll('svg')
      expect(icons?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Story States', () => {
    it('renders ErrorState story', () => {
      render(<ErrorState />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('renders ErrorWithIcon story', () => {
      render(<ErrorWithIcon />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('renders Disabled story in disabled state', () => {
      render(<Disabled />)
      const input = screen.getByPlaceholderText(/disabled/i)
      expect(input).toBeDisabled()
    })

    it('renders DisabledWithValue story', () => {
      render(<DisabledWithValue />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('renders ReadOnly story', () => {
      render(<ReadOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('renders Required story', () => {
      render(<Required />)
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })

    it('renders WithMaxLength story', () => {
      render(<WithMaxLength />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxlength')
    })
  })

  describe('Story Props', () => {
    it('Default story has placeholder', () => {
      expect(Default.args).toBeDefined()
      expect(Default.args?.placeholder).toBe('Enter text...')
    })

    it('WithValue story has defaultValue', () => {
      expect(WithValue.args).toBeDefined()
      expect(WithValue.args?.defaultValue).toBe('Hello, World!')
    })

    it('Email story has email type', () => {
      expect(Email.args).toBeDefined()
      expect(Email.args?.type).toBe('email')
    })

    it('Password story has password type', () => {
      expect(Password.args).toBeDefined()
      expect(Password.args?.type).toBe('password')
    })

    it('ErrorState story has error prop', () => {
      expect(ErrorState.args).toBeDefined()
      expect(ErrorState.args?.error).toBe(true)
    })

    it('Disabled story has disabled prop', () => {
      expect(Disabled.args).toBeDefined()
      expect(Disabled.args?.disabled).toBe(true)
    })

    it('ReadOnly story has readOnly prop', () => {
      expect(ReadOnly.args).toBeDefined()
      expect(ReadOnly.args?.readOnly).toBe(true)
    })

    it('Required story has required prop', () => {
      expect(Required.args).toBeDefined()
      expect(Required.args?.required).toBe(true)
    })
  })
})
