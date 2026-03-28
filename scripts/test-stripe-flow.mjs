import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const stripeBaseUrl = "https://stripe.test/v1";

function getBuiltModulePath(relativePath) {
  return resolve(process.cwd(), ".next/server", relativePath);
}

async function importBuiltModule(relativePath) {
  const absolutePath = getBuiltModulePath(relativePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Missing build artifact at ${absolutePath}. Run npm run build first.`);
  }

  return import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}`);
}

async function main() {
  process.env.FORMCATCH_SECRET = "12345678901234567890123456789012";
  process.env.NEXT_PUBLIC_URL = "https://formcatch.test";
  process.env.STRIPE_API_BASE = stripeBaseUrl;
  process.env.STRIPE_SECRET_KEY = "sk_test_local";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_local";
  delete process.env.STRIPE_PRO_PRICE_ID;
  delete process.env.STRIPE_TEAM_PRICE_ID;

  const pricingSource = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
  const successPageSource = readFileSync(
    resolve(process.cwd(), "src/app/success/page.tsx"),
    "utf8",
  );

  assert.match(pricingSource, /price:\s*"\$0"/);
  assert.match(pricingSource, /price:\s*"\$5"/);
  assert.match(pricingSource, /price:\s*"\$15"/);
  assert.match(pricingSource, /Get Started - Free/);
  assert.match(pricingSource, /Get Started - Pro/);
  assert.match(pricingSource, /Get Started - Team/);
  assert.match(successPageSource, /getCheckoutSession/);
  assert.match(successPageSource, /session\.status === "complete"/);

  const stripeSessions = [];
  const lookupKeyToPriceId = {
    "formcatch-pro-monthly": "price_pro_test",
    "formcatch-team-monthly": "price_team_test",
  };
  const originalFetch = global.fetch;

  global.fetch = async (input, init) => {
    const requestUrl =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;
    const method =
      init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET");
    const url = new URL(requestUrl);

    if (!url.href.startsWith(stripeBaseUrl)) {
      if (!originalFetch) {
        throw new Error(`Unexpected fetch call to ${url.href}`);
      }

      return originalFetch(input, init);
    }

    if (method === "GET" && url.pathname === "/v1/prices") {
      const lookupKey = url.searchParams.get("lookup_keys[0]");
      const priceId = lookupKey ? lookupKeyToPriceId[lookupKey] : undefined;

      return Response.json({ data: priceId ? [{ id: priceId }] : [] });
    }

    if (method === "POST" && url.pathname === "/v1/checkout/sessions") {
      const body = init?.body;
      const form =
        body instanceof URLSearchParams
          ? body
          : new URLSearchParams(typeof body === "string" ? body : "");
      const sessionId = `cs_test_${stripeSessions.length + 1}`;
      const session = {
        customerEmail: form.get("customer_email"),
        id: sessionId,
        plan: form.get("metadata[plan]"),
        price: form.get("line_items[0][price]"),
        subscriptionPlan: form.get("subscription_data[metadata][plan]"),
        successUrl: form.get("success_url"),
        url: `https://checkout.stripe.test/${sessionId}`,
      };

      stripeSessions.push(session);
      return Response.json({ id: session.id, url: session.url });
    }

    if (method === "GET" && url.pathname.startsWith("/v1/checkout/sessions/")) {
      const sessionId = url.pathname.split("/").pop();
      const session = stripeSessions.find((entry) => entry.id === sessionId);

      if (!session) {
        return Response.json({ error: "Unknown session" }, { status: 404 });
      }

      return Response.json({
        id: session.id,
        metadata: {
          plan: session.plan,
        },
        mode: "subscription",
        payment_status: "paid",
        status: "complete",
        url: session.url,
      });
    }

    throw new Error(`Unhandled Stripe mock request: ${method} ${url.href}`);
  };

  try {
    const [{ NextRequest }, checkoutRouteModule, webhookRouteModule] = await Promise.all([
      import("next/server.js"),
      importBuiltModule("app/api/checkout/route.js"),
      importBuiltModule("app/api/webhooks/stripe/route.js"),
    ]);
    const checkoutRoute = checkoutRouteModule.default.routeModule.userland;
    const webhookRoute = webhookRouteModule.default.routeModule.userland;

    for (const [plan, priceId] of [
      ["pro", "price_pro_test"],
      ["team", "price_team_test"],
    ]) {
      const response = await checkoutRoute.POST(
        new NextRequest("https://formcatch.test/api/checkout", {
          body: JSON.stringify({
            email: `${plan}@example.com`,
            plan,
          }),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        }),
      );
      const data = await response.json();

      assert.equal(response.status, 200);
      assert.equal(data.checkoutUrl, `https://checkout.stripe.test/${data.sessionId}`);
      assert.ok(data.sessionId);

      const recordedSession = stripeSessions.find((session) => session.id === data.sessionId);

      assert.ok(recordedSession);
      assert.equal(recordedSession.customerEmail, `${plan}@example.com`);
      assert.equal(recordedSession.plan, plan);
      assert.equal(recordedSession.subscriptionPlan, plan);
      assert.equal(recordedSession.price, priceId);
      assert.match(recordedSession.successUrl ?? "", /session_id=\{CHECKOUT_SESSION_ID\}/);
    }

    const invalidPlanResponse = await checkoutRoute.POST(
      new NextRequest("https://formcatch.test/api/checkout", {
        body: JSON.stringify({
          email: "free@example.com",
          plan: "free",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }),
    );

    assert.equal(invalidPlanResponse.status, 400);
    assert.deepEqual(await invalidPlanResponse.json(), {
      error: "Unsupported paid plan",
    });

    const webhookPayload = JSON.stringify({
      data: {
        object: {
          customer: "cus_test_123",
          customer_email: "pro@example.com",
          id: "cs_test_1",
          subscription: "sub_test_123",
        },
      },
      type: "checkout.session.completed",
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
      .update(`${timestamp}.${webhookPayload}`, "utf8")
      .digest("hex");
    const webhookResponse = await webhookRoute.POST(
      new NextRequest("https://formcatch.test/api/webhooks/stripe", {
        body: webhookPayload,
        headers: {
          "content-type": "application/json",
          "stripe-signature": `t=${timestamp},v1=${signature}`,
        },
        method: "POST",
      }),
    );

    assert.equal(webhookResponse.status, 200);
    assert.deepEqual(await webhookResponse.json(), { received: true });

    console.log("Stripe checkout flow verified for Free, Pro, and Team pricing.");
  } finally {
    global.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
