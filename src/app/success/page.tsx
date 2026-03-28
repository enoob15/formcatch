import {
  getCheckoutSession,
  getPlanDisplayName,
  isStripePlan,
} from "@/lib/stripe";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  let upgradedPlanName: string | null = null;

  if (sessionId) {
    try {
      const session = await getCheckoutSession(sessionId);
      const plan = session.metadata?.plan ?? "";

      if (
        session.mode === "subscription" &&
        session.status === "complete" &&
        isStripePlan(plan)
      ) {
        upgradedPlanName = getPlanDisplayName(plan);
      }
    } catch (error) {
      console.error("Unable to verify Stripe checkout session:", error);
    }
  }

  const isPaidUpgrade = Boolean(upgradedPlanName);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{isPaidUpgrade ? "🎉" : "✅"}</div>
        <h1 className="text-3xl font-bold mb-4">
          {isPaidUpgrade ? `Welcome to ${upgradedPlanName}!` : "Submission Received!"}
        </h1>
        <p className="text-slate-400 mb-8">
          {isPaidUpgrade
            ? "Your subscription is active. You now have unlimited form submissions."
            : "Your message has been delivered. You should hear back soon."}
        </p>
        <a
          href={isPaidUpgrade ? "/setup" : "/"}
          className="inline-block px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          {isPaidUpgrade ? "Create your form" : "← Back to FormCatch"}
        </a>
      </div>
    </main>
  );
}
