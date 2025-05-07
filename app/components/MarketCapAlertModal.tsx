import React, { useState, useEffect } from "react";
import { Bell, X, TrendingUp, AlertTriangle, Check } from "lucide-react";

interface MarketCapAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    targetMarketCap: string,
    callback: (success: boolean) => void,
  ) => void;
  currentMarketCap?: string;
  tokenSymbol: string;
  alertActive?: boolean;
  tokenName: string;
}

const MarketCapAlertModal: React.FC<MarketCapAlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentMarketCap,
  tokenSymbol,
  alertActive = false,
  tokenName,
}) => {
  const [targetMarketCap, setTargetMarketCap] = useState("");
  const [status, setStatus] = useState({
    isLoading: false,
    isSuccess: null as boolean | null,
    message: "",
  });

  // Reset form and status when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset status
      setStatus({
        isLoading: false,
        isSuccess: null,
        message: "",
      });

      // Set initial value to current market cap if available
      if (currentMarketCap) {
        try {
          const numValue = parseFloat(currentMarketCap);
          if (!isNaN(numValue)) {
            setTargetMarketCap(numValue.toString());
          }
        } catch (e) {
          console.error("Failed to parse current market cap:", e);
        }
      }
    }
  }, [isOpen, currentMarketCap]);

  const handleSubmit = () => {
    // Validate input
    if (!targetMarketCap || parseFloat(targetMarketCap) <= 0) {
      setStatus({
        isLoading: false,
        isSuccess: false,
        message: "Please enter a valid market cap value",
      });
      return;
    }

    // Set loading state
    setStatus({
      isLoading: true,
      isSuccess: null,
      message: "Setting alert...",
    });

    try {
      // Pass a callback to handle the success/failure state
      onSubmit(targetMarketCap, (success) => {
        setStatus({
          isLoading: false,
          isSuccess: success,
          message: success ? "Alert set successfully!" : "Failed to set alert",
        });

        // Auto close modal on success after 1.5 seconds
        if (success) {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      });
    } catch (error) {
      console.error("Error in submit handler:", error);
      setStatus({
        isLoading: false,
        isSuccess: false,
        message: "An unexpected error occurred",
      });
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (value: string): string => {
    if (!value) return "$0";
    try {
      const num = parseFloat(value);
      if (isNaN(num)) return "$0";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(num);
    } catch (e) {
      console.error("Format currency error:", e);
      return "$0";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-3 shadow-xl border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Bell className="text-blue-600" size={18} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {alertActive ? "Update Market Cap Alert" : "Set Market Cap Alert"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors duration-200"
            disabled={status.isLoading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status message */}
        {status.message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              status.isSuccess === true
                ? "bg-green-50 text-green-700"
                : status.isSuccess === false
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700"
            }`}
          >
            {status.isSuccess === true ? (
              <Check size={16} className="text-green-500" />
            ) : status.isSuccess === false ? (
              <AlertTriangle size={16} className="text-red-500" />
            ) : (
              <Bell size={16} className="text-blue-500" />
            )}
            <span className="text-sm">{status.message}</span>
          </div>
        )}

        {/* Form content */}
        <div className="mb-6">
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700">
              {tokenName} ({tokenSymbol})
            </span>
          </div>

          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
            Notify me when market cap reaches:
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-lg font-medium">$</span>
            </div>

            <input
              type="number"
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-lg"
              value={targetMarketCap}
              onChange={(e) => setTargetMarketCap(e.target.value)}
              placeholder="Enter target market cap"
              min="0"
              step="any"
              disabled={status.isLoading}
            />
          </div>

          {/* Current value display */}
          {currentMarketCap && (
            <div className="flex justify-between items-center mt-3 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <TrendingUp size={14} />
                <span>Current value:</span>
              </div>
              <p className="font-medium text-gray-900">
                {formatCurrency(currentMarketCap)}
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            disabled={status.isLoading}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-60 disabled:pointer-events-none"
            disabled={
              !targetMarketCap ||
              status.isLoading ||
              parseFloat(targetMarketCap) <= 0
            }
            type="button"
          >
            {status.isLoading ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </>
            ) : (
              <>
                <Bell size={16} />
                {alertActive ? "Update Alert" : "Set Alert"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketCapAlertModal;