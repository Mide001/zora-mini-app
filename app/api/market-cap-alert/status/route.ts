import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

function getMarketCapAlert(fid: number, tokenAddress: string): string {
  return `marketcap-alert${fid}:${tokenAddress}`;
}

export async function GET(request: Request) {
  const fid = request.headers.get("X-Farcaster-FID");
  if (!fid) {
    return Response.json(
      { enabled: false, error: "FID is required" },
      { status: 200 },
    );
  }

  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get("tokenAddress");
  if (!tokenAddress) {
    return Response.json(
      { enabled: false, error: "tokenAddress is required" },
      { status: 200 },
    );
  }

  try {
    const alertKey = getMarketCapAlert(parseInt(fid), tokenAddress);
    console.log(`Checking alert with key: ${alertKey}`);

    const alertData = await redis.get(alertKey);

    if (alertData) {
      console.log(`Alert found: ${JSON.stringify(alertData)}`);
      return Response.json(alertData);
    }

    console.log(`No alert found for key: ${alertKey}`);
    return Response.json({ enabled: false });
  } catch (error) {
    console.error("Error getting market cap alert: ", error);
    return Response.json({
      enabled: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(request: Request) {
  const fid = request.headers.get("X-Farcaster-FID");

  if (!fid) {
    return Response.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { tokenAddress } = body;

    if (!tokenAddress) {
      return Response.json(
        { error: "tokenAddress is required" },
        { status: 400 },
      );
    }

    const alertKey = getMarketCapAlert(parseInt(fid), tokenAddress);
    console.log(`Deleting alert with key: ${alertKey}`);

    await redis.del(alertKey);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting market cap alert: ", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
