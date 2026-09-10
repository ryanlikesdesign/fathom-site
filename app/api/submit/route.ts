import { NextResponse } from "next/server";
import { Resend } from "resend";
import { validateSubmission, type FormType } from "@/lib/validation";

export const runtime = "nodejs";

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

  const from = process.env.FROM_EMAIL ?? "Fathom <support@fathomvision.app>";
  const subject = `Fathom feedback${body.category ? `: ${body.category}` : ""}`;
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
