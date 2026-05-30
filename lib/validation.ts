export type FormType = "feedback" | "early-access";

export interface SubmissionInput {
  formType: FormType;
  name?: string;
  email?: string;
  category?: string;
  message?: string;
  role?: string;
  story?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

export function isValidEmail(value: string): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateSubmission(input: SubmissionInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (input.formType !== "feedback" && input.formType !== "early-access") {
    return { ok: false, errors: { formType: "Unknown form." } };
  }

  const email = (input.email ?? "").trim();

  if (input.formType === "feedback") {
    if (!(input.message ?? "").trim()) errors.message = "Enter a message so we know what's up.";
    if (email && !isValidEmail(email)) errors.email = "That email doesn't look right.";
  }

  if (input.formType === "early-access") {
    if (!email) errors.email = "Enter your email to request access.";
    else if (!isValidEmail(email)) errors.email = "That email doesn't look right.";
  }

  const cap = (v: string | undefined) => (v ?? "");
  if (cap(input.message).length > 5000) errors.message = "Message is too long (5000 characters max).";
  if (cap(input.name).length > 200) errors.name = "Name is too long.";
  if (cap(input.email).length > 200) errors.email = "Email is too long.";
  if (cap(input.category).length > 200) errors.category = "Category is too long.";
  if ((input.story ?? "").length > 5000) errors.story = "Too long.";
  if ((input.role ?? "").length > 200) errors.role = "Too long.";

  return { ok: Object.keys(errors).length === 0, errors };
}
