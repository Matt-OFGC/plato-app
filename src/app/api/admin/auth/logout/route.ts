import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/admin-auth";

export async function POST() {
  await destroyAdminSession();
  return NextResponse.json({ success: true });
}

export async function GET() {
  await destroyAdminSession();
  return NextResponse.redirect("/system-admin/auth");
}

