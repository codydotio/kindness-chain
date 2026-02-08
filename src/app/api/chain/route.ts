import { NextResponse } from "next/server";
import { getChainData } from "@/lib/store";

export async function GET() {
  try {
    const chain = getChainData();
    return NextResponse.json(chain);
  } catch {
    return NextResponse.json(
      { error: "Failed to get chain data" },
      { status: 500 }
    );
  }
}
