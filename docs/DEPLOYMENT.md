# Deploying fathomvision.app

## 1. Push to GitHub
- Already done: `git remote add origin git@github.com:ryanlikesdesign/fathom-site.git`
- Future pushes: `git push`

## 2. Import in Vercel
- New Project → import the `fathom-site` repo (framework auto-detected: Next.js).
- Add Environment Variables (Production + Preview):
  - `RESEND_API_KEY` — from resend.com
  - `CONTACT_EMAIL` — `support@fathomvision.app`
  - `FROM_EMAIL` — `support@fathomvision.app` (requires domain verified in Resend first — see step 3). Only the address is read: the route always sends as `fathom`, lowercase, so a value with a display name (`Fathom <…>`) still sends from `fathom <…>`.
- Deploy.

## 3. Resend
- Create an account at resend.com and generate an API key.
- Verify `fathomvision.app` in Resend (Domains → Add domain → follow the DNS records).
  - Until verified, use `FROM_EMAIL=onboarding@resend.dev` as a temporary fallback — but verify the domain before launch so mail comes from your own address.
- Once verified, set `FROM_EMAIL=support@fathomvision.app` in Vercel.
- All form submissions (early access, feedback) send to `CONTACT_EMAIL` (`support@fathomvision.app`).
- The `replyTo` header is set to the submitter's email, so replying in your email client goes straight back to them.

## 4. Domain (GoDaddy → Vercel)
- In Vercel → Project → Settings → Domains, add `fathomvision.app` and `www.fathomvision.app`.
- Vercel shows the exact records. In GoDaddy → DNS:
  - Apex `fathomvision.app`: A record → `76.76.21.21`
  - `www`: CNAME → `cname.vercel-dns.com`
- `.app` is HTTPS-only (HSTS preload). Vercel provisions the TLS certificate automatically once DNS resolves.
- `www.fathomvision.app` is the primary host; the apex redirects to it. `SITE_URL` in `lib/site-meta.ts` names www, so every canonical, `og:url`, JSON-LD url, sitemap entry and preview image points at the host that answers without a redirect. If the primary ever flips, change `SITE_URL` in the same change.

## 5. Verify
- Visit https://www.fathomvision.app — loads over HTTPS, and https://fathomvision.app redirects to it.
- Submit the feedback form and confirm the email arrives at `support@fathomvision.app`.
- Submit the early access form and confirm the email arrives with the role/notes fields included.
