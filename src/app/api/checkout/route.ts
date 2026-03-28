import { NextRequest, NextResponse } from "next/server";
import {
  createCheckoutSession,
  getAppUrl,
  getPriceIdForPlan,
  isStripePlan,
} from "@/lib/stripe";

export const runtime = "nodejs";

type CheckoutBody = {
  email?: unknown;
  plan?: unknown;
};

export async function POST(req: NextRequest) {
  let body: CheckoutBody;

  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const plan = typeof body.plan === "string" ? body.plan : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  if (!isStripePlan(plan)) {
    return NextResponse.json({ error: "Unsupported paid plan" }, { status: 400 });
  }

  try {
    const priceId = await getPriceIdForPlan(plan);
    const baseUrl = getAppUrl(req.nextUrl.origin);
    const session = await createCheckoutSession({
      baseUrl,
      email,
      plan,
      priceId,
    });

    if (!session.url) {
      throw new Error("Stripe session URL missing");
    }

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const message =
      error instanceof Error &&
      (error.message.startsWith("Missing STRIPE_") ||
        error.message.startsWith("Missing Stripe price"))
        ? error.message
        : "Unable to create Stripe checkout session";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
