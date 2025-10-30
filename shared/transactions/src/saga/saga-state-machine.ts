import { v4 as uuid } from 'uuid';
import type { DomainEvent, SagaState, SagaStep } from '../event-sourcing/types';
import { Trace, Metric } from '@vextrus/utils';

/**
 * State machine for saga orchestration
 */
export interface StateMachine<TData = unknown> {
  initialState: string;
  states: {
    [stateName: string]: {
      on?: {
        [eventType: string]: string; // Next state
      };
      invoke?: {
        src: (context: SagaContext<TData>) => Promise<void>;
        onDone?: string;
        onError?: string;
      };
      type?: 'final' | 'parallel';
      compensate?: (context: SagaContext<TData>) => Promise<void>;
    };
  };
  transitions?: Map<string, Map<string, string>>;
}

/**
 * Saga context passed to step handlers
 */
export interface SagaContext<TData = unknown> {
  sagaId: string;
  sagaType?: string;
  correlationId: string;
  data: TData;
  currentState: string;
  history: string[];
  metadata: Record<string, unknown>;
}

/**
 * Saga context implementation class
 */
export class SagaContext<TData = unknown> {
  sagaId: string;
  sagaType?: string;
  correlationId: string;
  data: TData;
  currentState: string;
  history: string[];
  metadata: Record<string, unknown>;

  constructor(
    sagaId: string,
    sagaTypeOrCorrelationId: string,
    currentStateOrData: string | TData,
    dataOrCorrelationId?: TData | string,
    correlationIdOrHistory?: string | string[],
    historyOrMetadata?: string[] | Record<string, unknown>,
    metadataOrSagaType?: Record<string, unknown> | string,
    sagaType?: string
  ) {
    // Handle different constructor signatures for backward compatibility
    if (typeof currentStateOrData === 'string' && dataOrCorrelationId && typeof dataOrCorrelationId === 'object' && !Array.isArray(dataOrCorrelationId)) {
      // New signature: (sagaId, sagaType, currentState, data, correlationId)
      this.sagaId = sagaId;
      this.sagaType = sagaTypeOrCorrelationId;
      this.currentState = currentStateOrData;
      this.data = dataOrCorrelationId as TData;
      this.correlationId = correlationIdOrHistory as string || '';
      this.history = (historyOrMetadata as string[]) || [];
      this.metadata = (metadataOrSagaType as Record<string, unknown>) || {};
    } else {
      // Old signature: (sagaId, correlationId, data, currentState, history, metadata, sagaType)
      this.sagaId = sagaId;
      this.correlationId = sagaTypeOrCorrelationId;
      this.data = currentStateOrData as TData;
      this.currentState = (dataOrCorrelationId as string) || 'initial';
      this.history = (correlationIdOrHistory as string[]) || [];
      this.metadata = (historyOrMetadata as Record<string, unknown>) || {};
      this.sagaType = metadataOrSagaType as string;
    }
  }

  /**
   * Add a state to history
   */
  addToHistory(state: string): void {
    this.history.push(state);
  }

  /**
   * Update metadata
   */
  setMetadata(key: string, value: unknown): void {
    this.metadata[key] = value;
  }

  /**
   * Get metadata value
   */
  getMetadata(key: string): unknown {
    return this.metadata[key];
  }

  /**
   * Update current state
   */
  updateState(newState: string): void {
    this.currentState = newState;
    this.addToHistory(newState);
  }
}

/**
 * Saga orchestrator with state machine
 */
export class SagaOrchestrator<TData = unknown> {
  private readonly sagaType: string;
  private stateMachine: StateMachine<TData>;
  private readonly steps: Map<string, SagaStep<TData>>;
  private repository?: any;
  private stateTransitions: Map<string, Map<string, string>> = new Map();
  public readonly transitions: Map<string, Map<string, string>> = new Map();
  public readonly compensations: Map<string, (ctx: SagaContext<TData>) => Promise<void>> = new Map();
  public readonly compensationHandlers: Record<string, any> = {};
  public readonly name: string;

  constructor(
    sagaType: string,
    stateMachineOrRepository?: StateMachine<TData> | any,
    steps: SagaStep<TData>[] = []
  ) {
    this.sagaType = sagaType;
    this.name = sagaType;
    
    // Support both old constructor (stateMachine) and new constructor (repository)
    if (stateMachineOrRepository && typeof stateMachineOrRepository.save === 'function') {
      // It's a repository
      this.repository = stateMachineOrRepository;
      this.stateMachine = {
        initialState: 'initial',
        states: {},
        transitions: this.transitions
      };
    } else {
      // It's a state machine
      this.stateMachine = stateMachineOrRepository || {
        initialState: 'initial',
        states: {},
        transitions: this.transitions
      };
    }
    
    this.steps = new Map(steps.map(step => [step.name, step]));
  }

  /**
   * Get the initial state of the saga
   */
  get initialState(): string {
    return this.stateMachine.initialState;
  }

  /**
   * Add a step to the saga (fluent interface)
   */
  addStep(
    stateName: string, 
    handler: (ctx: SagaContext<TData>) => Promise<DomainEvent>
  ): this {
    // Add state to state machine
    this.stateMachine.states[stateName] = {
      invoke: {
        src: async (context) => {
          try {
            const event = await handler(context);
            // Handle the returned event to trigger transitions
            if (this.stateTransitions.has(context.currentState)) {
              const transitions = this.stateTransitions.get(context.currentState)!;
              if (transitions.has(event.type)) {
                context.currentState = transitions.get(event.type)!;
              }
            }
            return event;
          } catch (error) {
            // Create a failure event from the error
            const failureEvent = {
              type: `${stateName}Failed`,
              data: { error: String(error) },
              metadata: {}
            };
            
            // Check for failure transitions
            if (this.stateTransitions.has(context.currentState)) {
              const transitions = this.stateTransitions.get(context.currentState)!;
              
              // Look for specific failure transition or generic failure
              const failureEventType = failureEvent.type;
              const genericFailureType = 'Failed';
              
              if (transitions.has(failureEventType)) {
                context.currentState = transitions.get(failureEventType)!;
              } else if (transitions.has(genericFailureType)) {
                context.currentState = transitions.get(genericFailureType)!;
              }
            }
            
            // Re-throw the error to trigger error handling
            throw error;
          }
        },
        onError: 'FAILED' // Default error state
      }
    };
    
    return this;
  }

  /**
   * Add compensation handler for a step
   */
  addCompensation(
    stateName: string,
    compensationHandler: (ctx: SagaContext<TData>) => Promise<void>
  ): this {
    if (this.stateMachine.states[stateName]) {
      this.stateMachine.states[stateName].compensate = compensationHandler;
    }
    
    // Track compensations for tests
    this.compensations.set(stateName, compensationHandler);
    this.compensationHandlers[stateName] = compensationHandler;
    
    return this;
  }

  /**
   * Add state transition
   */
  addTransition(fromState: string, eventType: string, toState: string): this {
    if (!this.stateTransitions.has(fromState)) {
      this.stateTransitions.set(fromState, new Map());
    }
    this.stateTransitions.get(fromState)!.set(eventType, toState);

    // Track transitions for tests
    if (!this.transitions.has(fromState)) {
      this.transitions.set(fromState, new Map());
    }
    this.transitions.get(fromState)!.set(eventType, toState);

    // Also add to state machine
    if (!this.stateMachine.states[fromState]) {
      this.stateMachine.states[fromState] = {};
    }
    if (!this.stateMachine.states[fromState].on) {
      this.stateMachine.states[fromState].on = {};
    }
    this.stateMachine.states[fromState].on![eventType] = toState;

    // Ensure target state exists 
    if (!this.stateMachine.states[toState]) {
      this.stateMachine.states[toState] = {};
    }
    
    // Mark final states based on common patterns
    const lowerToState = toState.toLowerCase();
    if (lowerToState === 'completed' || lowerToState === 'failed' || lowerToState === 'compensated') {
      this.stateMachine.states[toState].type = 'final';
    }

    return this;
  }

  /**
   * Start a new saga instance
   */
  @Metric('saga.start')
  async start(
    data: TData,
    correlationId?: string
  ): Promise<string> {
    const sagaId = uuid();
    const initialState = this.initialState || this.stateMachine?.initialState || 'STARTED';
    
    const sagaState: SagaState<TData> = {
      sagaId,
      sagaType: this.sagaType || this.name,
      currentState: initialState,
      data,
      status: 'ACTIVE',
      version: 1,
      startedAt: new Date(),
      updatedAt: new Date(),
      correlationId: correlationId || uuid(),
      completedSteps: [],
      compensatedSteps: [],
      error: null
    };

    // Save initial state
    if (this.repository) {
      await this.repository.save(sagaState);
    }
    
    // Execute initial state if it has a configuration
    if (this.stateMachine.states[initialState]) {
      try {
        await this.executeState(sagaState);
      } catch (error) {
        // Log error but don't fail startup
        console.warn('Initial state execution failed:', error);
        sagaState.errorMessage = String(error);
        if (this.repository) {
          await this.repository.update(sagaState, sagaState.version);
        }
      }
    }
    
    return sagaId;
  }

  /**
   * Handle an event and transition to next state
   */
  @Trace()
  @Metric('saga.handle-event')
  async handleEvent(
    sagaStateOrId: SagaState<TData> | string,
    event: DomainEvent
  ): Promise<SagaState<TData>> {
    // Load saga state if ID is provided
    let sagaState: SagaState<TData>;
    if (typeof sagaStateOrId === 'string') {
      if (!this.repository) {
        throw new Error('Repository required when using saga ID');
      }
      const loaded = await this.repository.findById(sagaStateOrId);
      if (!loaded) {
        throw new Error(`Saga not found: ${sagaStateOrId}`);
      }
      sagaState = loaded;
    } else {
      sagaState = sagaStateOrId;
    }

    const currentStateConfig = this.stateMachine.states[sagaState.currentState];
    
    if (!currentStateConfig) {
      throw new Error(`Unknown state: ${sagaState.currentState}`);
    }

    // Check for event transitions
    if (currentStateConfig.on && currentStateConfig.on[event.type]) {
      const nextState = currentStateConfig.on[event.type]!;
      
      // Transition to next state
      sagaState.currentState = nextState;
      sagaState.version++;
      sagaState.updatedAt = new Date();
      
      // Update repository if available
      if (this.repository) {
        await this.repository.update(sagaState);
      }
      
      // ALWAYS execute new state after transition
      await this.executeState(sagaState);
    }

    return sagaState;
  }

  /**
   * Execute a state's actions
   */
  private async executeState(sagaState: SagaState<TData>): Promise<void> {
    // Check both stateMachine.states and direct states property (from Object.assign)
    const states = this.stateMachine?.states || this.states;
    const stateConfig = states?.[sagaState.currentState];
    
    if (!stateConfig) {
      // Don't throw for initial state, it's optional
      if (sagaState.currentState === this.initialState || 
          sagaState.currentState === 'STARTED' || 
          sagaState.currentState === 'initial') {
        return;
      }
      throw new Error(`Unknown state: ${sagaState.currentState}`);
    }

    // Check if it's a final state
    if (stateConfig.type === 'final' || sagaState.currentState === 'COMPLETED' || sagaState.currentState === 'FAILED') {
      sagaState.completedAt = new Date();
      sagaState.status = sagaState.currentState === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
      
      // Update repository for final state
      if (this.repository) {
        await this.repository.update(sagaState, sagaState.version - 1);
      }
      return;
    }

    // Execute state invoke function
    if (stateConfig.invoke) {
      const context = this.createContext(sagaState);
      
      try {
        // Handle both function directly and wrapped in src property
        const invokeFunc = typeof stateConfig.invoke === 'function' 
          ? stateConfig.invoke 
          : stateConfig.invoke.src;
          
        if (invokeFunc) {
          const result = await this.executeWithRetry(
            () => invokeFunc(context),
            sagaState
          );
          
          // Copy any data changes back to saga state and persist immediately
          sagaState.data = context.data;
          sagaState.version++;
          sagaState.updatedAt = new Date();
          
          // Add current state to executed steps for compensation tracking
          if (!sagaState.executedSteps) {
            sagaState.executedSteps = [];
          }
          if (!sagaState.executedSteps.includes(sagaState.currentState)) {
            sagaState.executedSteps.push(sagaState.currentState);
          }
          
          // Persist data changes immediately after step execution
          if (this.repository) {
            await this.repository.update(sagaState, sagaState.version - 1);
          }
          
          // Check if the result is an event with a type that triggers a transition
          if (result && result.type) {
            const transition = stateConfig.on?.[result.type];
            if (transition) {
              sagaState.currentState = transition;
              sagaState.version++;
              sagaState.updatedAt = new Date();
              
              // Persist state transition
              if (this.repository) {
                await this.repository.update(sagaState, sagaState.version - 1);
              }
              
              // Recursively execute next state
              await this.executeState(sagaState);
              return;
            }
          }
        }
        
        // Transition to success state if defined
        if (stateConfig.invoke.onDone) {
          sagaState.currentState = stateConfig.invoke.onDone;
          sagaState.version++;
          sagaState.updatedAt = new Date();
          
          // Persist state transition
          if (this.repository) {
            await this.repository.update(sagaState, sagaState.version - 1);
          }
          
          // Recursively execute next state
          await this.executeState(sagaState);
        }
      } catch (error) {
        sagaState.errorMessage = String(error);
        sagaState.currentState = 'FAILED';
        sagaState.status = 'FAILED';
        sagaState.version++;
        sagaState.updatedAt = new Date();
        
        // Persist error state
        if (this.repository) {
          await this.repository.update(sagaState, sagaState.version - 1);
        }
        
        // Always trigger compensation on error
        await this.compensate(sagaState);
        
        // Don't re-throw the error - it's been handled by compensation
      }
    }
  }

  /**
   * Execute compensation logic
   */
  @Trace()
  @Metric('saga.compensate')
  async compensate(sagaStateOrId: SagaState<TData> | string): Promise<void> {
    // Load saga state if ID is provided
    let sagaState: SagaState<TData>;
    if (typeof sagaStateOrId === 'string') {
      if (!this.repository) {
        throw new Error('Repository required when using saga ID');
      }
      const loaded = await this.repository.findById(sagaStateOrId);
      if (!loaded) {
        throw new Error(`Saga not found: ${sagaStateOrId}`);
      }
      sagaState = loaded;
    } else {
      sagaState = sagaStateOrId;
    }

    // Use executed steps or visited states for compensation
    const stepsToCompensate = sagaState.executedSteps || this.getVisitedStates(sagaState);
    
    // Execute compensation in reverse order
    for (const stateName of stepsToCompensate.slice().reverse()) {
      // Try both stateConfig compensation and direct compensationHandlers
      const stateConfig = this.stateMachine.states[stateName];
      const directHandler = this.compensationHandlers[stateName];
      
      if (directHandler) {
        const context = this.createContext(sagaState);
        
        try {
          await directHandler(context);
        } catch (error) {
          // Log compensation failure but continue
          console.error(`Compensation failed for state ${stateName}:`, error);
        }
      } else if (stateConfig?.compensate) {
        const context = this.createContext(sagaState);
        
        try {
          await stateConfig.compensate(context);
        } catch (error) {
          // Log compensation failure but continue
          console.error(`Compensation failed for state ${stateName}:`, error);
        }
      }
    }
    
    // Mark saga as compensated if repository is available
    if (this.repository) {
      sagaState.currentState = 'compensated';
      sagaState.status = 'COMPENSATED';
      sagaState.version++;
      sagaState.updatedAt = new Date();
      await this.repository.update(sagaState, sagaState.version - 1);
    }
  }

  /**
   * Execute with retry policy
   */
  private async executeWithRetry(
    fn: () => Promise<void>,
    sagaState: SagaState<TData>
  ): Promise<void> {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fn();
        return;
      } catch (error) {
        sagaState.retryCount++;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Create saga context
   */
  private createContext(sagaState: SagaState<TData>): SagaContext<TData> {
    return {
      sagaId: sagaState.sagaId || sagaState.id,
      sagaType: sagaState.sagaType,
      correlationId: sagaState.correlationId,
      data: sagaState.data,
      currentState: sagaState.currentState,
      history: this.getVisitedStates(sagaState),
      metadata: {}
    };
  }

  /**
   * Get list of visited states
   */
  private getVisitedStates(sagaState: SagaState<TData>): string[] {
    // In a real implementation, this would be tracked in the saga state
    // For now, return current state
    return [sagaState.currentState];
  }
}

/**
 * Saga builder for fluent API
 */
export class SagaBuilder<TData = unknown> {
  private sagaType: string = '';
  private states: StateMachine<TData>['states'] = {};
  private _initialState: string = '';
  private steps: SagaStep<TData>[] = [];
  private transitions: Array<{from: string, event: string, to: string}> = [];

  constructor(sagaType?: string) {
    if (sagaType) {
      this.sagaType = sagaType;
    }
  }

  withType(type: string): this {
    this.sagaType = type;
    return this;
  }

  withName(name: string): this {
    return this.withType(name);
  }

  initialState(state: string): this {
    this._initialState = state;
    return this;
  }

  withInitialState(state: string): this {
    this._initialState = state;
    // Ensure the initial state exists in states
    if (!this.states[state]) {
      this.states[state] = {
        invoke: async () => ({ type: 'InitialStateReady', data: {}, metadata: {} }),
        transitions: []
      };
    }
    return this;
  }

  addState(
    name: string,
    config: StateMachine<TData>['states'][string] & {
      onEnter?: (ctx: SagaContext<TData>) => Promise<void>;
      action?: (ctx: SagaContext<TData>) => Promise<DomainEvent>;
      isFinal?: boolean;
    }
  ): this {
    // Convert the extended config to StateMachine format
    const stateConfig: StateMachine<TData>['states'][string] & { isFinal?: boolean } = {};
    
    if (config.onEnter || config.action) {
      stateConfig.invoke = {
        src: async (context) => {
          if (config.onEnter) {
            await config.onEnter(context);
          }
          if (config.action) {
            await config.action(context);
          }
        }
      };
    }
    
    if (config.compensate) {
      stateConfig.compensate = config.compensate;
    }

    // Handle isFinal property
    if (config.isFinal) {
      stateConfig.type = 'final';
      stateConfig.isFinal = true;
    }

    this.states[name] = stateConfig as StateMachine<TData>['states'][string];
    return this;
  }

  addTransition(fromState: string, eventType: string, toState: string): this {
    this.transitions.push({ from: fromState, event: eventType, to: toState });
    
    // Add to state machine on structure
    if (!this.states[fromState]) {
      this.states[fromState] = {};
    }
    if (!this.states[fromState].on) {
      this.states[fromState].on = {};
    }
    this.states[fromState].on![eventType] = toState;
    
    return this;
  }

  addStep(name: string, invoke: (context: SagaContext<TData>) => Promise<DomainEvent>): this {
    this.states[name] = {
      invoke,
      transitions: []
    };
    return this;
  }

  addCompensation(state: string, compensation: (context: SagaContext<TData>) => Promise<void>): this {
    if (this.states[state]) {
      this.states[state].compensate = compensation;
    }
    return this;
  }

  build(): any {
    if (!this._initialState) {
      throw new Error('Saga must have an initial state');
    }

    return {
      name: this.sagaType,
      initialState: this._initialState,
      states: this.states,
      transitions: this.transitions.map(t => ({ from: t.from, event: t.event, to: t.to }))
    };
  }

  createOrchestrator(repository: any): SagaOrchestrator<TData> {
    if (!this._initialState) {
      throw new Error('Saga must have an initial state');
    }

    const orchestrator = new SagaOrchestrator(this.sagaType, repository);
    
    // Transfer states to orchestrator's stateMachine
    orchestrator.stateMachine.states = { ...this.states };
    
    // IMPORTANT: Set the correct initial state from builder
    orchestrator.stateMachine.initialState = this._initialState;
    
    // Apply transitions
    for (const transition of this.transitions) {
      orchestrator.addTransition(transition.from, transition.event, transition.to);
    }
    
    // Transfer compensations from states
    for (const stateName in this.states) {
      if (Object.prototype.hasOwnProperty.call(this.states, stateName)) {
        const stateConfig = this.states[stateName];
        if (stateConfig.compensate) {
          orchestrator.addCompensation(stateName, stateConfig.compensate);
        }
      }
    }

    return orchestrator;
  }
}

/**
 * Example saga definition
 */
export const createOrderSaga = () => {
  return new SagaBuilder<OrderSagaData>()
    .withType('OrderFulfillment')
    .withInitialState('reservingInventory')
    .addState('reservingInventory', {
      invoke: {
        src: async (context) => {
          // Reserve inventory logic
          console.log('Reserving inventory for order:', context.data.orderId);
        },
        onDone: 'processingPayment',
        onError: 'failed'
      },
      compensate: async (context) => {
        // Release reserved inventory
        console.log('Releasing inventory for order:', context.data.orderId);
      }
    })
    .addState('processingPayment', {
      invoke: {
        src: async (context) => {
          // Process payment logic
          console.log('Processing payment for order:', context.data.orderId);
        },
        onDone: 'creatingShipment',
        onError: 'compensating'
      },
      compensate: async (context) => {
        // Refund payment
        console.log('Refunding payment for order:', context.data.orderId);
      }
    })
    .addState('creatingShipment', {
      invoke: {
        src: async (context) => {
          // Create shipment logic
          console.log('Creating shipment for order:', context.data.orderId);
        },
        onDone: 'completed',
        onError: 'compensating'
      }
    })
    .addState('compensating', {
      invoke: {
        src: async (context) => {
          // Trigger compensation
          console.log('Compensating order:', context.data.orderId);
        },
        onDone: 'failed'
      }
    })
    .addState('completed', {
      type: 'final'
    })
    .addState('failed', {
      type: 'final'
    })
    .build();
};

interface OrderSagaData {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  totalAmount: number;
}