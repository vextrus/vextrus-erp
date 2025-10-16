#!/bin/bash

# Fix CQRS TypeScript errors

# Fix payment handler imports - InvoiceId from invoice.aggregate
sed -i 's|import { Payment, InvoiceId }|import { Payment }|g' src/application/commands/handlers/create-payment.handler.ts
sed -i '5a import { InvoiceId, UserId } from '"'"'../../../domain/aggregates/invoice/invoice.aggregate'"'"';' src/application/commands/handlers/create-payment.handler.ts

# Fix reconcile handler - UserId from invoice.aggregate
sed -i 's|  UserId,||g' src/application/commands/handlers/reconcile-payment.handler.ts
sed -i '7a import { UserId } from '"'"'../../../domain/aggregates/invoice/invoice.aggregate'"'"';' src/application/commands/handlers/reconcile-payment.handler.ts

# Fix reverse handler - UserId from invoice.aggregate
sed -i 's|import { Payment, UserId }|import { Payment }|g' src/application/commands/handlers/reverse-payment.handler.ts
sed -i '5a import { UserId } from '"'"'../../../domain/aggregates/invoice/invoice.aggregate'"'"';' src/application/commands/handlers/reverse-payment.handler.ts

# Fix payment projection - DomainEvent from base
sed -i 's|  DomainEvent,||g' src/application/queries/handlers/payment-projection.handler.ts
sed -i '4a import { DomainEvent } from '"'"'../../../domain/base/domain-event.base'"'"';' src/application/queries/handlers/payment-projection.handler.ts

# Fix journal projection - DomainEvent from base
sed -i 's|  DomainEvent,||g' src/application/queries/handlers/journal-projection.handler.ts
sed -i '4a import { DomainEvent } from '"'"'../../../domain/base/domain-event.base'"'"';' src/application/queries/handlers/journal-projection.handler.ts

# Fix occurredOn -> timestamp in payment projection
sed -i 's/event\.occurredOn/event.timestamp/g' src/application/queries/handlers/payment-projection.handler.ts

# Fix occurredOn -> timestamp in journal projection
sed -i 's/event\.occurredOn/event.timestamp/g' src/application/queries/handlers/journal-projection.handler.ts

echo "CQRS errors fixed"
