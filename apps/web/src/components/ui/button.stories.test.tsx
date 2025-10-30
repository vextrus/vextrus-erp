import { describe, it, expect } from 'vitest'
import { composeStories } from '@storybook/react'
import { render, screen } from '@/test/utils'
import * as stories from './button.stories'

// Compose all stories from button.stories.tsx
const { Primary, Secondary, Ghost, Destructive, WithLeftIcon, WithRightIcon, Loading, Small, Medium, Large, Disabled } =
  composeStories(stories)

describe('Button Stories Tests', () => {
  describe('Story Rendering', () => {
    it('renders Primary story', () => {
      render(<Primary />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-primary-500')
    })

    it('renders Secondary story', () => {
      render(<Secondary />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-neutral-100')
    })

    it('renders Ghost story', () => {
      render(<Ghost />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('hover:bg-neutral-100')
    })

    it('renders Destructive story', () => {
      render(<Destructive />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-error-500')
    })

    it('renders Small size story', () => {
      render(<Small />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('h-9')
    })

    it('renders Medium size story', () => {
      render(<Medium />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('h-10')
    })

    it('renders Large size story', () => {
      render(<Large />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('h-12')
    })
  })

  describe('Story Interactions', () => {
    it('renders Loading story in disabled state', () => {
      render(<Loading />)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Loading...')
    })

    it('renders WithLeftIcon story with icon', () => {
      render(<WithLeftIcon />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // Icon should be present in the button
      const icon = button.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders WithRightIcon story with icon', () => {
      render(<WithRightIcon />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // Icon should be present in the button
      const icon = button.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Story Props', () => {
    it('Primary story has primary variant', () => {
      expect(Primary.args).toBeDefined()
      expect(Primary.args?.variant).toBe('primary')
      expect(Primary.args?.children).toBe('Primary Button')
    })

    it('Secondary story has secondary variant', () => {
      expect(Secondary.args).toBeDefined()
      expect(Secondary.args?.variant).toBe('secondary')
    })

    it('Loading story has loading prop', () => {
      expect(Loading.args).toBeDefined()
      expect(Loading.args?.loading).toBe(true)
    })

    it('Disabled story has disabled prop', () => {
      expect(Disabled.args).toBeDefined()
      expect(Disabled.args?.disabled).toBe(true)
    })

    it('Small story has sm size', () => {
      expect(Small.args).toBeDefined()
      expect(Small.args?.size).toBe('sm')
    })
  })
})
