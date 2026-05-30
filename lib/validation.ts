export type FormType = "feedback" | "early-access";

export interface SubmissionInput {
  formType: FormType;
  name?: string;
  email?: string;
  category?: string;
  message?: string;
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
  const email = (input.email ?? "").trim();

  if (input.formType === "feedback") {
    if (!(input.message ?? "").trim()) errors.message = "Enter a message so we know what's up.";
    if (email && !isValidEmail(email)) errors.email = "That email doesn't look right.";
  }

  if (input.formType === "early-access") {
    if (!email) errors.email = "Enter your email to request access.";
    else if (!isValidEmail(email)) errors.email = "That email doesn't look right.";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
