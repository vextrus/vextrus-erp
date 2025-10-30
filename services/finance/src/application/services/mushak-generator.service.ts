import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { BengaliLocalizationService } from './bengali-localization.service';
import { TaxCalculationService, TaxType, VendorType } from './tax-calculation.service';
import { NBRIntegrationService, MushakSubmission } from './nbr-integration.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export enum MushakFormType {
  MUSHAK_6_1 = '6.1',      // VAT Return
  MUSHAK_6_2_1 = '6.2.1',  // VAT Invoice
  MUSHAK_6_3 = '6.3',      // Commercial Invoice
  MUSHAK_6_4 = '6.4',      // Credit Note
  MUSHAK_6_5 = '6.5',      // Debit Note
  MUSHAK_6_6 = '6.6',      // Withholding Certificate
  MUSHAK_6_7 = '6.7',      // VAT Deposit Certificate
  MUSHAK_9_1 = '9.1'       // Monthly VAT Return
}

export interface MushakFormData {
  formType: MushakFormType;
  companyInfo: CompanyInfo;
  transactionInfo?: TransactionInfo;
  items?: InvoiceItem[];
  taxDetails?: TaxDetails;
  additionalInfo?: Record<string, any>;
  bengaliLabels?: boolean;
  includeQRCode?: boolean;
}

export interface CompanyInfo {
  name: string;
  nameBengali?: string;
  bin: string;
  tin?: string;
  address: string;
  addressBengali?: string;
  phone: string;
  email?: string;
  website?: string;
}

export interface TransactionInfo {
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerNameBengali?: string;
  customerAddress: string;
  customerTIN?: string;
  customerBIN?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  dueDate?: Date;
}

export interface InvoiceItem {
  description: string;
  descriptionBengali?: string;
  hscode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  vatRate?: number;
  vatAmount?: number;
  supplementaryDuty?: number;
}

export interface TaxDetails {
  totalAmount: number;
  vatableAmount: number;
  vatAmount: number;
  supplementaryDuty?: number;
  totalTax: number;
  grandTotal: number;
  amountInWords?: string;
  amountInWordsBengali?: string;
}

export interface MushakGenerationResult {
  formType: MushakFormType;
  pdfBuffer: Buffer;
  qrCodeData?: string;
  fileName: string;
  metadata: Record<string, any>;
}

@Injectable()
export class MushakGeneratorService {
  private readonly logger = new Logger(MushakGeneratorService.name);
  private readonly templatesPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly bengaliService: BengaliLocalizationService,
    private readonly taxService: TaxCalculationService,
    private readonly nbrService: NBRIntegrationService
  ) {
    this.templatesPath = this.configService.get<string>(
      'MUSHAK_TEMPLATES_PATH',
      path.join(process.cwd(), 'templates', 'mushak')
    );
  }

  /**
   * Generate Mushak form based on type
   */
  async generateMushakForm(data: MushakFormData): Promise<MushakGenerationResult> {
    try {
      this.logger.log(`Generating Mushak form: ${data.formType}`);

      let result: MushakGenerationResult;

      switch (data.formType) {
        case MushakFormType.MUSHAK_6_1:
          result = await this.generateMushak61(data);
          break;

        case MushakFormType.MUSHAK_6_2_1:
          result = await this.generateMushak621(data);
          break;

        case MushakFormType.MUSHAK_6_3:
          result = await this.generateMushak63(data);
          break;

        case MushakFormType.MUSHAK_6_4:
          result = await this.generateMushak64(data);
          break;

        case MushakFormType.MUSHAK_6_5:
          result = await this.generateMushak65(data);
          break;

        case MushakFormType.MUSHAK_6_6:
          result = await this.generateMushak66(data);
          break;

        case MushakFormType.MUSHAK_6_7:
          result = await this.generateMushak67(data);
          break;

        case MushakFormType.MUSHAK_9_1:
          result = await this.generateMushak91(data);
          break;

        default:
          throw new Error(`Unsupported Mushak form type: ${data.formType}`);
      }

      // Submit to NBR if configured
      if (this.configService.get<boolean>('AUTO_SUBMIT_MUSHAK', false)) {
        await this.submitToNBR(result, data);
      }

      return result;
    } catch (error) {
      this.logger.error(`Mushak generation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Generate Mushak-6.1: VAT Return
   */
  private async generateMushak61(data: MushakFormData): Promise<MushakGenerationResult> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    this.addFormHeader(doc, 'মূসক-৬.১', 'VAT Return Form', data.companyInfo);

    // Add government logo
    await this.addGovernmentLogo(doc);

    // Return period information
    doc.fontSize(12)
      .text('রিটার্ন পিরিয়ড / Return Period:', 50, 200)
      .text(data.additionalInfo?.returnPeriod || '', 200, 200);

    // Company details section
    this.addCompanySection(doc, data.companyInfo, 250);

    // Tax calculation summary
    if (data.taxDetails) {
      this.addTaxSummary(doc, data.taxDetails, 350);
    }

    // Sales and purchase summary
    const salesData = data.additionalInfo?.salesData || {};
    const purchaseData = data.additionalInfo?.purchaseData || {};

    doc.fontSize(11)
      .text('বিক্রয় বিবরণ / Sales Details', 50, 450)
      .text(`মোট বিক্রয় / Total Sales: ${this.bengaliService.formatCurrency(salesData.totalSales || 0)}`, 50, 470)
      .text(`আউটপুট ভ্যাট / Output VAT: ${this.bengaliService.formatCurrency(salesData.outputVAT || 0)}`, 50, 490);

    doc.text('ক্রয় বিবরণ / Purchase Details', 300, 450)
      .text(`মোট ক্রয় / Total Purchases: ${this.bengaliService.formatCurrency(purchaseData.totalPurchases || 0)}`, 300, 470)
      .text(`ইনপুট ভ্যাট / Input VAT: ${this.bengaliService.formatCurrency(purchaseData.inputVAT || 0)}`, 300, 490);

    // Net VAT calculation
    const netVAT = (salesData.outputVAT || 0) - (purchaseData.inputVAT || 0);
    doc.fontSize(12)
      .fillColor('#000080')
      .text(`নীট প্রদেয় ভ্যাট / Net VAT Payable: ${this.bengaliService.formatCurrency(netVAT)}`, 50, 530);

    // QR Code with submission data
    if (data.includeQRCode) {
      const qrData = await this.generateQRCode({
        form: 'MUSHAK-6.1',
        bin: data.companyInfo.bin,
        period: data.additionalInfo?.returnPeriod,
        netVAT: netVAT,
        timestamp: new Date().toISOString()
      });

      doc.image(qrData, 450, 550, { width: 100 });
    }

    // Footer with signatures
    this.addSignatureSection(doc, 650);

    // Finalize
    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return {
      formType: MushakFormType.MUSHAK_6_1,
      pdfBuffer,
      qrCodeData: data.includeQRCode ? 'QR_INCLUDED' : undefined,
      fileName: `MUSHAK_6_1_${data.companyInfo.bin}_${Date.now()}.pdf`,
      metadata: {
        returnPeriod: data.additionalInfo?.returnPeriod,
        netVAT,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Mushak-6.2.1: VAT Invoice (Tax Invoice)
   */
  private async generateMushak621(data: MushakFormData): Promise<MushakGenerationResult> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header with form title
    this.addFormHeader(doc, 'মূসক-৬.২.১', 'VAT Invoice / Tax Invoice', data.companyInfo);

    // Invoice details
    if (data.transactionInfo) {
      doc.fontSize(10)
        .text(`চালান নং / Invoice No: ${data.transactionInfo.invoiceNumber}`, 50, 150)
        .text(`তারিখ / Date: ${this.bengaliService.formatDate(data.transactionInfo.invoiceDate)}`, 350, 150);

      // Customer information
      doc.fontSize(11)
        .text('ক্রেতার বিবরণ / Customer Details:', 50, 180)
        .fontSize(10)
        .text(`নাম / Name: ${data.transactionInfo.customerName}`, 50, 200)
        .text(`ঠিকানা / Address: ${data.transactionInfo.customerAddress}`, 50, 215);

      if (data.transactionInfo.customerTIN) {
        doc.text(`টিআইএন / TIN: ${data.transactionInfo.customerTIN}`, 50, 230);
      }
      if (data.transactionInfo.customerBIN) {
        doc.text(`বিআইএন / BIN: ${data.transactionInfo.customerBIN}`, 250, 230);
      }
    }

    // Items table
    if (data.items && data.items.length > 0) {
      this.addItemsTable(doc, data.items, 270);
    }

    // Tax calculation section
    if (data.taxDetails) {
      const yPos = 270 + (data.items ? data.items.length * 25 : 0) + 50;
      this.addTaxCalculation(doc, data.taxDetails, yPos);
    }

    // QR Code with invoice verification data
    if (data.includeQRCode && data.transactionInfo) {
      const qrData = await this.generateQRCode({
        form: 'MUSHAK-6.2.1',
        invoiceNo: data.transactionInfo.invoiceNumber,
        bin: data.companyInfo.bin,
        customerTIN: data.transactionInfo.customerTIN,
        amount: data.taxDetails?.grandTotal,
        vatAmount: data.taxDetails?.vatAmount,
        timestamp: new Date().toISOString()
      });

      doc.image(qrData, 450, 600, { width: 100 });
      doc.fontSize(8)
        .text('স্ক্যান করে যাচাই করুন', 455, 705)
        .text('Scan to Verify', 465, 720);
    }

    // Footer with authorization
    this.addAuthorizationSection(doc, 750);

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return {
      formType: MushakFormType.MUSHAK_6_2_1,
      pdfBuffer,
      qrCodeData: data.includeQRCode ? 'QR_INCLUDED' : undefined,
      fileName: `MUSHAK_6_2_1_${data.transactionInfo?.invoiceNumber}_${Date.now()}.pdf`,
      metadata: {
        invoiceNumber: data.transactionInfo?.invoiceNumber,
        customerName: data.transactionInfo?.customerName,
        totalAmount: data.taxDetails?.grandTotal,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Mushak-6.3: Commercial Invoice
   */
  private async generateMushak63(data: MushakFormData): Promise<MushakGenerationResult> {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    this.addFormHeader(doc, 'মূসক-৬.৩', 'Commercial Invoice', data.companyInfo);

    // Commercial invoice specific details
    if (data.transactionInfo) {
      doc.fontSize(10)
        .text(`বাণিজ্যিক চালান নং / Commercial Invoice No: ${data.transactionInfo.invoiceNumber}`, 50, 150)
        .text(`তারিখ / Date: ${this.bengaliService.formatDate(data.transactionInfo.invoiceDate)}`, 350, 150);

      // Buyer details
      doc.fontSize(11)
        .text('ক্রেতা / Buyer:', 50, 180)
        .fontSize(10)
        .text(data.transactionInfo.customerName, 50, 200)
        .text(data.transactionInfo.customerAddress, 50, 215);

      // Delivery details if different
      if (data.transactionInfo.deliveryAddress) {
        doc.fontSize(11)
          .text('ডেলিভারি ঠিকানা / Delivery Address:', 300, 180)
          .fontSize(10)
          .text(data.transactionInfo.deliveryAddress, 300, 200);
      }
    }

    // Items with HS codes for international trade
    if (data.items && data.items.length > 0) {
      this.addCommercialItemsTable(doc, data.items, 250);
    }

    // Payment terms
    if (data.transactionInfo?.paymentTerms) {
      doc.fontSize(10)
        .text(`পেমেন্ট শর্তাবলী / Payment Terms: ${data.transactionInfo.paymentTerms}`, 50, 500);
    }

    // Total amount
    if (data.taxDetails) {
      doc.fontSize(12)
        .fillColor('#000080')
        .text(`মোট মূল্য / Total Amount: ${this.bengaliService.formatCurrency(data.taxDetails.grandTotal)}`, 50, 530);
    }

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return {
      formType: MushakFormType.MUSHAK_6_3,
      pdfBuffer,
      fileName: `MUSHAK_6_3_${data.transactionInfo?.invoiceNumber}_${Date.now()}.pdf`,
      metadata: {
        invoiceNumber: data.transactionInfo?.invoiceNumber,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Mushak-6.4: Credit Note
   */
  private async generateMushak64(data: MushakFormData): Promise<MushakGenerationResult> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    this.addFormHeader(doc, 'মূসক-৬.৪', 'Credit Note', data.companyInfo);

    // Credit note details
    doc.fontSize(10)
      .text(`ক্রেডিট নোট নং / Credit Note No: ${data.additionalInfo?.creditNoteNumber}`, 50, 150)
      .text(`তারিখ / Date: ${this.bengaliService.formatDate(new Date())}`, 350, 150)
      .text(`মূল চালান নং / Original Invoice No: ${data.additionalInfo?.originalInvoiceNumber}`, 50, 170)
      .text(`মূল চালান তারিখ / Original Invoice Date: ${data.additionalInfo?.originalInvoiceDate}`, 350, 170);

    // Reason for credit note
    doc.fontSize(11)
      .text('ক্রেডিট নোটের কারণ / Reason for Credit Note:', 50, 200)
      .fontSize(10)
      .text(data.additionalInfo?.reason || 'Return of goods / পণ্য ফেরত', 50, 220);

    // Items being credited
    if (data.items && data.items.length > 0) {
      this.addCreditDebitItemsTable(doc, data.items, 260, 'CREDIT');
    }

    // Credit amount summary
    if (data.taxDetails) {
      doc.fontSize(12)
        .fillColor('#008000')
        .text(`মোট ক্রেডিট / Total Credit: ${this.bengaliService.formatCurrency(data.taxDetails.grandTotal)}`, 50, 500);
    }

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return {
      formType: MushakFormType.MUSHAK_6_4,
      pdfBuffer,
      fileName: `MUSHAK_6_4_${data.additionalInfo?.creditNoteNumber}_${Date.now()}.pdf`,
      metadata: {
        creditNoteNumber: data.additionalInfo?.creditNoteNumber,
        originalInvoice: data.additionalInfo?.originalInvoiceNumber,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Mushak-6.5: Debit Note
   */
  private async generateMushak65(data: MushakFormData): Promise<MushakGenerationResult> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    this.addFormHeader(doc, 'মূসক-৬.৫', 'Debit Note', data.companyInfo);

    // Debit note details
    doc.fontSize(10)
      .text(`ডেবিট নোট নং / Debit Note No: ${data.additionalInfo?.debitNoteNumber}`, 50, 150)
      .text(`তারিখ / Date: ${this.bengaliService.formatDate(new Date())}`, 350, 150)
      .text(`মূল চালান নং / Original Invoice No: ${data.additionalInfo?.originalInvoiceNumber}`, 50, 170);

    // Reason for debit note
    doc.fontSize(11)
      .text('ডেবিট নোটের কারণ / Reason for Debit Note:', 50, 200)
      .fontSize(10)
      .text(data.additionalInfo?.reason || 'Additional charges / অতিরিক্ত চার্জ', 50, 220);

    // Items being debited
    if (data.items && data.items.length > 0) {
      this.addCreditDebitItemsTable(doc, data.items, 260, 'DEBIT');
    }

    // Debit amount summary
    if (data.taxDetails) {
      doc.fontSize(12)
        .fillColor('#FF0000')
        .text(`মোট ডেবিট / Total Debit: ${this.bengaliService.formatCurrency(data.taxDetails.grandTotal)}`, 50, 500);
    }

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return {
      formType: MushakFormType.MUSHAK_6_5,
      pdfBuffer,
      fileName: `MUSHAK_6_5_${data.additionalInfo?.debitNoteNumber}_${Date.now()}.pdf`,
      metadata: {
        debitNoteNumber: data.additionalInfo?.debitNoteNumber,
        originalInvoice: data.additionalInfo?.originalInvoiceNumber,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Mushak-6.6: Withholding Certificate
   */
  private async generateMushak66(data: MushakFormData): Promise<MushakGenerationResult> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    this.addFormHeader(doc, 'মূসক-৬.৬', 'Withholding Certificate', data.companyInfo);

    // Certificate details
    doc.fontSize(10)
      .text(`সার্টিফিকেট নং / Certificate No: ${data.additionalInfo?.certificateNumber}`, 50, 150)
      .text(`তারিখ / Date: ${this.bengaliService.formatDate(new Date())}`, 350, 150);

    // Vendor/Payee details
    doc.fontSize(11)
      .text('প্রাপকের বিবরণ / Payee Details:', 50, 180)
      .fontSize(10)
      .text(`নাম / Name: ${data.additionalInfo?.payeeName}`, 50, 200)
      .text(`টিআইএন / TIN: ${data.additionalInfo?.payeeTIN}`, 50, 215);

    // Withholding details
    const withholdingAmount = data.additionalInfo?.withholdingAmount || 0;
    const baseAmount = data.additionalInfo?.baseAmount || 0;
    const withholdingRate = data.additionalInfo?.withholdingRate || 0;

    doc.fontSize(11)
      .text('কর্তন বিবরণ / Withholding Details:', 50, 250)
      .fontSize(10)
      .text(`মূল পরিমাণ / Base Amount: ${this.bengaliService.formatCurrency(baseAmount)}`, 50, 270)
      .text(`কর্তনের হার / Withholding Rate: ${this.bengaliService.formatPercentage(withholdingRate * 100)}`, 50, 285)
      .text(`কর্তনকৃত পরিমাণ / Amount Withheld: ${this.bengaliService.formatCurrency(withholdingAmount)}`, 50, 300);

    // Payment details
    doc.fontSize(11)
      .text('পেমেন্ট বিবরণ / Payment Details:', 50, 330)
      .fontSize(10)
      .text(`পেমেন্ট তারিখ / Payment Date: ${data.additionalInfo?.paymentDate}`, 50, 350)
      .text(`চালান নং / Challan No: ${data.additionalInfo?.challanNumber}`, 50, 365);

    // Certification statement
    doc.fontSize(10)
      .text('এই মর্মে প্রত্যয়ন করা যাচ্ছে যে উপরোক্ত পরিমাণ কর উৎসে কর্তন করা হয়েছে এবং সরকারি কোষাগারে জমা দেওয়া হয়েছে।', 50, 400, {
        width: 500,
        align: 'justify'
      })
      .text('This is to certify that the above amount has been withheld at source and deposited to government treasury.', 50, 430, {
        width: 500,
        align: 'justify'
      });

    // Authorized signature
    this.addAuthorizationSection(doc, 500);

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return {
      formType: MushakFormType.MUSHAK_6_6,
      pdfBuffer,
      fileName: `MUSHAK_6_6_${data.additionalInfo?.certificateNumber}_${Date.now()}.pdf`,
      metadata: {
        certificateNumber: data.additionalInfo?.certificateNumber,
        payeeTIN: data.additionalInfo?.payeeTIN,
        withholdingAmount,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Mushak-6.7: VAT Deposit Certificate
   */
  private async generateMushak67(data: MushakFormData): Promise<MushakGenerationResult> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    this.addFormHeader(doc, 'মূসক-৬.৭', 'VAT Deposit Certificate', data.companyInfo);

    // Certificate details
    doc.fontSize(10)
      .text(`সার্টিফিকেট নং / Certificate No: ${data.additionalInfo?.certificateNumber}`, 50, 150)
      .text(`তারিখ / Date: ${this.bengaliService.formatDate(new Date())}`, 350, 150);

    // VAT deposit details
    const depositAmount = data.additionalInfo?.depositAmount || 0;
    const depositPeriod = data.additionalInfo?.depositPeriod || '';

    doc.fontSize(11)
      .text('ভ্যাট জমা বিবরণ / VAT Deposit Details:', 50, 180)
      .fontSize(10)
      .text(`জমার পিরিয়ড / Deposit Period: ${depositPeriod}`, 50, 200)
      .text(`জমাকৃত ভ্যাট / VAT Deposited: ${this.bengaliService.formatCurrency(depositAmount)}`, 50, 215);

    // Treasury challan details
    doc.fontSize(11)
      .text('ট্রেজারি চালান বিবরণ / Treasury Challan Details:', 50, 250)
      .fontSize(10)
      .text(`চালান নং / Challan No: ${data.additionalInfo?.challanNumber}`, 50, 270)
      .text(`চালান তারিখ / Challan Date: ${data.additionalInfo?.challanDate}`, 50, 285)
      .text(`ব্যাংক / Bank: ${data.additionalInfo?.bankName}`, 50, 300)
      .text(`শাখা / Branch: ${data.additionalInfo?.bankBranch}`, 50, 315);

    // Certification
    doc.fontSize(10)
      .text('এই মর্মে সার্টিফিকেট প্রদান করা হচ্ছে যে উপরোক্ত পরিমাণ ভ্যাট যথাযথভাবে সরকারি কোষাগারে জমা প্রদান করা হয়েছে।', 50, 350, {
        width: 500,
        align: 'justify'
      })
      .text('This certificate is issued to confirm that the above VAT amount has been duly deposited to the government treasury.', 50, 380, {
        width: 500,
        align: 'justify'
      });

    // QR Code for verification
    if (data.includeQRCode) {
      const qrData = await this.generateQRCode({
        form: 'MUSHAK-6.7',
        certificateNo: data.additionalInfo?.certificateNumber,
        challanNo: data.additionalInfo?.challanNumber,
        amount: depositAmount,
        timestamp: new Date().toISOString()
      });

      doc.image(qrData, 450, 420, { width: 100 });
    }

    // Authorized signature
    this.addAuthorizationSection(doc, 550);

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return {
      formType: MushakFormType.MUSHAK_6_7,
      pdfBuffer,
      qrCodeData: data.includeQRCode ? 'QR_INCLUDED' : undefined,
      fileName: `MUSHAK_6_7_${data.additionalInfo?.certificateNumber}_${Date.now()}.pdf`,
      metadata: {
        certificateNumber: data.additionalInfo?.certificateNumber,
        challanNumber: data.additionalInfo?.challanNumber,
        depositAmount,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate Mushak-9.1: Monthly VAT Return
   */
  private async generateMushak91(data: MushakFormData): Promise<MushakGenerationResult> {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    this.addFormHeader(doc, 'মূসক-৯.১', 'Monthly VAT Return', data.companyInfo);

    // Return month
    const returnMonth = data.additionalInfo?.returnMonth || '';
    doc.fontSize(10)
      .text(`রিটার্ন মাস / Return Month: ${returnMonth}`, 50, 120)
      .text(`জমা দেওয়ার সময়সীমা / Due Date: ${data.additionalInfo?.dueDate}`, 500, 120);

    // Summary table headers
    const tableTop = 160;
    doc.fontSize(9)
      .text('ক্রমিক', 50, tableTop)
      .text('বিবরণ / Description', 100, tableTop)
      .text('পরিমাণ / Amount', 400, tableTop)
      .text('ভ্যাট / VAT', 500, tableTop)
      .text('মন্তব্য / Remarks', 600, tableTop);

    // Draw table lines
    doc.moveTo(50, tableTop + 15)
      .lineTo(750, tableTop + 15)
      .stroke();

    // Monthly summary data
    const summaryData = [
      { description: 'মোট বিক্রয় / Total Sales', amount: data.additionalInfo?.totalSales || 0, vat: data.additionalInfo?.outputVAT || 0 },
      { description: 'মোট ক্রয় / Total Purchases', amount: data.additionalInfo?.totalPurchases || 0, vat: data.additionalInfo?.inputVAT || 0 },
      { description: 'রপ্তানি / Exports', amount: data.additionalInfo?.exports || 0, vat: 0 },
      { description: 'ছাড়প্রাপ্ত বিক্রয় / Exempted Sales', amount: data.additionalInfo?.exemptedSales || 0, vat: 0 },
      { description: 'সম্পূরক শুল্ক / Supplementary Duty', amount: data.additionalInfo?.supplementaryDuty || 0, vat: 0 }
    ];

    let yPosition = tableTop + 30;
    summaryData.forEach((item, index) => {
      doc.fontSize(9)
        .text((index + 1).toString(), 50, yPosition)
        .text(item.description, 100, yPosition)
        .text(this.bengaliService.formatCurrency(item.amount), 400, yPosition)
        .text(this.bengaliService.formatCurrency(item.vat), 500, yPosition);
      yPosition += 20;
    });

    // Net VAT calculation
    const netVAT = (data.additionalInfo?.outputVAT || 0) - (data.additionalInfo?.inputVAT || 0);
    doc.fontSize(11)
      .fillColor('#000080')
      .text(`নীট প্রদেয় ভ্যাট / Net VAT Payable: ${this.bengaliService.formatCurrency(netVAT)}`, 50, yPosition + 30);

    // Previous month adjustment if any
    if (data.additionalInfo?.previousMonthAdjustment) {
      doc.fontSize(10)
        .fillColor('#000000')
        .text(`পূর্ববর্তী মাসের সমন্বয় / Previous Month Adjustment: ${this.bengaliService.formatCurrency(data.additionalInfo.previousMonthAdjustment)}`, 50, yPosition + 50);
    }

    // Declaration
    doc.fontSize(9)
      .text('আমি ঘোষণা করছি যে এই রিটার্নে প্রদত্ত তথ্য সত্য এবং সঠিক।', 50, 450)
      .text('I declare that the information provided in this return is true and correct.', 50, 465);

    // Authorized signature
    this.addAuthorizationSection(doc, 500);

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return {
      formType: MushakFormType.MUSHAK_9_1,
      pdfBuffer,
      fileName: `MUSHAK_9_1_${returnMonth.replace('/', '_')}_${Date.now()}.pdf`,
      metadata: {
        returnMonth,
        netVAT,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Helper: Add form header
   */
  private addFormHeader(doc: any, formNumberBengali: string, formNameEnglish: string, companyInfo: CompanyInfo): void {
    // Government of Bangladesh header
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', { align: 'center' })
      .fontSize(12)
      .text('Government of the People\'s Republic of Bangladesh', { align: 'center' })
      .moveDown(0.5);

    // NBR header
    doc.fontSize(12)
      .text('জাতীয় রাজস্ব বোর্ড', { align: 'center' })
      .fontSize(11)
      .text('National Board of Revenue', { align: 'center' })
      .moveDown(0.5);

    // Form number and name
    doc.fontSize(16)
      .fillColor('#000080')
      .text(`${formNumberBengali}`, { align: 'center' })
      .fontSize(12)
      .fillColor('#000000')
      .text(formNameEnglish, { align: 'center' })
      .moveDown(1);

    // Company header
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text(companyInfo.name, { align: 'center' })
      .font('Helvetica')
      .fontSize(10)
      .text(`BIN: ${companyInfo.bin}${companyInfo.tin ? ` | TIN: ${companyInfo.tin}` : ''}`, { align: 'center' })
      .text(companyInfo.address, { align: 'center' })
      .text(companyInfo.phone, { align: 'center' })
      .moveDown(1);
  }

  /**
   * Helper: Add government logo (placeholder)
   */
  private async addGovernmentLogo(doc: any): Promise<void> {
    // In a real implementation, load the actual government logo
    // For now, we'll just add a placeholder
    doc.rect(250, 50, 100, 50)
      .stroke()
      .fontSize(8)
      .text('GOV LOGO', 275, 70);
  }

  /**
   * Helper: Add company section
   */
  private addCompanySection(doc: any, companyInfo: CompanyInfo, yPosition: number): void {
    doc.fontSize(11)
      .text('প্রতিষ্ঠানের বিবরণ / Company Details:', 50, yPosition)
      .fontSize(10)
      .text(`নাম / Name: ${companyInfo.name}`, 50, yPosition + 20)
      .text(`বিআইএন / BIN: ${companyInfo.bin}`, 50, yPosition + 35)
      .text(`ঠিকানা / Address: ${companyInfo.address}`, 50, yPosition + 50)
      .text(`ফোন / Phone: ${companyInfo.phone}`, 50, yPosition + 65);
  }

  /**
   * Helper: Add tax summary
   */
  private addTaxSummary(doc: any, taxDetails: TaxDetails, yPosition: number): void {
    doc.fontSize(11)
      .text('কর সংক্ষিপ্তসার / Tax Summary:', 50, yPosition)
      .fontSize(10)
      .text(`মোট পরিমাণ / Total Amount: ${this.bengaliService.formatCurrency(taxDetails.totalAmount)}`, 50, yPosition + 20)
      .text(`ভ্যাট / VAT: ${this.bengaliService.formatCurrency(taxDetails.vatAmount)}`, 50, yPosition + 35)
      .text(`সর্বমোট / Grand Total: ${this.bengaliService.formatCurrency(taxDetails.grandTotal)}`, 50, yPosition + 50);
  }

  /**
   * Helper: Add items table
   */
  private addItemsTable(doc: any, items: InvoiceItem[], startY: number): void {
    doc.fontSize(10)
      .text('ক্রম', 50, startY)
      .text('বিবরণ / Description', 80, startY)
      .text('পরিমাণ / Qty', 300, startY)
      .text('একক দর / Unit Price', 360, startY)
      .text('মোট / Total', 440, startY)
      .text('ভ্যাট / VAT', 500, startY);

    let yPos = startY + 20;
    items.forEach((item, index) => {
      doc.fontSize(9)
        .text((index + 1).toString(), 50, yPos)
        .text(item.description, 80, yPos, { width: 200 })
        .text(item.quantity.toString(), 300, yPos)
        .text(this.bengaliService.formatCurrency(item.unitPrice), 360, yPos)
        .text(this.bengaliService.formatCurrency(item.totalPrice), 440, yPos)
        .text(this.bengaliService.formatCurrency(item.vatAmount || 0), 500, yPos);
      yPos += 25;
    });
  }

  /**
   * Helper: Add commercial items table with HS codes
   */
  private addCommercialItemsTable(doc: any, items: InvoiceItem[], startY: number): void {
    doc.fontSize(10)
      .text('ক্রম', 50, startY)
      .text('বিবরণ / Description', 80, startY)
      .text('HS Code', 250, startY)
      .text('পরিমাণ / Qty', 320, startY)
      .text('একক / Unit', 380, startY)
      .text('মূল্য / Price', 440, startY);

    let yPos = startY + 20;
    items.forEach((item, index) => {
      doc.fontSize(9)
        .text((index + 1).toString(), 50, yPos)
        .text(item.description, 80, yPos, { width: 160 })
        .text(item.hscode || '-', 250, yPos)
        .text(item.quantity.toString(), 320, yPos)
        .text(item.unit, 380, yPos)
        .text(this.bengaliService.formatCurrency(item.totalPrice), 440, yPos);
      yPos += 25;
    });
  }

  /**
   * Helper: Add credit/debit items table
   */
  private addCreditDebitItemsTable(doc: any, items: InvoiceItem[], startY: number, type: 'CREDIT' | 'DEBIT'): void {
    const header = type === 'CREDIT' ? 'ক্রেডিট বিবরণ / Credit Details' : 'ডেবিট বিবরণ / Debit Details';

    doc.fontSize(11)
      .text(header, 50, startY - 20);

    doc.fontSize(10)
      .text('ক্রম', 50, startY)
      .text('বিবরণ / Description', 80, startY)
      .text('পরিমাণ / Amount', 400, startY);

    let yPos = startY + 20;
    items.forEach((item, index) => {
      doc.fontSize(9)
        .text((index + 1).toString(), 50, yPos)
        .text(item.description, 80, yPos, { width: 300 })
        .text(this.bengaliService.formatCurrency(item.totalPrice), 400, yPos);
      yPos += 25;
    });
  }

  /**
   * Helper: Add tax calculation details
   */
  private addTaxCalculation(doc: any, taxDetails: TaxDetails, yPosition: number): void {
    doc.fontSize(10)
      .text(`উপ-মোট / Subtotal:`, 350, yPosition)
      .text(this.bengaliService.formatCurrency(taxDetails.totalAmount), 450, yPosition)
      .text(`ভ্যাট / VAT (15%):`, 350, yPosition + 15)
      .text(this.bengaliService.formatCurrency(taxDetails.vatAmount), 450, yPosition + 15);

    if (taxDetails.supplementaryDuty) {
      doc.text(`সম্পূরক শুল্ক / SD:`, 350, yPosition + 30)
        .text(this.bengaliService.formatCurrency(taxDetails.supplementaryDuty), 450, yPosition + 30);
    }

    doc.fontSize(12)
      .fillColor('#000080')
      .text(`সর্বমোট / Grand Total:`, 350, yPosition + 50)
      .text(this.bengaliService.formatCurrency(taxDetails.grandTotal), 450, yPosition + 50);

    // Amount in words
    if (taxDetails.amountInWordsBengali) {
      doc.fontSize(9)
        .fillColor('#000000')
        .text(`কথায়: ${taxDetails.amountInWordsBengali}`, 50, yPosition + 70);
    }
  }

  /**
   * Helper: Add signature section
   */
  private addSignatureSection(doc: any, yPosition: number): void {
    doc.fontSize(10)
      .text('_____________________', 50, yPosition)
      .text('_____________________', 350, yPosition)
      .text('প্রস্তুতকারী / Prepared By', 50, yPosition + 15)
      .text('অনুমোদনকারী / Authorized By', 350, yPosition + 15);
  }

  /**
   * Helper: Add authorization section
   */
  private addAuthorizationSection(doc: any, yPosition: number): void {
    doc.fontSize(10)
      .text('_____________________', 350, yPosition)
      .text('অনুমোদিত স্বাক্ষর', 350, yPosition + 15)
      .text('Authorized Signature', 350, yPosition + 30)
      .fontSize(8)
      .text(`তারিখ / Date: ${this.bengaliService.formatDate(new Date())}`, 350, yPosition + 45);
  }

  /**
   * Generate QR code
   */
  private async generateQRCode(data: any): Promise<Buffer> {
    try {
      const qrDataString = JSON.stringify(data);
      const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M'
      });

      // Convert data URL to buffer
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      this.logger.error(`QR code generation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Submit Mushak to NBR
   */
  private async submitToNBR(result: MushakGenerationResult, data: MushakFormData): Promise<void> {
    try {
      const submission: MushakSubmission = {
        formType: result.formType,
        formData: {
          ...data,
          generatedAt: result.metadata.generatedAt
        },
        attachments: [result.pdfBuffer.toString('base64')]
      };

      await this.nbrService.submitMushakForm(submission);
      this.logger.log(`Mushak ${result.formType} submitted to NBR successfully`);
    } catch (error) {
      this.logger.error(`Failed to submit Mushak to NBR: ${(error as Error).message}`, (error as Error).stack);
      // Don't throw - allow form generation to succeed even if submission fails
    }
  }

  /**
   * Batch generate multiple Mushak forms
   */
  async batchGenerateMushakForms(formDataArray: MushakFormData[]): Promise<MushakGenerationResult[]> {
    const results: MushakGenerationResult[] = [];

    for (const formData of formDataArray) {
      try {
        const result = await this.generateMushakForm(formData);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to generate Mushak ${formData.formType}: ${(error as Error).message}`, (error as Error).stack);
      }
    }

    return results;
  }
}