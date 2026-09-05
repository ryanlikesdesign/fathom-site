import { endSession, passwordMatches, startSession } from "@/lib/promoAuth";

export const dynamic = "force-dynamic";

// One shared password guards a pool of live redeemable codes, so a wrong guess
// costs something. Per-instance and best-effort — serverless means several
// instances — but it turns "unlimited guesses" into "slow guesses".
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return Response.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let body: { password?: unknown; rep?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const rep = (typeof body.rep === "string" ? body.rep : "").trim().slice(0, 120);

  if (!passwordMatches(password)) {
    return Response.json(
      { error: "That password isn't right. Please check with the Fathom team and try again." },
      { status: 401 },
    );
  }

  await startSession(rep);
  return Response.json({ rep });
}

export async function DELETE() {
  await endSession();
  return Response.json({ ok: true });
}
