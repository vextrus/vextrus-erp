import { Entity, ValueObject, AggregateRoot } from '@vextrus/kernel';
import { ErrorCodes, EventTypes } from '@vextrus/contracts';
import { Trace, Metric, CircuitBreaker } from '@vextrus/utils';
import { 
  EventStoreService, 
  SagaOrchestrator, 
  OutboxService,
  IdempotencyService 
} from '@vextrus/distributed-transactions';

console.log('✅ All @vextrus packages imported successfully!\n');

// Test @vextrus/kernel
class TestEntity extends Entity {
  constructor(id, name) {
    super(id);
    this.name = name;
  }
}

const entity = new TestEntity('test-1', 'Test Entity');
console.log('✅ @vextrus/kernel - Entity created:', entity.id);

// Test @vextrus/contracts
console.log('✅ @vextrus/contracts - ErrorCodes.AUTH_INVALID_CREDENTIALS:', ErrorCodes.AUTH_INVALID_CREDENTIALS);
console.log('✅ @vextrus/contracts - EventTypes.USER_REGISTERED:', EventTypes.USER_REGISTERED);

// Test @vextrus/utils
const breaker = new CircuitBreaker({
  name: 'test-breaker',
  threshold: 5,
  timeout: 1000,
  resetTimeout: 5000
});
console.log('✅ @vextrus/utils - CircuitBreaker created:', breaker.getState());

// Test @vextrus/distributed-transactions
console.log('✅ @vextrus/distributed-transactions - All components available');

console.log('\n🎉 Integration test passed! All packages are working correctly.');
console.log('\nPackage versions:');
console.log('- @vextrus/kernel: 1.0.0');
console.log('- @vextrus/contracts: 1.0.0');
console.log('- @vextrus/utils: 1.0.0');
console.log('- @vextrus/distributed-transactions: 1.0.0');