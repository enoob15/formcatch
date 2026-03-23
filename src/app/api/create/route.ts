import { NextRequest, NextResponse } from "next/server";
import { encryptEmail } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const formId = encryptEmail(email.toLowerCase().trim());
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://formcatch.dev";
  const endpoint = `${baseUrl}/api/f/${formId}`;

  return NextResponse.json({ formId, endpoint });
}
