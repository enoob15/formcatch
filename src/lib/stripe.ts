import { createHmac, timingSafeEqual } from "crypto";

const PRO_PRICE_LOOKUP_KEY = "formcatch-pro-monthly";
const STRIPE_API_BASE = "https://api.stripe.com/v1";
const WEBHOOK_TOLERANCE_SECONDS = 300;

type StripeListResponse<T> = {
  data: T[];
};

type StripePrice = {
  id: string;
};

type StripeProduct = {
  id: string;
};

type StripeCheckoutSession = {
  id: string;
  url?: string;
};

export type StripeWebhookSession = {
  customer?: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
  customer_email?: string | null;
  id: string;
  subscription?: string | null;
};

export type StripeWebhookEvent = {
  data: {
    object: StripeWebhookSession;
  };
  type: string;
};

function getSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return secretKey;
}

async function stripeFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Stripe API request failed: ${response.status} ${errorBody}`);
  }

  return (await response.json()) as T;
}

export async function getProPriceId() {
  const configuredPriceId = process.env.STRIPE_PRICE_ID?.trim();

  if (configuredPriceId) {
    return configuredPriceId;
  }

  const existingPrices = await stripeFetch<StripeListResponse<StripePrice>>(
    `/prices?active=true&limit=1&lookup_keys[0]=${PRO_PRICE_LOOKUP_KEY}`,
  );

  const existingPrice = existingPrices.data[0];

  if (existingPrice) {
    return existingPrice.id;
  }

  const product = await stripeFetch<StripeProduct>("/products", {
    body: new URLSearchParams({
      description: "Unlimited form submissions for FormCatch.",
      name: "FormCatch Pro",
    }),
    method: "POST",
  });

  const price = await stripeFetch<StripePrice>("/prices", {
    body: new URLSearchParams({
      currency: "usd",
      lookup_key: PRO_PRICE_LOOKUP_KEY,
      nickname: "FormCatch Pro Monthly",
      product: product.id,
      "recurring[interval]": "month",
      unit_amount: "500",
    }),
    method: "POST",
  });

  return price.id;
}

export async function createCheckoutSession({
  baseUrl,
  email,
  priceId,
}: {
  baseUrl: string;
  email: string;
  priceId: string;
}) {
  return stripeFetch<StripeCheckoutSession>("/checkout/sessions", {
    body: new URLSearchParams({
      cancel_url: `${baseUrl}/`,
      customer_email: email,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[email]": email,
      "metadata[plan]": "pro",
      mode: "subscription",
      "subscription_data[metadata][email]": email,
      "subscription_data[metadata][plan]": "pro",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    }),
    method: "POST",
  });
}

export function getAppUrl(origin?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function verifyStripeWebhookSignature({
  payload,
  secret,
  signatureHeader,
}: {
  payload: string;
  secret: string;
  signatureHeader: string;
}) {
  const signatureParts = signatureHeader.split(",").reduce<Record<string, string>>(
    (acc, part) => {
      const [key, value] = part.split("=", 2);

      if (key && value) {
        acc[key] = value;
      }

      return acc;
    },
    {},
  );

  const timestamp = signatureParts.t;
  const signature = signatureParts.v1;

  if (!timestamp || !signature) {
    throw new Error("Stripe signature header is incomplete");
  }

  const timestampAge = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));

  if (!Number.isFinite(timestampAge) || timestampAge > WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error("Stripe webhook timestamp is outside the allowed tolerance");
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new Error("Stripe webhook signature does not match");
  }

  return JSON.parse(payload) as StripeWebhookEvent;
}
