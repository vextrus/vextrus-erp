import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';
import { BengaliLocalizationService } from './bengali-localization.service';
import { TaxCalculationService, TaxType } from './tax-calculation.service';
import { NBRIntegrationService } from './nbr-integration.service';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

export enum ChallanType {
  TDS_CHALLAN = 'TDS_CHALLAN',           // Tax Deducted at Source
  VAT_CHALLAN = 'VAT_CHALLAN',           // VAT Treasury Challan
  AIT_CHALLAN = 'AIT_CHALLAN',           // Advance Income Tax
  CUSTOMS_CHALLAN = 'CUSTOMS_CHALLAN',   // Customs Duty
  EXCISE_CHALLAN = 'EXCISE_CHALLAN',     // Excise Duty
  INCOME_TAX_CHALLAN = 'INCOME_TAX_CHALLAN', // Income Tax Payment
  PENALTY_CHALLAN = 'PENALTY_CHALLAN'    // Penalty Payment
}

export enum PaymentMode {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
  RTGS = 'RTGS',
  NEFT = 'NEFT'
}

export interface ChallanData {
  challanType: ChallanType;
  companyInfo: CompanyDetails;
  paymentDetails: PaymentDetails;
  taxDetails: TaxBreakdown;
  bankInfo?: BankDetails;
  additionalInfo?: Record<string, any>;
  generateBarcode?: boolean;
  generateQRCode?: boolean;
}

export interface CompanyDetails {
  name: string;
  nameBengali?: string;
  tin: string;
  bin?: string;
  address: string;
  addressBengali?: string;
  phone: string;
  email?: string;
  taxCircle?: string;
  taxZone?: string;
}

export interface PaymentDetails {
  challanNumber?: string;
  paymentDate: Date;
  dueDate: Date;
  paymentMode: PaymentMode;
  chequeNumber?: string;
  chequeDate?: Date;
  bankName?: string;
  branchName?: string;
  paymentPeriod: string; // e.g., "07/2024" for July 2024
  assessmentYear?: string;
}

export interface TaxBreakdown {
  principalAmount: number;
  taxAmount: number;
  penalty?: number;
  interest?: number;
  others?: number;
  totalAmount: number;
  economicCode?: string;
  taxType: TaxType;
  description?: string;
}

export interface BankDetails {
  bankName: string;
  branchName: string;
  accountNumber?: string;
  accountTitle?: string;
  routingNumber?: string;
}

export interface ChallanGenerationResult {
  challanType: ChallanType;
  challanNumber: string;
  pdfBuffer: Buffer;
  barcodeData?: string;
  qrCodeData?: string;
  fileName: string;
  metadata: Record<string, any>;
  copies: {
    depositor: Buffer;
    bank: Buffer;
    nbr: Buffer;
    office: Buffer;
  };
}

interface EconomicCode {
  code: string;
  description: string;
  descriptionBengali: string;
}

@Injectable()
export class ChallanGeneratorService {
  private readonly logger = new Logger(ChallanGeneratorService.name);

  // Economic codes for different tax types
  private readonly ECONOMIC_CODES: Record<string, EconomicCode> = {
    'VAT': {
      code: '1-1133-0000-0311',
      description: 'Value Added Tax',
      descriptionBengali: 'মূল্য সংযোজন কর'
    },
    'TDS': {
      code: '1-1141-0000-0311',
      description: 'Tax Deducted at Source',
      descriptionBengali: 'উৎসে কর কর্তন'
    },
    'AIT': {
      code: '1-1142-0000-0311',
      description: 'Advance Income Tax',
      descriptionBengali: 'অগ্রীম আয়কর'
    },
    'CUSTOMS': {
      code: '1-1151-0000-0311',
      description: 'Customs Duty',
      descriptionBengali: 'শুল্ক'
    },
    'EXCISE': {
      code: '1-1153-0000-0311',
      description: 'Excise Duty',
      descriptionBengali: 'আবগারি শুল্ক'
    },
    'INCOME_TAX': {
      code: '1-1143-0000-0311',
      description: 'Income Tax',
      descriptionBengali: 'আয়কর'
    },
    'PENALTY': {
      code: '1-1901-0000-0311',
      description: 'Penalty and Fine',
      descriptionBengali: 'জরিমানা'
    }
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly bengaliService: BengaliLocalizationService,
    private readonly taxService: TaxCalculationService,
    private readonly nbrService: NBRIntegrationService
  ) {}

  /**
   * Generate challan based on type
   */
  async generateChallan(data: ChallanData): Promise<ChallanGenerationResult> {
    try {
      this.logger.log(`Generating ${data.challanType} challan`);

      // Generate challan number if not provided
      const challanNumber = data.paymentDetails.challanNumber || this.generateChallanNumber(data.challanType);

      // Generate all 4 copies
      const copies = await this.generateAllCopies(data, challanNumber);

      // Create main PDF (Office copy)
      const mainPdf = copies.office;

      return {
        challanType: data.challanType,
        challanNumber,
        pdfBuffer: mainPdf,
        barcodeData: data.generateBarcode ? await this.generateBarcode(challanNumber) : undefined,
        qrCodeData: data.generateQRCode ? await this.generateQRCodeData(data, challanNumber) : undefined,
        fileName: `${data.challanType}_${challanNumber}_${Date.now()}.pdf`,
        metadata: {
          generatedAt: new Date(),
          totalAmount: data.taxDetails.totalAmount,
          paymentPeriod: data.paymentDetails.paymentPeriod,
          dueDate: data.paymentDetails.dueDate
        },
        copies
      };
    } catch (error) {
      this.logger.error(`Challan generation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Generate all 4 copies of the challan
   */
  private async generateAllCopies(
    data: ChallanData,
    challanNumber: string
  ): Promise<{
    depositor: Buffer;
    bank: Buffer;
    nbr: Buffer;
    office: Buffer;
  }> {
    const copies = {
      depositor: await this.generateSingleCopy(data, challanNumber, 'Depositor Copy / জমাদানকারীর কপি'),
      bank: await this.generateSingleCopy(data, challanNumber, 'Bank Copy / ব্যাংক কপি'),
      nbr: await this.generateSingleCopy(data, challanNumber, 'NBR Copy / জাতীয় রাজস্ব বোর্ড কপি'),
      office: await this.generateSingleCopy(data, challanNumber, 'Office Copy / অফিস কপি')
    };

    return copies;
  }

  /**
   * Generate a single copy of the challan
   */
  private async generateSingleCopy(
    data: ChallanData,
    challanNumber: string,
    copyType: string
  ): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Add copy type watermark
    doc.fontSize(40)
      .fillColor('#EEEEEE')
      .rotate(-45, { origin: [300, 400] })
      .text(copyType.split('/')[0].trim(), 100, 400)
      .rotate(45, { origin: [300, 400] })
      .fillColor('#000000');

    // Header based on challan type
    switch (data.challanType) {
      case ChallanType.TDS_CHALLAN:
        await this.generateTDSChallan(doc, data, challanNumber, copyType);
        break;

      case ChallanType.VAT_CHALLAN:
        await this.generateVATChallan(doc, data, challanNumber, copyType);
        break;

      case ChallanType.AIT_CHALLAN:
        await this.generateAITChallan(doc, data, challanNumber, copyType);
        break;

      case ChallanType.INCOME_TAX_CHALLAN:
        await this.generateIncomeTaxChallan(doc, data, challanNumber, copyType);
        break;

      default:
        await this.generateGenericChallan(doc, data, challanNumber, copyType);
    }

    doc.end();

    return Buffer.concat(chunks);
  }

  /**
   * Generate TDS Challan
   */
  private async generateTDSChallan(
    doc: any,
    data: ChallanData,
    challanNumber: string,
    copyType: string
  ): Promise<void> {
    // Government header
    this.addGovernmentHeader(doc);

    // Challan title
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('উৎসে কর কর্তন চালান', { align: 'center' })
      .fontSize(12)
      .text('Tax Deducted at Source (TDS) Challan', { align: 'center' })
      .moveDown();

    // Copy type
    doc.fontSize(10)
      .font('Helvetica')
      .text(copyType, { align: 'right' })
      .moveDown();

    // Challan number with barcode
    doc.fontSize(11)
      .text(`চালান নং / Challan No: ${challanNumber}`, 50, 200);

    if (data.generateBarcode) {
      const barcodeBuffer = await this.generateBarcodeBuffer(challanNumber);
      doc.image(barcodeBuffer, 350, 190, { width: 200, height: 50 });
    }

    // Company information
    this.addCompanySection(doc, data.companyInfo, 250);

    // Payment details
    this.addPaymentDetailsSection(doc, data.paymentDetails, 350);

    // Tax breakdown
    this.addTaxBreakdownSection(doc, data.taxDetails, 450);

    // Bank details if payment by cheque/transfer
    if (data.paymentDetails.paymentMode !== PaymentMode.CASH && data.bankInfo) {
      this.addBankDetailsSection(doc, data.bankInfo, 550);
    }

    // QR Code for verification
    if (data.generateQRCode) {
      const qrData = await this.generateQRCode({
        challanType: 'TDS',
        challanNumber,
        tin: data.companyInfo.tin,
        amount: data.taxDetails.totalAmount,
        paymentDate: data.paymentDetails.paymentDate,
        economicCode: this.ECONOMIC_CODES.TDS.code
      });

      doc.image(qrData, 450, 600, { width: 100 });
      doc.fontSize(8)
        .text('Scan for verification', 460, 705);
    }

    // Footer with signatures
    this.addSignatureSection(doc, 750);
  }

  /**
   * Generate VAT Treasury Challan
   */
  private async generateVATChallan(
    doc: any,
    data: ChallanData,
    challanNumber: string,
    copyType: string
  ): Promise<void> {
    // Government header
    this.addGovernmentHeader(doc);

    // Challan title
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('ভ্যাট ট্রেজারি চালান', { align: 'center' })
      .fontSize(12)
      .text('VAT Treasury Challan', { align: 'center' })
      .moveDown();

    // Copy type
    doc.fontSize(10)
      .font('Helvetica')
      .text(copyType, { align: 'right' })
      .moveDown();

    // Challan details
    doc.fontSize(11)
      .text(`চালান নং / Challan No: ${challanNumber}`, 50, 200)
      .text(`তারিখ / Date: ${this.bengaliService.formatDate(data.paymentDetails.paymentDate)}`, 350, 200);

    // Economic code
    const economicCode = data.taxDetails.economicCode || this.ECONOMIC_CODES.VAT.code;
    doc.text(`অর্থনৈতিক কোড / Economic Code: ${economicCode}`, 50, 220);

    // Company information
    this.addCompanySection(doc, data.companyInfo, 250);

    // VAT period
    doc.fontSize(11)
      .text(`ভ্যাট পিরিয়ড / VAT Period: ${data.paymentDetails.paymentPeriod}`, 50, 340);

    // Tax breakdown with VAT specifics
    const yPos = 370;
    doc.fontSize(10)
      .text('বিবরণ / Description', 50, yPos)
      .text('পরিমাণ / Amount (BDT)', 350, yPos);

    doc.moveTo(50, yPos + 15)
      .lineTo(550, yPos + 15)
      .stroke();

    const items = [
      { label: 'মূল ভ্যাট / Principal VAT', amount: data.taxDetails.principalAmount },
      { label: 'জরিমানা / Penalty', amount: data.taxDetails.penalty || 0 },
      { label: 'সুদ / Interest', amount: data.taxDetails.interest || 0 },
      { label: 'অন্যান্য / Others', amount: data.taxDetails.others || 0 }
    ];

    let currentY = yPos + 25;
    items.forEach(item => {
      doc.fontSize(9)
        .text(item.label, 50, currentY)
        .text(this.bengaliService.formatCurrency(item.amount), 350, currentY);
      currentY += 20;
    });

    // Total
    doc.moveTo(50, currentY)
      .lineTo(550, currentY)
      .stroke();

    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('সর্বমোট / Total', 50, currentY + 10)
      .text(this.bengaliService.formatCurrency(data.taxDetails.totalAmount), 350, currentY + 10);

    // Sonali Bank QR code for payment
    if (data.generateQRCode) {
      const qrData = await this.generateSonaliBankQRCode({
        challanNumber,
        amount: data.taxDetails.totalAmount,
        economicCode,
        tin: data.companyInfo.tin
      });

      doc.image(qrData, 450, 550, { width: 100 });
      doc.fontSize(8)
        .text('Sonali Bank QR', 455, 655)
        .text('স্ক্যান করে পেমেন্ট করুন', 445, 670);
    }

    // Footer
    this.addFooterSection(doc, 700);
  }

  /**
   * Generate AIT Challan
   */
  private async generateAITChallan(
    doc: any,
    data: ChallanData,
    challanNumber: string,
    copyType: string
  ): Promise<void> {
    // Government header
    this.addGovernmentHeader(doc);

    // Challan title
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('অগ্রীম আয়কর চালান', { align: 'center' })
      .fontSize(12)
      .text('Advance Income Tax (AIT) Challan', { align: 'center' })
      .moveDown();

    // Copy type and challan number
    doc.fontSize(10)
      .text(copyType, { align: 'right' })
      .text(`চালান নং / Challan No: ${challanNumber}`, 50, 200);

    // Import/Export details if applicable
    if (data.additionalInfo?.importExportDetails) {
      const details = data.additionalInfo.importExportDetails;
      doc.fontSize(10)
        .text(`L/C or B/E No: ${details.lcNumber || details.beNumber || 'N/A'}`, 50, 220)
        .text(`Invoice No: ${details.invoiceNumber || 'N/A'}`, 50, 235)
        .text(`HS Code: ${details.hsCode || 'N/A'}`, 350, 235);
    }

    // Company and tax details
    this.addCompanySection(doc, data.companyInfo, 270);
    this.addTaxBreakdownSection(doc, data.taxDetails, 370);

    // Assessment year
    if (data.paymentDetails.assessmentYear) {
      doc.fontSize(10)
        .text(`নির্ধারণ বছর / Assessment Year: ${data.paymentDetails.assessmentYear}`, 50, 470);
    }

    // Payment instructions
    doc.fontSize(9)
      .text('পেমেন্ট নির্দেশনা / Payment Instructions:', 50, 500)
      .text('• সোনালী ব্যাংকের যেকোন শাখায় জমা দেওয়া যাবে', 50, 515)
      .text('• অনলাইন পেমেন্ট: sonalibank.com.bd', 50, 530);

    // Barcode
    if (data.generateBarcode) {
      const barcodeBuffer = await this.generateBarcodeBuffer(challanNumber);
      doc.image(barcodeBuffer, 200, 550, { width: 200, height: 50 });
    }

    // Signatures
    this.addSignatureSection(doc, 650);
  }

  /**
   * Generate Income Tax Challan
   */
  private async generateIncomeTaxChallan(
    doc: any,
    data: ChallanData,
    challanNumber: string,
    copyType: string
  ): Promise<void> {
    // Government header
    this.addGovernmentHeader(doc);

    // Challan title
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('আয়কর চালান', { align: 'center' })
      .fontSize(12)
      .text('Income Tax Payment Challan', { align: 'center' })
      .moveDown();

    // Copy type
    doc.fontSize(10)
      .text(copyType, { align: 'right' });

    // Challan number and date
    doc.fontSize(11)
      .text(`চালান নং / Challan No: ${challanNumber}`, 50, 200)
      .text(`তারিখ / Date: ${this.bengaliService.formatDate(data.paymentDetails.paymentDate)}`, 350, 200);

    // Taxpayer details
    this.addTaxpayerSection(doc, data.companyInfo, 230);

    // Assessment details
    const assessmentYear = data.paymentDetails.assessmentYear || this.getCurrentAssessmentYear();
    doc.fontSize(10)
      .text(`নির্ধারণ বছর / Assessment Year: ${assessmentYear}`, 50, 330)
      .text(`কর বৃত্ত / Tax Circle: ${data.companyInfo.taxCircle || 'N/A'}`, 350, 330)
      .text(`কর অঞ্চল / Tax Zone: ${data.companyInfo.taxZone || 'N/A'}`, 350, 345);

    // Payment breakdown
    this.addIncomeTaxBreakdown(doc, data.taxDetails, 380);

    // Payment mode details
    this.addPaymentModeDetails(doc, data.paymentDetails, 500);

    // QR Code
    if (data.generateQRCode) {
      const qrData = await this.generateQRCode({
        challanType: 'INCOME_TAX',
        challanNumber,
        tin: data.companyInfo.tin,
        amount: data.taxDetails.totalAmount,
        assessmentYear,
        economicCode: this.ECONOMIC_CODES.INCOME_TAX.code
      });

      doc.image(qrData, 450, 550, { width: 100 });
    }

    // Declaration and signature
    this.addDeclarationSection(doc, 650);
    this.addSignatureSection(doc, 700);
  }

  /**
   * Generate generic challan for other types
   */
  private async generateGenericChallan(
    doc: any,
    data: ChallanData,
    challanNumber: string,
    copyType: string
  ): Promise<void> {
    // Government header
    this.addGovernmentHeader(doc);

    // Challan title
    const title = this.getChallanTitle(data.challanType);
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text(title.bengali, { align: 'center' })
      .fontSize(12)
      .text(title.english, { align: 'center' })
      .moveDown();

    // Copy type
    doc.fontSize(10)
      .text(copyType, { align: 'right' });

    // Standard sections
    this.addCompanySection(doc, data.companyInfo, 250);
    this.addPaymentDetailsSection(doc, data.paymentDetails, 350);
    this.addTaxBreakdownSection(doc, data.taxDetails, 450);

    // Barcode and QR code
    if (data.generateBarcode) {
      const barcodeBuffer = await this.generateBarcodeBuffer(challanNumber);
      doc.image(barcodeBuffer, 200, 550, { width: 200, height: 50 });
    }

    if (data.generateQRCode) {
      const qrData = await this.generateQRCode({
        challanType: data.challanType,
        challanNumber,
        amount: data.taxDetails.totalAmount
      });
      doc.image(qrData, 450, 550, { width: 100 });
    }

    // Signatures
    this.addSignatureSection(doc, 700);
  }

  /**
   * Add government header
   */
  private addGovernmentHeader(doc: any): void {
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .text('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', { align: 'center' })
      .fontSize(11)
      .text('Government of the People\'s Republic of Bangladesh', { align: 'center' })
      .fontSize(11)
      .text('জাতীয় রাজস্ব বোর্ড', { align: 'center' })
      .fontSize(10)
      .text('National Board of Revenue', { align: 'center' })
      .moveDown();
  }

  /**
   * Add company section
   */
  private addCompanySection(doc: any, company: CompanyDetails, yPos: number): void {
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('করদাতার বিবরণ / Taxpayer Details:', 50, yPos)
      .font('Helvetica')
      .fontSize(10);

    const details = [
      { label: 'নাম / Name', value: company.name },
      { label: 'টিআইএন / TIN', value: company.tin },
      { label: 'বিআইএন / BIN', value: company.bin || 'N/A' },
      { label: 'ঠিকানা / Address', value: company.address },
      { label: 'ফোন / Phone', value: company.phone }
    ];

    let currentY = yPos + 20;
    details.forEach(detail => {
      doc.text(`${detail.label}: ${detail.value}`, 50, currentY);
      currentY += 15;
    });
  }

  /**
   * Add taxpayer section for income tax
   */
  private addTaxpayerSection(doc: any, company: CompanyDetails, yPos: number): void {
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('করদাতার তথ্য / Taxpayer Information:', 50, yPos)
      .font('Helvetica')
      .fontSize(10);

    doc.text(`নাম / Name: ${company.name}`, 50, yPos + 20)
      .text(`টিআইএন / TIN: ${company.tin}`, 50, yPos + 35);

    if (company.nameBengali) {
      doc.text(`নাম (বাংলায়): ${company.nameBengali}`, 50, yPos + 50);
    }

    doc.text(`ঠিকানা / Address: ${company.address}`, 50, yPos + 65);
  }

  /**
   * Add payment details section
   */
  private addPaymentDetailsSection(doc: any, payment: PaymentDetails, yPos: number): void {
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('পেমেন্ট বিবরণ / Payment Details:', 50, yPos)
      .font('Helvetica')
      .fontSize(10);

    doc.text(`পেমেন্ট তারিখ / Payment Date: ${this.bengaliService.formatDate(payment.paymentDate)}`, 50, yPos + 20)
      .text(`নির্ধারিত তারিখ / Due Date: ${this.bengaliService.formatDate(payment.dueDate)}`, 50, yPos + 35)
      .text(`পেমেন্ট মোড / Payment Mode: ${payment.paymentMode}`, 50, yPos + 50)
      .text(`কর পিরিয়ড / Tax Period: ${payment.paymentPeriod}`, 50, yPos + 65);

    if (payment.chequeNumber) {
      doc.text(`চেক নং / Cheque No: ${payment.chequeNumber}`, 350, yPos + 20);
      if (payment.chequeDate) {
        doc.text(`চেক তারিখ / Cheque Date: ${this.bengaliService.formatDate(payment.chequeDate)}`, 350, yPos + 35);
      }
    }
  }

  /**
   * Add tax breakdown section
   */
  private addTaxBreakdownSection(doc: any, tax: TaxBreakdown, yPos: number): void {
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('কর বিবরণ / Tax Breakdown:', 50, yPos)
      .font('Helvetica')
      .fontSize(10);

    const items = [
      { label: 'মূল পরিমাণ / Principal Amount', value: tax.principalAmount },
      { label: 'কর পরিমাণ / Tax Amount', value: tax.taxAmount }
    ];

    if (tax.penalty) {
      items.push({ label: 'জরিমানা / Penalty', value: tax.penalty });
    }
    if (tax.interest) {
      items.push({ label: 'সুদ / Interest', value: tax.interest });
    }
    if (tax.others) {
      items.push({ label: 'অন্যান্য / Others', value: tax.others });
    }

    let currentY = yPos + 20;
    items.forEach(item => {
      doc.text(item.label, 50, currentY)
        .text(this.bengaliService.formatCurrency(item.value), 350, currentY);
      currentY += 15;
    });

    // Total
    doc.moveTo(50, currentY)
      .lineTo(450, currentY)
      .stroke();

    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('সর্বমোট / Total Amount', 50, currentY + 10)
      .text(this.bengaliService.formatCurrency(tax.totalAmount), 350, currentY + 10);

    // Amount in words
    const amountInWords = this.bengaliService.numberToWords(Math.floor(tax.totalAmount));
    doc.fontSize(9)
      .font('Helvetica')
      .text(`কথায়: ${amountInWords} টাকা মাত্র`, 50, currentY + 30);
  }

  /**
   * Add income tax breakdown
   */
  private addIncomeTaxBreakdown(doc: any, tax: TaxBreakdown, yPos: number): void {
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('কর বিবরণ / Tax Details:', 50, yPos)
      .font('Helvetica')
      .fontSize(10);

    const breakdown = [
      { label: 'আয়কর / Income Tax', value: tax.principalAmount },
      { label: 'সারচার্জ / Surcharge', value: tax.others || 0 },
      { label: 'জরিমানা / Penalty', value: tax.penalty || 0 },
      { label: 'সুদ / Interest', value: tax.interest || 0 }
    ];

    let currentY = yPos + 20;
    breakdown.forEach(item => {
      doc.text(item.label, 50, currentY)
        .text(this.bengaliService.formatCurrency(item.value), 350, currentY);
      currentY += 15;
    });

    // Draw line and total
    doc.moveTo(50, currentY)
      .lineTo(450, currentY)
      .stroke();

    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('মোট প্রদেয় / Total Payable', 50, currentY + 10)
      .text(this.bengaliService.formatCurrency(tax.totalAmount), 350, currentY + 10);
  }

  /**
   * Add bank details section
   */
  private addBankDetailsSection(doc: any, bank: BankDetails, yPos: number): void {
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text('ব্যাংক বিবরণ / Bank Details:', 50, yPos)
      .font('Helvetica')
      .fontSize(10);

    doc.text(`ব্যাংক / Bank: ${bank.bankName}`, 50, yPos + 20)
      .text(`শাখা / Branch: ${bank.branchName}`, 50, yPos + 35);

    if (bank.accountNumber) {
      doc.text(`হিসাব নং / Account No: ${bank.accountNumber}`, 50, yPos + 50);
    }
    if (bank.routingNumber) {
      doc.text(`রাউটিং নং / Routing No: ${bank.routingNumber}`, 350, yPos + 50);
    }
  }

  /**
   * Add payment mode details
   */
  private addPaymentModeDetails(doc: any, payment: PaymentDetails, yPos: number): void {
    doc.fontSize(10)
      .font('Helvetica-Bold')
      .text('পেমেন্ট পদ্ধতি / Payment Method:', 50, yPos)
      .font('Helvetica');

    switch (payment.paymentMode) {
      case PaymentMode.CASH:
        doc.text('নগদ / Cash', 50, yPos + 15);
        break;

      case PaymentMode.CHEQUE:
        doc.text(`চেক / Cheque`, 50, yPos + 15)
          .text(`চেক নং / Cheque No: ${payment.chequeNumber}`, 50, yPos + 30)
          .text(`ব্যাংক / Bank: ${payment.bankName}`, 50, yPos + 45);
        break;

      case PaymentMode.BANK_TRANSFER:
      case PaymentMode.RTGS:
      case PaymentMode.NEFT:
        doc.text(`${payment.paymentMode}`, 50, yPos + 15)
          .text(`ব্যাংক / Bank: ${payment.bankName}`, 50, yPos + 30)
          .text(`শাখা / Branch: ${payment.branchName}`, 50, yPos + 45);
        break;

      case PaymentMode.ONLINE:
        doc.text('অনলাইন পেমেন্ট / Online Payment', 50, yPos + 15);
        break;
    }
  }

  /**
   * Add declaration section
   */
  private addDeclarationSection(doc: any, yPos: number): void {
    doc.fontSize(9)
      .text('ঘোষণা / Declaration:', 50, yPos)
      .text('আমি ঘোষণা করছি যে উপরোক্ত তথ্য সত্য এবং সঠিক।', 50, yPos + 15)
      .text('I declare that the above information is true and correct.', 50, yPos + 30);
  }

  /**
   * Add signature section
   */
  private addSignatureSection(doc: any, yPos: number): void {
    doc.fontSize(9);

    // Three signature blocks
    const signatureBlocks = [
      { label: 'জমাদানকারী / Depositor', x: 50 },
      { label: 'ব্যাংক কর্মকর্তা / Bank Official', x: 225 },
      { label: 'কর কর্মকর্তা / Tax Official', x: 400 }
    ];

    signatureBlocks.forEach(block => {
      doc.text('_________________', block.x, yPos)
        .text(block.label, block.x, yPos + 15)
        .text('তারিখ / Date: ___________', block.x, yPos + 30);
    });
  }

  /**
   * Add footer section
   */
  private addFooterSection(doc: any, yPos: number): void {
    doc.fontSize(8)
      .fillColor('#666666')
      .text('সোনালী ব্যাংকের যেকোন শাখায় জমা দেওয়া যাবে', 50, yPos)
      .text('Can be deposited at any branch of Sonali Bank', 50, yPos + 12)
      .text('অনলাইন পেমেন্ট: ibas.finance.gov.bd', 50, yPos + 24);
  }

  /**
   * Generate challan number
   */
  private generateChallanNumber(challanType: ChallanType): string {
    const prefix = this.getChallanPrefix(challanType);
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get challan prefix based on type
   */
  private getChallanPrefix(challanType: ChallanType): string {
    const prefixes: Record<ChallanType, string> = {
      [ChallanType.TDS_CHALLAN]: 'TDS',
      [ChallanType.VAT_CHALLAN]: 'VAT',
      [ChallanType.AIT_CHALLAN]: 'AIT',
      [ChallanType.CUSTOMS_CHALLAN]: 'CUS',
      [ChallanType.EXCISE_CHALLAN]: 'EXC',
      [ChallanType.INCOME_TAX_CHALLAN]: 'INC',
      [ChallanType.PENALTY_CHALLAN]: 'PEN'
    };
    return prefixes[challanType] || 'GEN';
  }

  /**
   * Get challan title
   */
  private getChallanTitle(challanType: ChallanType): { bengali: string; english: string } {
    const titles: Record<ChallanType, { bengali: string; english: string }> = {
      [ChallanType.TDS_CHALLAN]: {
        bengali: 'উৎসে কর কর্তন চালান',
        english: 'Tax Deducted at Source Challan'
      },
      [ChallanType.VAT_CHALLAN]: {
        bengali: 'ভ্যাট ট্রেজারি চালান',
        english: 'VAT Treasury Challan'
      },
      [ChallanType.AIT_CHALLAN]: {
        bengali: 'অগ্রীম আয়কর চালান',
        english: 'Advance Income Tax Challan'
      },
      [ChallanType.CUSTOMS_CHALLAN]: {
        bengali: 'শুল্ক চালান',
        english: 'Customs Duty Challan'
      },
      [ChallanType.EXCISE_CHALLAN]: {
        bengali: 'আবগারি শুল্ক চালান',
        english: 'Excise Duty Challan'
      },
      [ChallanType.INCOME_TAX_CHALLAN]: {
        bengali: 'আয়কর চালান',
        english: 'Income Tax Challan'
      },
      [ChallanType.PENALTY_CHALLAN]: {
        bengali: 'জরিমানা চালান',
        english: 'Penalty Payment Challan'
      }
    };
    return titles[challanType] || { bengali: 'সাধারণ চালান', english: 'General Challan' };
  }

  /**
   * Generate barcode
   */
  private async generateBarcode(text: string): Promise<string> {
    const canvas = new Canvas(400, 100);
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 14,
      margin: 10
    });
    return canvas.toDataURL();
  }

  /**
   * Generate barcode buffer
   */
  private async generateBarcodeBuffer(text: string): Promise<Buffer> {
    const canvas = new Canvas(400, 100);
    JsBarcode(canvas, text, {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 14,
      margin: 10
    });
    return canvas.toBuffer('image/png');
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
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      this.logger.error(`QR code generation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Generate QR code data string
   */
  private async generateQRCodeData(data: ChallanData, challanNumber: string): Promise<string> {
    const qrData = {
      challanNumber,
      tin: data.companyInfo.tin,
      amount: data.taxDetails.totalAmount,
      paymentDate: data.paymentDetails.paymentDate,
      challanType: data.challanType,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(qrData);
  }

  /**
   * Generate Sonali Bank specific QR code
   */
  private async generateSonaliBankQRCode(data: {
    challanNumber: string;
    amount: number;
    economicCode: string;
    tin: string;
  }): Promise<Buffer> {
    const sonaliData = {
      bank: 'SONALI',
      type: 'TAX_PAYMENT',
      challan: data.challanNumber,
      amount: data.amount,
      code: data.economicCode,
      tin: data.tin,
      timestamp: Date.now()
    };
    return this.generateQRCode(sonaliData);
  }

  /**
   * Get current assessment year
   */
  private getCurrentAssessmentYear(): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Assessment year runs from July to June
    if (currentMonth >= 6) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  }

  /**
   * Calculate due date for challan
   */
  calculateChallanDueDate(challanType: ChallanType, transactionDate?: Date): Date {
    const date = transactionDate || new Date();
    const dueDate = new Date(date);

    switch (challanType) {
      case ChallanType.VAT_CHALLAN:
        // VAT payment due by 15th of next month
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(15);
        break;

      case ChallanType.TDS_CHALLAN:
        // TDS payment due within 7 days
        dueDate.setDate(dueDate.getDate() + 7);
        break;

      case ChallanType.INCOME_TAX_CHALLAN:
        // Income tax quarterly payments
        const month = dueDate.getMonth();
        if (month < 2) {
          dueDate.setMonth(2, 31); // March 31
        } else if (month < 5) {
          dueDate.setMonth(5, 30); // June 30
        } else if (month < 8) {
          dueDate.setMonth(8, 30); // September 30
        } else if (month < 11) {
          dueDate.setMonth(11, 31); // December 31
        } else {
          dueDate.setFullYear(dueDate.getFullYear() + 1, 2, 31); // Next March 31
        }
        break;

      default:
        // Default: end of current month
        dueDate.setMonth(dueDate.getMonth() + 1, 0);
    }

    // If due date is weekend (Friday/Saturday in Bangladesh), move to Sunday
    const dayOfWeek = dueDate.getDay();
    if (dayOfWeek === 5) { // Friday
      dueDate.setDate(dueDate.getDate() + 2);
    } else if (dayOfWeek === 6) { // Saturday
      dueDate.setDate(dueDate.getDate() + 1);
    }

    return dueDate;
  }

  /**
   * Submit challan to NBR
   */
  async submitChallanToNBR(
    challanData: ChallanData,
    challanNumber: string
  ): Promise<void> {
    try {
      // Prepare submission data
      const submission = {
        challanNumber,
        challanType: challanData.challanType,
        tin: challanData.companyInfo.tin,
        amount: challanData.taxDetails.totalAmount,
        paymentDate: challanData.paymentDetails.paymentDate,
        economicCode: challanData.taxDetails.economicCode || this.ECONOMIC_CODES[challanData.challanType.split('_')[0]]?.code
      };

      // Submit to NBR
      await this.nbrService.logSubmission({
        eventType: 'CHALLAN_GENERATION',
        eventDescription: `${challanData.challanType} generated`,
        userId: 'system',
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        affectedEntity: 'CHALLAN',
        entityId: challanNumber,
        metadata: submission
      });

      this.logger.log(`Challan ${challanNumber} submitted to NBR`);
    } catch (error) {
      this.logger.error(`Failed to submit challan to NBR: ${(error as Error).message}`, (error as Error).stack);
      // Don't throw - allow challan generation to succeed even if submission fails
    }
  }
}