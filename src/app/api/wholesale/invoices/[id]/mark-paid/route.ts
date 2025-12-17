import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, message: "Invoice marked paid placeholder" });
}
