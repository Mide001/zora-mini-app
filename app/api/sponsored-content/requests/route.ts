import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

interface SponsoredRequest {
  requestId: string;
  targetFid: string;
  requesterFid: string;
  content: string;
  amount: string;
  requesterUsername: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json(
        { error: "FID is required" },
        { status: 400 }
      );
    }

    // Get the list of request IDs for this user
    const requestsKey = `zora-minikit:user:${fid}:sponsored-requests`;
    const requestIds = await redis.lrange(requestsKey, 0, -1);

    if (!requestIds.length) {
      return NextResponse.json({ requests: [] });
    }

    // Fetch all request details
    const requests = await Promise.all(
      requestIds.map(async (requestId) => {
        const requestKey = `zora-minikit:sponsored-request:${requestId}`;
        const requestData = await redis.get(requestKey);
        return requestData as SponsoredRequest | null;
      })
    );

    // Filter out any null values and sort by timestamp (newest first)
    const validRequests = requests
      .filter((request): request is SponsoredRequest => request !== null)
      .sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ requests: validRequests });
  } catch (error) {
    console.error("Error fetching sponsored requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsored requests" },
      { status: 500 }
    );
  }
} 