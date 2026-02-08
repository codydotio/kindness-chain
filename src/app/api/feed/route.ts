import { NextResponse } from "next/server";
import { getFeed, getAllUsers } from "@/lib/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type"); // "feed" or "users"

    if (type === "users") {
      const users = getAllUsers();
      return NextResponse.json({ users });
    }

    const feed = getFeed(limit);
    return NextResponse.json({ feed });
  } catch {
    return NextResponse.json(
      { error: "Failed to get feed" },
      { status: 500 }
    );
  }
}
