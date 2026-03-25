type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const isProUpgrade = Boolean(sessionId);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{isProUpgrade ? "🎉" : "✅"}</div>
        <h1 className="text-3xl font-bold mb-4">
          {isProUpgrade ? "Welcome to FormCatch Pro!" : "Submission Received!"}
        </h1>
        <p className="text-slate-400 mb-8">
          {isProUpgrade
            ? "Your subscription is active. You now have unlimited form submissions."
            : "Your message has been delivered. You should hear back soon."}
        </p>
        <a
          href={isProUpgrade ? "/setup" : "/"}
          className="inline-block px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          {isProUpgrade ? "Create your form" : "← Back to FormCatch"}
        </a>
      </div>
    </main>
  );
}
