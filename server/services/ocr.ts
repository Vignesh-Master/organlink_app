import Tesseract from "tesseract.js";
import sharp from "sharp";

export class OCRService {
  // Process image and extract text
  async extractText(imageBuffer: Buffer): Promise<string> {
    try {
      // Preprocess image for better OCR results
      const processedImage = await this.preprocessImage(imageBuffer);

      // Perform OCR
      const result = await Tesseract.recognize(processedImage, "eng", {
        logger: (m) => console.log(m),
      });

      return result.data.text.trim();
    } catch (error) {
      console.error("OCR text extraction error:", error);
      throw new Error("Failed to extract text from image");
    }
  }

  // Preprocess image for better OCR accuracy (with optional rotation)
  private async preprocessImage(
    imageBuffer: Buffer,
    rotateDeg: number = 0,
  ): Promise<Buffer> {
    try {
      const img = sharp(imageBuffer);
      const meta = await img.metadata();
      const targetWidth = Math.max(meta.width || 0, 1600);
      return await img
        .rotate(rotateDeg)
        .resize({ width: targetWidth, withoutEnlargement: false })
        .greyscale()
        .normalize()
        .sharpen()
        .toFormat("png")
        .toBuffer();
    } catch (error) {
      console.error("Image preprocessing error:", error);
      return imageBuffer; // Return original if preprocessing fails
    }
  }

  // Verify signature document
  async verifySignatureDocument(imageBuffer: Buffer): Promise<{
    isValid: boolean;
    extractedText: string;
    confidence: number;
    keywords: string[];
  }> {
    try {
      // Extract text from the signature document
      const processed = await this.preprocessImage(imageBuffer);
      const result = await Tesseract.recognize(processed, "eng", {
        logger: (m) => console.log(m),
      });

      const extractedText = result.data.text.trim().toLowerCase();
      const confidence = result.data.confidence;

      // Keywords that might indicate a valid signature document
      const validKeywords = [
        "signature",
        "consent",
        "agreement",
        "donor",
        "patient",
        "organ",
        "authorization",
        "medical",
        "hospital",
        "date",
        "name",
        "signed",
      ];

      // Check for presence of keywords
      const foundKeywords = validKeywords.filter((keyword) =>
        extractedText.includes(keyword),
      );

      // Basic validation criteria
      const hasMinimumLength = extractedText.length > 10;
      const hasKeywords = foundKeywords.length >= 2;
      const hasGoodConfidence = confidence > 50;

      const isValid = hasMinimumLength && hasKeywords && hasGoodConfidence;

      return {
        isValid,
        extractedText: result.data.text.trim(),
        confidence,
        keywords: foundKeywords,
      };
    } catch (error) {
      console.error("Signature verification error:", error);
      return {
        isValid: false,
        extractedText: "",
        confidence: 0,
        keywords: [],
      };
    }
  }

  // Advanced signature verification with pattern matching
  async advancedSignatureVerification(
    imageBuffer: Buffer,
    expectedPatientName?: string,
  ): Promise<{
    isValid: boolean;
    extractedText: string;
    confidence: number;
    matchedPatterns: string[];
    nameMatch: boolean;
  }> {
    try {
      // Try multiple orientations (handles vertical signatures)
      const angles = [0, 90, 180, 270];
      let best = { text: "", confidence: 0 };
      for (const angle of angles) {
        const processed = await this.preprocessImage(imageBuffer, angle);
        const res = await Tesseract.recognize(processed, "eng", {
          logger: (m) => console.log(m),
        });
        const conf = Number(res.data.confidence || 0);
        if (conf > best.confidence)
          best = { text: res.data.text.trim(), confidence: conf };
      }

      const extractedText = best.text;
      const normalizedText = extractedText.toLowerCase();

      // Signature document patterns
      const patterns = [
        /consent.*organ.*donation/i,
        /authorization.*medical.*treatment/i,
        /patient.*signature/i,
        /donor.*agreement/i,
        /medical.*consent/i,
        /organ.*transplant.*consent/i,
        /signature.*date/i,
        /\d{1,2}\/\d{1,2}\/\d{2,4}/i, // Date patterns
        /signed.*by/i,
      ];

      const matchedPatterns = patterns
        .filter((pattern) => pattern.test(extractedText))
        .map((pattern) => pattern.toString());

      // Check if expected patient name is found (robust matching with typos)
      let nameMatch = false;
      if (expectedPatientName) {
        const sanitize = (s: string) =>
          s.toLowerCase().replace(/[^a-z0-9]+/g, "");
        const textSan = sanitize(normalizedText);
        const expSan = sanitize(expectedPatientName);

        // token presence
        const parts = expectedPatientName
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);
        const partsMatch =
          parts.filter((p) => p.length > 2 && textSan.includes(sanitize(p)))
            .length >= Math.min(2, parts.length);
        const wholeMatch = expSan.length > 3 && textSan.includes(expSan);

        // trigram similarity
        const trigrams = (s: string) => new Set(s.match(/.{1,3}/g) || []);
        const A = trigrams(expSan);
        const B = trigrams(textSan);
        const inter = [...A].filter((x) => B.has(x)).length;
        const sim = A.size ? inter / A.size : 0;

        // Levenshtein distance (allow small typos like Doe vs Dot)
        const levenshtein = (a: string, b: string) => {
          const m = a.length,
            n = b.length;
          const dp = Array.from({ length: m + 1 }, () =>
            new Array(n + 1).fill(0),
          );
          for (let i = 0; i <= m; i++) dp[i][0] = i;
          for (let j = 0; j <= n; j++) dp[0][j] = j;
          for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
              const cost = a[i - 1] === b[j - 1] ? 0 : 1;
              dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
              );
            }
          }
          return dp[m][n];
        };

        const tokens = Array.from(
          new Set(textSan.split(/[^a-z0-9]+/).filter(Boolean)),
        );
        const lastName = sanitize(parts[parts.length - 1] || "");
        const anyTokenClose = tokens.some((t) => {
          const distLast = lastName ? levenshtein(lastName, t) : 99;
          const distFull = levenshtein(expSan, t);
          return distLast <= 1 || distFull <= 2;
        });

        nameMatch = wholeMatch || partsMatch || sim >= 0.35 || anyTokenClose;
      }

      // Advanced validation criteria
      const hasPatterns = matchedPatterns.length >= 1;
      const hasMinimumLength = extractedText.length > 10;
      const hasGoodConfidence = best.confidence > 40;

      const isValid = hasPatterns && hasMinimumLength && hasGoodConfidence;

      return {
        isValid,
        extractedText,
        confidence: best.confidence,
        matchedPatterns,
        nameMatch,
      };
    } catch (error) {
      console.error("Advanced signature verification error:", error);
      return {
        isValid: false,
        extractedText: "",
        confidence: 0,
        matchedPatterns: [],
        nameMatch: false,
      };
    }
  }

  // Extract specific fields from medical documents
  async extractMedicalFields(imageBuffer: Buffer): Promise<{
    patientName?: string;
    date?: string;
    hospitalName?: string;
    signature?: boolean;
    organType?: string;
  }> {
    try {
      const processed = await this.preprocessImage(imageBuffer);
      const result = await Tesseract.recognize(processed, "eng", {
        logger: (m) => console.log(m),
      });

      const text = result.data.text;

      // Extract potential fields using regex patterns
      const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
      const namePattern = /name[:\s]*([a-z\s]+)/i;
      const hospitalPattern = /hospital[:\s]*([a-z\s]+)/i;
      const organPattern = /(kidney|liver|heart|lung|pancreas|cornea)/i;

      const dateMatch = text.match(datePattern);
      const nameMatch = text.match(namePattern);
      const hospitalMatch = text.match(hospitalPattern);
      const organMatch = text.match(organPattern);

      return {
        patientName: nameMatch ? nameMatch[1].trim() : undefined,
        date: dateMatch ? dateMatch[1] : undefined,
        hospitalName: hospitalMatch ? hospitalMatch[1].trim() : undefined,
        signature:
          text.toLowerCase().includes("signature") ||
          text.toLowerCase().includes("signed"),
        organType: organMatch ? organMatch[1].toLowerCase() : undefined,
      };
    } catch (error) {
      console.error("Medical field extraction error:", error);
      return {};
    }
  }
}

export const ocrService = new OCRService();
