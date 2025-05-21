import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

interface Cast {
  recast?: boolean;
  text: string;
  timestamp: number;
  parentSource?: {
    type: string;
    url: string;
  };
  channel?: {
    key: string;
    name: string;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    console.log('Test endpoint called with FID:', fid);

    if (!fid) {
      console.log('Missing FID parameter');
      return NextResponse.json(
        { error: "FID is required" },
        { status: 400 }
      );
    }

    // Fetch user's latest casts from Warpcast API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      console.log('Making request to Warpcast API:', `https://api.warpcast.com/v2/casts?fid=${fid}&limit=3`);
      const response = await fetch(
        `https://api.warpcast.com/v2/casts?fid=${fid}&limit=3`,
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Warpcast API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`Failed to fetch cast: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Warpcast API response:', JSON.stringify(data, null, 2));
      
      // Validate the response structure
      if (!data.result?.casts || !Array.isArray(data.result.casts)) {
        console.error('Invalid response format:', JSON.stringify(data, null, 2));
        throw new Error(`Invalid response format from Warpcast API: ${JSON.stringify(data)}`);
      }

      // Process the last 3 casts
      const casts = data.result.casts.map((cast: Cast) => {
        try {
          return {
            text: cast.text,
            timestamp: new Date(cast.timestamp).toISOString(),
            isRecast: Boolean(cast.recast),
            isPinned: Boolean(
              cast.channel?.key || 
              (cast.parentSource?.type === "url" && cast.parentSource?.url.includes("warpcast.com/~/channel"))
            ),
            metadata: {
              channel: cast.channel,
              parentSource: cast.parentSource,
              recast: cast.recast
            }
          };
        } catch (error) {
          console.error('Error processing cast:', cast, error);
          throw new Error(`Failed to process cast: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      return NextResponse.json({
        success: true,
        casts
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 5 seconds');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch cast",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 