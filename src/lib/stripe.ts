import { createHmac, timingSafeEqual } from "crypto";

const WEBHOOK_TOLERANCE_SECONDS = 300;
const DEFAULT_STRIPE_API_BASE = "https://api.stripe.com/v1";

export const STRIPE_PLANS = ["pro", "team"] as const;

export type StripePlan = (typeof STRIPE_PLANS)[number];

const STRIPE_PLAN_CONFIG: Record<
  StripePlan,
  {
    displayName: string;
    lookupKey: string;
    priceEnvVar: string;
  }
> = {
  pro: {
    displayName: "FormCatch Pro",
    lookupKey: "formcatch-pro-monthly",
    priceEnvVar: "STRIPE_PRO_PRICE_ID",
  },
  team: {
    displayName: "FormCatch Team",
    lookupKey: "formcatch-team-monthly",
    priceEnvVar: "STRIPE_TEAM_PRICE_ID",
  },
};

type StripeListResponse<T> = {
  data: T[];
};

type StripePrice = {
  id: string;
};

type StripeCheckoutSession = {
  id: string;
  metadata?: {
    plan?: string;
  };
  mode?: string;
  payment_status?: string;
  status?: string | null;
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

function getStripeApiBase() {
  return (
    process.env.STRIPE_API_BASE?.trim().replace(/\/$/, "") ?? DEFAULT_STRIPE_API_BASE
  );
}

async function stripeFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getStripeApiBase()}${path}`, {
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

export function isStripePlan(value: string): value is StripePlan {
  return STRIPE_PLANS.includes(value as StripePlan);
}

function getConfiguredPriceId(plan: StripePlan) {
  const configuredPriceId = process.env[STRIPE_PLAN_CONFIG[plan].priceEnvVar]?.trim();

  if (configuredPriceId) {
    return configuredPriceId;
  }

  if (plan === "pro") {
    return process.env.STRIPE_PRICE_ID?.trim();
  }

  return undefined;
}

export async function getPriceIdForPlan(plan: StripePlan) {
  const configuredPriceId = getConfiguredPriceId(plan);

  if (configuredPriceId) {
    return configuredPriceId;
  }

  const { lookupKey, priceEnvVar } = STRIPE_PLAN_CONFIG[plan];
  const existingPrices = await stripeFetch<StripeListResponse<StripePrice>>(
    `/prices?active=true&limit=1&lookup_keys[0]=${lookupKey}`,
  );

  const existingPrice = existingPrices.data[0];

  if (existingPrice) {
    return existingPrice.id;
  }

  throw new Error(
    `Missing Stripe price for ${plan}. Set ${priceEnvVar} or create an active monthly price with lookup key ${lookupKey}.`,
  );
}

export async function createCheckoutSession({
  baseUrl,
  email,
  plan,
  priceId,
}: {
  baseUrl: string;
  email: string;
  plan: StripePlan;
  priceId: string;
}) {
  return stripeFetch<StripeCheckoutSession>("/checkout/sessions", {
    body: new URLSearchParams({
      cancel_url: `${baseUrl}/`,
      customer_email: email,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[email]": email,
      "metadata[plan]": plan,
      mode: "subscription",
      "subscription_data[metadata][email]": email,
      "subscription_data[metadata][plan]": plan,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    }),
    method: "POST",
  });
}

export async function getCheckoutSession(sessionId: string) {
  return stripeFetch<StripeCheckoutSession>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export function getPlanDisplayName(plan: StripePlan) {
  return STRIPE_PLAN_CONFIG[plan].displayName;
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
