import { NextRequest, NextResponse } from "next/server";
import { decryptEmail } from "@/lib/crypto";
import { sendFormEmail } from "@/lib/mail";

// Rate limit: simple in-memory (per-form, 10 submissions/min)
const hits = new Map<string, number[]>();

function rateOk(formId: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const max = 10;
  const times = (hits.get(formId) || []).filter((t) => now - t < window);
  if (times.length >= max) return false;
  times.push(now);
  hits.set(formId, times);
  return true;
}

async function handleSubmission(
  req: NextRequest,
  formId: string
): Promise<NextResponse> {
  // Rate limit
  if (!rateOk(formId)) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait." },
      { status: 429 }
    );
  }

  // Decrypt target email
  let email: string;
  try {
    email = decryptEmail(formId);
  } catch {
    return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
  }

  // Parse fields from form data or JSON
  let fields: Record<string, string> = {};
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    fields = await req.json();
  } else if (
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  ) {
    const fd = await req.formData();
    fd.forEach((val, key) => {
      if (typeof val === "string") fields[key] = val;
    });
  } else {
    // Try URL search params as fallback
    const url = new URL(req.url);
    url.searchParams.forEach((val, key) => {
      fields[key] = val;
    });
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json(
      { error: "No form fields received" },
      { status: 400 }
    );
  }

  // Check for honeypot (_gotcha field)
  if (fields._gotcha) {
    // Bot detected — pretend success
    return handleRedirect(fields, formId);
  }

  // Send email
  try {
    await sendFormEmail(email, fields, {
      referer: req.headers.get("referer") || undefined,
      formId,
    });
  } catch (err) {
    console.error("Email send failed:", err);
    return NextResponse.json(
      { error: "Failed to deliver submission" },
      { status: 500 }
    );
  }

  return handleRedirect(fields, formId);
}

function handleRedirect(
  fields: Record<string, string>,
  formId: string
): NextResponse {
  const redirect = fields._redirect || fields._next;
  if (redirect) {
    return NextResponse.redirect(redirect, 303);
  }

  // Default: redirect to our thank you page
  const baseUrl = (process.env.NEXT_PUBLIC_URL || "https://formcatch.dev").trim();
  return NextResponse.redirect(`${baseUrl}/success`, 303);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  return handleSubmission(req, formId);
}

// Also handle GET for simple form actions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;
  return handleSubmission(req, formId);
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
