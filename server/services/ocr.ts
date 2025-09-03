import Tesseract from 'tesseract.js';
import { createHash } from 'crypto';

export interface OCRResult {
  text: string;
  confidence: number;
  confidenceScore: number; // 0-10000 basis points
  verified: boolean;
  metadata: {
    processingTime: number;
    blocks: any[];
    symbols: any[];
  };
}

export interface SignatureVerificationResult {
  isSignature: boolean;
  confidence: number;
  features: {
    hasHandwriting: boolean;
    hasSignatureLikeStrokes: boolean;
    textLength: number;
    confidenceThreshold: number;
  };
}

export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
    }
  }

  async processImage(imageBuffer: Buffer): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      await this.initialize();
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      const { data } = await this.worker.recognize(imageBuffer);
      const processingTime = Date.now() - startTime;

      // Calculate confidence score in basis points (0-10000)
      const confidenceScore = Math.round(data.confidence * 100);
      
      // Determine if the text is verified based on confidence
      const verified = data.confidence >= 0.7; // 70% threshold

      return {
        text: data.text.trim(),
        confidence: data.confidence,
        confidenceScore,
        verified,
        metadata: {
          processingTime,
          blocks: data.blocks || [],
          symbols: data.symbols || []
        }
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  async verifySignature(imageBuffer: Buffer, expectedSignature?: string): Promise<SignatureVerificationResult> {
    try {
      const ocrResult = await this.processImage(imageBuffer);
      
      // Analyze the OCR result to determine if it's a signature
      const features = this.analyzeSignatureFeatures(ocrResult);
      
      let confidence = 0;
      
      // Base confidence on OCR confidence and signature-like features
      if (features.hasHandwriting) confidence += 0.3;
      if (features.hasSignatureLikeStrokes) confidence += 0.4;
      if (ocrResult.confidence > 0.5) confidence += 0.2;
      if (features.textLength > 2 && features.textLength < 50) confidence += 0.1;
      
      // If expected signature is provided, compare similarity
      if (expectedSignature && ocrResult.text) {
        const similarity = this.calculateTextSimilarity(
          ocrResult.text.toLowerCase(),
          expectedSignature.toLowerCase()
        );
        confidence = Math.max(confidence, similarity);
      }
      
      const isSignature = confidence >= features.confidenceThreshold;
      
      return {
        isSignature,
        confidence,
        features
      };
    } catch (error) {
      console.error('Signature verification error:', error);
      throw new Error(`Signature verification failed: ${error}`);
    }
  }

  private analyzeSignatureFeatures(ocrResult: OCRResult): SignatureVerificationResult['features'] {
    const text = ocrResult.text;
    const textLength = text.length;
    
    // Simple heuristics to detect signature-like content
    const hasHandwriting = textLength > 0 && textLength < 100;
    
    // Check for signature-like patterns (name-like text, single words, etc.)
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const hasSignatureLikeStrokes = words.length >= 1 && words.length <= 4 && 
      words.some(word => /^[A-Za-z]+$/.test(word) && word.length >= 2);
    
    // Confidence threshold for signature detection
    const confidenceThreshold = 0.6;
    
    return {
      hasHandwriting,
      hasSignatureLikeStrokes,
      textLength,
      confidenceThreshold
    };
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    
    if (maxLength === 0) return 1;
    
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async generateDocumentHash(content: Buffer | string): Promise<string> {
    const hash = createHash('sha256');
    hash.update(content);
    return '0x' + hash.digest('hex');
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const ocrService = new OCRService();

// Cleanup on process exit
process.on('exit', () => {
  ocrService.cleanup();
});

process.on('SIGINT', () => {
  ocrService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  ocrService.cleanup();
  process.exit(0);
});
