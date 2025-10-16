import { Entity } from '@vextrus/kernel';
import type { DomainEvent, AggregateState, DomainCommand } from './types';

/**
 * Base class for event-sourced aggregates
 */
export abstract class AggregateRoot<
  TState extends AggregateState = AggregateState
> extends Entity<string> {
  protected state: TState;
  protected uncommittedEvents: DomainEvent[] = [];
  protected version: number = 0;

  constructor(id: string, initialState: TState) {
    super(id);
    this.state = initialState;
  }

  /**
   * Get current aggregate version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Get current aggregate state
   */
  getState(): Readonly<TState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Load aggregate from event history
   */
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.applyEvent(event, false);
      this.version++;
    }
  }

  /**
   * Apply an event to the aggregate
   */
  protected applyEvent(event: DomainEvent, isNew: boolean = true): void {
    // Apply event to state
    this.state = this.when(this.state, event);
    
    // Update metadata
    this.state.updatedAt = new Date();
    if (this.version === 0) {
      this.state.createdAt = new Date();
    }
    
    // Track new events
    if (isNew) {
      this.uncommittedEvents.push(event);
      this.version++;
    }
    
    // Update state version
    this.state.version = this.version;
  }

  /**
   * Abstract method to handle state transitions
   * Must be implemented by concrete aggregates
   */
  protected abstract when(state: TState, event: DomainEvent): TState;

  /**
   * Abstract method to handle commands
   * Must be implemented by concrete aggregates
   */
  abstract handle(command: DomainCommand): void;

  /**
   * Raise a domain event
   */
  protected raiseEvent<
    TType extends string,
    TData extends Record<string, unknown>
  >(
    type: TType,
    data: TData,
    metadata?: Record<string, unknown>
  ): void {
    const event: DomainEvent = {
      type,
      data,
      metadata: {
        aggregateId: this.id,
        aggregateVersion: this.version + 1,
        timestamp: Date.now(),
        ...metadata
      }
    };

    this.applyEvent(event, true);
  }

  /**
   * Validate aggregate invariants
   */
  protected abstract validateInvariants(): void;

  /**
   * Check if aggregate can handle a command
   */
  /**
   * Load aggregate from snapshot
   */
  loadFromSnapshot(snapshot: TState, version: number): void {
    this.state = { ...snapshot };
    this.version = version;
    this.state.version = version;
  }

  /**
   * Validate current state consistency
   */
  validateState(): boolean {
    try {
      this.validateInvariants();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get string representation of the aggregate
   */
  toString(): string {
    return `${this.constructor.name}(${this.id})`;
  }

  canHandle(command: DomainCommand): boolean {
    try {
      // Simulate command handling without side effects
      const tempState = { ...this.state };
      this.state = tempState;
      this.handle(command);
      this.state = tempState; // Restore original state
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Example aggregate implementation
 */
export class ExampleAggregate extends AggregateRoot<ExampleState> {
  static create(id: string, name: string): ExampleAggregate {
    const aggregate = new ExampleAggregate(id, {
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: '',
      status: 'DRAFT',
      items: []
    });

    aggregate.raiseEvent('ExampleCreated', { name });
    return aggregate;
  }

  protected when(state: ExampleState, event: DomainEvent): ExampleState {
    switch (event.type) {
      case 'ExampleCreated':
        return {
          ...state,
          name: event.data.name as string,
          status: 'ACTIVE'
        };
      
      case 'ItemAdded':
        return {
          ...state,
          items: [...state.items, event.data.item as ExampleItem]
        };
      
      case 'StatusChanged':
        return {
          ...state,
          status: event.data.status as string
        };
      
      default:
        return state;
    }
  }

  handle(command: DomainCommand): void {
    switch (command.type) {
      case 'AddItem':
        this.addItem(command.data.item as ExampleItem);
        break;
      
      case 'ChangeStatus':
        this.changeStatus(command.data.status as string);
        break;
      
      default:
        throw new Error(`Unknown command: ${command.type}`);
    }
  }

  private addItem(item: ExampleItem): void {
    this.validateInvariants();
    
    if (this.state.status !== 'ACTIVE') {
      throw new Error('Cannot add items to inactive aggregate');
    }

    this.raiseEvent('ItemAdded', { item });
  }

  private changeStatus(status: string): void {
    if (this.state.status === status) {
      return; // Idempotent
    }

    this.raiseEvent('StatusChanged', { 
      status, 
      previousStatus: this.state.status 
    });
  }

  protected validateInvariants(): void {
    if (!this.state.name) {
      throw new Error('Aggregate must have a name');
    }

    if (this.state.items.length > 100) {
      throw new Error('Aggregate cannot have more than 100 items');
    }
  }
}

// Types for example aggregate
interface ExampleState extends AggregateState {
  name: string;
  status: string;
  items: ExampleItem[];
}

interface ExampleItem {
  id: string;
  name: string;
  quantity: number;
}