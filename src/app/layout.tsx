import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormCatch - Form Backend in 10 Seconds",
  description:
    "Drop your email, get an endpoint, and send HTML form submissions straight to your inbox. No account, no database, no monthly fee to start.",
  openGraph: {
    title: "FormCatch - Form Backend in 10 Seconds",
    description: "Email-first form endpoints for static sites. No account, no database, no setup drag.",
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
