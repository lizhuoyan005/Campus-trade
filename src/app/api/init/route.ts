import { initDb, seedDb } from "@/lib/db";
import { NextResponse } from "next/server";
export async function GET() {
  try {
    initDb();
    seedDb();
    return NextResponse.json({ message: "Database initialized" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}