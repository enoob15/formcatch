"use client";

import { useState } from "react";

type CreateResult = {
  endpoint: string;
  formId: string;
};

type CheckoutResult = {
  checkoutUrl?: string;
  error?: string;
  sessionId?: string;
};

type PaidPlan = "pro" | "team";

type PricingTier =
  | {
      ctaHref: string;
      ctaKind: "link";
      ctaLabel: string;
      description: string;
      detail: string;
      featured: boolean;
      features: string[];
      name: string;
      price: string;
    }
  | {
      ctaKind: "checkout";
      ctaLabel: string;
      description: string;
      detail: string;
      featured: boolean;
      features: string[];
      name: string;
      plan: PaidPlan;
      price: string;
    };

const steps = [
  {
    title: "Enter your email",
    body: "Drop in the inbox you want submissions sent to. No signup flow, no dashboard setup.",
  },
  {
    title: "Get your endpoint",
    body: "FormCatch instantly returns a private form action URL you can use anywhere.",
  },
  {
    title: "Paste into your form",
    body: "Point any HTML form at the endpoint and submissions land in your inbox.",
  },
];

const pricing: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    detail: "100 submissions / month",
    description: "For personal sites, quick launches, and side projects that need a real endpoint fast.",
    features: [
      "100 submissions / month",
      "Email delivery",
      "No account required",
      "Works with any HTML form",
    ],
    ctaHref: "/setup",
    ctaLabel: "Get Started - Free",
    ctaKind: "link",
    featured: false,
  },
  {
    name: "Pro",
    plan: "pro" as PaidPlan,
    price: "$5",
    detail: "per month",
    description: "For production forms that need more volume and automation without a bulky platform.",
    features: [
      "Unlimited submissions",
      "File uploads",
      "Webhooks",
      "Priority delivery",
    ],
    ctaLabel: "Get Started - Pro",
    ctaKind: "checkout",
    featured: true,
  },
  {
    name: "Team",
    plan: "team" as PaidPlan,
    price: "$15",
    detail: "per month",
    description: "For teams that need shared visibility, routing, and a cleaner operational view.",
    features: [
      "Multiple recipients",
      "Analytics",
      "Shared management",
      "Everything in Pro",
    ],
    ctaLabel: "Get Started - Team",
    ctaKind: "checkout",
    featured: false,
  },
];

const paidPlanContent: Record<PaidPlan, { name: string; priceLabel: string }> = {
  pro: {
    name: "FormCatch Pro",
    priceLabel: "$5/month",
  },
  team: {
    name: "FormCatch Team",
    priceLabel: "$15/month",
  },
};

const comparisons = [
  {
    label: "Setup",
    values: [
      "Email -> endpoint -> done",
      "Account + dashboard",
      "Account + dashboard",
      "Account + dashboard",
    ],
  },
  {
    label: "Account required",
    values: ["No", "Yes", "Yes", "Yes"],
  },
  {
    label: "Storage model",
    values: [
      "Stateless, inbox-first",
      "Stored submissions + dashboard",
      "Stored submissions + dashboard",
      "Stored submissions + dashboard",
    ],
  },
  {
    label: "Free tier",
    values: ["100 / month", "50 / month", "50 / month", "25 credits / month"],
  },
  {
    label: "Plan with webhooks",
    values: ["$5 / month", "Paid tiers", "$12.50 / month yearly", "$15.83 / month yearly"],
  },
  {
    label: "Best fit",
    values: [
      "Static sites that need speed",
      "Teams who want a full platform",
      "Lead capture ops and automations",
      "Form management with stored endpoints",
    ],
  },
];

function buildSnippet(endpoint: string) {
  return `<form action="${endpoint}" method="POST">
  <input type="text" name="name" placeholder="Jane Doe" required />
  <input type="email" name="email" placeholder="jane@company.com" required />
  <textarea name="message" placeholder="How can we help?" required></textarea>
  <input type="text" name="_gotcha" class="hidden" />
  <button type="submit">Send</button>
</form>`;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PaidPlan>("pro");
  const [result, setResult] = useState<CreateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedTarget, setCopiedTarget] = useState<"endpoint" | "snippet" | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCopiedTarget(null);

    try {
      const response = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as Partial<CreateResult> & { error?: string };

      if (!response.ok || !data.endpoint || !data.formId) {
        throw new Error(data.error || "Unable to create endpoint");
      }

      setResult({
        endpoint: data.endpoint,
        formId: data.formId,
      });
    } catch (caughtError) {
      setResult(null);
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to create endpoint",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyValue(target: "endpoint" | "snippet") {
    if (!result) return;

    const value = target === "endpoint" ? result.endpoint : buildSnippet(result.endpoint);
    await navigator.clipboard.writeText(value);
    setCopiedTarget(target);
    window.setTimeout(() => setCopiedTarget(null), 1800);
  }

  function openCheckoutModal(plan: PaidPlan) {
    setCheckoutError("");
    setCheckoutEmail(email);
    setCheckoutPlan(plan);
    setCheckoutOpen(true);
  }

  function closeCheckoutModal() {
    if (checkoutLoading) return;

    setCheckoutError("");
    setCheckoutOpen(false);
  }

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError("");
    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: checkoutEmail,
          plan: checkoutPlan,
        }),
      });

      const data = (await response.json()) as CheckoutResult;

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.assign(data.checkoutUrl);
    } catch (caughtError) {
      setCheckoutError(
        caughtError instanceof Error ? caughtError.message : "Unable to start checkout",
      );
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="absolute left-[8%] top-[24rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-[6%] h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_32%),linear-gradient(to_bottom,rgba(15,23,42,0.92),rgba(2,6,23,1))]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-12 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <a
            href="#top"
            className="inline-flex items-center gap-3 text-sm font-medium tracking-[0.22em] text-slate-200 uppercase"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-[0_0_40px_rgba(99,102,241,0.25)]">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
            </span>
            FormCatch
          </a>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#demo" className="transition hover:text-white">
              Live demo
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a
              href="https://github.com/enoob15/formcatch"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition hover:border-indigo-400/40 hover:bg-white/10"
            >
              GitHub
            </a>
          </nav>
        </header>

        <section id="top" className="grid gap-10 pb-20 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14 lg:pb-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs font-medium tracking-[0.2em] text-indigo-200 uppercase">
              Stateless form backend
            </div>

            <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Form backend in 10 seconds. No account. No database. Free.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Drop your email, get an endpoint, and ship contact forms without
              touching a backend. FormCatch is email-first, stateless, and fast
              enough to feel invisible.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#demo"
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
              >
                Generate an endpoint
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
              >
                See pricing
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["10 sec", "Average setup"],
                ["0", "Accounts required"],
                ["HTML", "Only integration surface"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl"
                >
                  <div className="text-2xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-sm text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] border border-indigo-400/15 bg-indigo-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/7 p-5 shadow-2xl shadow-slate-950/40 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-medium text-white">Ship in one paste</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Endpoint generated instantly. No project setup.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Live-ready
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span>Endpoint</span>
                    <span>POST</span>
                  </div>
                  <code className="mt-3 block break-all text-sm text-indigo-300">
                    https://formcatch.dev/api/f/enc_x7q1r2...
                  </code>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span>HTML</span>
                    <span>Copy / paste</span>
                  </div>
                  <pre className="mt-3 overflow-x-auto text-sm leading-6 text-slate-300">
                    <code>{`<form action="https://formcatch.dev/api/f/enc_x7q1r2..." method="POST">
  <input name="email" />
  <textarea name="message"></textarea>
  <button>Send</button>
</form>`}</code>
                  </pre>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/12 to-cyan-400/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Result
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                    <div className="text-sm font-medium text-white">New submission delivered</div>
                    <div className="mt-2 text-sm text-slate-400">
                      From: contact@brand.com
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Subject: Contact form submission
                    </div>
                    <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300">
                      "Looking for a backend that doesn&apos;t become a project."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-8 backdrop-blur-2xl sm:px-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-indigo-200">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                Three steps from static form to delivered email
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-400">
              FormCatch stays out of your way: one endpoint, one form action
              update, and your site can collect submissions without a database.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-slate-950/85"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-lg font-semibold text-indigo-200">
                  0{index + 1}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="demo" className="grid gap-8 py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-indigo-200">
              Live demo
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Generate your real endpoint right here
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-400">
              This form posts to the existing <code>/api/create</code> endpoint
              in this app. Enter an email and FormCatch will return a working
              action URL you can paste into any HTML form immediately.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/40 backdrop-blur-2xl sm:p-7">
            <form onSubmit={handleCreate} className="grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                Inbox email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-indigo-500 px-5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Generating endpoint..." : "Get my endpoint"}
              </button>
            </form>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {result ? (
              <div className="mt-6 grid gap-4">
                <div className="rounded-[1.5rem] border border-indigo-400/20 bg-indigo-500/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-100">
                        Endpoint ready
                      </p>
                      <code className="mt-2 block break-all text-sm text-indigo-200">
                        {result.endpoint}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyValue("endpoint")}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15"
                    >
                      {copiedTarget === "endpoint" ? "Copied" : "Copy endpoint"}
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/75 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Paste this into your site</p>
                      <p className="mt-1 text-sm text-slate-400">
                        The action is already wired to your generated form endpoint.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyValue("snippet")}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      {copiedTarget === "snippet" ? "Copied" : "Copy snippet"}
                    </button>
                  </div>

                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-300">
                    <code>{buildSnippet(result.endpoint)}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/50 p-5 text-sm leading-7 text-slate-400">
                Generated endpoint and copy-ready HTML snippet will appear here.
              </div>
            )}
          </div>
        </section>

        <section id="pricing" className="py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-indigo-200">
                Pricing
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                Simple enough to start free, serious enough to pay for
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-400">
              Clear plans, no platform sprawl. Upgrade only when you need more
              volume, uploads, routing, or team visibility.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {pricing.map((tier: PricingTier) => (
              <div
                key={tier.name}
                className={`rounded-[1.75rem] border p-6 backdrop-blur-2xl ${
                  tier.featured
                    ? "border-indigo-400/35 bg-gradient-to-b from-indigo-500/18 to-white/6 shadow-[0_24px_80px_rgba(99,102,241,0.18)]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{tier.description}</p>
                  </div>
                  {tier.featured ? (
                    <span className="rounded-full border border-indigo-300/25 bg-indigo-400/15 px-3 py-1 text-xs font-medium text-indigo-100">
                      Popular
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight text-white">
                    {tier.price}
                  </span>
                  <span className="pb-1 text-sm text-slate-400">{tier.detail}</span>
                </div>

                <div className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-slate-200">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-400/25 bg-indigo-500/10 text-indigo-200">
                        +
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  {tier.ctaKind === "checkout" ? (
                    <button
                      type="button"
                      onClick={() => openCheckoutModal(tier.plan)}
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-500 px-5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                      {tier.ctaLabel}
                    </button>
                  ) : (
                    <a
                      href={tier.ctaHref}
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                    >
                      {tier.ctaLabel}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="compare" className="py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-indigo-200">
                Comparison
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                Cheaper to adopt, simpler to keep
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              FormCatch is optimized for people who want an endpoint and inbox
              delivery, not another app to manage.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-6 py-4 font-medium text-slate-400">Category</th>
                    <th className="px-6 py-4 font-semibold text-white">FormCatch</th>
                    <th className="px-6 py-4 font-medium">Formspree</th>
                    <th className="px-6 py-4 font-medium">Basin</th>
                    <th className="px-6 py-4 font-medium">Getform</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, rowIndex) => (
                    <tr
                      key={row.label}
                      className={rowIndex % 2 === 0 ? "bg-slate-950/45" : "bg-slate-950/20"}
                    >
                      <td className="px-6 py-4 font-medium text-slate-400">{row.label}</td>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.label}-${value}`}
                          className={`px-6 py-4 align-top leading-7 ${
                            index === 0 ? "font-medium text-white" : "text-slate-300"
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs leading-6 text-slate-500">
            Competitor notes use publicly listed pricing and free-tier limits
            checked on March 23, 2026. Pricing pages change often.
          </p>
        </section>

        <footer className="border-t border-white/10 py-8 text-sm text-slate-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>FormCatch. Stateless form handling for the modern static web.</p>
            <a
              href="https://github.com/enoob15/formcatch"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-300 transition hover:text-indigo-200"
            >
              View on GitHub
            </a>
          </div>
        </footer>
      </div>

      {checkoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-indigo-200">
                  {paidPlanContent[checkoutPlan].name}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Start your {paidPlanContent[checkoutPlan].priceLabel} subscription
                </h3>
              </div>

              <button
                type="button"
                onClick={closeCheckoutModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10"
                aria-label="Close checkout modal"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              Enter the email you want attached to your subscription, then continue through
              Stripe Checkout.
            </p>

            <form onSubmit={handleCheckout} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                Email
                <input
                  type="email"
                  value={checkoutEmail}
                  onChange={(event) => setCheckoutEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  className="h-12 rounded-2xl border border-white/10 bg-slate-900 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-indigo-500 px-5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutLoading ? "Redirecting..." : "Continue to Stripe"}
              </button>
            </form>

            {checkoutError ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {checkoutError}
              </div>
            ) : null}

            <div className="mt-5 text-xs leading-6 text-slate-500">
              Hosted Stripe subscription checkout. Cancel any time.
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
