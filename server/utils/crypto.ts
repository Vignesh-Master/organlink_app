import { createHash } from "crypto";
import { ethers } from "ethers";

/**
 * Generate keccak256 hash of a buffer (same as Ethereum's hash function)
 */
export function hashBuffer(buffer: Buffer): string {
  const hash = createHash('sha256').update(buffer).digest();
  return ethers.keccak256(hash);
}

/**
 * Generate keccak256 hash of a string
 */
export function hashString(input: string): string {
  const buffer = Buffer.from(input, 'utf8');
  return hashBuffer(buffer);
}

/**
 * Generate secure random bytes as hex string
 */
export function generateRandomHex(length: number = 32): string {
  const buffer = Buffer.alloc(length);
  require('crypto').randomFillSync(buffer);
  return '0x' + buffer.toString('hex');
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Ethereum transaction hash format
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate IPFS CID format (basic validation)
 */
export function isValidIPFSCid(cid: string): boolean {
  // Basic CID validation - starts with Qm or bafy/bafk for v1
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{52}|bafk[a-z0-9]{52})$/.test(cid);
}

/**
 * Format wei to ether with specified decimal places
 */
export function formatEther(wei: bigint | string, decimals: number = 4): string {
  const ether = ethers.formatEther(wei);
  return parseFloat(ether).toFixed(decimals);
}

/**
 * Convert basis points to percentage
 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/**
 * Convert percentage to basis points
 */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

/**
 * Generate document metadata hash for integrity verification
 */
export function generateDocumentMetadata(data: {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  patientId?: string;
  hospitalId?: string;
}): string {
  const metadataString = JSON.stringify(data, Object.keys(data).sort());
  return hashString(metadataString);
}

/**
 * Validate OCR score (should be between 0 and 100)
 */
export function validateOcrScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 100;
}

/**
 * Generate deterministic ID from multiple inputs
 */
export function generateId(...inputs: string[]): string {
  const combined = inputs.join('|');
  return hashString(combined);
}

/**
 * Parse and validate vote value
 */
export function parseVote(vote: string | number): 1 | 2 | 3 | null {
  const voteMap: Record<string, 1 | 2 | 3> = {
    'for': 1,
    'against': 2,
    'abstain': 3,
    '1': 1,
    '2': 2,
    '3': 3,
  };

  const normalizedVote = String(vote).toLowerCase();
  return voteMap[normalizedVote] || null;
}

/**
 * Get vote label from numeric value
 */
export function getVoteLabel(vote: 1 | 2 | 3): string {
  const labels = { 1: 'For', 2: 'Against', 3: 'Abstain' };
  return labels[vote];
}

/**
 * Calculate proposal voting deadline from duration
 */
export function calculateVotingDeadline(durationHours: number = 24): number {
  return Math.floor(Date.now() / 1000) + (durationHours * 60 * 60);
}

/**
 * Check if a timestamp is in the past
 */
export function isExpired(timestamp: number): boolean {
  return timestamp < Math.floor(Date.now() / 1000);
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Sanitize input for blockchain interaction
 */
export function sanitizeInput(input: string, maxLength: number = 100): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[^\w\s\-_.,!?()]/g, ''); // Remove special characters except basic punctuation
}

/**
 * Validate proposal parameters
 */
export function validateProposalParams(params: any): boolean {
  if (!params || typeof params !== 'object') return false;
  
  // Basic validation - params should be serializable
  try {
    JSON.stringify(params);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a secure salt for hashing
 */
export function generateSalt(): string {
  return generateRandomHex(16);
}

/**
 * Hash password with salt (for API keys, etc.)
 */
export function hashWithSalt(input: string, salt: string): string {
  return createHash('sha256')
    .update(input + salt)
    .digest('hex');
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(ip: string, endpoint: string): string {
  return `rate_limit:${ip}:${endpoint}`;
}

/**
 * Validate file type for document uploads
 */
export function isValidDocumentType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'image/tiff',
    'image/bmp'
  ];
  return allowedTypes.includes(mimeType);
}

/**
 * Check file size limits
 */
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
}
