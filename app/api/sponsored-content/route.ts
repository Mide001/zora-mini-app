import { Redis } from "@upstash/redis";
import { type SendNotificationRequest } from "@farcaster/frame-sdk";

const redis = Redis.fromEnv();
const appUrl = process.env.NEXT_PUBLIC_URL || "";

// Function to store sponsored post request in Redis
async function storeSponsoredRequest({
  targetFid,
  requesterFid,
  content,
  amount,
  requesterUsername,
}: {
  targetFid: string;
  requesterFid: string;
  content: string;
  amount: string;
  requesterUsername: string;
}) {
  try {
    const timestamp = Date.now();
    const requestId = crypto.randomUUID();

    // Store the request with a unique ID
    const requestKey = `zora-minikit:sponsored-request:${requestId}`;
    const requestData = {
      requestId,
      targetFid,
      requesterFid,
      content,
      amount,
      requesterUsername,
      timestamp,
      status: "pending",
    };

    await redis.set(requestKey, requestData);

    // Add to target user's sponsored requests list
    const targetRequestsKey = `zora-minikit:user:${targetFid}:sponsored-requests`;
    await redis.lpush(targetRequestsKey, requestId);

    // Add to requester's sent requests list
    const requesterRequestsKey = `zora-minikit:user:${requesterFid}:sent-requests`;
    await redis.lpush(requesterRequestsKey, requestId);

    return requestId;
  } catch (error) {
    console.error("Error storing sponsored request:", error);
    throw error;
  }
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetFid, content, amount, requesterUsername } = body;

    if (!targetFid || !content || !amount || !requesterUsername) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get requester's FID from the request headers
    const requesterFid = request.headers.get("X-Farcaster-FID");
    if (!requesterFid) {
      return Response.json(
        { error: "Requester FID is required" },
        { status: 400 },
      );
    }

    // Store the sponsored request in Redis
    const requestId = await storeSponsoredRequest({
      targetFid,
      requesterFid,
      content,
      amount,
      requesterUsername,
    });

    // Get target user's notification details from Redis
    const userKey = `zora-minikit:user:${targetFid}`;
    const userData = await redis.get(userKey);

    if (!userData) {
      return Response.json({ error: "Target user not found" }, { status: 404 });
    }

    const { token, url } = userData as { token: string; url: string };

    // Send notification
    const notificationSent = await sendDirectNotification({
      token,
      url,
      title: "New Sponsored Post Request",
      body: `${requesterUsername} wants to sponsor a post from you for ${amount} USDC`,
    });

    if (!notificationSent) {
      return Response.json(
        { error: "Failed to send notification" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      message: "Sponsored post request sent successfully",
      data: {
        requestId,
        targetFid,
        content,
        amount,
        requesterUsername,
      },
    });
  } catch (error) {
    console.error("Error processing sponsored content request:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}
