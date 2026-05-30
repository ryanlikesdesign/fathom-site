"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { validateSubmission, type FormType } from "@/lib/validation";

const CATEGORIES = ["Bug", "Suggestion", "Accessibility", "General"];

export function ContactForm({ formType }: { formType: FormType }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const summaryRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      formType,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      category: String(fd.get("category") ?? ""),
      message: String(fd.get("message") ?? ""),
      company: String(fd.get("company") ?? ""), // honeypot
    };

    const v = validateSubmission(payload);
    if (!v.ok) {
      setErrors(v.errors);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad status");
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p role="status" className="text-lg">
        {formType === "feedback"
          ? "Got it — thank you. I read every message."
          : "You're on the list. I'll be in touch before launch."}
      </p>
    );
  }

  const errorList = Object.entries(errors);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-card)] border p-4">
          <p className="font-medium">Please fix the following:</p>
          <ul className="mt-2 list-disc pl-5">
            {errorList.map(([field, msg]) => (
              <li key={field}><a href={`#field-${field}`} className="underline">{msg}</a></li>
            ))}
          </ul>
        </div>
      )}

      {/* Honeypot: visually off-screen, aria-hidden so AT skips it entirely */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="field-name" className="block text-sm font-medium">Name <span className="text-[var(--text-muted)]">(optional)</span></label>
        <input id="field-name" name="name" type="text" autoComplete="name"
          className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-3 py-2" />
      </div>

      <div>
        <label htmlFor="field-email" className="block text-sm font-medium">
          Email{" "}
          {formType !== "early-access" && (
            <span className="text-[var(--text-muted)]">(optional)</span>
          )}
        </label>
        <input id="field-email" name="email" type="email" autoComplete="email"
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "err-email" : undefined}
          className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-3 py-2" />
        {errors.email && <p id="err-email" className="mt-1 text-sm">{errors.email}</p>}
      </div>

      {formType === "feedback" && (
        <>
          <div>
            <label htmlFor="field-category" className="block text-sm font-medium">Category</label>
            <select id="field-category" name="category" defaultValue="General"
              className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-3 py-2">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="field-message" className="block text-sm font-medium">Message</label>
            <textarea id="field-message" name="message" rows={6}
              aria-invalid={!!errors.message || undefined}
              aria-describedby={errors.message ? "err-message" : undefined}
              className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-3 py-2" />
            {errors.message && <p id="err-message" className="mt-1 text-sm">{errors.message}</p>}
          </div>
        </>
      )}

      {status === "error" && <p role="alert" className="text-sm">Something went wrong. Please try again.</p>}

      <Button type="submit" variant="primary" size="xl">
        {status === "sending" ? "Sending…" : formType === "feedback" ? "Send feedback" : "Request early access"}
      </Button>
    </form>
  );
}
