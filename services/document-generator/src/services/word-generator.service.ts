import { Injectable, Logger } from '@nestjs/common';
import { DocumentTemplate } from '../entities/document-template.entity';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class WordGeneratorService {
  private readonly logger = new Logger(WordGeneratorService.name);

  async generate(
    template: DocumentTemplate,
    data: Record<string, any>,
    language: string = 'en'
  ): Promise<{ buffer: Buffer; pages: number }> {
    try {
      // Check if template content is a path to a .docx template
      if (template.template_content.endsWith('.docx')) {
        return this.generateFromDocxTemplate(template, data, language);
      } else {
        return this.generateFromHtmlTemplate(template, data, language);
      }
    } catch (error: any) {
      this.logger.error(`Word generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateFromDocxTemplate(
    template: DocumentTemplate,
    data: Record<string, any>,
    language: string
  ): Promise<{ buffer: Buffer; pages: number }> {
    // Load the docx file as binary
    const templatePath = path.resolve(template.template_content);
    const content = fs.readFileSync(templatePath, 'binary');

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      parser: this.angularParser,
    });

    // Process data for Bengali if needed
    const processedData = this.processDataForBengali(data, language);

    // Set the template variables
    doc.setData(processedData);

    try {
      // Render the document
      doc.render();
    } catch (error: any) {
      this.logger.error('Template rendering error:', error);
      throw error;
    }

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return { buffer, pages: 1 }; // Page count would need additional processing
  }

  private async generateFromHtmlTemplate(
    template: DocumentTemplate,
    data: Record<string, any>,
    language: string
  ): Promise<{ buffer: Buffer; pages: number }> {
    // Create a simple DOCX from HTML-like template
    const htmlContent = Handlebars.compile(template.template_content)(data);
    
    // Convert HTML to DOCX structure
    const docx = this.createDocxFromHtml(htmlContent, template, language);
    
    return { buffer: docx, pages: 1 };
  }

  private createDocxFromHtml(
    htmlContent: string,
    template: DocumentTemplate,
    language: string
  ): Buffer {
    // Create a basic DOCX structure
    const doc = new Docxtemplater();
    const zip = new PizZip();

    // Add required DOCX structure files
    this.addDocxStructure(zip);

    // Convert HTML to DOCX content
    const documentContent = this.convertHtmlToDocx(htmlContent, template, language);
    
    // Add document content
    zip.file('word/document.xml', documentContent);

    // Add styles for Bengali support if needed
    if (this.hasBengaliContent(htmlContent) || language === 'bn') {
      const styles = this.createBengaliStyles();
      zip.file('word/styles.xml', styles);
    }

    return zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
  }

  private addDocxStructure(zip: PizZip) {
    // Add _rels folder
    zip.folder('_rels');
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
      </Relationships>`);

    // Add word folder structure
    zip.folder('word');
    zip.folder('word/_rels');
    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
      </Relationships>`);

    // Add [Content_Types].xml
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
      </Types>`);
  }

  private convertHtmlToDocx(
    htmlContent: string,
    template: DocumentTemplate,
    language: string
  ): string {
    // Simple HTML to DOCX XML conversion
    const paragraphs = htmlContent
      .replace(/<br\s*\/?>/gi, '</w:t></w:r><w:r><w:t>')
      .replace(/<p[^>]*>/gi, '<w:p><w:r><w:t>')
      .replace(/<\/p>/gi, '</w:t></w:r></w:p>')
      .replace(/<strong[^>]*>/gi, '</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>')
      .replace(/<\/strong>/gi, '</w:t></w:r><w:r><w:t>')
      .replace(/<em[^>]*>/gi, '</w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:t>')
      .replace(/<\/em>/gi, '</w:t></w:r><w:r><w:t>')
      .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags

    const fontFamily = template.default_styles?.font_family || 'Calibri';
    const fontSize = (template.default_styles?.font_size || 11) * 2; // Convert to half-points

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="Normal"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:rFonts w:ascii="${fontFamily}" w:hAnsi="${fontFamily}"/>
                <w:sz w:val="${fontSize}"/>
              </w:rPr>
              <w:t>${paragraphs}</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>`;
  }

  private createBengaliStyles(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:docDefaults>
          <w:rPrDefault>
            <w:rPr>
              <w:rFonts w:ascii="Kalpurush" w:eastAsia="Kalpurush" w:hAnsi="Kalpurush" w:cs="Kalpurush"/>
            </w:rPr>
          </w:rPrDefault>
        </w:docDefaults>
        <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
          <w:name w:val="Normal"/>
          <w:rPr>
            <w:rFonts w:ascii="Kalpurush" w:eastAsia="Kalpurush" w:hAnsi="Kalpurush" w:cs="Kalpurush"/>
          </w:rPr>
        </w:style>
      </w:styles>`;
  }

  private processDataForBengali(data: any, language: string): any {
    if (language !== 'bn') return data;

    const processValue = (value: any): any => {
      if (typeof value === 'number') {
        return this.toBengaliNumber(value);
      }
      if (value instanceof Date) {
        return this.toBengaliDate(value);
      }
      if (typeof value === 'object' && value !== null) {
        const processed = {};
        for (const [key, val] of Object.entries(value)) {
          processed[key] = processValue(val);
        }
        return processed;
      }
      return value;
    };

    return processValue(data);
  }

  private angularParser(tag: string) {
    const expr = tag
      .replace(/^\.$/, 'this')
      .replace(/('|')/g, "'")
      .replace(/("|")/g, '"');

    const keys = expr.split('.');

    return {
      get: (scope: any) => {
        let obj = scope;
        for (const key of keys) {
          if (obj == null) return '';
          obj = obj[key];
        }
        return obj;
      },
    };
  }

  private hasBengaliContent(data: any): boolean {
    const bengaliRegex = /[\u0980-\u09FF]/;
    
    if (typeof data === 'string') {
      return bengaliRegex.test(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => this.hasBengaliContent(value));
    }
    
    return false;
  }

  private toBengaliNumber(num: number | string): string {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
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