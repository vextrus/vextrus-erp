import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Pagination, PaginationInfo } from './pagination'

const meta = {
  title: 'UI/Data Display/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onPageChange: fn(),
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
  },
}

export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
  },
}

export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
  },
}

export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 5,
  },
}

export const ManyPages: Story = {
  args: {
    currentPage: 15,
    totalPages: 50,
  },
}

export const WithoutFirstLast: Story = {
  args: {
    currentPage: 5,
    totalPages: 20,
    showFirstLast: false,
  },
}

export const WithInfo: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = React.useState(1)
    const totalItems = 247
    const pageSize = 10
    const totalPages = Math.ceil(totalItems / pageSize)

    return (
      <div className="space-y-4">
        <PaginationInfo
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    )
  },
}

export const Interactive: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = React.useState(1)
    const totalPages = 20

    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-neutral-400">
            Current Page: <span className="font-medium text-white">{currentPage}</span>
          </p>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    )
  },
}

export const TablePagination: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = React.useState(1)
    const totalItems = 156
    const pageSize = 15
    const totalPages = Math.ceil(totalItems / pageSize)

    return (
      <div className="w-full max-w-4xl space-y-4">
        <div className="rounded-lg border border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-900/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Name</th>
                <th className="text-left p-4 text-sm font-medium">Email</th>
                <th className="text-left p-4 text-sm font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i} className="border-t border-neutral-800">
                  <td className="p-4 text-sm">User {(currentPage - 1) * 10 + i + 1}</td>
                  <td className="p-4 text-sm text-neutral-400">
                    user{(currentPage - 1) * 10 + i + 1}@example.com
                  </td>
                  <td className="p-4 text-sm text-neutral-400">Member</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    )
  },
}
