/**
 * Base interface for commands
 */
export interface ICommand {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Command handler interface
 */
export interface ICommandHandler<TCommand extends ICommand = ICommand, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}

/**
 * Command metadata
 */
export interface CommandMetadata {
  correlationId: string;
  causationId: string;
  userId?: string;
  timestamp: number;
  [key: string]: any;
}

/**
 * Command handler decorator metadata
 */
export interface CommandHandlerMetadata {
  commandType: string;
  handler: ICommandHandler;
}