# FormCatch 📬

**Form backend in 30 seconds.** Point any HTML form at FormCatch. Submissions get emailed to you instantly.

No signup. No database. No backend code. Just HTML.

## How It Works

1. Enter your email → get an encrypted endpoint
2. Set your form's `action` to that endpoint
3. Submissions arrive in your inbox as beautifully formatted emails

## Features

- **Zero config** — email in, endpoint out
- **Email encryption** — your email is encrypted in the form ID, never exposed
- **Spam protection** — built-in honeypot field + rate limiting
- **Custom redirects** — add `_redirect` field for custom thank-you pages
- **CORS enabled** — works from any domain
- **Open source** — MIT licensed

## Usage

```html
<form action="https://formcatch.dev/api/f/YOUR_FORM_ID" method="POST">
  <input type="text" name="name" placeholder="Name" required>
  <input type="email" name="email" placeholder="Email" required>
  <textarea name="message" placeholder="Message" required></textarea>
  <!-- Honeypot (hidden from users, catches bots) -->
  <input type="text" name="_gotcha" style="display:none">
  <button type="submit">Send</button>
</form>
```

## Special Fields

| Field | Purpose |
|-------|---------|
| `_gotcha` | Honeypot — hide with CSS, bots fill it, humans don't |
| `_redirect` | URL to redirect to after submission |
| `_next` | Alias for `_redirect` |

## Self-Hosting

```bash
git clone https://github.com/enoob15/formcatch.git
cd formcatch
cp .env.local.example .env.local  # Configure your SMTP
npm install
npm run build
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FORMCATCH_SECRET` | Yes | Encryption key for form IDs |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (default: 465) |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_FROM` | No | From address (default: SMTP_USER) |
| `NEXT_PUBLIC_URL` | Yes | Public URL of your deployment |

## Architecture

FormCatch is **completely stateless**. No database needed.

The "form ID" is actually an AES-256-GCM encrypted version of the target email address. When a form submission arrives, we decrypt the form ID to get the email, then send the formatted submission. Simple, secure, scalable.

## License

MIT
