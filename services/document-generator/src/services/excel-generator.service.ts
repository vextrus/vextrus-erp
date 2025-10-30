import { Injectable, Logger } from '@nestjs/common';
import { DocumentTemplate } from '../entities/document-template.entity';
import * as ExcelJS from 'exceljs';
import { PaperSize } from 'exceljs';
import * as Handlebars from 'handlebars';

@Injectable()
export class ExcelGeneratorService {
  private readonly logger = new Logger(ExcelGeneratorService.name);

  async generate(
    template: DocumentTemplate,
    data: Record<string, any>,
    language: string = 'en'
  ): Promise<{ buffer: Buffer; sheets: number }> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = 'Vextrus ERP';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.lastPrinted = new Date();

      // Parse template content to determine structure
      const templateConfig = this.parseTemplateConfig(template.template_content);
      
      // Create sheets based on template configuration
      for (const sheetConfig of templateConfig.sheets || [{ name: 'Sheet1', template: template.template_content }]) {
        const worksheet = workbook.addWorksheet(sheetConfig.name);
        
        // Apply styles
        this.applyDefaultStyles(worksheet, template);
        
        // Process data
        if (sheetConfig.type === 'table' && data.items) {
          this.generateTableSheet(worksheet, data.items, sheetConfig);
        } else if (sheetConfig.type === 'report') {
          this.generateReportSheet(worksheet, data, sheetConfig);
        } else {
          this.generateCustomSheet(worksheet, data, sheetConfig.template);
        }

        // Add Bengali number formatting if needed
        if (this.hasBengaliContent(data) || language === 'bn') {
          this.applyBengaliFormatting(worksheet);
        }
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      this.logger.log(`Generated Excel with ${workbook.worksheets.length} sheets`);
      return { 
        buffer: Buffer.from(buffer), 
        sheets: workbook.worksheets.length 
      };
    } catch (error: any) {
      this.logger.error(`Excel generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private parseTemplateConfig(templateContent: string): any {
    try {
      // Try to parse as JSON configuration
      return JSON.parse(templateContent);
    } catch {
      // Default configuration for simple templates
      return {
        sheets: [{
          name: 'Data',
          type: 'table',
          template: templateContent,
        }],
      };
    }
  }

  private applyDefaultStyles(worksheet: ExcelJS.Worksheet, template: DocumentTemplate) {
    // Set default column widths
    worksheet.columns = Array(20).fill(null).map(() => ({ width: 15 }));

    // Set default font
    const fontFamily = template.default_styles?.font_family || 'Arial';
    const fontSize = template.default_styles?.font_size || 11;

    worksheet.eachRow((row) => {
      row.font = { name: fontFamily, size: fontSize };
    });

    // Add page setup
    worksheet.pageSetup = {
      paperSize: PaperSize.A4, // ExcelJS doesn't support A3, using A4 for all
      orientation: template.default_styles?.orientation || 'portrait',
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    };
  }

  private generateTableSheet(
    worksheet: ExcelJS.Worksheet,
    items: any[],
    config: any
  ) {
    if (!items || items.length === 0) return;

    // Get headers from first item or config
    const headers = config.headers || Object.keys(items[0]);
    
    // Add headers
    const headerRow = worksheet.addRow(headers.map(h => 
      typeof h === 'object' ? h.label : h
    ));
    
    // Style headers
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow.border = {
      bottom: { style: 'thin' },
    };

    // Add data rows
    items.forEach(item => {
      const rowData = headers.map(h => {
        const key = typeof h === 'object' ? h.key : h;
        return this.getNestedValue(item, key);
      });
      
      const row = worksheet.addRow(rowData);
      
      // Apply number formatting
      rowData.forEach((value, index) => {
        if (typeof value === 'number') {
          const cell = row.getCell(index + 1);
          if (config.numberFormat) {
            cell.numFmt = config.numberFormat;
          }
        }
      });
    });

    // Add totals row if configured
    if (config.totals) {
      const totalsRow = worksheet.addRow([]);
      config.totals.forEach((total, index) => {
        if (total.type === 'sum') {
          const column = this.getColumnLetter(index + 1);
          totalsRow.getCell(index + 1).value = {
            formula: `SUM(${column}2:${column}${items.length + 1})`,
          };
        } else if (total.type === 'count') {
          totalsRow.getCell(index + 1).value = items.length;
        } else if (total.type === 'label') {
          totalsRow.getCell(index + 1).value = total.value;
        }
      });
      
      totalsRow.font = { bold: true };
      totalsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' },
      };
    }

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index]?.toString().length || 10;
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const cell = row.getCell(index + 1);
          const length = cell.value?.toString().length || 0;
          if (length > maxLength) maxLength = length;
        }
      });
      
      column.width = Math.min(maxLength + 2, 50);
    });

    // Add filters
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
  }

  private generateReportSheet(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, any>,
    config: any
  ) {
    let currentRow = 1;

    // Add title
    if (config.title) {
      const titleRow = worksheet.getRow(currentRow);
      titleRow.getCell(1).value = Handlebars.compile(config.title)(data);
      titleRow.getCell(1).font = { size: 16, bold: true };
      worksheet.mergeCells(currentRow, 1, currentRow, 6);
      currentRow += 2;
    }

    // Add metadata section
    if (config.metadata) {
      config.metadata.forEach(field => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = field.label;
        row.getCell(1).font = { bold: true };
        row.getCell(2).value = this.getNestedValue(data, field.key);
        currentRow++;
      });
      currentRow++;
    }

    // Add sections
    if (config.sections) {
      config.sections.forEach(section => {
        // Section title
        if (section.title) {
          const sectionRow = worksheet.getRow(currentRow);
          sectionRow.getCell(1).value = section.title;
          sectionRow.getCell(1).font = { size: 14, bold: true };
          worksheet.mergeCells(currentRow, 1, currentRow, 4);
          currentRow += 2;
        }

        // Section content
        if (section.type === 'table' && data[section.dataKey]) {
          // Create table in report
          const items = data[section.dataKey];
          if (items && items.length > 0) {
            const headers = section.headers || Object.keys(items[0]);
            
            // Headers
            const headerRow = worksheet.getRow(currentRow);
            headers.forEach((h, i) => {
              headerRow.getCell(i + 1).value = typeof h === 'object' ? h.label : h;
              headerRow.getCell(i + 1).font = { bold: true };
              headerRow.getCell(i + 1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' },
              };
            });
            currentRow++;

            // Data
            items.forEach(item => {
              const row = worksheet.getRow(currentRow);
              headers.forEach((h, i) => {
                const key = typeof h === 'object' ? h.key : h;
                row.getCell(i + 1).value = this.getNestedValue(item, key);
              });
              currentRow++;
            });
            
            currentRow++;
          }
        } else if (section.type === 'text') {
          const textRow = worksheet.getRow(currentRow);
          textRow.getCell(1).value = Handlebars.compile(section.content)(data);
          worksheet.mergeCells(currentRow, 1, currentRow, 6);
          currentRow += 2;
        }
      });
    }
  }

  private generateCustomSheet(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, any>,
    template: string
  ) {
    // Parse template as CSV-like structure
    const lines = template.split('\n');
    
    lines.forEach((line, rowIndex) => {
      const cells = line.split(',').map(cell => cell.trim());
      const row = worksheet.getRow(rowIndex + 1);
      
      cells.forEach((cellTemplate, colIndex) => {
        if (cellTemplate.startsWith('{{') && cellTemplate.endsWith('}}')) {
          // Handlebars template
          const compiled = Handlebars.compile(cellTemplate);
          row.getCell(colIndex + 1).value = compiled(data);
        } else {
          row.getCell(colIndex + 1).value = cellTemplate;
        }
      });
    });
  }

  private applyBengaliFormatting(worksheet: ExcelJS.Worksheet) {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === 'string' && this.hasBengaliContent(cell.value)) {
          cell.font = { 
            ...cell.font,
            name: 'Kalpurush',
          };
        }
      });
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
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

  private getColumnLetter(columnNumber: number): string {
    let columnName = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      columnName = String.fromCharCode(65 + remainder) + columnName;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnName;
  }
}