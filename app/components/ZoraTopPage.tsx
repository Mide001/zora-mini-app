import { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  TrendingUp,
  Clock,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Define token interface based on the API response
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

const ZoraCoinsTracker = () => {
  const router = useRouter();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [viewType, setViewType] = useState<string>("top-gainers");

  async function fetchData(
    type = viewType,
    cursor = nextCursor,
    refreshing = false,
  ) {
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
                  blurhash: edge.node.mediaContent.previewImage?.blurhash || "",
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
  }

  useEffect(() => {
    fetchData(viewType, undefined, true);
  }, [viewType]);

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Zora{" "}
          {viewType === "top-gainers"
            ? "Top Gainers"
            : viewType === "top-volume"
              ? "Top Volume"
              : "New Coins"}
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewType("top-gainers")}
              className={`px-3 py-1 flex items-center gap-1 ${
                viewType === "top-gainers"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              <TrendingUp size={16} />
              Top Gainers
            </button>
            <button
              onClick={() => setViewType("top-volume")}
              className={`px-3 py-1 flex items-center gap-1 ${
                viewType === "top-volume"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              <TrendingUp size={16} />
              Top Volume
            </button>
            <button
              onClick={() => setViewType("recent")}
              className={`px-3 py-1 flex items-center gap-1 ${
                viewType === "recent"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              <Clock size={16} />
              Recent
            </button>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">{error}</div>
      ) : loading && tokens.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center p-8 bg-gray-100 rounded">
          No data available
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tokens.map((coin, index) => {
            const percentChange = parseFloat(coin.marketCapDelta24h || "0");
            const isPositive = percentChange > 0;

            return (
              <div
                key={coin.id || index}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {coin.mediaContent?.previewImage?.small ? (
                        <img
                          src={coin.mediaContent.previewImage.small}
                          alt={coin.symbol}
                          className="w-8 h-8 rounded-full mr-3"
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement, Event>,
                          ) => {
                            const imgElement = e.currentTarget;
                            imgElement.onerror = null;
                            imgElement.src = "/api/placeholder/24/24";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
                      )}
                      <div>
                        <div className="text-base font-medium text-gray-900">
                          {coin.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {coin.symbol}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center text-base font-medium ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUp size={18} className="mr-1" />
                    ) : (
                      <ArrowDown size={18} className="mr-1" />
                    )}
                    {formatPercentChange(coin.marketCapDelta24h)}
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Market Cap
                      </div>
                      <div className="text-sm font-medium">
                        {formatMarketCap(coin.marketCap)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Volume (24h)
                      </div>
                      <div className="text-sm font-medium">
                        {formatMarketCap(coin.volume24h)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Unique Holders
                      </div>
                      <div className="text-sm font-medium">
                        {coin.uniqueHolders?.toLocaleString() || "N/A"}
                      </div>
                    </div>
                  </div>
                  {coin.description && coin.description.trim() !== "" && (
                    <div className="mt-3 text-sm text-gray-600 border-t border-gray-100 pt-3">
                      {coin.description.length > 100
                        ? `${coin.description.substring(0, 100)}...`
                        : coin.description}
                    </div>
                  )}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => viewTokenDetails(coin.address)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Info size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {nextCursor && !loading && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Load More
          </button>
        </div>
      )}

      {loading && tokens.length > 0 && (
        <div className="mt-4 flex justify-center">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default ZoraCoinsTracker;
