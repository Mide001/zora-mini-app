"use client";

import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/frame-sdk";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface SponsoredRequest {
  requestId: string;
  targetFid: string;
  requesterFid: string;
  content: string;
  amount: string;
  requesterUsername: string;
  timestamp: number;
  status: "pending" | "accepted" | "rejected" | "posted";
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
    <p className="mt-4 text-gray-500 dark:text-gray-400">
      Loading your sponsored requests...
    </p>
  </div>
);

export default function SponsoredPage() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const router = useRouter();
  const [requests, setRequests] = useState<SponsoredRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [castingRequestId, setCastingRequestId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!fid) {
      router.push("/");
      return;
    }
    fetchSponsoredRequests();
  }, [fid]);

  const fetchSponsoredRequests = async () => {
    try {
      const response = await fetch(
        `/api/sponsored-content/requests?fid=${fid}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sponsored requests");
      }
      const data = await response.json();
      console.log("Fetched sponsored requests:", data.requests);

      // Make sure each request has a requestId
      const requestsWithIds = data.requests.map(
        (request: SponsoredRequest) => ({
          ...request,
          requestId:
            request.requestId ||
            `zora-minikit:sponsored-request:${request.targetFid}-${request.timestamp}`,
        }),
      );

      setRequests(requestsWithIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCast = async (content: string, requestId: string) => {
    try {
      setCastingRequestId(requestId);
      const castContent = `${content}\n\nSponsored Post`;
      
      // Open the compose window
      const results = await sdk.actions.composeCast({
        text: castContent,
        embeds: [],
      });

      // If we get here, the compose window was opened successfully
      console.log("Compose window opened successfully");

      // Ensure we have a valid FID
      if (!fid) {
        throw new Error("No FID available. Please connect your wallet first.");
      }

      // If we have a cast hash, update the status to 'posted'
      if (results?.cast?.hash) {
        // Update the request status to 'posted' since the cast was successful
        const updateResponse = await fetch("/api/sponsored-content/respond", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Farcaster-FID": String(fid),
          },
          body: JSON.stringify({
            requestId: requestId.replace("zora-minikit:sponsored-request:", ""), // Remove the prefix if it exists
            action: "posted",
            fid: String(fid), // Ensure fid is a string
            castHash: results.cast.hash,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error("Failed to update request:", errorData);
          throw new Error(errorData.error || "Failed to update request status");
        }

        const responseData = await updateResponse.json();
        console.log("Update response:", responseData);

        // Update the request status immediately
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.requestId === requestId
              ? {
                  ...request,
                  status: "posted",
                }
              : request
          )
        );

        // Show success message and clear it after 3 seconds
        setSuccessMessage(requestId);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }

    } catch (error) {
      console.error("Error in handleCast:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to open the cast window. Please try again.",
      );
    } finally {
      setCastingRequestId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-8"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </button>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-8"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </button>
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-8"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </button>

        <h1 className="text-lg font-medium text-center mb-12 text-gray-800 dark:text-gray-200">
          Sponsored Post
        </h1>

        {requests.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-300 text-base mb-2">
              No sponsored post requests yet
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              When someone requests a sponsored post from you, it will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div
                key={request.requestId}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4 w-full">
                  <div>
                    <h2 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                      Request from @{request.requesterUsername}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                      Amount: {request.amount} USDC
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(request.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                          : request.status === "posted"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            : request.status === "accepted"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                      }`}
                    >
                      {request.status}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {request.content}
                  </p>
                </div>

                {request.status === "pending" && (
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() =>
                        handleCast(request.content, request.requestId)
                      }
                      disabled={castingRequestId === request.requestId}
                      className={`bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                        castingRequestId === request.requestId
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {castingRequestId === request.requestId ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Casting...
                        </>
                      ) : (
                        "Cast Sponsored Post"
                      )}
                    </button>
                    {successMessage === request.requestId && (
                      <span className="text-sm text-green-600 dark:text-green-400 animate-fade-out">
                        Cast successful! 🎉
                      </span>
                    )}
                  </div>
                )}

                {request.status === "posted" && (
                  <div className="flex justify-end">
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Cast successful! 🎉
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
