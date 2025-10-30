import { bench, describe } from 'vitest';
import { CommandBus } from '../../src/cqrs/command-bus';
import { QueryBus } from '../../src/cqrs/query-bus';
import { ICommand, ICommandHandler } from '../../src/cqrs/command.interface';
import { IQuery, IQueryHandler } from '../../src/cqrs/query.interface';
import { v4 as uuid } from 'uuid';

// Test commands
class CreateOrderCommand implements ICommand {
  readonly correlationId = uuid();
  constructor(
    public readonly orderId: string,
    public readonly amount: number
  ) {}
}

class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  async execute(command: CreateOrderCommand): Promise<void> {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1));
  }
}

// Test queries
class GetOrderQuery implements IQuery {
  readonly correlationId = uuid();
  constructor(public readonly orderId: string) {}
}

class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  async execute(query: GetOrderQuery): Promise<any> {
    // Simulate query
    return { orderId: query.orderId, amount: Math.random() * 1000 };
  }
}

describe('CQRS Performance', () => {
  const commandBus = new CommandBus();
  const queryBus = new QueryBus();

  // Register handlers
  commandBus.register('CreateOrderCommand', new CreateOrderHandler());
  queryBus.register('GetOrderQuery', new GetOrderHandler());

  bench('execute single command', async () => {
    const command = new CreateOrderCommand(uuid(), 100);
    await commandBus.execute(command);
  });

  bench('execute 10 commands sequentially', async () => {
    for (let i = 0; i < 10; i++) {
      const command = new CreateOrderCommand(uuid(), 100 + i);
      await commandBus.execute(command);
    }
  });

  bench('execute 10 commands in parallel', async () => {
    const commands = Array.from({ length: 10 }, (_, i) =>
      new CreateOrderCommand(uuid(), 100 + i)
    );
    await Promise.all(commands.map(cmd => commandBus.execute(cmd)));
  });

  bench('execute single query', async () => {
    const query = new GetOrderQuery(uuid());
    await queryBus.execute(query);
  });

  bench('execute cached query', async () => {
    const orderId = uuid();
    const query = new GetOrderQuery(orderId);
    
    // First execution to populate cache
    await queryBus.execute(query, { cache: true, cacheKey: orderId });
    
    // Benchmark cached execution
    await queryBus.execute(query, { cache: true, cacheKey: orderId });
  });

  bench('execute 10 queries in parallel', async () => {
    const queries = Array.from({ length: 10 }, () =>
      new GetOrderQuery(uuid())
    );
    await queryBus.executeMany(queries);
  });

  bench('command with middleware', async () => {
    const busWithMiddleware = new CommandBus();
    busWithMiddleware.register('CreateOrderCommand', new CreateOrderHandler());
    
    // Add middleware
    busWithMiddleware.use(async (command) => {
      // Simulate validation
      if ((command as any).amount < 0) {
        throw new Error('Invalid amount');
      }
    });
    
    const command = new CreateOrderCommand(uuid(), 200);
    await busWithMiddleware.execute(command);
  });

  bench('query with middleware', async () => {
    const busWithMiddleware = new QueryBus();
    busWithMiddleware.register('GetOrderQuery', new GetOrderHandler());
    
    // Add middleware
    busWithMiddleware.use(async (query) => {
      // Simulate authorization check
      const authorized = true;
      if (!authorized) {
        throw new Error('Unauthorized');
      }
    });
    
    const query = new GetOrderQuery(uuid());
    await busWithMiddleware.execute(query);
  });
});