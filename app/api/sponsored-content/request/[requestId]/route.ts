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
  status: 'pending' | 'accepted' | 'rejected' | 'posted';
}

export async function GET(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Fetch the request details from Redis
    const requestKey = `zora-minikit:sponsored-request:${requestId}`;
    const requestData = await redis.get(requestKey) as SponsoredRequest | null;

    if (!requestData) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(requestData);
  } catch (error) {
    console.error("Error fetching sponsored request:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsored request" },
      { status: 500 }
    );
  }
} 