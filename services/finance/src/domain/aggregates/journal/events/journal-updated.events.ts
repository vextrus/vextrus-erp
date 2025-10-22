import { DomainEvent } from '../../../base/domain-event.base';
import { JournalId, JournalLineId, JournalLine } from '../journal-entry.aggregate';
import { UserId } from '../../invoice/invoice.aggregate';

/**
 * Journal Description Updated Event
 *
 * Emitted when journal description is updated on a DRAFT journal.
 */
export class JournalDescriptionUpdatedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly description: string,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      journalId.value,
      'JournalDescriptionUpdated',
      {
        journalId: journalId.value,
        description,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Journal Reference Updated Event
 *
 * Emitted when journal reference is updated.
 */
export class JournalReferenceUpdatedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly reference: string,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      journalId.value,
      'JournalReferenceUpdated',
      {
        journalId: journalId.value,
        reference,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Journal Date Updated Event
 *
 * Emitted when journal date is updated.
 * May trigger fiscal period recalculation.
 */
export class JournalDateUpdatedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly journalDate: Date,
    public readonly fiscalPeriod: string,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      journalId.value,
      'JournalDateUpdated',
      {
        journalId: journalId.value,
        journalDate,
        fiscalPeriod,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Journal Lines Replaced Event
 *
 * Emitted when all journal lines are replaced.
 * Used for bulk updates to journal entries.
 * Journal must be revalidated for balance after this event.
 */
export class JournalLinesReplacedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly lines: JournalLine[],
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      journalId.value,
      'JournalLinesReplaced',
      {
        journalId: journalId.value,
        lineCount: lines.length,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Journal Line Removed Event
 *
 * Emitted when a specific journal line is removed.
 * Journal must be revalidated for balance after this event.
 */
export class JournalLineRemovedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly lineId: JournalLineId,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      journalId.value,
      'JournalLineRemoved',
      {
        journalId: journalId.value,
        lineId: lineId.value,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}
