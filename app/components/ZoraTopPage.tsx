import { useState, useEffect, useCallback } from "react";
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  TrendingUp,
  Clock,
  Info,
  Bell,
  BarChart2,
  Users,
  DollarSign,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import Link from "next/link";
import debounce from "lodash/debounce";

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
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<TokenData | null>(null);
  const [isViewChanging, setIsViewChanging] = useState(false);
  const { context } = useMiniKit();
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce(async (address: string) => {
      if (!address) {
        setSearchResult(null);
        return;
      }

      setIsSearchLoading(true);
      console.log("Searching for address:", address);
      
      try {
        const response = await fetch(
          `/api/zora-coins?type=token-detail&address=${address}`,
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API Response:", data);

        if (data.data?.zora20Token) {
          console.log("Found token data:", data.data.zora20Token);
          const tokenData: TokenData = {
            id: data.data.zora20Token.id || address,
            name: data.data.zora20Token.name || "",
            description: data.data.zora20Token.description || "",
            address: address,
            symbol: data.data.zora20Token.symbol || "",
            totalSupply: data.data.zora20Token.totalSupply || "0",
            totalVolume: data.data.zora20Token.totalVolume || "0",
            volume24h: data.data.zora20Token.volume24h || "0",
            marketCap: data.data.zora20Token.marketCap,
            marketCapDelta24h: data.data.zora20Token.marketCapDelta24h,
            uniqueHolders: data.data.zora20Token.uniqueHolders || 0,
            mediaContent: data.data.zora20Token.mediaContent,
            creatorAddress: data.data.zora20Token.creatorAddress,
            createdAt: data.data.zora20Token.createdAt,
          };
          console.log("Formatted token data:", tokenData);
          setSearchResult(tokenData);
        } else {
          console.log("No token data found in response");
          setSearchResult(null);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResult(null);
      } finally {
        setIsSearchLoading(false);
      }
    }, 1000),
    []
  );

  // Handle input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setSearchAddress(value);
    setSearchResult(null);
    if (value) {
      debouncedSearch(value);
    }
  };

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

  const handleViewChange = async (newViewType: string) => {
    setIsViewChanging(true);
    setViewType(newViewType);
    await fetchData(newViewType, undefined, true);
    setIsViewChanging(false);
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex flex-col mb-3">
        <div className="mb-4 flex justify-between items-center px-2">
          {context?.user?.fid && (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs hover:bg-purple-200"
              >
                <Users size={14} />
                <span>Profile</span>
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200"
              >
                <BarChart2 size={14} />
                <span>Analytics</span>
              </Link>
              <Link
                href="/sponsored"
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200"
              >
                <DollarSign size={14} />
                <span>Sponsored</span>
              </Link>
              <Link
                href="/alerts"
                className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs hover:bg-orange-200"
              >
                <Bell size={14} />
                <span>Alerts</span>
              </Link>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <Search size={16} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewChange("top-gainers")}
              disabled={isViewChanging}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                viewType === "top-gainers"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-gray-100 text-gray-600"
              } ${isViewChanging ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isViewChanging && viewType === "top-gainers" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Gainers
            </button>
            <button
              onClick={() => handleViewChange("top-volume")}
              disabled={isViewChanging}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                viewType === "top-volume"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-gray-100 text-gray-600"
              } ${isViewChanging ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isViewChanging && viewType === "top-volume" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Trending
            </button>
            <button
              onClick={() => handleViewChange("recent")}
              disabled={isViewChanging}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                viewType === "recent"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-gray-100 text-gray-600"
              } ${isViewChanging ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isViewChanging && viewType === "recent" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              New Coins
            </button>
            <button
              onClick={refreshData}
              disabled={isViewChanging}
              className={`p-2 text-gray-500 hover:text-gray-700 ${
                isViewChanging ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Search Modal */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200 ${
            isSearchModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div 
            className={`bg-gray-50/95 backdrop-blur-sm rounded-xl shadow-xl w-full max-w-md mx-4 transform transition-all duration-200 ${
              isSearchModalOpen ? "scale-100" : "scale-95"
            }`}
          >
            <div className="p-4 border-b border-gray-200/50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Search Token</h3>
                  <p className="text-sm text-gray-500 mt-1">Enter a coined contract address to view details</p>
                </div>
                <button
                  onClick={() => {
                    setIsSearchModalOpen(false);
                    setSearchAddress("");
                    setSearchResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchAddress}
                  onChange={handleSearchInputChange}
                  placeholder="Enter token contract address"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                {isSearchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-4 pb-4">
              {isSearchLoading ? (
                <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : searchResult ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center">
                      {searchResult.mediaContent?.previewImage?.small ? (
                        <Image
                          src={searchResult.mediaContent.previewImage.small}
                          alt={searchResult.symbol}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full mr-3"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/api/placeholder/32/32";
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {searchResult.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {searchResult.symbol}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center text-sm font-medium ${
                      parseFloat(searchResult.marketCapDelta24h || "0") > 0 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {parseFloat(searchResult.marketCapDelta24h || "0") > 0 ? (
                        <ArrowUp size={14} className="mr-1" />
                      ) : (
                        <ArrowDown size={14} className="mr-1" />
                      )}
                      {formatPercentChange(searchResult.marketCapDelta24h)}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Market Cap</div>
                        <div className="text-sm font-medium">
                          {formatMarketCap(searchResult.marketCap)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Vol (24h)</div>
                        <div className="text-sm font-medium">
                          {formatMarketCap(searchResult.volume24h)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Holders</div>
                        <div className="text-sm font-medium">
                          {searchResult.uniqueHolders?.toLocaleString() || "N/A"}
                        </div>
                      </div>
                    </div>
                    {searchResult.description && searchResult.description.trim() !== "" && (
                      <div className="mt-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
                        {searchResult.description.length > 100
                          ? `${searchResult.description.substring(0, 100)}...`
                          : searchResult.description}
                      </div>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => {
                          viewTokenDetails(searchResult.address);
                          setIsSearchModalOpen(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        <Info size={14} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ) : searchAddress && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    <Search size={24} className="mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">No token found with this address</p>
                  <p className="text-xs text-gray-400 mt-1">Please check the address and try again</p>
                </div>
              )}
            </div>
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
                  const percentChange = parseFloat(
                    coin.marketCapDelta24h || "0",
                  );
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
                            isPositive ? "text-purple-600" : "text-red-600"
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
                            className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors text-xxs"
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
    </div>
  );
};

export default ZoraCoinsTracker;
