"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{
    endpoint: string;
    formId: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.endpoint) setResult(data);
    } finally {
      setLoading(false);
    }
  }

  function copySnippet() {
    if (!result) return;
    const snippet = `<form action="${result.endpoint}" method="POST">
  <input type="text" name="name" placeholder="Name" required>
  <input type="email" name="email" placeholder="Email" required>
  <textarea name="message" placeholder="Message" required></textarea>
  <input type="text" name="_gotcha" style="display:none">
  <button type="submit">Send</button>
</form>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-8">
            <span>📬</span> No signup · No database · Free forever
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Form backend
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              in 30 seconds
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-lg mx-auto">
            Point any HTML form at FormCatch. Submissions get emailed to you
            instantly. No backend code. No server. Just HTML.
          </p>

          {/* Create Form */}
          {!result ? (
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Creating..." : "Get Endpoint →"}
              </button>
            </form>
          ) : (
            <div className="max-w-xl mx-auto text-left">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <p className="text-sm text-slate-400 mb-2">Your form endpoint:</p>
                <code className="block text-indigo-400 text-sm break-all mb-4 bg-slate-900 p-3 rounded">
                  {result.endpoint}
                </code>

                <p className="text-sm text-slate-400 mb-2">Drop this HTML anywhere:</p>
                <pre className="bg-slate-900 p-4 rounded text-xs text-slate-300 overflow-x-auto mb-4">
{`<form action="${result.endpoint}" method="POST">
  <input type="text" name="name" placeholder="Name" required>
  <input type="email" name="email" placeholder="Email" required>
  <textarea name="message" placeholder="Message" required></textarea>
  <input type="text" name="_gotcha" style="display:none">
  <button type="submit">Send</button>
</form>`}
                </pre>

                <div className="flex gap-3">
                  <button
                    onClick={copySnippet}
                    className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors"
                  >
                    {copied ? "✓ Copied!" : "Copy Snippet"}
                  </button>
                  <button
                    onClick={() => { setResult(null); setEmail(""); }}
                    className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-12">
            Why FormCatch?
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Zero Config",
                desc: "Enter your email, get an endpoint. Paste into your HTML. Done.",
              },
              {
                icon: "🔒",
                title: "Email Encryption",
                desc: "Your email is encrypted in the form ID. Never exposed in your HTML source.",
              },
              {
                icon: "🤖",
                title: "Spam Protection",
                desc: "Built-in honeypot field and rate limiting. No CAPTCHAs needed.",
              },
              {
                icon: "📱",
                title: "Works Everywhere",
                desc: "Static sites, Webflow, WordPress, Notion, anywhere you can paste HTML.",
              },
              {
                icon: "🔄",
                title: "Custom Redirects",
                desc: "Add a _redirect field to send users to your own thank-you page.",
              },
              {
                icon: "💰",
                title: "Free Forever",
                desc: "Core features always free. Premium plans for teams and high volume.",
              },
            ].map((f) => (
              <div key={f.title} className="text-center sm:text-left">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="space-y-8">
            {[
              { step: "1", title: "Enter your email", desc: "We generate a unique encrypted endpoint." },
              { step: "2", title: "Paste the form HTML", desc: "Into any website, static page, or app." },
              { step: "3", title: "Get submissions in your inbox", desc: "Beautiful formatted emails with all field data." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>
          Built by{" "}
          <a href="https://github.com/enoob15" className="text-indigo-400 hover:text-indigo-300">
            Boone
          </a>
          {" · "}
          <a href="https://github.com/enoob15/formcatch" className="text-indigo-400 hover:text-indigo-300">
            Open Source
          </a>
        </p>
      </footer>
    </main>
  );
}
