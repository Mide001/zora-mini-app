import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { type SendNotificationRequest } from "@farcaster/frame-sdk";

const redis = Redis.fromEnv();
const appUrl = process.env.NEXT_PUBLIC_URL || "";

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

async function sendDirectNotification({
  token,
  url,
  title,
  body,
}: {
  token: string;
  url: string;
  title: string;
  body: string;
}): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: crypto.randomUUID(),
        title,
        body,
        targetUrl: appUrl,
        tokens: [token],
      } satisfies SendNotificationRequest),
    });

    return response.status === 200;
  } catch (error) {
    console.error("Error sending direct notification:", error);
    return false;
  }
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    const { requestId, action, fid, castHash } = body;

    if (!requestId) {
      console.log('Missing requestId');
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    if (!action) {
      console.log('Missing action');
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    if (!fid) {
      console.log('Missing fid');
      return NextResponse.json(
        { error: "fid is required" },
        { status: 400 }
      );
    }

    // Construct the Redis key
    const key = `zora-minikit:sponsored-request:${requestId}`;
    console.log('Attempting to update Redis key:', key);

    // First check if the key exists
    const exists = await redis.exists(key);
    console.log('Key exists in Redis:', exists);

    const requestData = await redis.get(key) as SponsoredRequest | null;
    console.log('Retrieved data from Redis:', requestData);

    if (!requestData) {
      console.log('Request not found for key:', key);
      return NextResponse.json(
        { error: "Request not found", key },
        { status: 404 }
      );
    }

    // Log the FID comparison details
    console.log('FID comparison:', {
      requestTargetFid: requestData.targetFid,
      requestTargetFidType: typeof requestData.targetFid,
      userFid: fid,
      userFidType: typeof fid,
      areEqual: requestData.targetFid === fid,
      areEqualStrict: requestData.targetFid === String(fid)
    });

    // Verify the request belongs to the user
    if (String(requestData.targetFid) !== String(fid)) {
      console.log('Request does not belong to user:', { 
        requestFid: requestData.targetFid, 
        userFid: fid,
        requestFidType: typeof requestData.targetFid,
        userFidType: typeof fid
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    console.log('Current request data:', requestData);

    // Update the request status based on action
    const updatedRequest = {
      ...requestData,
      status: action === 'accept' ? 'posted' : action,
      ...(castHash && { castHash }) // Add castHash if provided
    };

    console.log('Updating request with new status:', updatedRequest);

    await redis.set(key, updatedRequest);
    console.log('Successfully updated Redis key:', key);

    return NextResponse.json({
      success: true,
      message: 'Request updated successfully',
      updatedStatus: updatedRequest.status,
      key
    });
  } catch (error) {
    console.error("Error updating request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
} 