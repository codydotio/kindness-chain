import { NextResponse } from "next/server";
import { registerUser, getUserStats } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { alienId, displayName } = await request.json();
    const user = registerUser(alienId, displayName || "Human");
    const stats = getUserStats(user.id);
    return NextResponse.json({ user, stats });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
