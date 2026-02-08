import { NextResponse } from "next/server";
import { getAIInsights } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getAIInsights());
}
