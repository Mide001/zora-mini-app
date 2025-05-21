import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("FID API called");
  console.log("Request URL:", request.url);
  
  try {
    // Get username from query params
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    
    console.log("Username from params:", username);

    if (!username) {
      console.log("No username provided");
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const farcasterUrl = `https://api.farcaster.xyz/v2/user-by-username?username=${username}`;
    console.log("Fetching from Farcaster API:", farcasterUrl);
    
    // Fetch FID from Farcaster API
    const response = await fetch(farcasterUrl, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      cache: 'no-store'
    });

    console.log("Farcaster API response status:", response.status);
    console.log("Farcaster API response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error("Farcaster API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: `Farcaster API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Farcaster API response data:", JSON.stringify(data, null, 2));

    if (!data.result?.user?.fid) {
      console.log("No FID found in response");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const result = {
      fid: data.result.user.fid,
      username: data.result.user.username,
      displayName: data.result.user.displayName,
    };
    
    console.log("Returning result:", result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in FID API:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch FID", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
