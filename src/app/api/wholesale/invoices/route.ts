import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Wholesale invoices list placeholder" });
}

export async function POST() {
  return NextResponse.json({ ok: true, message: "Create wholesale invoice placeholder" });
}
