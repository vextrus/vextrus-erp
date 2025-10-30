import { describe, it, expect, beforeEach } from 'vitest';
import { AggregateRoot } from '../../../src/event-sourcing/aggregate.base';
import type { DomainEvent, AggregateState, DomainCommand } from '../../../src/event-sourcing/types';

// Test aggregate state
interface TestState extends AggregateState {
  id: string;
  version: number;
  name?: string;
  value?: number;
  isActive?: boolean;
}

// Test events
class TestCreatedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly name: string,
    public readonly value: number
  ) {}
  type = 'TestCreated';
}

class TestUpdatedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly newValue: number
  ) {}
  type = 'TestUpdated';
}

class TestDeactivatedEvent implements DomainEvent {
  constructor(public readonly aggregateId: string) {}
  type = 'TestDeactivated';
}

// Test commands
class CreateTestCommand implements DomainCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly value: number
  ) {}
  type = 'CreateTest';
}

class UpdateTestCommand implements DomainCommand {
  constructor(
    public readonly id: string,
    public readonly newValue: number
  ) {}
  type = 'UpdateTest';
}

// Test aggregate implementation
class TestAggregate extends AggregateRoot<TestState> {
  static create(id: string, name: string, value: number): TestAggregate {
    const aggregate = new TestAggregate(id, { id, version: 0 });
    aggregate.applyEvent(new TestCreatedEvent(id, name, value));
    return aggregate;
  }

  handle(command: DomainCommand): void {
    switch (command.type) {
      case 'CreateTest': {
        const cmd = command as CreateTestCommand;
        this.applyEvent(new TestCreatedEvent(cmd.id, cmd.name, cmd.value));
        break;
      }
      case 'UpdateTest': {
        const cmd = command as UpdateTestCommand;
        if (!this.state.isActive) {
          throw new Error('Cannot update deactivated aggregate');
        }
        this.applyEvent(new TestUpdatedEvent(cmd.id, cmd.newValue));
        break;
      }
      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }

  deactivate(): void {
    if (!this.state.isActive) {
      throw new Error('Already deactivated');
    }
    this.applyEvent(new TestDeactivatedEvent(this.id));
  }

  protected when(state: TestState, event: DomainEvent): TestState {
    switch (event.type) {
      case 'TestCreated': {
        const e = event as TestCreatedEvent;
        return {
          ...state,
          name: e.name,
          value: e.value,
          isActive: true
        };
      }
      case 'TestUpdated': {
        const e = event as TestUpdatedEvent;
        return {
          ...state,
          value: e.newValue
        };
      }
      case 'TestDeactivated': {
        return {
          ...state,
          isActive: false
        };
      }
      default:
        return state;
    }
  }

  protected validateInvariants(): void {
    // Basic validation - ensure required fields exist
    if (!this.state.id) {
      throw new Error('TestAggregate must have an id');
    }
    // Value should be non-negative if it exists
    if (this.state.value !== undefined && this.state.value < 0) {
      throw new Error('TestAggregate value cannot be negative');
    }
  }
}

describe('AggregateRoot Base Class', () => {
  let aggregate: TestAggregate;

  beforeEach(() => {
    aggregate = TestAggregate.create('test-123', 'Test Aggregate', 100);
  });

  describe('Basic Operations', () => {
    it('should create aggregate with initial state', () => {
      expect(aggregate.id).toBe('test-123');
      expect(aggregate.getVersion()).toBe(1);
      
      const state = aggregate.getState();
      expect(state.name).toBe('Test Aggregate');
      expect(state.value).toBe(100);
      expect(state.isActive).toBe(true);
    });

    it('should return frozen state to prevent mutations', () => {
      const state = aggregate.getState();
      expect(() => {
        (state as any).value = 200;
      }).toThrow();
    });

    it('should track uncommitted events', () => {
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('TestCreated');
      expect((events[0] as TestCreatedEvent).name).toBe('Test Aggregate');
    });

    it('should clear uncommitted events when marked as committed', () => {
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
      aggregate.markEventsAsCommitted();
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should increment version for each event', () => {
      expect(aggregate.getVersion()).toBe(1);
      
      aggregate.handle(new UpdateTestCommand('test-123', 200));
      expect(aggregate.getVersion()).toBe(2);
      
      aggregate.deactivate();
      expect(aggregate.getVersion()).toBe(3);
    });
  });

  describe('Event Application', () => {
    it('should apply events and update state', () => {
      aggregate.handle(new UpdateTestCommand('test-123', 200));
      
      const state = aggregate.getState();
      expect(state.value).toBe(200);
      expect(state.isActive).toBe(true);
    });

    it('should maintain event order', () => {
      aggregate.markEventsAsCommitted(); // Clear initial event
      
      aggregate.handle(new UpdateTestCommand('test-123', 200));
      aggregate.handle(new UpdateTestCommand('test-123', 300));
      aggregate.deactivate();
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('TestUpdated');
      expect((events[0] as TestUpdatedEvent).newValue).toBe(200);
      expect(events[1].type).toBe('TestUpdated');
      expect((events[1] as TestUpdatedEvent).newValue).toBe(300);
      expect(events[2].type).toBe('TestDeactivated');
    });

    it('should enforce business rules', () => {
      aggregate.deactivate();
      
      expect(() => {
        aggregate.handle(new UpdateTestCommand('test-123', 200));
      }).toThrow('Cannot update deactivated aggregate');
      
      expect(() => {
        aggregate.deactivate();
      }).toThrow('Already deactivated');
    });
  });

  describe('Event Sourcing', () => {
    it('should load from event history', () => {
      const events = [
        new TestCreatedEvent('test-456', 'Restored Aggregate', 50),
        new TestUpdatedEvent('test-456', 75),
        new TestUpdatedEvent('test-456', 100),
        new TestDeactivatedEvent('test-456')
      ];
      
      const restored = new TestAggregate('test-456', { id: 'test-456', version: 0 });
      restored.loadFromHistory(events);
      
      expect(restored.getVersion()).toBe(4);
      const state = restored.getState();
      expect(state.name).toBe('Restored Aggregate');
      expect(state.value).toBe(100);
      expect(state.isActive).toBe(false);
      
      // Should not have uncommitted events when loading from history
      expect(restored.getUncommittedEvents()).toHaveLength(0);
    });

    it('should handle empty event history', () => {
      const aggregate = new TestAggregate('test-789', { id: 'test-789', version: 0 });
      aggregate.loadFromHistory([]);
      
      expect(aggregate.getVersion()).toBe(0);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should apply snapshot and subsequent events', () => {
      const snapshotState: TestState = {
        id: 'test-999',
        version: 10,
        name: 'Snapshot Test',
        value: 500,
        isActive: true
      };
      
      const aggregate = new TestAggregate('test-999', snapshotState);
      aggregate.loadFromSnapshot(snapshotState, 10);
      
      // Apply events after snapshot
      const newEvents = [
        new TestUpdatedEvent('test-999', 600),
        new TestUpdatedEvent('test-999', 700)
      ];
      aggregate.loadFromHistory(newEvents);
      
      expect(aggregate.getVersion()).toBe(12);
      const state = aggregate.getState();
      expect(state.value).toBe(700);
      expect(state.isActive).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate state consistency', () => {
      aggregate.handle(new UpdateTestCommand('test-123', 200));
      aggregate.handle(new UpdateTestCommand('test-123', 300));
      
      const isValid = aggregate.validateState();
      expect(isValid).toBe(true);
      
      const state = aggregate.getState();
      expect(state.value).toBe(300);
    });

    it('should handle unknown commands', () => {
      const unknownCommand = { type: 'UnknownCommand' } as DomainCommand;
      
      expect(() => {
        aggregate.handle(unknownCommand);
      }).toThrow('Unknown command type: UnknownCommand');
    });
  });

  describe('Entity Methods', () => {
    it('should implement equals correctly', () => {
      const aggregate1 = TestAggregate.create('test-1', 'Test 1', 100);
      const aggregate2 = TestAggregate.create('test-1', 'Test 2', 200);
      const aggregate3 = TestAggregate.create('test-2', 'Test 3', 100);
      
      expect(aggregate1.equals(aggregate2)).toBe(true); // Same ID
      expect(aggregate1.equals(aggregate3)).toBe(false); // Different ID
    });

    it('should provide string representation', () => {
      const str = aggregate.toString();
      expect(str).toBe('TestAggregate(test-123)');
    });
  });
});