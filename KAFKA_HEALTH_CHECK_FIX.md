# Kafka Health Check Provider Injection Fix

## Problem Summary
The master-data service had a dependency injection scope issue where `KafkaHealthIndicator` couldn't access the `KAFKA_SERVICE` provider because it was registered in `AppModule` but needed in `HealthModule`.

## Error Message
```
Nest can't resolve dependencies of the KafkaHealthIndicator (?). 
Please make sure that the argument "KAFKA_SERVICE" at index [0] is available in the HealthModule context.
```

## Root Cause
- `KAFKA_SERVICE` was registered directly in `AppModule` using `ClientsModule.registerAsync()`
- `HealthModule` imported `AppModule` but couldn't access the provider
- NestJS module scoping prevents cross-module provider access without explicit exports

## Solution Architecture

### Module Dependency Graph (Before)
```
AppModule
├── ClientsModule.registerAsync(['KAFKA_SERVICE']) ❌ Not exported
├── HealthModule
│   └── KafkaHealthIndicator ❌ Cannot inject KAFKA_SERVICE
└── EventPublisherService ✅ Can inject (same module)
```

### Module Dependency Graph (After)
```
KafkaModule (NEW)
├── ClientsModule.registerAsync(['KAFKA_SERVICE'])
└── exports: [ClientsModule] ✅ Makes provider available

AppModule
├── imports: [KafkaModule] ✅ Provider available here
└── EventPublisherService ✅ Can inject KAFKA_SERVICE

HealthModule
├── imports: [KafkaModule] ✅ Provider available here
└── KafkaHealthIndicator ✅ Can inject KAFKA_SERVICE
```

## Implementation Details

### 1. Created KafkaModule
**File:** `services/master-data/src/modules/kafka/kafka.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('kafka.clientId'),
              brokers: configService.get('kafka.brokers'),
            },
            consumer: {
              groupId: configService.get('kafka.consumerGroup'),
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule], // ✅ Key: Export to make available to other modules
})
export class KafkaModule {}
```

**Key Points:**
- Encapsulates Kafka client registration
- Uses `ClientsModule.registerAsync()` for dynamic configuration
- **Exports `ClientsModule`** to make `KAFKA_SERVICE` available to importing modules
- Follows NestJS best practices for shared provider modules

### 2. Updated AppModule
**File:** `services/master-data/src/app.module.ts`

**Changes:**
- ✅ Added import: `import { KafkaModule } from './modules/kafka/kafka.module';`
- ✅ Added to imports array: `KafkaModule`
- ❌ Removed: Direct `ClientsModule.registerAsync()` registration (moved to KafkaModule)

**Result:**
- `AppModule` now imports `KafkaModule` instead of registering Kafka directly
- `EventPublisherService` can still inject `KAFKA_SERVICE` (available via KafkaModule)

### 3. Updated HealthModule
**File:** `services/master-data/src/modules/health/health.module.ts`

**Changes:**
- ✅ Added import: `import { KafkaModule } from '../kafka/kafka.module';`
- ✅ Added to imports array: `KafkaModule`

**Result:**
- `KafkaHealthIndicator` can now successfully inject `KAFKA_SERVICE`
- Health checks can verify Kafka connectivity

## Files Modified/Created

### Created
1. `services/master-data/src/modules/kafka/kafka.module.ts` - New Kafka module

### Modified
1. `services/master-data/src/app.module.ts` - Import KafkaModule, remove direct ClientsModule
2. `services/master-data/src/modules/health/health.module.ts` - Import KafkaModule

### Unchanged (but now working)
1. `services/master-data/src/modules/health/kafka.health.ts` - No changes needed
2. `services/master-data/src/services/event-publisher.service.ts` - No changes needed

## Verification

### Build Success
```bash
cd services/master-data
npm run build
# ✅ Build completed without errors
```

### Provider Injection
Both services can now inject KAFKA_SERVICE:
- ✅ `KafkaHealthIndicator` (in HealthModule)
- ✅ `EventPublisherService` (in AppModule)

## NestJS Best Practices Applied

1. **Single Responsibility**: KafkaModule only handles Kafka client registration
2. **Proper Scoping**: Provider exported via module exports
3. **Reusability**: KafkaModule can be imported by any module needing Kafka
4. **Configuration**: Uses ConfigService for environment-based setup
5. **Type Safety**: Maintains TypeScript types throughout

## Related Components

### Services Using KAFKA_SERVICE
1. **KafkaHealthIndicator** - Health checks for Kafka connectivity
2. **EventPublisherService** - Publishes domain events to Kafka topics

### Configuration Required
Environment variables needed for Kafka:
- `KAFKA_CLIENT_ID` - Kafka client identifier
- `KAFKA_BROKERS` - Comma-separated Kafka broker URLs
- `KAFKA_CONSUMER_GROUP` - Consumer group ID

## Summary

The fix implements proper NestJS module architecture by:
1. Creating a dedicated `KafkaModule` that encapsulates Kafka client setup
2. Exporting the `ClientsModule` to make `KAFKA_SERVICE` available
3. Importing `KafkaModule` in both `AppModule` and `HealthModule`
4. Eliminating the dependency injection scope issue

**Result**: All modules can now successfully inject and use the `KAFKA_SERVICE` provider for Kafka operations.
