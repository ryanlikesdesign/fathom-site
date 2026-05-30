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
  company?: string; // honeypot — real users never fill this
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: pretend success, send nothing.
  if (body.company && body.company.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
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

  const from = process.env.FROM_EMAIL ?? "Fathom <onboarding@resend.dev>";
  const isFeedback = body.formType === "feedback";
  const subject = isFeedback
    ? `Fathom feedback${body.category ? ` — ${body.category}` : ""}`
    : "Fathom early access request";
  const text = isFeedback
    ? [
        `Category: ${body.category ?? "General"}`,
        `Name: ${body.name ?? "(none)"}`,
        `Email: ${body.email ?? "(none)"}`,
        "",
        body.message ?? "",
      ].join("\n")
    : [`New early access request`, `Name: ${body.name ?? "(none)"}`, `Email: ${body.email}`].join("\n");

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
