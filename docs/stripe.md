# Stripe Setup

FormCatch uses server-side Stripe Checkout sessions. The browser never needs the Stripe secret key or a publishable key for the current flow.

## Required environment variables

Set these in Vercel for every environment that should accept payments:

```bash
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY preview
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET preview
vercel env add STRIPE_PRO_PRICE_ID production
vercel env add STRIPE_PRO_PRICE_ID preview
vercel env add STRIPE_TEAM_PRICE_ID production
vercel env add STRIPE_TEAM_PRICE_ID preview
vercel env add NEXT_PUBLIC_URL production
vercel env add NEXT_PUBLIC_URL preview
```

Local development should use `.env.local` copied from `.env.local.example`.

## Stripe dashboard setup

1. Create a monthly recurring price for `FormCatch Pro` at `$5.00` USD and copy its `price_...` id into `STRIPE_PRO_PRICE_ID`.
2. Create a monthly recurring price for `FormCatch Team` at `$15.00` USD and copy its `price_...` id into `STRIPE_TEAM_PRICE_ID`.
3. Create a webhook endpoint pointing to `https://YOUR_DOMAIN/api/webhooks/stripe`.
4. Subscribe the webhook to `checkout.session.completed`.
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Optional lookup-key fallback

If you prefer not to store price ids, FormCatch can discover active prices by Stripe lookup key:

- `formcatch-pro-monthly`
- `formcatch-team-monthly`

This is useful if you recreate prices between environments, but explicit price ids are the safer production choice.

## Verification

Run the local integration test after configuring env vars:

```bash
npm run test:stripe
```

The test starts FormCatch locally, stubs Stripe with a local HTTP server, creates checkout sessions for both paid plans, verifies the Free tier stays outside Stripe, and validates webhook signature handling.
