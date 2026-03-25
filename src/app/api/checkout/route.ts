import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, getAppUrl, getProPriceId } from "@/lib/stripe";

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

  if (plan !== "pro") {
    return NextResponse.json({ error: "Unsupported plan" }, { status: 400 });
  }

  try {
    const priceId = await getProPriceId();
    const baseUrl = getAppUrl(req.nextUrl.origin);
    const session = await createCheckoutSession({
      baseUrl,
      email,
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

    return NextResponse.json(
      { error: "Unable to create Stripe checkout session" },
      { status: 500 },
    );
  }
}
