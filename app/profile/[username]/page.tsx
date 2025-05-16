"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Globe, Send } from "lucide-react";
import Link from "next/link";
import { getProfile } from "@zoralabs/coins-sdk";

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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sponsorAmount, setSponsorAmount] = useState<string>("");
  const [sponsorContent, setSponsorContent] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    console.log("Params:", params);
    if (params.username) {
      console.log("Fetching profile for username:", params.username);
      fetchUserProfile(params.username);
    } else {
      console.log("No username provided");
      setError("No username provided");
      setLoading(false);
    }
  }, [params.username]);

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

  const handleCreateSponsoredPost = async () => {
    if (!sponsorAmount || isNaN(Number(sponsorAmount))) {
      alert("Please enter a valid amount");
      return;
    }
    if (!sponsorContent.trim()) {
      alert("Please enter the content for your sponsored post");
      return;
    }

    setIsCreating(true);
    try {
      // TODO: Implement sponsored post creation logic
      console.log("Creating sponsored post:", {
        amount: sponsorAmount,
        content: sponsorContent,
      });
      // Reset form after successful creation
      setSponsorAmount("");
      setSponsorContent("");
    } catch (err) {
      console.error("Failed to create sponsored post:", err);
      alert("Failed to create sponsored post. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

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
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
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
              <div className="w-20 h-20 rounded-full bg-gray-100"></div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-medium text-gray-900">
              {userProfile.displayName || "N/A"}
            </h1>
            <div className="text-sm text-gray-500">
              @{userProfile.handle || "N/A"}
            </div>

            {userProfile.website && (
              <div className="mt-2">
                <Link
                  href={`https://${userProfile.website}`}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <Globe size={14} className="mr-1" />
                  {userProfile.website}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="text-sm text-gray-600 leading-relaxed">
          {userProfile.bio || "No bio available"}
        </div>

        {/* Join Date */}
        <div className="text-sm">
          <span className="text-gray-500">Joined</span>
          <div className="mt-1 text-gray-900">
            {userProfile.joinedAt
              ? new Date(userProfile.joinedAt).toLocaleDateString()
              : "N/A"}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="text-sm">
            <span className="text-gray-500">Followers</span>
            <div className="mt-1 font-medium text-gray-900">
              {userProfile.followerCount?.toLocaleString() || "N/A"}
            </div>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Following</span>
            <div className="mt-1 font-medium text-gray-900">
              {userProfile.followingCount?.toLocaleString() || "N/A"}
            </div>
          </div>
        </div>

        {/* Social Accounts */}
        {userProfile.socialAccounts && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-sm">
              <span className="text-gray-500">Social Accounts</span>
              <div className="mt-2 space-y-2">
                {userProfile.socialAccounts.instagram && (
                  <div className="text-gray-900">
                    Instagram:{" "}
                    {userProfile.socialAccounts.instagram.displayName || "N/A"}
                  </div>
                )}
                {userProfile.socialAccounts.twitter && (
                  <div className="text-gray-900">
                    Twitter:{" "}
                    {userProfile.socialAccounts.twitter.displayName || "N/A"}
                  </div>
                )}
                {userProfile.socialAccounts.tiktok && (
                  <div className="text-gray-900">
                    TikTok:{" "}
                    {userProfile.socialAccounts.tiktok.displayName || "N/A"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sponsored Post Section */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-sm">
            <span className="text-gray-500">Request Sponsored Content</span>
            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  Want this creator to post specific content? Make an offer in
                  USDC and specify what you'd like them to post. The creator
                  will review your request and can accept or decline it.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Request
                    </label>
                    <textarea
                      value={sponsorContent}
                      onChange={(e) => setSponsorContent(e.target.value)}
                      placeholder="Describe what you'd like the creator to post..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Offer (USDC)
                    </label>
                    <input
                      type="number"
                      value={sponsorAmount}
                      onChange={(e) => setSponsorAmount(e.target.value)}
                      placeholder="Enter amount in USDC (minimum 1 USDC)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      step="0.01"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum offer: 1 USDC
                    </p>
                  </div>
                  <button
                    onClick={handleCreateSponsoredPost}
                    disabled={
                      isCreating ||
                      !sponsorAmount ||
                      !sponsorContent.trim() ||
                      Number(sponsorAmount) < 1
                    }
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? (
                      "Creating..."
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
