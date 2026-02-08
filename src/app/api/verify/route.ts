import { NextResponse } from "next/server";
import { registerUser, getUserStats } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { alienId, displayName } = await request.json();

    if (!alienId || !displayName) {
      return NextResponse.json(
        { error: "alienId and displayName are required" },
        { status: 400 }
      );
    }

    const user = registerUser(alienId, displayName);
    const stats = getUserStats(user.id);

    return NextResponse.json({ user, stats });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify user" },
      { status: 500 }
    );
  }
}
