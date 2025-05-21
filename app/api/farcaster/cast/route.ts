import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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

    // Fetch user's latest cast from Warpcast API
    const response = await fetch(
      `https://api.warpcast.com/v2/user-casts?fid=${fid}&limit=1`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch cast");
    }

    const data = await response.json();
    const latestCast = data.result?.casts?.[0] || null;

    return NextResponse.json({ cast: latestCast });
  } catch (error) {
    console.error("Error fetching cast:", error);
    return NextResponse.json(
      { error: "Failed to fetch cast" },
      { status: 500 }
    );
  }
} 