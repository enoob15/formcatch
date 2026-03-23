import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormCatch — Form Backend in 30 Seconds",
  description:
    "Point your HTML form at FormCatch. Submissions go straight to your inbox. No backend, no database, no signup required.",
  openGraph: {
    title: "FormCatch — Form Backend in 30 Seconds",
    description: "Point your HTML form at FormCatch. Submissions emailed to you instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
