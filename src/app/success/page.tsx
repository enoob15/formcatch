export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-4">Submission Received!</h1>
        <p className="text-slate-400 mb-8">
          Your message has been delivered. You should hear back soon.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          ← Back to FormCatch
        </a>
      </div>
    </main>
  );
}
