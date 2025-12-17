import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "List delivery notes placeholder" });
}

export async function POST() {
  return NextResponse.json({ ok: true, message: "Create delivery note placeholder" });
}
