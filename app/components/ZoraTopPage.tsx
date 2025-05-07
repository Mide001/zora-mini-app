import { useState, useEffect, useCallback } from "react";
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  TrendingUp,
  Clock,
  Info,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Link from "next/link";

// Token interfaces
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
  uniqueHolders: number;
  priceUsd?: string;
  priceDelta24h?: string;
  holders?: number;
  deployedAt?: string;
  tokenURI?: string;
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
    exploreList: {
      edges: Array<{
        node: TokenData;
      }>;
      pageInfo: {
        endCursor?: string;
        hasNextPage: boolean;
      };
    };
  };
}

// Skeleton component for loading state
const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
    <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 animate-pulse"></div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-2 bg-gray-200 rounded w-10 mt-1 animate-pulse"></div>
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
    </div>
    <div className="p-2">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-xxs text-gray-500 mb-1">Market Cap</div>
          <div className="h-2 bg-gray-200 rounded w-14 animate-pulse"></div>
        </div>
        <div>
          <div className="text-xxs text-gray-500 mb-1">Volume (24h)</div>
          <div className="h-2 bg-gray-200 rounded w-14 animate-pulse"></div>
        </div>
        <div>
          <div className="text-xxs text-gray-500 mb-1">Holders</div>
          <div className="h-2 bg-gray-200 rounded w-14 animate-pulse"></div>
        </div>
      </div>
      <div className="mt-2 h-6 bg-gray-200 rounded animate-pulse"></div>
      <div className="mt-2 flex justify-end">
        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
    </div>
  </div>
);

const ZoraCoinsTracker = () => {
  const router = useRouter();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [viewType, setViewType] = useState<string>("top-gainers");
  const { context } = useMiniKit();

  // Use useCallback to memoize the function
  const fetchData = useCallback(
    async (type = viewType, cursor = nextCursor, refreshing = false) => {
      setLoading(true);
      try {
        // Build URL with query parameters
        const params = new URLSearchParams({
          type,
          count: "10",
        });

        if (cursor && !refreshing) {
          params.append("after", cursor);
        }

        const response = await fetch(`/api/zora-coins?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch data");
        }

        const responseData: ApiResponse = await response.json();

        const tokenData =
          responseData.data?.exploreList.edges?.map((edge) => ({
            ...edge.node,
            mediaContent: edge.node.mediaContent
              ? {
                  mimeType: edge.node.mediaContent.mimeType || "",
                  originalUri: edge.node.mediaContent.originalUri,
                  previewImage: {
                    small: edge.node.mediaContent.previewImage?.small || "",
                    medium: edge.node.mediaContent.previewImage?.medium || "",
                    blurhash:
                      edge.node.mediaContent.previewImage?.blurhash || "",
                  },
                }
              : undefined,
          })) || [];

        if (refreshing) {
          setTokens(tokenData);
        } else {
          setTokens((prev) => [...prev, ...tokenData]);
        }

        if (responseData.data?.exploreList?.pageInfo?.endCursor) {
          setNextCursor(responseData.data.exploreList.pageInfo.endCursor);
        } else {
          setNextCursor(undefined);
        }

        setLoading(false);
      } catch (err) {
        setError(
          `Failed to load data: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setLoading(false);
      }
    },
    [viewType, nextCursor],
  );

  useEffect(() => {
    fetchData(viewType, undefined, true);
  }, [viewType, fetchData]);

  const refreshData = () => {
    fetchData(viewType, undefined, true);
  };

  const loadMore = () => {
    fetchData(viewType, nextCursor, false);
  };

  const viewTokenDetails = (address: string) => {
    router.push(`/coins/${address}`);
  };

  const formatMarketCap = (value?: string): string => {
    if (!value) return "N/A";

    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";

    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    } else {
      return `$${num.toFixed(1)}`;
    }
  };

  const formatPercentChange = (value?: string): string => {
    if (!value) return "N/A";

    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";

    return `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
  };

  // Generate skeleton cards for loading state
  const renderSkeletonCards = () => {
    const skeletons = [];
    for (let i = 0; i < 5; i++) {
      skeletons.push(<SkeletonCard key={`skeleton-${i}`} />);
    }
    return skeletons;
  };

  // Generate skeleton cards for load more operation
  const renderLoadMoreSkeletons = () => {
    const skeletons = [];
    for (let i = 0; i < 2; i++) {
      skeletons.push(<SkeletonCard key={`load-more-skeleton-${i}`} />);
    }
    return skeletons;
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex flex-col mb-3">
        <div className="mb-4 flex justify-between items-center px-2">
          <Image
            src="/zora-logo.png"
            alt="Zora"
            width={100}
            height={33}
            className="h-auto"
          />
          {context?.user?.fid && (
            <Link
              href="/alerts"
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200"
            >
              <Bell size={14} />
            </Link>
          )}
        </div>

        {/* View Type Filter Buttons */}
        <div className="flex justify-end items-center">
          <div className="flex border rounded overflow-hidden text-xs">
            <button
              onClick={() => setViewType("top-gainers")}
              className={`px-2 py-1 flex items-center gap-1 ${
                viewType === "top-gainers"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
              aria-label="Show top gainers"
            >
              <TrendingUp size={12} />
              Gainers
            </button>
            <button
              onClick={() => setViewType("top-volume")}
              className={`px-2 py-1 flex items-center gap-1 ${
                viewType === "top-volume"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
              aria-label="Show top volume"
            >
              <TrendingUp size={12} />
              Volume
            </button>
            <button
              onClick={() => setViewType("recent")}
              className={`px-2 py-1 flex items-center gap-1 ${
                viewType === "recent"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
              aria-label="Show recent coins"
            >
              <Clock size={12} />
              Recent
            </button>
          </div>
          <button
            onClick={refreshData}
            className="ml-1 flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            aria-label="Refresh data"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Display view type text below filters */}
        <div className="mt-2 text-center">
          <h2 className="text-sm font-medium">
            {viewType === "top-gainers"
              ? "Top Gainers"
              : viewType === "top-volume"
                ? "Top Volume"
                : "New Coins"}
          </h2>
        </div>
      </div>

      {error ? (
        <div
          className="p-2 bg-red-100 text-red-700 rounded mb-2 text-xs"
          role="alert"
        >
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {loading && tokens.length === 0 ? (
            renderSkeletonCards()
          ) : tokens.length === 0 ? (
            <div className="text-center p-4 bg-gray-100 rounded text-xs">
              No data available
            </div>
          ) : (
            <>
              {tokens.map((coin, index) => {
                const percentChange = parseFloat(coin.marketCapDelta24h || "0");
                const isPositive = percentChange > 0;

                return (
                  <div
                    key={coin.id || index}
                    className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {coin.mediaContent?.previewImage?.small ? (
                            <Image
                              src={coin.mediaContent.previewImage.small}
                              alt={coin.symbol}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full mr-2"
                              onError={(
                                e: React.SyntheticEvent<
                                  HTMLImageElement,
                                  Event
                                >,
                              ) => {
                                const imgElement = e.currentTarget;
                                imgElement.onerror = null;
                                imgElement.src = "/api/placeholder/24/24";
                              }}
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full bg-gray-200 mr-2"
                              aria-hidden="true"
                            ></div>
                          )}
                          <div>
                            <div className="text-xs font-medium text-gray-900">
                              {coin.name}
                            </div>
                            <div className="text-xxs text-gray-500">
                              {coin.symbol}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center text-xs font-medium ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUp
                            size={12}
                            className="mr-1"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowDown
                            size={12}
                            className="mr-1"
                            aria-hidden="true"
                          />
                        )}
                        {formatPercentChange(coin.marketCapDelta24h)}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-xxs text-gray-500 mb-1">
                            Market Cap
                          </div>
                          <div className="text-xxs font-medium">
                            {formatMarketCap(coin.marketCap)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xxs text-gray-500 mb-1">
                            Vol (24h)
                          </div>
                          <div className="text-xxs font-medium">
                            {formatMarketCap(coin.volume24h)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xxs text-gray-500 mb-1">
                            Holders
                          </div>
                          <div className="text-xxs font-medium">
                            {coin.uniqueHolders?.toLocaleString() || "N/A"}
                          </div>
                        </div>
                      </div>
                      {coin.description && coin.description.trim() !== "" && (
                        <div className="mt-2 text-xxs text-gray-600 border-t border-gray-100 pt-1">
                          {coin.description.length > 60
                            ? `${coin.description.substring(0, 60)}...`
                            : coin.description}
                        </div>
                      )}
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => viewTokenDetails(coin.address)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xxs"
                          aria-label={`View details for ${coin.name}`}
                        >
                          <Info size={10} aria-hidden="true" />
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Show skeleton loaders for "Load More" operation */}
              {loading && tokens.length > 0 && renderLoadMoreSkeletons()}
            </>
          )}
        </div>
      )}

      {nextCursor && !loading && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={loadMore}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs"
            aria-label="Load more coins"
          >
            Load More
          </button>
        </div>
      )}

      {loading && tokens.length > 0 && (
        <div
          className="mt-2 flex justify-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <RefreshCw size={16} className="animate-spin text-blue-500" />
          <span className="sr-only">Loading more data...</span>
        </div>
      )}
    </div>
  );
};

export default ZoraCoinsTracker;
