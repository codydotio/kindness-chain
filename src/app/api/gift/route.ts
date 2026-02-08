import { NextResponse } from "next/server";
import { createGift, getUserStats, registerUser, getUser } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { fromUserId, fromDisplayName, toUserId, amount, note, txHash } =
      await request.json();

    if (!fromUserId || !toUserId || !amount || !note) {
      return NextResponse.json(
        { error: "fromUserId, toUserId, amount, and note are required" },
        { status: 400 }
      );
    }

    // Auto-register sender if not found (handles Vercel serverless cold starts)
    if (!getUser(fromUserId)) {
      registerUser(fromUserId, fromDisplayName || "Human");
    }

    const result = createGift(fromUserId, toUserId, amount, note, txHash);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const stats = getUserStats(fromUserId);
    return NextResponse.json({ gift: result, stats });
  } catch {
    return NextResponse.json(
      { error: "Failed to create gift" },
      { status: 500 }
    );
  }
}
