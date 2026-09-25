import { NextResponse } from "next/server";
import { Resend } from "resend";
import { validateSubmission, type FormType } from "@/lib/validation";
import { SITE_NAME } from "@/lib/site-meta";

export const runtime = "nodejs";

const DEFAULT_SENDER = "support@fathomvision.app";

/**
 * The address FROM_EMAIL names, with or without a display name
 * ("fathom <a@b.co>" or "a@b.co"). Only the address is read: the name a
 * person sees is always SITE_NAME, lowercase, so an env value set before
 * the rename ("Fathom <…>") can't bring the capital back.
 */
function senderAddress(env: string | undefined): string {
  const raw = (env ?? "").replace(/[\r\n]/g, "").trim();
  const bracketed = /<([^<>\s@]+@[^<>\s@]+)>$/.exec(raw)?.[1];
  if (bracketed) return bracketed;
  return /^[^<>\s@]+@[^<>\s@]+$/.test(raw) ? raw : DEFAULT_SENDER;
}

interface Payload {
  formType: FormType;
  name?: string;
  email?: string;
  category?: string;
  message?: string;
  company?: string; // honeypot; real users never fill this
  renderedAt?: number; // when the form was drawn (ms epoch), sent by the client
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot. A filled field is not proof by itself: browser autofill can
  // write into it too. A bot submits within a beat of the page loading (or
  // never bothers to send renderedAt); a person takes longer than 1.5s to
  // write a message. Automated: pretend success, send nothing. Otherwise
  // note it and let the submission through to validation.
  if (body.company && body.company.trim() !== "") {
    const elapsed = typeof body.renderedAt === "number" ? Date.now() - body.renderedAt : null;
    const looksAutomated = elapsed === null || elapsed < 1500;
    if (looksAutomated) {
      console.warn("submit: honeypot hit, dropped", { elapsed });
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.warn("submit: honeypot filled after a human-paced delay, letting through", { elapsed });
  }

  const result = validateSubmission(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  const to = process.env.CONTACT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey) {
    return NextResponse.json({ ok: false, error: "Server not configured." }, { status: 500 });
  }

  // The sender's display name is the brand, lowercase like everywhere a
  // person reads it; FROM_EMAIL supplies only the address.
  const from = `${SITE_NAME} <${senderAddress(process.env.FROM_EMAIL)}>`;
  const subject = `${SITE_NAME} feedback${body.category ? `: ${body.category}` : ""}`;
  const text = [
    `Category: ${body.category ?? "General"}`,
    `Name: ${body.name ?? "(none)"}`,
    `Email: ${body.email ?? "(none)"}`,
    "",
    body.message ?? "",
  ].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: body.email?.replace(/[\r\n]/g, "").trim() || undefined,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not send. Try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
