/* eslint-disable react/no-unescaped-entities */
"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Globe, Send } from "lucide-react";
import Link from "next/link";
import { getProfile } from "@zoralabs/coins-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

interface ProfileData {
  data?: {
    profile?: {
      id: string;
      handle: string;
      username: string;
      displayName?: string;
      bio?: string;
      website?: string;
      joinedAt?: string;
      address?: string;
      followerCount?: number;
      followingCount?: number;
      avatar?: {
        small?: string;
        medium?: string;
        blurhash?: string;
      };
      linkedWallets?: {
        edges: Array<{
          node: {
            walletType: "PRIVY" | "EXTERNAL" | "SMART_WALLET";
            walletAddress: string;
          };
        }>;
      };
      publicWallet?: {
        walletAddress: string;
      };
      socialAccounts?: {
        instagram?: { displayName?: string } | null;
        tiktok?: { displayName?: string } | null;
        twitter?: { displayName?: string } | null;
      };
    };
  };
}

const ProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-20 h-20 rounded-full bg-gray-100"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-1/4"></div>
        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

const ProfilePage = () => {
  const params = useParams<{ username: string }>();
  const { context } = useMiniKit();
  const userFid = context?.user?.fid;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sponsorAmount, setSponsorAmount] = useState<string>("");
  const [sponsorContent, setSponsorContent] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [targetFid, setTargetFid] = useState<string | null>(null);
  const [targetUsername, setTargetUsername] = useState<string>("");
  const [isFetchingFid, setIsFetchingFid] = useState(false);
  const [fidError, setFidError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [requesterUsername, setRequesterUsername] = useState<string | null>(null);

  // Function to get username from FID
  const getUsernameFromFid = async (fid: string) => {
    try {
      const response = await fetch(`/api/farcaster/username?fid=${fid}`);
      if (response.ok) {
        const data = await response.json();
        return data.username;
      }
      return null;
    } catch (error) {
      console.error("Error fetching username:", error);
      return null;
    }
  };

  // Fetch requester's username when FID is available
  useEffect(() => {
    const fetchRequesterUsername = async () => {
      if (userFid) {
        const username = await getUsernameFromFid(userFid.toString());
        setRequesterUsername(username);
      }
    };
    fetchRequesterUsername();
  }, [userFid]);

  // Function to fetch target user's FID
  const fetchTargetFid = async (username: string) => {
    if (!username) return;

    setIsFetchingFid(true);
    setFidError(null);
    try {
      const response = await fetch(`/api/farcaster/fid?username=${username}`);
      if (!response.ok) {
        throw new Error("Failed to fetch FID");
      }
      const data = await response.json();
      if (data.fid) {
        setTargetFid(data.fid.toString());
        setFidError(null);
      } else {
        setTargetFid(null);
        setFidError("User not found");
      }
    } catch (err) {
      console.error("Error fetching FID:", err);
      setTargetFid(null);
      setFidError("Failed to fetch FID");
    } finally {
      setIsFetchingFid(false);
    }
  };

  const handleCreateSponsoredPost = async () => {
    if (!userFid) {
      setRequestStatus({
        type: "error",
        message: "Please connect your Farcaster account",
      });
      return;
    }
    if (!requesterUsername) {
      setRequestStatus({
        type: "error",
        message: "Could not fetch your username. Please try again.",
      });
      return;
    }
    if (!targetUsername) {
      setRequestStatus({
        type: "error",
        message: "Please enter a target username",
      });
      return;
    }
    if (!sponsorAmount || isNaN(Number(sponsorAmount))) {
      setRequestStatus({
        type: "error",
        message: "Please enter a valid amount",
      });
      return;
    }
    if (!sponsorContent.trim()) {
      setRequestStatus({
        type: "error",
        message: "Please enter the content for your sponsored post",
      });
      return;
    }

    setIsCreating(true);
    setRequestStatus({ type: null, message: "" });
    try {
      // First, fetch the target's FID
      const fidResponse = await fetch(
        `/api/farcaster/fid?username=${targetUsername}`,
      );
      if (!fidResponse.ok) {
        const errorData = await fidResponse.json();
        throw new Error(
          errorData.error || "Failed to fetch FID for the target user",
        );
      }
      const fidData = await fidResponse.json();

      if (!fidData.fid) {
        throw new Error("Target user not found");
      }

      // Then, send the notification through our API
      const notificationResponse = await fetch("/api/sponsored-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Farcaster-FID": userFid.toString(),
        },
        body: JSON.stringify({
          targetFid: fidData.fid,
          content: sponsorContent,
          amount: sponsorAmount,
          requesterUsername: requesterUsername,
        }),
      });

      if (!notificationResponse.ok) {
        const errorData = await notificationResponse.json();
        throw new Error(
          errorData.error || "Failed to send sponsored post request",
        );
      }

      const responseData = await notificationResponse.json();
      
      setRequestStatus({
        type: "success",
        message:
          responseData.message || "Sponsored post request sent successfully!",
      });

      // Reset form
      setSponsorAmount("");
      setSponsorContent("");
      setTargetUsername("");
      setTargetFid(null);
    } catch (err) {
      console.error("Failed to create sponsored post:", err);
      setRequestStatus({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to create sponsored post. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Add useEffect for auto-dismissing status messages
  useEffect(() => {
    if (requestStatus.type) {
      const timer = setTimeout(() => {
        setRequestStatus({ type: null, message: "" });
      }, 5000); // Dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [requestStatus]);

  useEffect(() => {
    console.log("Params:", params);
    if (params.username) {
      console.log("Fetching profile for username:", params.username);
      fetchUserProfile(params.username);
      fetchTargetFid(params.username);
    } else {
      console.log("No username provided");
      setError("No username provided");
      setLoading(false);
    }
  }, [params]);

  async function fetchUserProfile(username: string) {
    console.log("Starting fetchUserProfile for:", username);
    setLoading(true);
    try {
      console.log("Calling getProfile with username:", username);
      const response = await getProfile({
        identifier: username,
      });
      console.log("Raw API response:", response);

      if (response?.data?.profile) {
        console.log("Profile data found:", response.data.profile);
        setProfile(response);
      } else {
        console.log("No profile data in response");
        setError("Profile not found");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(
        `Failed to load profile: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    console.log("Rendering loading state");
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back
          </Link>
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    console.log("Rendering error state:", error);
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-sm text-gray-500 mb-4">{error}</div>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back
        </Link>
      </div>
    );
  }

  if (!profile?.data?.profile) {
    console.log("No profile data available");
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-sm text-gray-500 mb-4">Profile not found</div>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back
        </Link>
      </div>
    );
  }

  console.log("Rendering profile with data:", profile.data.profile);
  const userProfile = profile.data.profile;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back
        </Link>
      </div>

      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex items-start space-x-6">
          <div className="relative">
            {userProfile.avatar?.medium ? (
              <Image
                src={userProfile.avatar.medium}
                alt={userProfile.handle}
                width={80}
                height={80}
                className="rounded-full"
                unoptimized
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/api/placeholder/80/80";
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800"></div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
              {userProfile.displayName || "N/A"}
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{userProfile.handle || "N/A"}
            </div>

            {userProfile.website && (
              <div className="mt-2">
                <Link
                  href={`https://${userProfile.website}`}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
                >
                  <Globe size={14} className="mr-1" />
                  {userProfile.website}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {userProfile.bio || "No bio available"}
        </div>

        {/* Join Date */}
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Joined</span>
          <div className="mt-1 text-gray-900 dark:text-white">
            {userProfile.joinedAt
              ? new Date(userProfile.joinedAt).toLocaleDateString()
              : "N/A"}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Followers</span>
            <div className="mt-1 font-medium text-gray-900 dark:text-white">
              {userProfile.followerCount?.toLocaleString() || "N/A"}
            </div>
          </div>
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Following</span>
            <div className="mt-1 font-medium text-gray-900 dark:text-white">
              {userProfile.followingCount?.toLocaleString() || "N/A"}
            </div>
          </div>
        </div>

        {/* Social Accounts */}
        {userProfile.socialAccounts && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Social Accounts</span>
              <div className="mt-2 space-y-2">
                {userProfile.socialAccounts.instagram && (
                  <div className="text-gray-900 dark:text-white">
                    Instagram:{" "}
                    {userProfile.socialAccounts.instagram.displayName || "N/A"}
                  </div>
                )}
                {userProfile.socialAccounts.twitter && (
                  <div className="text-gray-900 dark:text-white">
                    Twitter:{" "}
                    {userProfile.socialAccounts.twitter.displayName || "N/A"}
                  </div>
                )}
                {userProfile.socialAccounts.tiktok && (
                  <div className="text-gray-900 dark:text-white">
                    TikTok:{" "}
                    {userProfile.socialAccounts.tiktok.displayName || "N/A"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sponsored Content Section */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Request Sponsored Content
          </h2>

          <div className="space-y-4">
            {!userFid ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Please connect your Farcaster account to request sponsored content</p>
              </div>
            ) : !requesterUsername ? (
              <div className="text-center py-4">
                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading your username...</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Requesting as: <span className="font-medium text-gray-900 dark:text-white">{requesterUsername}</span>
                  </p>
                </div>

                {/* Username Input with FID Verification */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Target Username
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      id="username"
                      value={targetUsername}
                      onChange={(e) => {
                        setTargetUsername(e.target.value);
                        setTargetFid(null);
                        setFidError(null);
                      }}
                      onBlur={() => fetchTargetFid(targetUsername)}
                      placeholder="Enter Farcaster username"
                      className={`flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        targetFid
                          ? "border-green-500"
                          : fidError
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-700"
                      }`}
                    />
                    {isFetchingFid && (
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                    )}
                    {targetFid && (
                      <div className="text-green-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  {fidError && (
                    <p className="mt-1 text-sm text-red-500">{fidError}</p>
                  )}
                  {targetFid && (
                    <p className="mt-1 text-sm text-green-500">
                      FID verified: {targetFid}
                    </p>
                  )}
                </div>

                {/* Content Input */}
                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Content
                  </label>
                  <textarea
                    id="content"
                    value={sponsorContent}
                    onChange={(e) => setSponsorContent(e.target.value)}
                    placeholder="Enter the content for your sponsored post"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={4}
                  />
                </div>

                {/* Amount Input */}
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={sponsorAmount}
                    onChange={(e) => setSponsorAmount(e.target.value)}
                    placeholder="Enter amount in USDC"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleCreateSponsoredPost}
                  disabled={isCreating || !targetFid}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                    isCreating || !targetFid
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  }`}
                >
                  {isCreating ? "Creating..." : "Create Sponsored Post"}
                </button>

                {requestStatus.type && (
                  <div
                    className={`block mt-2 text-sm p-2 rounded-md ${
                      requestStatus.type === "success"
                        ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {requestStatus.message}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
