import { describe, it, expect } from 'vitest'
import { composeStories } from '@storybook/react'
import { render, screen } from '@/test/utils'
import * as stories from './badge.stories'

// Compose all stories from badge.stories.tsx
const { Default, Primary, Success, Warning, Error, InfoVariant, Outline, Small, Large, WithDot, WithIcon, Dismissible } =
  composeStories(stories)

describe('Badge Stories Tests', () => {
  describe('Story Rendering', () => {
    it('renders Default story', () => {
      render(<Default />)
      expect(screen.getByText('Badge')).toBeInTheDocument()
    })

    it('renders Primary story', () => {
      render(<Primary />)
      expect(screen.getByText('Primary')).toBeInTheDocument()
    })

    it('renders Success story', () => {
      render(<Success />)
      expect(screen.getByText('Success')).toBeInTheDocument()
    })

    it('renders Warning story', () => {
      render(<Warning />)
      expect(screen.getByText('Warning')).toBeInTheDocument()
    })

    it('renders Error story', () => {
      render(<Error />)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('renders InfoVariant story', () => {
      render(<InfoVariant />)
      expect(screen.getByText('Info')).toBeInTheDocument()
    })

    it('renders Outline story', () => {
      render(<Outline />)
      expect(screen.getByText('Outline')).toBeInTheDocument()
    })
  })

  describe('Story Sizes', () => {
    it('renders Small size story', () => {
      render(<Small />)
      expect(screen.getByText('Small')).toBeInTheDocument()
    })

    it('renders Large size story', () => {
      render(<Large />)
      expect(screen.getByText('Large')).toBeInTheDocument()
    })
  })

  describe('Story Features', () => {
    it('renders WithDot story', () => {
      render(<WithDot />)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('renders WithIcon story with icon', () => {
      render(<WithIcon />)
      expect(screen.getByText('Verified')).toBeInTheDocument()
      // Icon should be present in the badge
      const badge = screen.getByText('Verified').parentElement
      const icon = badge?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders Dismissible story', () => {
      render(<Dismissible />)
      expect(screen.getByText('Dismissible')).toBeInTheDocument()
    })
  })

  describe('Story Props', () => {
    it('Default story has correct args', () => {
      expect(Default.args).toBeDefined()
      expect(Default.args?.children).toBe('Badge')
    })

    it('Primary story has primary variant', () => {
      expect(Primary.args).toBeDefined()
      expect(Primary.args?.variant).toBe('primary')
      expect(Primary.args?.children).toBe('Primary')
    })

    it('Success story has success variant', () => {
      expect(Success.args).toBeDefined()
      expect(Success.args?.variant).toBe('success')
    })

    it('WithDot story has dot prop', () => {
      expect(WithDot.args).toBeDefined()
      expect(WithDot.args?.dot).toBe(true)
    })

    it('Dismissible story has dismissible prop', () => {
      expect(Dismissible.args).toBeDefined()
      expect(Dismissible.args?.dismissible).toBe(true)
    })

    it('Small story has sm size', () => {
      expect(Small.args).toBeDefined()
      expect(Small.args?.size).toBe('sm')
    })

    it('Large story has lg size', () => {
      expect(Large.args).toBeDefined()
      expect(Large.args?.size).toBe('lg')
    })
  })
})
