import { NextResponse } from "next/server";
import { getSparks, getFeed, getChainData } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "sparks";

  if (type === "sparks") {
    return NextResponse.json({ sparks: getSparks("all") });
  }
  if (type === "feed") {
    return NextResponse.json({ feed: getFeed() });
  }
  if (type === "chain") {
    return NextResponse.json({ chain: getChainData() });
  }

  return NextResponse.json({ sparks: getSparks("all") });
}
