import { NextRequest, NextResponse } from "next/server";
import {
  getCoinsTopGainers,
  getCoinsNew,
  getCoinsTopVolume24h,
  getCoin,
} from "@zoralabs/coins-sdk";
import { base } from "viem/chains";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "top-gainers";
    const count = parseInt(searchParams.get("count") || "10", 10);
    const after = searchParams.get("after") || undefined;
    const address = searchParams.get("address") || undefined;

    let response;

    switch (type) {
      case "top-gainers":
        response = await getCoinsTopGainers({
          count,
          after,
        });
        break;

      case "recent":
        response = await getCoinsNew({
          count,
          after,
        });
        break;

      case "top-volume":
        response = await getCoinsTopVolume24h({
          count,
          after,
        });
        break;

      case "token-detail":
        if (!address) {
          return NextResponse.json(
            { error: "Token address is required for token detail" },
            { status: 400 },
          );
        }

        response = await getCoin({
          address,
          chain: base.id,
        });

        break;

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 },
        );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching data from Zora:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch data",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Token address is required" },
        { status: 400 },
      );
    }

    const response = await getCoin({
      address,
      chain: base.id, 
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
