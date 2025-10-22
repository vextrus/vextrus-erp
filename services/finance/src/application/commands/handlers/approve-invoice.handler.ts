import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { ApproveInvoiceCommand } from '../approve-invoice.command';
import { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { UserId } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { MushakGeneratorService, MushakFormType, MushakFormData } from '../../services/mushak-generator.service';
import { QueryBus } from '@nestjs/cqrs';
import { GetInvoiceQuery } from '../../queries/get-invoice.query';

/**
 * Approve Invoice Command Handler
 *
 * Handles the approval of draft invoices with automatic Mushak 6.3 generation.
 * Loads the aggregate from EventStore, applies business rules,
 * generates Mushak 6.3 (Commercial Invoice) for NBR compliance,
 * and persists the approval event.
 *
 * Bangladesh Compliance:
 * - Generates Mushak 6.3 (Commercial Invoice) on approval
 * - QR code for verification included
 * - Bengali/English bilingual format
 * - Automatic NBR submission if configured
 */
@CommandHandler(ApproveInvoiceCommand)
export class ApproveInvoiceHandler implements ICommandHandler<ApproveInvoiceCommand> {
  private readonly logger = new Logger(ApproveInvoiceHandler.name);

  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus,
    private readonly mushakGenerator: MushakGeneratorService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: ApproveInvoiceCommand): Promise<void> {
    this.logger.log(`Approving invoice: ${command.invoiceId}`);

    try {
      // Load invoice aggregate from event store
      const invoice = await this.repository.findById(command.invoiceId);

      if (!invoice) {
        throw new NotFoundException(`Invoice not found: ${command.invoiceId}`);
      }

      // Apply business logic (will throw if invalid state transition)
      invoice.approve(new UserId(command.userId));

      // Persist events to event store
      await this.repository.save(invoice);

      // Publish domain events to Kafka
      const events = invoice.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} domain events for invoice approval ${command.invoiceId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Invoice approved successfully: ${command.invoiceId}`);

      // Generate Mushak 6.3 (Commercial Invoice) for NBR compliance
      await this.generateMushak63(command.invoiceId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to approve invoice: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Generate Mushak 6.3 (Commercial Invoice) for approved invoice
   * NBR-compliant bilingual commercial invoice with QR code
   */
  private async generateMushak63(invoiceId: string): Promise<void> {
    try {
      this.logger.log(`Generating Mushak 6.3 for invoice ${invoiceId}`);

      // Query read model to get complete invoice details
      const invoiceReadModel = await this.queryBus.execute(new GetInvoiceQuery(invoiceId));

      if (!invoiceReadModel) {
        this.logger.warn(`Invoice ${invoiceId} not found in read model for Mushak generation`);
        return;
      }

      // Prepare Mushak form data
      const mushakData: MushakFormData = {
        formType: MushakFormType.MUSHAK_6_3,
        companyInfo: {
          name: invoiceReadModel.vendorName || 'Company Name',
          bin: invoiceReadModel.vendorBIN || '',
          tin: invoiceReadModel.vendorTIN || '',
          address: invoiceReadModel.vendorAddress || 'Address',
          phone: invoiceReadModel.vendorPhone || '',
          email: invoiceReadModel.vendorEmail
        },
        transactionInfo: {
          invoiceNumber: invoiceReadModel.invoiceNumber,
          invoiceDate: invoiceReadModel.invoiceDate,
          customerName: invoiceReadModel.customerName || 'Customer',
          customerAddress: invoiceReadModel.customerAddress || '',
          customerTIN: invoiceReadModel.customerTIN,
          customerBIN: invoiceReadModel.customerBIN,
          deliveryAddress: invoiceReadModel.deliveryAddress,
          paymentTerms: invoiceReadModel.paymentTerms || 'As per agreement',
          dueDate: invoiceReadModel.dueDate
        },
        items: invoiceReadModel.lineItems?.map((item: any) => ({
          description: item.description,
          hscode: item.hsCode,
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          unitPrice: item.unitPrice,
          totalPrice: item.amount,
          vatRate: item.vatRate,
          vatAmount: item.vatAmount,
          supplementaryDuty: item.supplementaryDuty
        })) || [],
        taxDetails: {
          totalAmount: invoiceReadModel.subtotal,
          vatableAmount: invoiceReadModel.subtotal,
          vatAmount: invoiceReadModel.vatAmount,
          supplementaryDuty: invoiceReadModel.supplementaryDuty,
          totalTax: invoiceReadModel.vatAmount + (invoiceReadModel.supplementaryDuty || 0),
          grandTotal: invoiceReadModel.grandTotal
        },
        includeQRCode: true,
        bengaliLabels: true
      };

      // Generate Mushak 6.3 PDF
      const result = await this.mushakGenerator.generateMushakForm(mushakData);

      this.logger.log(`Mushak 6.3 generated successfully: ${result.fileName}`);
      this.logger.log(`PDF size: ${result.pdfBuffer.length} bytes`);

      // TODO: Store PDF to file storage service or emit event with PDF data
      // For now, we just log the successful generation
      // In production, you might:
      // 1. Save to S3/MinIO
      // 2. Emit MushakGeneratedEvent with file path
      // 3. Send to NBR automatically (if configured in mushak-generator)

    } catch (error) {
      // Don't fail the approval if Mushak generation fails
      // Log error and continue
      this.logger.error(`Failed to generate Mushak 6.3 for invoice ${invoiceId}: ${(error as Error).message}`, (error as Error).stack);
    }
  }
}
