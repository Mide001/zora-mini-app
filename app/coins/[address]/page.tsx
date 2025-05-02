"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

// Complete TokenData interface with all available fields
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
  chainId?: number;
  createdAt?: string;
  creatorAddress?: string;
  creatorEarnings?: Array<any>;
  creatorProfile?: {
    id: string;
    handle: string;
    avatar?: {
      url?: string;
    };
  };
  uniqueHolders: number;
  priceUsd?: string;
  priceDelta24h?: string;
  holders?: number;
  deployedAt?: string;
  tokenUri?: string;
  transfers?: {
    count: number;
  };
  zoraComments?: {
    pageInfo: any;
    count: number;
    edges: Array<any>;
  };
  mediaContent?: {
    mimeType: string;
    originalUri: string;
    previewImage: {
      small: string;
      medium: string;
      blurhash: string;
    };
  };
}

interface ApiResponse {
  data?: {
    zora20Token?: TokenData;
  };
}

const TokenDetailPage = () => {
  const params = useParams<{ address: string }>();
  const address = params.address;

  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchTokenDetails(address);
    } else {
      setError("No token address provided");
      setLoading(false);
    }
  }, [address]);

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

      const responseData: ApiResponse = await response.json();

      if (responseData.data?.zora20Token) {
        setToken(responseData.data.zora20Token);
      } else {
        setError("Token data not found in response");
      }
      setLoading(false);
    } catch (err) {
      setError(
        `Failed to load token details: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setLoading(false);
    }
  }

  const formatMarketCap = (value?: string): string => {
    if (!value) return "N/A";

    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";

    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  const formatPercentChange = (value?: string): string => {
    if (!value) return "N/A";

    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";

    return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderDataItem = (
    label: string,
    value: any,
    fieldName: string = "",
  ) => {
    const displayValue =
      value === undefined || value === null ? "N/A" : value.toString();
    const canCopy = displayValue !== "N/A" && fieldName;

    return (
      <div className="flex justify-between py-2 border-b border-gray-100">
        <span className="text-gray-600">{label}</span>
        <div className="flex items-center">
          <span className="font-medium mr-2">{displayValue}</span>
          {canCopy && (
            <button
              onClick={() => copyToClipboard(displayValue, fieldName)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              {copiedField === fieldName ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} className="text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">{error}</div>
        <div className="mt-4">
          <Link
            href="/coins"
            className="flex items-center text-blue-500 hover:underline"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to coins list
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center p-8 bg-gray-100 rounded">
          Token not found or no data available
        </div>
        <div className="mt-4">
          <Link
            href="/coins"
            className="flex items-center text-blue-500 hover:underline"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to coins list
          </Link>
        </div>
      </div>
    );
  }

  const percentChange = parseFloat(token.marketCapDelta24h || "0");
  const isPositive = percentChange > 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-4">
        <Link
          href="/coins"
          className="flex items-center text-blue-500 hover:underline"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to coins list
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            {token.mediaContent?.previewImage?.medium ? (
              <img
                src={token.mediaContent.previewImage.medium}
                alt={token.symbol}
                className="w-16 h-16 rounded-full mr-6"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const imgElement = e.currentTarget;
                  imgElement.onerror = null;
                  imgElement.src = "/api/placeholder/64/64";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 mr-6"></div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{token.name}</h1>
              <div className="text-lg text-gray-500">{token.symbol}</div>
              {token.creatorProfile && (
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500 mr-1">by</span>
                  <span className="text-sm font-medium text-blue-600">
                    @{token.creatorProfile.handle}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div
              className={`flex items-center text-xl font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <ArrowUp size={24} className="mr-1" />
              ) : (
                <ArrowDown size={24} className="mr-1" />
              )}
              {formatPercentChange(token.marketCapDelta24h)}
            </div>

            {token.zoraComments && (
              <div className="flex items-center mt-2 text-gray-500">
                <MessageSquare size={16} className="mr-1" />
                <span>
                  {token.zoraComments.count.toLocaleString()} comments
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between mb-6">
              <div className="mb-4 md:mb-0">
                <div className="text-sm text-gray-500 mb-1">Price</div>
                <div className="text-3xl font-medium">
                  {formatMarketCap(token.marketCap)}
                </div>
              </div>
              <div className="flex space-x-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">24h Change</div>
                  <div
                    className={`text-2xl font-medium flex items-center ${
                      parseFloat(token.marketCapDelta24h || "0") > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {parseFloat(token.marketCapDelta24h || "0") > 0 ? (
                      <ArrowUp size={20} className="mr-1" />
                    ) : (
                      <ArrowDown size={20} className="mr-1" />
                    )}
                    {formatPercentChange(token.marketCapDelta24h)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Volume (24h)</div>
                  <div className="text-2xl font-medium">
                    {formatMarketCap(token.volume24h)}
                  </div>
                </div>
              </div>
            </div>

            {token.description && (
              <div className="mb-8">
                <h3 className="text-xl font-medium mb-3">Description</h3>
                <p className="text-gray-700">
                  {token.description || "No description provided."}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-medium mb-4">Market Data</h3>
                <div className="space-y-4">
                  {renderDataItem(
                    "Market Cap",
                    formatMarketCap(token.marketCap),
                    "marketCap",
                  )}
                  {renderDataItem(
                    "Market Cap Δ24h",
                    formatPercentChange(token.marketCapDelta24h),
                    "marketCapDelta24h",
                  )}
                  {renderDataItem(
                    "Volume (24h)",
                    formatMarketCap(token.volume24h),
                    "volume24h",
                  )}
                  {renderDataItem(
                    "Total Volume",
                    formatMarketCap(token.totalVolume),
                    "totalVolume",
                  )}
                  {renderDataItem(
                    "Total Supply",
                    parseInt(token.totalSupply || "0").toLocaleString(),
                    "totalSupply",
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-4">
                  Activity & Holdings
                </h3>
                <div className="space-y-4">
                  {renderDataItem(
                    "Unique Holders",
                    token.uniqueHolders?.toLocaleString() || "N/A",
                    "uniqueHolders",
                  )}
                  {renderDataItem(
                    "Transfers",
                    token.transfers?.count.toLocaleString() || "N/A",
                    "transfers",
                  )}
                  {renderDataItem(
                    "Comments",
                    token.zoraComments?.count.toLocaleString() || "N/A",
                    "comments",
                  )}
                  {renderDataItem(
                    "Created At",
                    formatDate(token.createdAt),
                    "createdAt",
                  )}
                </div>
              </div>
            </div>

            {/* Creator Information */}
            {token.creatorProfile && (
              <div className="mb-8">
                <h3 className="text-xl font-medium mb-4">
                  Creator Information
                </h3>
                <div className="flex items-center mb-4">
                  {token.creatorProfile.avatar?.url ? (
                    <img
                      src={token.creatorProfile.avatar.url}
                      alt={token.creatorProfile.handle}
                      className="w-12 h-12 rounded-full mr-4"
                      onError={(
                        e: React.SyntheticEvent<HTMLImageElement, Event>,
                      ) => {
                        const imgElement = e.currentTarget;
                        imgElement.onerror = null;
                        imgElement.src = "/api/placeholder/48/48";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                  )}
                  <div>
                    <div className="font-medium">
                      @{token.creatorProfile.handle}
                    </div>
                    <div className="text-sm text-gray-500">Creator</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {renderDataItem(
                    "Creator ID",
                    token.creatorProfile.id,
                    "creatorId",
                  )}
                  {renderDataItem(
                    "Creator Address",
                    token.creatorAddress || "N/A",
                    "creatorAddress",
                  )}
                  {token.creatorEarnings &&
                    token.creatorEarnings.length > 0 && (
                      <div className="py-2 border-b border-gray-100">
                        <span className="text-gray-600">Creator Earnings</span>
                        <div className="mt-2 bg-gray-50 p-2 rounded">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(token.creatorEarnings, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Token Identity Section */}
            <div className="mb-8">
              <h3 className="text-xl font-medium mb-4">Token Identity</h3>
              <div className="space-y-4">
                {renderDataItem("Token ID", token.id, "id")}
                {renderDataItem("Symbol", token.symbol, "symbol")}
                {renderDataItem("Contract Address", token.address, "address")}
                {renderDataItem("Chain ID", token.chainId, "chainId")}
                {renderDataItem("Token URI", token.tokenUri, "tokenUri")}
              </div>
            </div>

            {/* Media Content Section */}
            {token.mediaContent && (
              <div className="mb-8">
                <h3 className="text-xl font-medium mb-4">Media Content</h3>
                <div className="space-y-4">
                  {renderDataItem(
                    "MIME Type",
                    token.mediaContent.mimeType,
                    "mimeType",
                  )}
                  {renderDataItem(
                    "Original URI",
                    token.mediaContent.originalUri,
                    "originalUri",
                  )}
                  <div className="mt-4">
                    <span className="text-gray-600 block mb-2">
                      Preview Images:
                    </span>
                    <div className="flex flex-wrap gap-4">
                      {token.mediaContent.previewImage?.small && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Small
                          </span>
                          <img
                            src={token.mediaContent.previewImage.small}
                            alt="Small preview"
                            className="max-h-32 rounded border border-gray-200"
                            onError={(
                              e: React.SyntheticEvent<HTMLImageElement, Event>,
                            ) => {
                              const imgElement = e.currentTarget;
                              imgElement.onerror = null;
                              imgElement.src = "/api/placeholder/48/48";
                            }}
                          />
                        </div>
                      )}
                      {token.mediaContent.previewImage?.medium && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Medium
                          </span>
                          <img
                            src={token.mediaContent.previewImage.medium}
                            alt="Medium preview"
                            className="max-h-32 rounded border border-gray-200"
                            onError={(
                              e: React.SyntheticEvent<HTMLImageElement, Event>,
                            ) => {
                              const imgElement = e.currentTarget;
                              imgElement.onerror = null;
                              imgElement.src = "/api/placeholder/64/64";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {token.mediaContent.previewImage?.blurhash && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500 block mb-1">
                          Blurhash
                        </span>
                        <div className="break-all bg-gray-50 p-2 rounded border border-gray-200">
                          {token.mediaContent.previewImage.blurhash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetailPage;
