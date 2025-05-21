import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("Username API called");
  console.log("Request URL:", request.url);
  
  try {
    // Get FID from query params
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");
    
    console.log("FID from params:", fid);

    if (!fid) {
      console.log("No FID provided");
      return NextResponse.json(
        { error: "FID is required" },
        { status: 400 }
      );
    }

    const farcasterUrl = `https://api.farcaster.xyz/v2/user?fid=${fid}`;
    console.log("Fetching from Farcaster API:", farcasterUrl);
    
    // Fetch username from Farcaster API
    const response = await fetch(farcasterUrl, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      cache: 'no-store'
    });

    console.log("Farcaster API response status:", response.status);
    
    if (!response.ok) {
      console.error("Farcaster API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: `Farcaster API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Farcaster API response data:", JSON.stringify(data, null, 2));

    if (!data.result?.user?.username) {
      console.log("No username found in response");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const result = {
      username: data.result.user.username,
      displayName: data.result.user.displayName,
      fid: data.result.user.fid,
    };
    
    console.log("Returning result:", result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in Username API:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch username", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 