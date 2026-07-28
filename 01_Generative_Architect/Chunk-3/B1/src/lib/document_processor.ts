import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Initialize PDF.js worker with modern ESM CDN for maximum async efficiency
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Dalek Sovereign Splicer: DocumentProcessor
 * Logic specialized for elite-tier text extraction and sanitization.
 */
export class DocumentProcessor {
  private static readonly SIG = {
    PDF: 0x25504446, // %PDF
    PK: 0x504B0304,  // PK.. (DOCX/ZIP)
  } as const;

  /**
   * Fast signature validation using DataView to avoid buffer slicing.
   */
  private static validateHeader(buffer: ArrayBuffer, magic: number): boolean {
    return buffer.byteLength >= 4 && new DataView(buffer).getUint32(0) === magic;
  }

  /**
   * Parallel PDF extraction utilizing high-concurrency page mapping.
   */
  public static async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    if (!this.validateHeader(arrayBuffer, this.SIG.PDF)) {
      throw new Error('EXTRACT_ERR: INVALID_PDF_SIGNATURE');
    }

    try {
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        stopAtErrors: false,
        isEvalSupported: false,
        disableRange: true,
        disableStream: true,
      }).promise;

      const pageIndices = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      
      const pages = await Promise.all(
        pageIndices.map(async (num) => {
          const page = await pdf.getPage(num);
          const content = await page.getTextContent();
          
          const text = content.items
            .filter((item): item is TextItem => 'str' in item)
            .map(item => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          return text ? `--- Page ${num} ---\n${text}\n` : '';
        })
      );

      return this.sanitizeText(pages.filter(Boolean).join('\n'));
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'PasswordException' || /password/i.test(err.message)) {
        throw new Error('SECURITY_ERR: DOCUMENT_ENCRYPTED');
      }
      throw new Error(`EXTRACT_ERR: PDF_STRUCTURE_INVALID (${err.name || 'UNKNOWN'})`);
    }
  }

  /**
   * Dynamic DOCX extraction utilizing lazy-loaded Mammoth engine.
   */
  public static async extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
    if (!this.validateHeader(arrayBuffer, this.SIG.PK)) {
      throw new Error('EXTRACT_ERR: INVALID_DOCX_CONTAINER');
    }

    try {
      const { extractRawText } = await import('mammoth');
      const { value } = await extractRawText({ arrayBuffer });
      return this.sanitizeText(value);
    } catch (error: unknown) {
      throw new Error(`EXTRACT_ERR: DOCX_CORRUPTION_${(error as Error).name?.toUpperCase() || 'UNKNOWN'}`);
    }
  }

  /**
   * High-performance normalization and non-printable character eradication.
   */
  private static sanitizeText(text: string): string {
    return text
      .normalize('NFC')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, '')
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/(\r\n|\n|\r){3,}/g, '\n\n')
      .trim();
  }

  /**
   * Primary entry point for multi-protocol document splicing.
   */
  public static async processFile(name: string, arrayBuffer: ArrayBuffer): Promise<string> {
    if (!arrayBuffer?.byteLength) throw new Error('VOID_INPUT');

    const ext = name.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'pdf':
        return this.extractTextFromPDF(arrayBuffer);
      case 'docx':
        return this.extractTextFromDOCX(arrayBuffer);
      case 'txt':
      case 'md':
      case 'markdown':
      case 'json':
      case 'csv':
        return this.sanitizeText(new TextDecoder('utf-8').decode(arrayBuffer));
      default:
        try {
          // Attempt generic UTF-8 extraction for unknown formats
          return this.sanitizeText(new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer));
        } catch {
          throw new Error(`UNSUPPORTED_PROTOCOL: .${ext || 'NULL'}`);
        }
    }
  }
}