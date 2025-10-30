// Injectable decorator not needed for plain class
import { ICommand, ICommandHandler, CommandMetadata } from './command.interface';
import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';

/**
 * Command bus for executing commands
 */
export class CommandBus extends EventEmitter {
  private handlers = new Map<string, ICommandHandler>();
  private middleware: Array<(command: ICommand) => Promise<void>> = [];

  /**
   * Register a command handler
   */
  register<TCommand extends ICommand>(
    commandType: string,
    handler: ICommandHandler<TCommand>
  ): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler for command ${commandType} already registered`);
    }
    this.handlers.set(commandType, handler);
    this.emit('handler:registered', { commandType });
  }

  /**
   * Unregister a command handler
   */
  unregister(commandType: string): void {
    this.handlers.delete(commandType);
    this.emit('handler:unregistered', { commandType });
  }

  /**
   * Add middleware to the command pipeline
   */
  use(middleware: (command: ICommand) => Promise<void>): void {
    this.middleware.push(middleware);
  }

  /**
   * Execute a command
   */
  async execute<TResult = void>(command: ICommand): Promise<TResult> {
    const commandType = command.constructor.name;
    const handler = this.handlers.get(commandType);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandType}`);
    }

    // Add metadata if not present
    const enrichedCommand = this.enrichCommand(command);

    // Emit pre-execution event
    this.emit('command:executing', { command: enrichedCommand, type: commandType });

    try {
      // Run middleware
      for (const mw of this.middleware) {
        await mw(enrichedCommand);
      }

      // Execute command
      const result = await handler.execute(enrichedCommand);

      // Emit post-execution event
      this.emit('command:executed', { 
        command: enrichedCommand, 
        type: commandType, 
        result 
      });

      return result as TResult;
    } catch (error) {
      // Emit error event
      this.emit('command:failed', { 
        command: enrichedCommand, 
        type: commandType, 
        error 
      });
      throw error;
    }
  }

  /**
   * Execute multiple commands in a transaction
   */
  async executeMany<TResult = void>(
    commands: ICommand[]
  ): Promise<TResult[]> {
    const results: TResult[] = [];
    
    for (const command of commands) {
      const result = await this.execute<TResult>(command);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get registered handler for a command type
   */
  getHandler(commandType: string): ICommandHandler | undefined {
    return this.handlers.get(commandType);
  }

  /**
   * Check if a handler is registered
   */
  hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType);
  }

  /**
   * Get all registered command types
   */
  getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.middleware = [];
    this.removeAllListeners();
  }

  /**
   * Enrich command with metadata
   */
  private enrichCommand(command: ICommand): ICommand {
    if (!command.correlationId) {
      (command as any).correlationId = uuid();
    }
    if (!command.causationId) {
      (command as any).causationId = uuid();
    }
    if (!command.metadata) {
      (command as any).metadata = {};
    }
    (command as any).metadata.timestamp = Date.now();
    return command;
  }
}