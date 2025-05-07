import { Redis } from "@upstash/redis";
import { setUserNotificationDetails } from "@/lib/notification";
import { type SendNotificationRequest } from "@farcaster/frame-sdk";

const redis = Redis.fromEnv();

interface MarketCapAlertPreference {
  enabled: boolean;
  token?: string;
  url?: string;
  tokenAddress: string;
  tokenName: string;
  marketCapTarget: string;
}

const appUrl = process.env.NEXT_PUBLIC_URL || "";

function getMarketCapAlertKey(fid: number, tokenAddress: string): string {
  return `marketcap-alert${fid}:${tokenAddress}`;
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
  const fid = request.headers.get("X-Farcaster-FID");

  if (!fid) {
    return Response.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    const { enabled, token, url, tokenAddress, tokenName, marketCapTarget } =
      await request.json();

    if (!tokenAddress) {
      return Response.json(
        { error: "Token address is required" },
        { status: 400 },
      );
    }

    if (typeof enabled !== "boolean") {
      return Response.json(
        {
          error: "enabled must be a boolean",
        },
        { status: 400 },
      );
    }

    if (enabled && !marketCapTarget) {
      return Response.json(
        { error: "Marketcap Target is required when enabling alerts" },
        { status: 400 },
      );
    }

    const preference: MarketCapAlertPreference = {
      enabled,
      tokenAddress,
      tokenName,
      marketCapTarget,
    };

    if (enabled && token && url) {
      preference.token = token;
      preference.url = url;

      await setUserNotificationDetails(parseInt(fid), { token, url });
    }

    await redis.set(
      getMarketCapAlertKey(parseInt(fid), tokenAddress),
      preference,
    );

    let notificationSent = false;

    if (preference.token && preference.url) {
      notificationSent = await sendDirectNotification({
        token: preference.token,
        url: preference.url,
        title: "Zora Miniapp Alert",
        body: enabled
          ? `$${tokenName} alert has been set`
          : `$${tokenName} alert has been disabled`,
      });
      if (notificationSent) {
        console.log(`Notification sent using preference token for FID ${fid}`);
      } else {
        console.log(
          `Failed to send notification with preference token for FID ${fid}`,
        );
      }
    }
    return Response.json({ success: true, preference });
  } catch (error) {
    console.error("Error updating basename alert preferences: ", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const fid = request.headers.get("X-Farcaster-FID");

  if (!fid) {
    return Response.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    const { tokenAddress } = await request.json();

    if (!tokenAddress) {
      return Response.json(
        { error: "Token address is required" },
        { status: 400 },
      );
    }

    const currentAlert = await redis.get<MarketCapAlertPreference>(
      getMarketCapAlertKey(parseInt(fid), tokenAddress),
    );

    if (currentAlert?.token && currentAlert?.url) {
      const notificationSent = await sendDirectNotification({
        token: currentAlert.token,
        url: currentAlert.url,
        title: "Zora Miniapp Alert",
        body: `$${currentAlert.tokenName} alert has been disabled`,
      });

      if (notificationSent) {
        console.log(`Notification sent using preference token for FID ${fid}`);
      } else {
        console.log(
          `Failed to send notification with preference token for FID ${fid}`,
        );
      }
    }

    await redis.del(getMarketCapAlertKey(parseInt(fid), tokenAddress));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting market cap alert: ", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const fid = request.headers.get("X-Farcaster-FID");

  if (!fid) {
    return Response.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    const keys = await redis.keys(`marketcap-alert${fid}:*`);

    const alerts = await Promise.all(
      keys.map(async (key) => {
        const alert = await redis.get<MarketCapAlertPreference>(key);
        return alert;
      }),
    );

    const enabledAlerts = alerts.filter(
      (alert): alert is MarketCapAlertPreference =>
        alert !== null && alert.enabled,
    );

    return Response.json({ alerts: enabledAlerts });
  } catch (error) {
    console.error("Error fetching alerts: ", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
