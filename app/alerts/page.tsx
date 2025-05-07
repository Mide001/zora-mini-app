"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Bell, RefreshCw, ArrowLeft, TrendingUp, X } from "lucide-react";
import Link from "next/link";

interface AlertData {
  tokenAddress: string;
  tokenName: string;
  marketCapTarget: string;
}

// Utility function to format market cap values
const formatMarketCap = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "$0";

  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return `$${num.toFixed(0)}`;
};

// Skeleton component for loading state
const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-pulse">
    <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
          <div className="h-2 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="p-2">
      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
      <div className="flex justify-end">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

export default function AlertsPage() {
  const router = useRouter();
  const { context } = useMiniKit();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!context?.user?.fid) return;

    setLoading(true);
    try {
      const response = await fetch("/api/market-cap-alert", {
        headers: {
          "X-Farcaster-FID": context.user.fid.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setError("Failed to load alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [context?.user?.fid]);

  const handleDisableAlert = async (tokenAddress: string) => {
    if (!context?.user?.fid) return;

    setIsDeleting(tokenAddress);
    try {
      const response = await fetch("/api/market-cap-alert", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Farcaster-FID": context.user.fid.toString(),
        },
        body: JSON.stringify({ tokenAddress }),
      });

      if (response.ok) {
        // Add fade-out animation before removing
        setTimeout(() => {
          setAlerts((prev) =>
            prev.filter((alert) => alert.tokenAddress !== tokenAddress),
          );
        }, 300);
      }
    } catch (error) {
      console.error("Error disabling alert:", error);
      setError("Failed to disable alert. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    if (context?.user?.fid) {
      fetchAlerts();
    } else {
      setLoading(false);
    }
  }, [context?.user?.fid, fetchAlerts]);

  if (!context?.user?.fid) {
    return (
      <div className="p-4 max-w-full mx-auto">
        <div className="text-center p-4 bg-gray-100 rounded text-xs">
          Please connect your Farcaster account to view alerts
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col mb-3">
        <div className="mb-4 flex justify-between items-center px-2">
          <Link
            href="/"
            className="flex items-center text-xs text-blue-500 hover:underline"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back to coins
          </Link>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200"
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Title */}
        <div className="mb-4 flex items-center justify-center">
          <h1 className="text-sm font-medium flex items-center gap-1">
            <Bell size={14} />
            Your Alerts
          </h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <Bell size={20} className="mx-auto mb-2 text-gray-400" />
          <p className="text-xs text-gray-500 mb-2">No active alerts</p>
          <Link
            href="/"
            className="inline-block text-xs text-blue-500 hover:underline"
          >
            Browse coins to set alerts
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.tokenAddress}
              className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all duration-300 ${
                isDeleting === alert.tokenAddress ? "opacity-50" : ""
              }`}
            >
              <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp size={14} className="text-blue-500 mr-2" />
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      {alert.tokenName}
                    </div>
                    <div className="text-xxs text-gray-500">
                      Target: {formatMarketCap(alert.marketCapTarget)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/coins/${alert.tokenAddress}`)}
                    className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xxs hover:bg-blue-200 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDisableAlert(alert.tokenAddress)}
                    disabled={isDeleting === alert.tokenAddress}
                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
