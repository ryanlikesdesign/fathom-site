/* ================================================================
   Access control for the rep tools. SERVER ONLY.

   The old gate compared the password in the browser and shipped every
   code in the JS bundle, so the "lock" was decorative. Now the password
   is checked server-side and unlock issues a signed, httpOnly cookie;
   the codes never reach a client that hasn't presented it.

   This is a shared-password gate, not per-person accounts — enough to
   keep a valuable code pool off the open web, not an identity system.
   ================================================================ */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "fathom_promo_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export function promoPassword(): string {
  return (
    process.env.PROMO_PASSWORD ??
    // Kept so an existing Vercel deployment doesn't silently fall back to the
    // default the moment this ships. Prefer the non-public var.
    process.env.NEXT_PUBLIC_PROMO_PASSWORD ??
    "fathom-crew"
  );
}

function secret(): string {
  return process.env.PROMO_SESSION_SECRET ?? promoPassword();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function passwordMatches(attempt: string): boolean {
  return safeEqual(attempt.trim(), promoPassword());
}

function token(rep: string, expiresAt: number): string {
  const payload = `${expiresAt}.${Buffer.from(rep, "utf8").toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

/** Reads the signed cookie. Returns the rep name ("" if they skipped it), or null. */
export async function currentRep(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [expiresAt, repB64, sig] = parts;

  if (!safeEqual(sig, sign(`${expiresAt}.${repB64}`))) return null;
  if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) return null;

  try {
    return Buffer.from(repB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export async function startSession(rep: string): Promise<void> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  (await cookies()).set(COOKIE, token(rep, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** Guard for the rep-only route handlers. */
export async function requireRep(): Promise<
  { ok: true; rep: string } | { ok: false; response: Response }
> {
  const rep = await currentRep();
  if (rep === null) {
    return {
      ok: false,
      response: Response.json({ error: "Not unlocked." }, { status: 401 }),
    };
  }
  return { ok: true, rep };
}
