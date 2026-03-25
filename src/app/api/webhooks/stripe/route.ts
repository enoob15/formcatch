import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhookSignature } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const payload = await req.text();

  try {
    const event = verifyStripeWebhookSignature({
      payload,
      secret: webhookSecret,
      signatureHeader: signature,
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("Stripe subscription recorded", {
        customerEmail:
          session.customer_details?.email ?? session.customer_email ?? null,
        customerId: session.customer ?? null,
        sessionId: session.id,
        subscriptionId: session.subscription ?? null,
      });
    }
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);

    return NextResponse.json(
      { error: "Invalid Stripe webhook signature" },
      { status: 400 },
    );
  }

  return NextResponse.json({ received: true });
}
