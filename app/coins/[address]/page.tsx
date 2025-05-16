"use client";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Copy,
  Check,
  MessageSquare,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { useMiniKit, useAddFrame } from "@coinbase/onchainkit/minikit";
import MarketCapAlertModal from "@/app/components/MarketCapAlertModal";

interface TokenData {
  id: string;
  name: string;
  description: string;
  address: string;
  symbol: string;
  totalSupply: string;
  totalVolume: string;
  volume24h: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  createdAt?: string;
  creatorAddress?: string;
  creatorEarnings?: Array<{ amountUsd: string }>;
  creatorProfile?: {
    id: string;
    handle: string;
    avatar?: {
      previewImage: {
        small: string;
        medium?: string;
        blurhash?: string;
      };
    };
  };
  uniqueHolders: number;
  zoraComments?: {
    count: number;
  };
  mediaContent?: {
    previewImage: {
      small: string;
      medium: string;
      blurhash: string;
    };
  };
}

const TokenDetailSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    {/* Header Skeleton */}
    <div className="p-3 border-b border-gray-200 bg-gray-50">
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex items-center mb-2 md:mb-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>

    <div className="p-3">
      {/* Description Skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>

      {/* Market Data & Activity Skeleton */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        {/* Market Data */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={`market-${i}`} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity & Holdings */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={`activity-${i}`} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Creator Information Skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={`creator-${i}`} className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-28"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Token Identity Skeleton */}
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={`identity-${i}`} className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const TokenDetailPage = () => {
  const params = useParams<{ address: string }>();
  const address = params.address;
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertActive, setAlertActive] = useState(false);
  const [alertLoading, setAlertLoading] = useState(true);
  const [targetMarketCapValue, setTargetMarketCapValue] = useState("");

  const { context } = useMiniKit();
  const addFrame = useAddFrame();

  const { ref: creatorSectionRef, inView: creatorSectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const checkExistingAlert = useCallback(
    async (tokenAddress: string) => {
      if (!context?.user?.fid) {
        console.log("No FID available, can't check alerts");
        setAlertLoading(false);
        return;
      }

      console.log("Target new market: ", targetMarketCapValue);

      try {
        const fid = context.user.fid;
        console.log(`Checking alerts for token ${tokenAddress} and FID ${fid}`);
        console.log(
          `Expected Redis key format: marketcap-alert${fid}:${tokenAddress}`,
        );

        const response = await fetch(
          `/api/market-cap-alert/status?tokenAddress=${tokenAddress}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Farcaster-FID": fid.toString(),
            },
          },
        );

        if (!response.ok) {
          console.log(
            "Alert status request failed with status:",
            response.status,
          );
          setAlertActive(false);
          return;
        }

        const text = await response.text();
        if (!text) {
          console.log("Empty response received from alert status endpoint");
          setAlertActive(false);
          return;
        }

        try {
          const data = JSON.parse(text);
          console.log("Alert status response:", data);

          if (data.tokenAddress && data.tokenAddress === tokenAddress) {
            console.log("Found matching alert with full data");
            setAlertActive(true);
            if (data.marketCapTarget) {
              setTargetMarketCapValue(data.marketCapTarget);
            }
          } else {
            console.log("Alert enabled status:", data.enabled);
            setAlertActive(data.enabled || false);
            if (data.marketCapTarget) {
              setTargetMarketCapValue(data.marketCapTarget);
            }
          }
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          setAlertActive(false);
        }
      } catch (error) {
        console.error("Failed to fetch alert status: ", error);
        setAlertActive(false);
      } finally {
        setAlertLoading(false);
      }
    },
    [context?.user?.fid, targetMarketCapValue],
  );

  useEffect(() => {
    setAlertLoading(true);
    setAlertActive(false);

    if (address) {
      fetchTokenDetails(address);

      if (context?.user?.fid) {
        checkExistingAlert(address);
      } else {
        console.log("Context or FID not available yet");
        const timer = setTimeout(() => {
          if (!context?.user?.fid) {
            console.log("No FID available after timeout");
            setAlertLoading(false);
          }
        }, 2000);

        return () => clearTimeout(timer);
      }
    } else {
      setError("No token address provided");
      setLoading(false);
      setAlertLoading(false);
    }
  }, [address, context?.user?.fid, checkExistingAlert]);

  async function fetchTokenDetails(tokenAddress: string) {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/zora-coins?type=token-detail&address=${tokenAddress}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch token details");
      }

      const responseData = await response.json();
      if (responseData.data?.zora20Token) {
        console.log("Token: ", responseData.data.zora20Token);
        setToken(responseData.data.zora20Token);
      } else {
        setError("Token data not found in response");
      }
    } catch (err) {
      setError(
        `Failed to load token details: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  const formatMarketCap = (value?: string) => {
    if (!value) return "N/A";
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";

    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentChange = (value?: string) => {
    if (!value) return "N/A";
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAlertSubmit = async (
    newTargetMarketCap: string,
    callback: (success: boolean) => void,
  ) => {
    if (!context?.user?.fid) {
      console.log("Please connect your farcaster account first");
      callback(false);
      return;
    }

    try {
      const result = await addFrame();
      if (!result) {
        console.log("Frame access was denied, Alert can't be enabled.");
        callback(false);
        return;
      }

      const requestBody = {
        enabled: true,
        token: result.token,
        url: result.url,
        tokenAddress: token?.address,
        tokenName: token?.name,
        marketCapTarget: newTargetMarketCap,
      };

      const response = await fetch("/api/market-cap-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Farcaster-FID": context.user.fid.toString(),
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setAlertActive(true);
        setTargetMarketCapValue(newTargetMarketCap);
        callback(true);
      } else {
        console.log("Alert set error: ", await response.json());
        callback(false);
      }

      console.log("Target Alert: ", newTargetMarketCap);
    } catch (error) {
      console.error("Error setting alert:", error);
      callback(false);
    }
  };

  const handleDisableAlert = async () => {
    if (!context?.user?.fid) {
      console.log("Please connect your farcaster account first");
      return;
    }

    if (!token?.address) {
      console.log("No token address available");
      return;
    }

    setAlertLoading(true);
    try {
      console.log(
        `Attempting to disable alert for token ${token.address} and FID ${context.user.fid}`,
      );
      console.log(
        `Expected Redis key to delete: marketcap-alert${context.user.fid}:${token.address}`,
      );

      const response = await fetch("/api/market-cap-alert", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Farcaster-FID": context.user.fid.toString(),
        },
        body: JSON.stringify({
          tokenAddress: token.address,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Disable alert response:", result);
        setAlertActive(false);
        setTargetMarketCapValue("");
        console.log("Alert successfully disabled");
      } else {
        const errorData = await response.json();
        console.log("Alert disable error: ", errorData);
      }
    } catch (error) {
      console.error("Error disabling alert:", error);
    } finally {
      setAlertLoading(false);
    }
  };

  const renderAlertButton = () => {
    if (alertLoading) {
      return (
        <button
          disabled
          className="flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600"
        >
          <Bell size={14} className="mr-1 animate-pulse" />
          Checking...
        </button>
      );
    } else if (!context?.user?.fid) {
      return (
        <button
          onClick={() =>
            console.log("Please connect your farcaster account first")
          }
          className="flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <Bell size={14} className="mr-1" />
          Connect First
        </button>
      );
    } else if (alertActive) {
      return (
        <button
          onClick={handleDisableAlert}
          className="flex items-center px-2 py-1 rounded-md text-xs bg-red-100 text-red-600 hover:bg-red-200"
        >
          <Bell size={14} className="mr-1" />
          Disable Alert
        </button>
      );
    } else {
      return (
        <button
          onClick={() => setIsAlertModalOpen(true)}
          className="flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-600 hover:bg-blue-200"
        >
          <Bell size={14} className="mr-1" />
          Set Alert
        </button>
      );
    }
  };

  const renderDataItem = (
    label: string,
    value: string | number,
    fieldName: string = "",
    disableCopy: boolean = false,
    extraSmall: boolean = false,
  ) => {
    const displayValue = value ?? "N/A";
    const canCopy = !disableCopy && displayValue !== "N/A" && fieldName;
    const textSize = extraSmall ? "text-tiny" : "text-xs";

    return (
      <div className="flex justify-between py-1.5 border-b border-gray-100">
        <span className="text-xs text-gray-600">{label}</span>
        <div className="flex items-center">
          <span
            className={`${textSize} font-medium mr-1.5 break-all max-w-[200px]`}
          >
            {displayValue.toString()}
          </span>
          {canCopy && (
            <button
              onClick={() =>
                copyToClipboard(displayValue.toString(), fieldName)
              }
              className="p-0.5 hover:bg-gray-100 rounded-full"
            >
              {copiedField === fieldName ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Copy size={12} className="text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-3 max-w-full">
        <div className="mb-2">
          <Link
            href="/"
            className="flex items-center text-xs text-blue-500 hover:underline"
          >
            <ArrowLeft size={12} className="mr-1" />
            Back to coins list
          </Link>
        </div>
        <TokenDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-3 max-w-full">
        <div className="p-3 bg-red-100 text-red-700 rounded text-xs mb-3">
          {error}
        </div>
        <Link
          href="/"
          className="flex items-center text-xs text-blue-500 hover:underline mt-3"
        >
          <ArrowLeft size={12} className="mr-1" />
          Back to coins list
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container mx-auto p-3 max-w-full">
        <div className="text-center p-4 bg-gray-100 rounded text-xs">
          Token not found or no data available
        </div>
        <Link
          href="/"
          className="flex items-center text-xs text-blue-500 hover:underline mt-3"
        >
          <ArrowLeft size={12} className="mr-1" />
          Back to coins list
        </Link>
      </div>
    );
  }

  const percentChange = parseFloat(token.marketCapDelta24h || "0");
  const isPositive = percentChange > 0;

  return (
    <div className="container mx-auto p-3 max-w-full">
      {/* Header with back button and alert button */}
      <div className="mb-2 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center text-xs text-blue-500 hover:underline"
        >
          <ArrowLeft size={12} className="mr-1" />
          Back to coins list
        </Link>
        {renderAlertButton()}
      </div>

      {/* Alert Modal - Only show when setting a new alert */}
      {!alertActive && (
        <MarketCapAlertModal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          onSubmit={handleAlertSubmit}
          currentMarketCap={token.marketCap}
          tokenSymbol={token.symbol}
          alertActive={false}
          tokenName={token.name}
        />
      )}

      {/* Main content card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Token header */}
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between">
          <div className="flex items-center mb-2 md:mb-0">
            {token.mediaContent?.previewImage?.medium ? (
              <Image
                src={token.mediaContent.previewImage.medium}
                alt={token.symbol}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full mr-3"
                unoptimized={true}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/api/placeholder/40/40";
                }}
                loading="lazy"
                placeholder="blur"
                blurDataURL={
                  token.mediaContent.previewImage.blurhash ||
                  "/api/placeholder/40/40"
                }
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
            )}
            <div>
              <h1 className="text-base font-bold text-gray-900">
                {token.name}
              </h1>
              <div className="text-xs text-gray-500">{token.symbol}</div>
              {token.creatorProfile && (
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-0.5">by</span>
                  <Link
                    href={`/profile/${token.creatorProfile.handle}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    @{token.creatorProfile.handle}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <div
                className={`flex items-center text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"} mr-4`}
              >
                {isPositive ? (
                  <ArrowUp size={14} className="mr-0.5" />
                ) : (
                  <ArrowDown size={14} className="mr-0.5" />
                )}
                {formatPercentChange(token.marketCapDelta24h)}
              </div>
            </div>

            {token.zoraComments && (
              <div className="flex items-center mt-1 text-gray-500">
                <MessageSquare size={12} className="mr-0.5" />
                <span className="text-xs">
                  {token.zoraComments.count.toLocaleString()} comments
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3">
          {/* Description */}
          {token.description && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-1.5">Description</h3>
              <p className="text-xs text-gray-700">{token.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Market Data */}
            <div>
              <h3 className="text-sm font-medium mb-2">Market Data</h3>
              <div className="space-y-1.5">
                {renderDataItem(
                  "Market Cap",
                  formatMarketCap(token.marketCap),
                  "marketCap",
                  true,
                )}
                {renderDataItem(
                  "Market Cap Δ24h",
                  formatPercentChange(token.marketCapDelta24h),
                  "marketCapDelta24h",
                  true,
                )}
                {renderDataItem(
                  "Volume (24h)",
                  formatMarketCap(token.volume24h),
                  "volume24h",
                  true,
                )}
                {renderDataItem(
                  "Total Supply",
                  parseInt(token.totalSupply || "0").toLocaleString(),
                  "totalSupply",
                )}
              </div>
            </div>

            {/* Activity & Holdings */}
            <div>
              <h3 className="text-sm font-medium mb-2">Activity & Holdings</h3>
              <div className="space-y-1.5">
                {renderDataItem(
                  "Unique Holders",
                  token.uniqueHolders?.toLocaleString() || "N/A",
                  "uniqueHolders",
                  true,
                )}
                {renderDataItem(
                  "Created At",
                  formatDate(token.createdAt),
                  "createdAt",
                  true,
                )}
              </div>
            </div>
          </div>

          {/* Creator Information - Lazy loaded */}
          <div ref={creatorSectionRef}>
            {creatorSectionInView && token.creatorProfile && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">
                  Creator Information
                </h3>
                <div className="flex items-center mb-2">
                  {token.creatorProfile.avatar?.previewImage.small ? (
                    <Image
                      src={token.creatorProfile.avatar.previewImage.small}
                      alt={token.creatorProfile.handle}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full mr-2"
                      unoptimized={true}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/api/placeholder/32/32";
                      }}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL={
                        token.creatorProfile.avatar.previewImage.blurhash ||
                        "/api/placeholder/32/32"
                      }
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-gray-500 text-xs">
                      {token.creatorProfile.handle.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/profile/${token.creatorProfile.handle}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      @{token.creatorProfile.handle}
                    </Link>
                    <div className="text-xs text-gray-500">Creator</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {renderDataItem(
                    "Creator Address",
                    token.creatorAddress || "N/A",
                    "creatorAddress",
                  )}
                  {token.creatorEarnings?.[0]?.amountUsd &&
                    renderDataItem(
                      "Creator Earnings (USD)",
                      `$${parseFloat(
                        token.creatorEarnings[0].amountUsd,
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                      "creatorEarningsUsd",
                      true,
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Token Identity Section */}
          <div>
            <h3 className="text-sm font-medium mb-2">Token Identity</h3>
            <div className="space-y-1.5">
              {renderDataItem("Symbol", token.symbol, "symbol", true)}
              {renderDataItem(
                "Contract Address",
                token.address,
                "address",
                false,
                true,
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetailPage;
