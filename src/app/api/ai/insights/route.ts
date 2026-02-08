import { NextResponse } from "next/server";
import { getUsers, getRecentGiftsCount } from "@/lib/store";
import { generateInsights } from "@/lib/ai-agent";

export async function GET() {
  try {
    const users = getUsers();
    const recentGifts = getRecentGiftsCount();
    const insights = generateInsights(users, recentGifts);
    return NextResponse.json(insights);
  } catch {
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
