"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { validateSubmission, type FormType } from "@/lib/validation";

const CATEGORIES = ["Bug", "Suggestion", "Accessibility", "General"];
const MESSAGE_MAX = 5000;
// The counter only appears once it is worth reading; a live region that
// updates on every keystroke from 5000 down is noise for VoiceOver.
const COUNTER_SHOWS_AT = 500;

// Every control shares one boundary: a visible edge (--field-border) on the
// raised surface so a field can be found at 200% zoom, a 44px floor, and the
// invalid state doubles the border in the accent so it is not carried by the
// error text alone.
const fieldInputClass =
  "mt-2 w-full min-h-11 rounded-[var(--radius-btn)] border border-[var(--field-border)] bg-[var(--bg-raised)] px-4 py-3.5 focus:border-[var(--accent-signal)] aria-invalid:border-2 aria-invalid:border-[var(--accent-signal)]";

function describedBy(...ids: (string | false | undefined)[]) {
  const list = ids.filter(Boolean);
  return list.length ? list.join(" ") : undefined;
}

export function ContactForm({ formType }: { formType: FormType }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [messageLength, setMessageLength] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  // When the form was drawn. Sent along so the server can tell a bot that
  // filled the honeypot instantly from a browser autofill that took its time.
  // Stamped in an effect (not during render) so the component stays pure.
  const mountedAtRef = useRef(0);
  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  // Focus the success card once it exists, so the confirmation is the next
  // thing a screen-reader user hears rather than an empty spot where the
  // form used to be.
  useEffect(() => {
    if (status !== "done") return;
    requestAnimationFrame(() => successRef.current?.focus());
  }, [status]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // A second Enter or click while the first request is in flight would
    // post twice; aria-disabled on the button does not stop a keyboard submit.
    if (status === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      formType,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      category: String(fd.get("category") ?? ""),
      message: String(fd.get("message") ?? ""),
      company: String(fd.get("ref_hint") ?? ""), // honeypot
      renderedAt: mountedAtRef.current,
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
      <div ref={successRef} tabIndex={-1} role="status" className="form-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m8 12 3 3 5-6" />
        </svg>
        <div>
          <p className="success-title">Got it. Thank you.</p>
          <p className="success-body">I read every message.</p>
        </div>
      </div>
    );
  }

  const errorList = Object.entries(errors);
  const sending = status === "sending";
  const remaining = MESSAGE_MAX - messageLength;
  const showCounter = remaining <= COUNTER_SHOWS_AT;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-card)] border-2 border-[var(--accent-signal)] bg-[var(--bg-raised)] p-4">
          <p className="font-medium">Please fix the following:</p>
          <ul className="mt-2 list-disc pl-5">
            {errorList.map(([field, msg]) => (
              <li key={field}><a href={`#field-${field}`} className="underline">{msg}</a></li>
            ))}
          </ul>
        </div>
      )}

      {/* Honeypot: visually off-screen, aria-hidden so AT skips it entirely.
          readOnly until focused keeps browser autofill from writing into it
          (autofill skips read-only fields; a real focus lifts the lock), and
          the password autocomplete hint stops the field from ever being
          offered a saved name. Sent as payload.company. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}>
        <input type="text" name="ref_hint" tabIndex={-1} autoComplete="new-password" readOnly
          onFocus={(e) => e.currentTarget.removeAttribute("readonly")} />
      </div>

      <div>
        <label htmlFor="field-name" className="block text-sm font-medium">Name <span className="text-[var(--text-muted)]">(optional)</span></label>
        <input id="field-name" name="name" type="text" autoComplete="name" maxLength={200}
          aria-invalid={!!errors.name || undefined}
          aria-describedby={errors.name ? "err-name" : undefined}
          className={fieldInputClass} />
        {errors.name && <p id="err-name" className="mt-1 text-sm font-medium"><span className="sr-only">Error: </span>{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="field-email" className="block text-sm font-medium">
          Email <span className="text-[var(--text-muted)]">(optional)</span>
        </label>
        <input id="field-email" name="email" type="email" autoComplete="email" maxLength={200}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "err-email" : undefined}
          className={fieldInputClass} />
        {errors.email && <p id="err-email" className="mt-1 text-sm font-medium"><span className="sr-only">Error: </span>{errors.email}</p>}
      </div>

      {formType === "feedback" && (
        <>
          <div>
            <label htmlFor="field-category" className="block text-sm font-medium">Category</label>
            <select id="field-category" name="category" defaultValue="General"
              aria-invalid={!!errors.category || undefined}
              aria-describedby={errors.category ? "err-category" : undefined}
              className={fieldInputClass}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p id="err-category" className="mt-1 text-sm font-medium"><span className="sr-only">Error: </span>{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="field-message" className="block text-sm font-medium">
              Message <span className="text-[var(--text-muted)]">(required)</span>
            </label>
            <textarea id="field-message" name="message" rows={6} maxLength={MESSAGE_MAX}
              aria-required="true"
              aria-invalid={!!errors.message || undefined}
              aria-describedby={describedBy(errors.message && "err-message", showCounter && "msg-count")}
              onChange={(e) => setMessageLength(e.currentTarget.value.length)}
              className={fieldInputClass} />
            {errors.message && <p id="err-message" className="mt-1 text-sm font-medium"><span className="sr-only">Error: </span>{errors.message}</p>}
            {showCounter && (
              <p id="msg-count" aria-live="polite" className="mt-1 text-sm text-[var(--text-secondary)]">
                {remaining} characters left
              </p>
            )}
          </div>
        </>
      )}

      {status === "error" && <p role="alert" className="text-sm">Something went wrong. Please try again.</p>}

      <Button type="submit" variant="primary" size="xl" disabled={sending}
        aria-describedby={sending ? "send-hint" : undefined}>
        {sending ? "Sending…" : "Send feedback"}
      </Button>
      {sending && <p id="send-hint" role="status" className="text-sm">Sending your message.</p>}
    </form>
  );
}
