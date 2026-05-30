# Deploying fathomvision.app

## 1. Push to GitHub
- Create a new empty repo (no README) named `fathom-site` under your account.
- `git remote add origin git@github.com:<USERNAME>/fathom-site.git`
- `git push -u origin main`

## 2. Import in Vercel
- New Project → import the `fathom-site` repo (framework auto-detected: Next.js).
- Add Environment Variables (Production + Preview):
  - `RESEND_API_KEY` — from resend.com
  - `CONTACT_EMAIL` — the inbox that receives submissions
  - `FROM_EMAIL` — `Fathom <onboarding@resend.dev>` until your domain is verified in Resend
- Deploy.

## 3. Resend
- Create an account, add an API key, paste it into Vercel as `RESEND_API_KEY`.
- (Recommended) Verify `fathomvision.app` in Resend and set `FROM_EMAIL` to e.g. `Fathom <hello@fathomvision.app>` so mail isn't from a shared sandbox domain.

## 4. Domain (GoDaddy → Vercel)
- In Vercel → Project → Settings → Domains, add `fathomvision.app` and `www.fathomvision.app`.
- Vercel shows the exact records. In GoDaddy → DNS:
  - Apex `fathomvision.app`: A record → `76.76.21.21`
  - `www`: CNAME → `cname.vercel-dns.com`
- `.app` is HTTPS-only (HSTS preload). Vercel provisions the TLS certificate automatically once DNS resolves.
- Set `www` → apex redirect (or vice versa) in Vercel domain settings.

## 5. Verify
- Visit https://fathomvision.app — loads over HTTPS.
- Submit the feedback form and confirm the email arrives at `CONTACT_EMAIL`.
