import { NextResponse } from "next/server";
import { backSpark, getUserStats, registerUser, getUser } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { sparkId, backerId, displayName, amount, note, txHash } = await request.json();

    // Auto-register on cold start
    if (!getUser(backerId)) {
      registerUser(backerId, displayName || "Human");
    }

    const result = backSpark(sparkId, backerId, amount, note, txHash);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const stats = getUserStats(backerId);
    return NextResponse.json({ backing: result, stats });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
