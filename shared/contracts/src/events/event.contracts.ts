export enum EventTypes {
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_PROFILE_UPDATED = 'user.profile_updated',
  USER_LOCKED = 'user.locked',
  USER_UNLOCKED = 'user.unlocked',
  USER_DELETED = 'user.deleted',
  
  // Organization Events
  ORGANIZATION_CREATED = 'organization.created',
  ORGANIZATION_UPDATED = 'organization.updated',
  ORGANIZATION_DELETED = 'organization.deleted',
  
  // Project Events
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_COMPLETED = 'project.completed',
  PROJECT_CANCELLED = 'project.cancelled',
  
  // Finance Events
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',
  PAYMENT_RECEIVED = 'payment.received',
  EXPENSE_RECORDED = 'expense.recorded',
  
  // HR Events
  EMPLOYEE_HIRED = 'employee.hired',
  EMPLOYEE_TERMINATED = 'employee.terminated',
  LEAVE_REQUESTED = 'leave.requested',
  LEAVE_APPROVED = 'leave.approved',
  
  // SCM Events
  MATERIAL_ORDERED = 'material.ordered',
  MATERIAL_RECEIVED = 'material.received',
  INVENTORY_UPDATED = 'inventory.updated',
}

export interface IEventPayload {
  aggregateId: string;
  aggregateType: string;
  eventType: EventTypes;
  eventVersion: number;
  timestamp: Date;
  data: any;
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}