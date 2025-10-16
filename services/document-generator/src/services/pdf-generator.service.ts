import { Injectable, Logger } from '@nestjs/common';
import { DocumentTemplate } from '../entities/document-template.entity';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  constructor() {
    this.registerHelpers();
  }

  async generate(
    template: DocumentTemplate,
    data: Record<string, any>,
    language: string = 'en'
  ): Promise<{ buffer: Buffer; pages: number }> {
    try {
      // Compile template
      const templateContent = this.getLocalizedTemplate(template, language);
      const compiledTemplate = Handlebars.compile(templateContent);
      
      // Add Bengali font support if needed
      const styles = this.generateStyles(template, this.hasBengaliContent(data));
      
      // Generate HTML
      const html = this.buildHtml(
        compiledTemplate(data),
        template.header_template ? Handlebars.compile(template.header_template)(data) : '',
        template.footer_template ? Handlebars.compile(template.footer_template)(data) : '',
        styles
      );

      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfOptions: any = {
        format: template.default_styles?.page_size || 'A4',
        landscape: template.default_styles?.orientation === 'landscape',
        margin: template.default_styles?.margins || {
          top: '20mm',
          bottom: '20mm',
          left: '10mm',
          right: '10mm',
        },
        printBackground: true,
        displayHeaderFooter: !!(template.header_template || template.footer_template),
      };

      if (template.header_template) {
        pdfOptions.headerTemplate = `
          <div style="font-size: 10px; width: 100%; text-align: center;">
            ${template.header_template}
          </div>
        `;
      }

      if (template.footer_template) {
        pdfOptions.footerTemplate = `
          <div style="font-size: 10px; width: 100%; text-align: center;">
            ${template.footer_template}
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `;
      }

      const buffer = await page.pdf(pdfOptions);
      const pages = await page.evaluate(() => {
        const pageBreaks = (globalThis as any).document?.querySelectorAll?.('.page-break');
        return pageBreaks ? pageBreaks.length + 1 : 1;
      });

      await browser.close();

      this.logger.log(`Generated PDF with ${pages} pages`);
      return { buffer, pages };
    } catch (error: any) {
      this.logger.error(`PDF generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private registerHelpers() {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date, format) => {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'bengali') {
        return this.toBengaliDate(d);
      }
      return d.toLocaleDateString();
    });

    // Format number helper
    Handlebars.registerHelper('formatNumber', (number, format) => {
      if (number === null || number === undefined) return '';
      if (format === 'bengali') {
        return this.toBengaliNumber(number);
      }
      return number.toLocaleString();
    });

    // Currency helper
    Handlebars.registerHelper('currency', (amount, currency = 'BDT') => {
      if (!amount) return '';
      if (currency === 'BDT') {
        return `৳${this.toBengaliNumber(amount)}`;
      }
      return `${currency} ${amount.toLocaleString()}`;
    });

    // Conditional helper
    Handlebars.registerHelper('ifEqual', function(this: any, a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Math helpers
    Handlebars.registerHelper('add', (a, b) => a + b);
    Handlebars.registerHelper('subtract', (a, b) => a - b);
    Handlebars.registerHelper('multiply', (a, b) => a * b);
    Handlebars.registerHelper('divide', (a, b) => a / b);

    // Array helpers
    Handlebars.registerHelper('length', (array) => array ? array.length : 0);
    Handlebars.registerHelper('sum', (array, key) => {
      if (!array) return 0;
      return array.reduce((sum, item) => sum + (item[key] || 0), 0);
    });
  }

  private getLocalizedTemplate(template: DocumentTemplate, language: string): string {
    if (language !== 'en' && template.localization?.[language]?.template_content) {
      return template.localization[language].template_content;
    }
    return template.template_content;
  }

  private generateStyles(template: DocumentTemplate, hasBengali: boolean): string {
    const fontFamily = hasBengali && template.bengali_font_path
      ? `'Kalpurush', ${template.default_styles?.font_family || 'Arial'}, sans-serif`
      : template.default_styles?.font_family || 'Arial, sans-serif';

    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: ${fontFamily};
          font-size: ${template.default_styles?.font_size || 12}px;
          line-height: 1.6;
          color: #333;
        }
        
        .bengali {
          font-family: 'Noto Sans Bengali', 'Kalpurush', sans-serif;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        th, td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .page-break {
          page-break-after: always;
        }
        
        .header {
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 2px solid #333;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .invoice-info {
          text-align: right;
          flex: 1;
        }
        
        .total-section {
          margin-top: 30px;
          text-align: right;
        }
        
        .total-row {
          display: flex;
          justify-content: flex-end;
          padding: 5px 0;
        }
        
        .total-label {
          margin-right: 20px;
          min-width: 100px;
        }
        
        .total-amount {
          min-width: 100px;
          font-weight: bold;
        }
        
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        
        .signature-box {
          width: 200px;
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 5px;
        }
      </style>
    `;
  }

  private buildHtml(
    content: string,
    header: string,
    footer: string,
    styles: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${styles}
        </head>
        <body>
          ${header ? `<div class="header">${header}</div>` : ''}
          <div class="content">
            ${content}
          </div>
          ${footer ? `<div class="footer">${footer}</div>` : ''}
        </body>
      </html>
    `;
  }

  private hasBengaliContent(data: any): boolean {
    const bengaliRegex = /[\u0980-\u09FF]/;
    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return bengaliRegex.test(value);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };
    return checkValue(data);
  }

  private toBengaliNumber(num: number | string): string {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৆', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => {
      const index = parseInt(digit);
      return bengaliDigits[index] || digit;
    });
  }

  private toBengaliDate(date: Date): string {
    const bengaliMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    
    const day = this.toBengaliNumber(date.getDate());
    const month = bengaliMonths[date.getMonth()];
    const year = this.toBengaliNumber(date.getFullYear());
    
    return `${day} ${month} ${year}`;
  }
}