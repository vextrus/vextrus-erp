import { Injectable, Logger } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import sharp from 'sharp';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as brain from 'brain.js';
import levenshtein from 'levenshtein';

export interface ExtractedInvoiceData {
  mushakNumber?: string;
  vendorTin?: string;
  vendorBin?: string;
  vendorName?: string;
  vendorAddress?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  totalAmount: number;
  subtotal?: number;
  vatAmount?: number;
  vatRate?: number;
  discountAmount?: number;
  lineItems: CodedLineItem[];
  confidence: number;
  validation: ValidationResult;
  suggestedCorrections?: SuggestedCorrection[];
  extractedText?: string;
  currency: string;
  tenantId: string;
}

export interface ExtractedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit?: string;
  vatRate?: number;
}

export interface CodedLineItem extends ExtractedLineItem {
  accountCode: string;
  hsCode?: string;
  taxCategory?: string;
  costCenter?: string;
  confidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface SuggestedCorrection {
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reason: string;
}

export interface ParsedInvoiceData {
  mushakNumber?: string;
  vendorTin?: string;
  vendorBin?: string;
  vendorName?: string;
  vendorAddress?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  totalAmount?: number;
  vatAmount?: number;
  lineItems: ExtractedLineItem[];
}

// Bangladesh HS Code mapping (simplified)
const HS_CODE_MAPPING: { [key: string]: string } = {
  'construction materials': '6801',
  'cement': '2523',
  'steel': '7208',
  'bricks': '6904',
  'sand': '2505',
  'electrical': '8544',
  'plumbing': '3917',
  'paint': '3209',
  'glass': '7005',
  'tiles': '6907',
  'wood': '4407',
  'aluminum': '7604',
  'concrete': '3824',
  'machinery': '8429',
  'equipment': '8430',
};

// Account code mapping for construction/real estate
const ACCOUNT_CODE_MAPPING: { [key: string]: string } = {
  'materials': '5010',
  'labor': '5020',
  'equipment': '5030',
  'subcontractor': '5040',
  'utilities': '5050',
  'professional': '5060',
  'administrative': '6010',
  'marketing': '6020',
  'maintenance': '5070',
  'insurance': '6030',
};

@Injectable()
export class OCRInvoiceProcessorService {
  private readonly logger = new Logger(OCRInvoiceProcessorService.name);
  private worker!: Tesseract.Worker;
  private classifier!: brain.NeuralNetwork<any, any>;
  private hsCodeModel!: brain.NeuralNetwork<any, any>;
  private readonly modelPath = path.join(process.cwd(), 'models', 'hs-code-classifier');

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize Tesseract worker
      await this.initializeTesseract();

      // Initialize ML classifiers
      await this.initializeClassifiers();

      this.logger.log('OCR and ML services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OCR services', error);
    }
  }

  private async initializeTesseract(): Promise<void> {
    this.worker = await Tesseract.createWorker(['eng', 'ben'], 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        } else if (m.status) {
          this.logger.debug(`OCR Status: ${m.status}`);
        }
      },
    });

    // Set parameters after worker is created and initialized
    await this.worker.setParameters({
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });
  }

  private async initializeClassifiers(): Promise<void> {
    // Initialize account code classifier
    this.classifier = new brain.NeuralNetwork<any, any>({
      hiddenLayers: [20, 10],
      activation: 'sigmoid',
    });

    // Initialize HS code classifier
    this.hsCodeModel = new brain.NeuralNetwork<any, any>({
      hiddenLayers: [30, 15],
      activation: 'sigmoid',
    });

    // Load pre-trained models if they exist
    await this.loadModels();
  }

  private async loadModels(): Promise<void> {
    const classifierPath = path.join(this.modelPath, 'account-classifier.json');
    const hsCodePath = path.join(this.modelPath, 'hs-classifier.json');

    try {
      if (fs.existsSync(classifierPath)) {
        const modelData = JSON.parse(fs.readFileSync(classifierPath, 'utf8'));
        this.classifier.fromJSON(modelData);
        this.logger.log('Loaded account code classifier');
      }

      if (fs.existsSync(hsCodePath)) {
        const modelData = JSON.parse(fs.readFileSync(hsCodePath, 'utf8'));
        this.hsCodeModel.fromJSON(modelData);
        this.logger.log('Loaded HS code classifier');
      }
    } catch (error) {
      this.logger.warn('Could not load pre-trained models, using defaults', error);
    }
  }

  async processInvoiceImage(
    imageBuffer: Buffer,
    format: 'pdf' | 'image',
    tenantId: string
  ): Promise<ExtractedInvoiceData> {
    const startTime = Date.now();

    try {
      // Convert PDF to image if needed
      const image = format === 'pdf'
        ? await this.pdfToImage(imageBuffer)
        : imageBuffer;

      // Preprocess image for better OCR
      const preprocessed = await this.preprocessImage(image);

      // Extract text using OCR
      const ocrResult = await this.performOCR(preprocessed);

      // Parse structured data
      const structuredData = await this.parseInvoiceData(ocrResult.data.text);

      // Auto-code line items
      const codedLineItems = await this.autoCodeLineItems(structuredData.lineItems || []);

      // Validate extracted data
      const validation = await this.validateExtraction(structuredData);

      // Generate suggested corrections
      const suggestedCorrections = await this.suggestCorrections(structuredData, validation);

      const processingTime = Date.now() - startTime;

      // Emit processing metrics
      this.eventEmitter.emit('invoice.ocr.processed', {
        processingTimeMs: processingTime,
        confidence: ocrResult.data.confidence,
        lineItemCount: codedLineItems.length,
        validationErrors: validation.errors.length,
      });

      this.logger.log(`Invoice processed in ${processingTime}ms with ${ocrResult.data.confidence}% confidence`);

      return {
        ...structuredData,
        invoiceNumber: structuredData.invoiceNumber || this.generateInvoiceNumber(),
        invoiceDate: structuredData.invoiceDate || new Date(),
        totalAmount: structuredData.totalAmount || 0,
        lineItems: codedLineItems,
        confidence: ocrResult.data.confidence,
        validation,
        suggestedCorrections,
        extractedText: ocrResult.data.text,
        currency: 'BDT',
        tenantId,
      };
    } catch (error) {
      this.logger.error('Failed to process invoice', error);
      throw error;
    }
  }

  private async pdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
    try {
      const pdfData = await pdfParse(pdfBuffer);

      // For now, we'll extract text directly from PDF
      // In production, you'd use a PDF rendering library to convert to image
      const text = pdfData.text;

      // Create a simple image with the text (placeholder)
      // In production, use pdf-to-image library
      const image = await sharp({
        create: {
          width: 2480,
          height: 3508,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .png()
      .toBuffer();

      return image;
    } catch (error) {
      this.logger.error('Failed to convert PDF to image', error);
      throw error;
    }
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Use sharp for image preprocessing
      const processed = await sharp(imageBuffer)
        .grayscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen text
        .threshold(128) // Binary threshold
        .toBuffer();

      return processed;
    } catch (error) {
      this.logger.error('Failed to preprocess image', error);
      throw error;
    }
  }

  private async performOCR(imageBuffer: Buffer): Promise<Tesseract.RecognizeResult> {
    try {
      const result = await this.worker.recognize(imageBuffer);
      return result;
    } catch (error) {
      this.logger.error('OCR failed', error);
      throw error;
    }
  }

  private async parseInvoiceData(text: string): Promise<ParsedInvoiceData> {
    // Bangladesh specific invoice format patterns
    const patterns = {
      mushakNumber: /MUSHAK[\s-]*6\.3[\s:-]*([A-Z0-9\-]+)/i,
      tin: /TIN[\s:]*(\d{10,12})/i,
      bin: /BIN[\s:]*(\d{9})/i,
      vendorName: /(?:Vendor|Supplier|From)[\s:]*([A-Za-z\s&.,]+?)(?:\n|TIN|BIN)/i,
      vendorAddress: /(?:Address|Office)[\s:]*([A-Za-z0-9\s,.\-/]+?)(?:\n{2}|Tel|Phone|Email)/i,
      invoiceNumber: /(?:Invoice|Bill|Challan)[\s]*(?:No|Number|#)[\s:]*([A-Z0-9\-/]+)/i,
      invoiceDate: /(?:Date|Dated)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      totalAmount: /(?:Total|Grand\s*Total|Net\s*Amount)[\s:]*(?:BDT|TK|Taka|৳)?\s*([\d,]+\.?\d*)/i,
      subtotal: /(?:Sub[\s-]*Total|Amount)[\s:]*(?:BDT|TK|৳)?\s*([\d,]+\.?\d*)/i,
      vat: /(?:VAT|Tax)[\s:@]*(\d+\.?\d*)%?\s*(?:BDT|TK|৳)?\s*([\d,]+\.?\d*)/i,
      discount: /(?:Discount|Deduction)[\s:]*(?:BDT|TK|৳)?\s*([\d,]+\.?\d*)/i,
    };

    const extracted: ParsedInvoiceData = {
      mushakNumber: this.extractPattern(text, patterns.mushakNumber),
      vendorTin: this.extractPattern(text, patterns.tin),
      vendorBin: this.extractPattern(text, patterns.bin),
      vendorName: this.extractPattern(text, patterns.vendorName),
      vendorAddress: this.extractPattern(text, patterns.vendorAddress),
      invoiceNumber: this.extractPattern(text, patterns.invoiceNumber),
      invoiceDate: this.parseDate(this.extractPattern(text, patterns.invoiceDate)),
      totalAmount: this.parseAmount(this.extractPattern(text, patterns.totalAmount)),
      vatAmount: this.parseAmount(this.extractPattern(text, patterns.vat, 2)),
      lineItems: await this.extractLineItems(text),
    };

    return extracted;
  }

  private extractPattern(text: string, pattern: RegExp, groupIndex: number = 1): string | undefined {
    const match = text.match(pattern);
    return match ? match[groupIndex]?.trim() : undefined;
  }

  private parseDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;

    // Handle various date formats used in Bangladesh
    const formats = [
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{2})/, // DD-MM-YY
      /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // DD/MM/YY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
        let year = parseInt(match[3]);

        // Handle 2-digit years
        if (year < 100) {
          year += year > 50 ? 1900 : 2000;
        }

        return new Date(year, month, day);
      }
    }

    return undefined;
  }

  private parseAmount(amountStr?: string): number | undefined {
    if (!amountStr) return undefined;

    // Remove commas and parse
    const cleaned = amountStr.replace(/,/g, '');
    const amount = parseFloat(cleaned);

    return isNaN(amount) ? undefined : amount;
  }

  private async extractLineItems(text: string): Promise<ExtractedLineItem[]> {
    const lineItems: ExtractedLineItem[] = [];

    // Pattern for table rows (common invoice format)
    const linePattern = /(\d+)[\s\t]+([A-Za-z0-9\s\-,./]+)[\s\t]+([\d.]+)[\s\t]+(\w+)?[\s\t]+([\d,.]+)[\s\t]+([\d,.]+)/gm;

    let match;
    while ((match = linePattern.exec(text)) !== null) {
      const item: ExtractedLineItem = {
        description: match[2].trim(),
        quantity: parseFloat(match[3]) || 1,
        unit: match[4] || 'pcs',
        unitPrice: this.parseAmount(match[5]) || 0,
        amount: this.parseAmount(match[6]) || 0,
      };

      // Validate line item
      if (item.description && item.amount > 0) {
        lineItems.push(item);
      }
    }

    // If no line items found with table pattern, try simpler pattern
    if (lineItems.length === 0) {
      const simplePattern = /([A-Za-z][A-Za-z0-9\s\-,./]+)[\s\t]+(?:BDT|TK|৳)?\s*([\d,.]+)/gm;

      while ((match = simplePattern.exec(text)) !== null) {
        const description = match[1].trim();
        const amount = this.parseAmount(match[2]);

        // Filter out total/subtotal lines
        if (description && amount &&
            !description.match(/total|vat|tax|discount/i)) {
          lineItems.push({
            description,
            quantity: 1,
            unitPrice: amount,
            amount: amount,
          });
        }
      }
    }

    return lineItems;
  }

  private async autoCodeLineItems(lineItems: ExtractedLineItem[]): Promise<CodedLineItem[]> {
    const codedItems: CodedLineItem[] = [];

    for (const item of lineItems) {
      const features = this.extractItemFeatures(item);

      // Predict account code
      const accountPrediction = this.classifier.run(features);
      const accountCode = this.mapPredictionToAccountCode(accountPrediction);

      // Predict HS code
      const hsCode = await this.predictHSCode(item.description);

      // Determine tax category
      const taxCategory = this.determineTaxCategory(hsCode);

      // Predict cost center
      const costCenter = await this.predictCostCenter(item);

      const codedItem: CodedLineItem = {
        ...item,
        accountCode,
        hsCode,
        taxCategory,
        costCenter,
        confidence: this.calculateItemConfidence(accountPrediction),
      };

      codedItems.push(codedItem);
    }

    return codedItems;
  }

  private extractItemFeatures(item: ExtractedLineItem): any {
    const description = item.description.toLowerCase();

    // Extract features for classification
    const features: any = {
      hasMaterial: /cement|steel|brick|sand|stone|glass|wood|tile/i.test(description) ? 1 : 0,
      hasLabor: /labor|labour|worker|mason|carpenter|electrician/i.test(description) ? 1 : 0,
      hasEquipment: /equipment|machine|tool|crane|mixer|generator/i.test(description) ? 1 : 0,
      hasService: /service|consultant|architect|engineer|design/i.test(description) ? 1 : 0,
      hasAdmin: /office|stationery|admin|management|rent/i.test(description) ? 1 : 0,
      amount: Math.log10(item.amount + 1) / 8, // Normalize amount (log scale)
    };

    return features;
  }

  private mapPredictionToAccountCode(prediction: any): string {
    // Map neural network output to account codes
    const categories = Object.keys(ACCOUNT_CODE_MAPPING);
    let maxScore = 0;
    let selectedCategory = 'materials'; // Default

    for (const category of categories) {
      if (prediction[category] > maxScore) {
        maxScore = prediction[category];
        selectedCategory = category;
      }
    }

    return ACCOUNT_CODE_MAPPING[selectedCategory];
  }

  private async predictHSCode(description: string): Promise<string> {
    const desc = description.toLowerCase();

    // Direct mapping for common items
    for (const [keyword, hsCode] of Object.entries(HS_CODE_MAPPING)) {
      if (desc.includes(keyword)) {
        return hsCode;
      }
    }

    // Use ML model for complex descriptions
    const features = this.getTextFeatures(desc);
    const prediction = this.hsCodeModel.run(features);

    // Map to closest HS code
    const hsCodeValues = Object.values(HS_CODE_MAPPING);
    const index = Math.floor(prediction.index * hsCodeValues.length);

    return hsCodeValues[Math.min(index, hsCodeValues.length - 1)];
  }

  private getTextFeatures(text: string): any {
    // Simple bag-of-words features for text classification
    const words = text.toLowerCase().split(/\s+/);
    const features: any = {};

    const keywords = [
      'construction', 'material', 'cement', 'steel', 'brick',
      'electrical', 'plumbing', 'paint', 'equipment', 'machinery'
    ];

    for (const keyword of keywords) {
      features[keyword] = words.includes(keyword) ? 1 : 0;
    }

    return features;
  }

  private determineTaxCategory(hsCode?: string): string {
    if (!hsCode) return 'standard';

    // Bangladesh tax categories based on HS codes
    // Simplified - in production, use official NBR tax category mappings
    const firstTwo = hsCode.substring(0, 2);

    if (['01', '02', '03', '04'].includes(firstTwo)) {
      return 'food'; // Basic food items - often zero or reduced VAT
    } else if (['84', '85', '87'].includes(firstTwo)) {
      return 'machinery'; // Machinery and equipment
    } else if (['68', '69', '70'].includes(firstTwo)) {
      return 'construction'; // Construction materials
    }

    return 'standard'; // Standard 15% VAT
  }

  private async predictCostCenter(item: ExtractedLineItem): Promise<string> {
    const description = item.description.toLowerCase();

    // Simple rule-based cost center assignment
    if (description.match(/site|project|construction/)) {
      return 'PROJ-001'; // Project cost center
    } else if (description.match(/office|admin|management/)) {
      return 'ADMIN-001'; // Administrative cost center
    } else if (description.match(/marketing|sales|advertisement/)) {
      return 'MKTG-001'; // Marketing cost center
    } else if (description.match(/maintenance|repair|service/)) {
      return 'MAINT-001'; // Maintenance cost center
    }

    return 'GENERAL-001'; // General cost center
  }

  private calculateItemConfidence(prediction: any): number {
    // Calculate confidence based on neural network output
    const values = Object.values(prediction) as number[];
    const maxValue = Math.max(...values);

    // Convert to percentage
    return Math.round(maxValue * 100) / 100;
  }

  private async validateExtraction(data: ParsedInvoiceData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!data.invoiceNumber) {
      errors.push({
        field: 'invoiceNumber',
        message: 'Invoice number is required',
      });
    }

    if (!data.invoiceDate) {
      errors.push({
        field: 'invoiceDate',
        message: 'Invoice date is required',
      });
    }

    if (!data.totalAmount || data.totalAmount <= 0) {
      errors.push({
        field: 'totalAmount',
        message: 'Total amount must be greater than 0',
        value: data.totalAmount,
      });
    }

    // TIN/BIN validation for Bangladesh
    if (data.vendorTin && !this.validateTIN(data.vendorTin)) {
      errors.push({
        field: 'vendorTin',
        message: 'Invalid TIN format (should be 10-12 digits)',
        value: data.vendorTin,
      });
    }

    if (data.vendorBin && !this.validateBIN(data.vendorBin)) {
      errors.push({
        field: 'vendorBin',
        message: 'Invalid BIN format (should be 9 digits)',
        value: data.vendorBin,
      });
    }

    // VAT validation (Bangladesh standard is 15%)
    if (data.vatAmount && data.totalAmount) {
      const expectedVat = (data.totalAmount / 1.15) * 0.15;
      const vatDifference = Math.abs(data.vatAmount - expectedVat);

      if (vatDifference > expectedVat * 0.1) { // More than 10% difference
        warnings.push({
          field: 'vatAmount',
          message: `VAT amount seems incorrect (expected ~${expectedVat.toFixed(2)} for 15% VAT)`,
          suggestion: `Verify if VAT rate is different or if this is VAT-exempt`,
        });
      }
    }

    // Mushak format validation
    if (data.mushakNumber && !this.validateMushakNumber(data.mushakNumber)) {
      warnings.push({
        field: 'mushakNumber',
        message: 'Mushak number format may be incorrect',
        suggestion: 'Should be in format: MUSHAK-6.3-YYYY-MM-XXXXXX',
      });
    }

    // Line items validation
    if (!data.lineItems || data.lineItems.length === 0) {
      warnings.push({
        field: 'lineItems',
        message: 'No line items detected',
        suggestion: 'Manual entry may be required',
      });
    } else {
      // Check if line items sum matches total
      const lineItemsTotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const expectedTotal = data.vatAmount
        ? lineItemsTotal + data.vatAmount
        : lineItemsTotal;

      if (Math.abs(expectedTotal - (data.totalAmount || 0)) > 0.01) {
        warnings.push({
          field: 'lineItems',
          message: `Line items total (${lineItemsTotal.toFixed(2)}) doesn't match invoice total`,
          suggestion: 'Review line items extraction',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateTIN(tin: string): boolean {
    // Bangladesh TIN is 10-12 digits
    return /^\d{10,12}$/.test(tin);
  }

  private validateBIN(bin: string): boolean {
    // Bangladesh BIN is 9 digits
    return /^\d{9}$/.test(bin);
  }

  private validateMushakNumber(mushak: string): boolean {
    // Mushak-6.3 format validation
    return /MUSHAK[\s-]*6\.3[\s-]*\d{4}-\d{2}-\d{6}/i.test(mushak);
  }

  private async suggestCorrections(
    data: ParsedInvoiceData,
    validation: ValidationResult
  ): Promise<SuggestedCorrection[]> {
    const suggestions: SuggestedCorrection[] = [];

    // Suggest corrections for validation errors
    for (const error of validation.errors) {
      if (error.field === 'invoiceDate' && !data.invoiceDate) {
        suggestions.push({
          field: 'invoiceDate',
          currentValue: undefined,
          suggestedValue: new Date(),
          confidence: 0.5,
          reason: 'Using current date as fallback',
        });
      }

      if (error.field === 'vendorTin' && data.vendorTin) {
        const cleanedTin = data.vendorTin.replace(/\D/g, '');
        if (cleanedTin.length >= 10 && cleanedTin.length <= 12) {
          suggestions.push({
            field: 'vendorTin',
            currentValue: data.vendorTin,
            suggestedValue: cleanedTin,
            confidence: 0.8,
            reason: 'Removed non-numeric characters',
          });
        }
      }
    }

    // Suggest VAT amount if missing
    if (!data.vatAmount && data.totalAmount) {
      const suggestedVat = (data.totalAmount / 1.15) * 0.15;
      suggestions.push({
        field: 'vatAmount',
        currentValue: undefined,
        suggestedValue: suggestedVat,
        confidence: 0.7,
        reason: 'Calculated based on 15% standard VAT rate',
      });
    }

    return suggestions;
  }

  private generateInvoiceNumber(): string {
    // Generate a temporary invoice number if extraction failed
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `INV-${year}${month}${day}-${random}`;
  }

  async trainClassifiers(trainingData: {
    lineItems: Array<{ description: string; accountCode: string; hsCode: string }>;
  }): Promise<void> {
    if (trainingData.lineItems.length < 50) {
      this.logger.warn('Insufficient training data for classifiers');
      return;
    }

    this.logger.log(`Training classifiers with ${trainingData.lineItems.length} samples`);

    // Prepare training data for account classifier
    const accountTrainingData = trainingData.lineItems.map(item => ({
      input: this.extractItemFeatures({
        description: item.description,
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      }),
      output: { [this.getAccountCategory(item.accountCode)]: 1 },
    }));

    // Train account classifier
    this.classifier.train(accountTrainingData);

    // Prepare training data for HS code classifier
    const hsTrainingData = trainingData.lineItems.map(item => ({
      input: this.getTextFeatures(item.description),
      output: { index: this.getHSCodeIndex(item.hsCode) },
    }));

    // Train HS code classifier
    this.hsCodeModel.train(hsTrainingData);

    // Save trained models
    await this.saveModels();

    this.logger.log('Classifiers trained successfully');
  }

  private getAccountCategory(accountCode: string): string {
    // Reverse lookup account category from code
    for (const [category, code] of Object.entries(ACCOUNT_CODE_MAPPING)) {
      if (code === accountCode) {
        return category;
      }
    }
    return 'materials'; // Default
  }

  private getHSCodeIndex(hsCode: string): number {
    // Get normalized index for HS code
    const hsCodeValues = Object.values(HS_CODE_MAPPING);
    const index = hsCodeValues.indexOf(hsCode);

    return index >= 0 ? index / hsCodeValues.length : 0;
  }

  private async saveModels(): Promise<void> {
    try {
      if (!fs.existsSync(this.modelPath)) {
        fs.mkdirSync(this.modelPath, { recursive: true });
      }

      // Save account classifier
      const classifierPath = path.join(this.modelPath, 'account-classifier.json');
      fs.writeFileSync(classifierPath, JSON.stringify(this.classifier.toJSON()));

      // Save HS code classifier
      const hsCodePath = path.join(this.modelPath, 'hs-classifier.json');
      fs.writeFileSync(hsCodePath, JSON.stringify(this.hsCodeModel.toJSON()));

      this.logger.log('Models saved successfully');
    } catch (error) {
      this.logger.error('Failed to save models', error);
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
    if (this.worker) {
      await this.worker.terminate();
    }
  }
}