import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendFormEmail(
  to: string,
  fields: Record<string, string>,
  meta: { referer?: string; formId: string }
) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@formcatch.dev";
  const subject = `New form submission${meta.referer ? ` from ${new URL(meta.referer).hostname}` : ""}`;

  // Build a nice HTML email
  const rows = Object.entries(fields)
    .filter(([k]) => !k.startsWith("_"))
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;text-transform:capitalize">${k.replace(/[_-]/g, " ")}</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${escapeHtml(v)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:-apple-system,system-ui,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0f172a;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:18px">📬 New Form Submission</h2>
        <p style="margin:4px 0 0;opacity:0.7;font-size:13px">${meta.referer || "Direct submission"}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:0">${rows}</table>
      <p style="color:#9ca3af;font-size:12px;margin-top:16px;padding:0 4px">
        Delivered by <a href="https://formcatch.dev" style="color:#6366f1">FormCatch</a> · Form ID: ${meta.formId.slice(0, 8)}…
      </p>
    </div>
  `;

  const text = Object.entries(fields)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  await getTransporter().sendMail({ from, to, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
