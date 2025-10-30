import { DomainEvent } from '../../base/domain-event.base';
import { AccountId } from './chart-of-account.aggregate';

/**
 * Account Name Updated Event
 *
 * Emitted when account name is updated on an ACTIVE account.
 * Account code, type, and currency remain immutable for accounting integrity.
 */
export class AccountNameUpdatedEvent extends DomainEvent {
  constructor(
    public readonly accountId: AccountId,
    public readonly accountName: string,
    public readonly updatedBy: string,
    tenantId: string,
  ) {
    super(
      accountId.value,
      'AccountNameUpdated',
      {
        accountId: accountId.value,
        accountName,
        updatedBy,
      },
      tenantId,
      updatedBy
    );
  }
}

/**
 * Account Parent Updated Event
 *
 * Emitted when account's parent is changed (account reclassification in hierarchy).
 * Must maintain account type consistency with new parent.
 */
export class AccountParentUpdatedEvent extends DomainEvent {
  constructor(
    public readonly accountId: AccountId,
    public readonly previousParentId: AccountId | undefined,
    public readonly newParentId: AccountId | undefined,
    public readonly updatedBy: string,
    tenantId: string,
  ) {
    super(
      accountId.value,
      'AccountParentUpdated',
      {
        accountId: accountId.value,
        previousParentId: previousParentId?.value,
        newParentId: newParentId?.value,
        updatedBy,
      },
      tenantId,
      updatedBy
    );
  }
}
