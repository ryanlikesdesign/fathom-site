# Deploying fathomvision.app

## 1. Push to GitHub
- Already done: `git remote add origin git@github.com:ryanlikesdesign/fathom-site.git`
- Future pushes: `git push`

## 2. Import in Vercel
- New Project → import the `fathom-site` repo (framework auto-detected: Next.js).
- Add Environment Variables (Production + Preview):
  - `RESEND_API_KEY` — from resend.com
  - `CONTACT_EMAIL` — `support@fathomvision.app`
  - `FROM_EMAIL` — `Fathom <support@fathomvision.app>` (requires domain verified in Resend first — see step 3)
- Deploy.

## 3. Resend
- Create an account at resend.com and generate an API key.
- Verify `fathomvision.app` in Resend (Domains → Add domain → follow the DNS records).
  - Until verified, use `FROM_EMAIL=Fathom <onboarding@resend.dev>` as a temporary fallback — but verify the domain before launch so mail comes from your own address.
- Once verified, set `FROM_EMAIL=Fathom <support@fathomvision.app>` in Vercel.
- All form submissions (early access, feedback) send to `CONTACT_EMAIL` (`support@fathomvision.app`).
- The `replyTo` header is set to the submitter's email, so replying in your email client goes straight back to them.

## 4. Domain (GoDaddy → Vercel)
- In Vercel → Project → Settings → Domains, add `fathomvision.app` and `www.fathomvision.app`.
- Vercel shows the exact records. In GoDaddy → DNS:
  - Apex `fathomvision.app`: A record → `76.76.21.21`
  - `www`: CNAME → `cname.vercel-dns.com`
- `.app` is HTTPS-only (HSTS preload). Vercel provisions the TLS certificate automatically once DNS resolves.
- Set `www` → apex redirect (or vice versa) in Vercel domain settings.

## 5. Verify
- Visit https://fathomvision.app — loads over HTTPS.
- Submit the feedback form and confirm the email arrives at `support@fathomvision.app`.
- Submit the early access form and confirm the email arrives with the role/notes fields included.
