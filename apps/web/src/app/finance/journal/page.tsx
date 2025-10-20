/**
 * Journal Entries Page
 *
 * Placeholder for journal entry management.
 * To be implemented in future phase.
 */

'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

function JournalContent() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Journal Entries
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Record and manage journal entries
          </p>
        </div>

        <Card className="p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            Coming Soon
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Journal entry management will be available in the next release.
          </p>
          <div className="mt-6">
            <Button variant="outline" disabled>
              Create Journal Entry
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function JournalPage() {
  return (
    <ProtectedRoute>
      <JournalContent />
    </ProtectedRoute>
  );
}
