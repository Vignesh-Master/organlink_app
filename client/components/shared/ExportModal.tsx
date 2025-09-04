import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  title?: string;
  description?: string;
  dataType?: string;
  requiresApproval?: boolean;
  showDateRange?: boolean;
  showFilters?: boolean;
  availableFormats?: ("pdf" | "excel" | "csv" | "json")[];
}

export interface ExportOptions {
  format: "pdf" | "excel" | "csv" | "json";
  dateFrom?: string;
  dateTo?: string;
  includePersonalData?: boolean;
  includeBlockchainData?: boolean;
  filters?: Record<string, any>;
  password?: string;
}

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
  title = "Export Data",
  description = "Choose format and options for your data export",
  dataType = "data",
  requiresApproval = false,
  showDateRange = true,
  showFilters = false,
  availableFormats = ["pdf", "excel", "csv"],
}: ExportModalProps) {
  const [format, setFormat] = useState<"pdf" | "excel" | "csv" | "json">("pdf");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includePersonalData, setIncludePersonalData] = useState(false);
  const [includeBlockchainData, setIncludeBlockchainData] = useState(true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);

      const exportOptions: ExportOptions = {
        format,
        ...(showDateRange && { dateFrom, dateTo }),
        includePersonalData,
        includeBlockchainData,
        ...(requiresApproval && { password }),
      };

      await onExport(exportOptions);
      handleClose();
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormat("pdf");
    setDateFrom("");
    setDateTo("");
    setIncludePersonalData(false);
    setIncludeBlockchainData(true);
    setPassword("");
    onClose();
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "excel":
        return <Download className="h-4 w-4 text-green-600" />;
      case "csv":
        return <Download className="h-4 w-4 text-blue-600" />;
      case "json":
        return <Download className="h-4 w-4 text-purple-600" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (fmt: string) => {
    switch (fmt) {
      case "pdf":
        return "Professional formatted report with charts and graphics";
      case "excel":
        return "Spreadsheet format with multiple sheets and formulas";
      case "csv":
        return "Simple comma-separated values for data analysis";
      case "json":
        return "Structured data format for API integration";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-medical-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Export Format
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableFormats.map((fmt) => (
                <button
                  key={fmt}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    format === fmt
                      ? "border-medical-600 bg-medical-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setFormat(fmt)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getFormatIcon(fmt)}
                    <span className="font-medium capitalize">{fmt}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {getFormatDescription(fmt)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          {showDateRange && (
            <div>
              <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dateFrom" className="text-xs text-gray-600">
                    From
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-xs text-gray-600">
                    To
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Data Options */}
          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Data Options
            </Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePersonalData"
                  checked={includePersonalData}
                  onCheckedChange={(checked) =>
                    setIncludePersonalData(checked as boolean)
                  }
                />
                <Label htmlFor="includePersonalData" className="text-sm">
                  Include personal/sensitive data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBlockchainData"
                  checked={includeBlockchainData}
                  onCheckedChange={(checked) =>
                    setIncludeBlockchainData(checked as boolean)
                  }
                />
                <Label htmlFor="includeBlockchainData" className="text-sm">
                  Include blockchain verification data
                </Label>
              </div>
            </div>
          </div>

          {/* Security Warning for Personal Data */}
          {includePersonalData && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">
                    Sensitive Data Warning
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This export will include personal and sensitive information.
                    {requiresApproval
                      ? " Admin approval will be required for this export."
                      : " Please handle this data securely and in compliance with privacy regulations."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Password Requirement for Approval */}
          {requiresApproval && includePersonalData && (
            <div>
              <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Authorization Required
              </Label>
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="Enter your password for verification"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-600">
                  A request will be sent to the administrator for approval. You
                  will be notified once the export is approved and ready.
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Export Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Export Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium capitalize">{format}</span>
              </div>
              <div>
                <span className="text-gray-600">Data Type:</span>
                <span className="ml-2 font-medium capitalize">{dataType}</span>
              </div>
              {dateFrom && (
                <div>
                  <span className="text-gray-600">Date Range:</span>
                  <span className="ml-2 font-medium">
                    {dateFrom} to {dateTo || "Present"}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Approval:</span>
                <span className="ml-2 font-medium">
                  {requiresApproval && includePersonalData
                    ? "Required"
                    : "Not Required"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              loading || (requiresApproval && includePersonalData && !password)
            }
            className="bg-medical-600 hover:bg-medical-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {requiresApproval && includePersonalData
                  ? "Requesting..."
                  : "Exporting..."}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {requiresApproval && includePersonalData
                  ? "Request Export"
                  : `Export ${format.toUpperCase()}`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
