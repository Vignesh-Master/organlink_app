import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Chain,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface SignatureUploadProps {
  recordType: "patient" | "donor";
  recordId: string;
  patientName?: string;
  onUploadComplete?: (result: any) => void;
}

interface OCRResult {
  isValid: boolean;
  extractedText: string;
  confidence: number;
  matchedPatterns: string[];
  nameMatch: boolean;
}

interface UploadResult {
  success: boolean;
  ipfsHash?: string;
  fileName?: string;
  fileUrl?: string;
  ocrVerification?: OCRResult;
  message?: string;
  error?: string;
}

export default function SignatureUpload({
  recordType,
  recordId,
  patientName,
  onUploadComplete,
}: SignatureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [blockchainTx, setBlockchainTx] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
      setBlockchainTx(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("signature", selectedFile);
      formData.append("record_type", recordType);
      formData.append("record_id", recordId);
      if (patientName) {
        formData.append("patient_name", patientName);
      }

      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/upload/signature", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success && onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        error: "Upload failed. Please try again.",
      });
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleBlockchainRegistration = async () => {
    if (!uploadResult?.ipfsHash) return;

    setRegistering(true);

    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/upload/blockchain-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          record_type: recordType,
          record_id: recordId,
          ipfs_hash: uploadResult.ipfsHash,
          ocr_score_bps: Math.round(
            (uploadResult.ocrVerification?.confidence || 0) * 10000,
          ),
          verified: uploadResult.ocrVerification?.isValid || false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setBlockchainTx(result.blockchainTxHash);
      } else {
        throw new Error(result.error || "Blockchain registration failed");
      }
    } catch (error) {
      console.error("Blockchain registration error:", error);
      alert("Failed to register on blockchain: " + error);
    } finally {
      setRegistering(false);
    }
  };

  const getOCRStatusIcon = (ocr?: OCRResult) => {
    if (!ocr) return <AlertTriangle className="h-4 w-4 text-gray-500" />;

    if (ocr.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getOCRStatusBadge = (ocr?: OCRResult) => {
    if (!ocr) return <Badge variant="secondary">No OCR</Badge>;

    if (ocr.isValid) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    } else {
      return <Badge variant="destructive">Needs Review</Badge>;
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setBlockchainTx(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Signature Upload & Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload Signature Document
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Click to select an image file or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: JPG, PNG, WebP, HEIC • Max size: 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Selected File</h4>
                  <Button variant="outline" size="sm" onClick={resetUpload}>
                    Change File
                  </Button>
                </div>

                <div className="flex items-start gap-4">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Signature preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {patientName && (
                      <p className="text-sm text-blue-600 mt-1">
                        Expected signature: {patientName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              {!uploadResult && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {processing ? "Processing with OCR..." : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Process
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing signature...</span>
              <span>{processing ? "Running OCR" : "Uploading"}</span>
            </div>
            <Progress value={processing ? 75 : 25} className="h-2" />
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className="space-y-4">
            {uploadResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Upload successful!</strong> File processed and stored
                  on IPFS.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Upload failed:</strong> {uploadResult.error}
                </AlertDescription>
              </Alert>
            )}

            {/* OCR Results */}
            {uploadResult.ocrVerification && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getOCRStatusIcon(uploadResult.ocrVerification)}
                    OCR Verification Results
                    {getOCRStatusBadge(uploadResult.ocrVerification)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Confidence Score:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={uploadResult.ocrVerification.confidence * 100}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs font-mono">
                          {Math.round(
                            uploadResult.ocrVerification.confidence * 100,
                          )}
                          %
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium">Name Match:</span>
                      <div className="flex items-center gap-1 mt-1">
                        {uploadResult.ocrVerification.nameMatch ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-xs">
                          {uploadResult.ocrVerification.nameMatch
                            ? "Matched"
                            : "No match"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {uploadResult.ocrVerification.extractedText && (
                    <div>
                      <span className="font-medium text-sm">
                        Extracted Text:
                      </span>
                      <p className="text-sm bg-gray-50 p-2 rounded mt-1 font-mono">
                        "{uploadResult.ocrVerification.extractedText}"
                      </p>
                    </div>
                  )}

                  {uploadResult.ocrVerification.matchedPatterns.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">
                        Detected Patterns:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uploadResult.ocrVerification.matchedPatterns.map(
                          (pattern) => (
                            <Badge
                              key={pattern}
                              variant="outline"
                              className="text-xs"
                            >
                              {pattern.replace(/_/g, " ")}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* IPFS Info */}
            {uploadResult.ipfsHash && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">IPFS Storage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">IPFS Hash:</span>
                    <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 break-all">
                      {uploadResult.ipfsHash}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(uploadResult.fileUrl, "_blank")
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View File
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://gateway.pinata.cloud/ipfs/${uploadResult.ipfsHash}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open in IPFS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blockchain Registration */}
            {uploadResult.success && !blockchainTx && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Chain className="h-4 w-4" />
                    Blockchain Attestation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Register this signature verification on the blockchain for
                    permanent proof.
                  </p>
                  <Button
                    onClick={handleBlockchainRegistration}
                    disabled={registering}
                    className="w-full"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering on Blockchain...
                      </>
                    ) : (
                      <>
                        <Chain className="h-4 w-4 mr-2" />
                        Register on Blockchain
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Blockchain Success */}
            {blockchainTx && (
              <Alert className="border-blue-200 bg-blue-50">
                <Chain className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Blockchain registration successful!</strong>
                  <div className="mt-2">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${blockchainTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm break-all"
                    >
                      View Transaction: {blockchainTx}
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
