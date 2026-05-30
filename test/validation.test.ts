import { describe, it, expect } from "vitest";
import { isValidEmail, validateSubmission } from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => expect(isValidEmail("a@b.co")).toBe(true));
  it("rejects junk", () => expect(isValidEmail("nope")).toBe(false));
  it("rejects empty", () => expect(isValidEmail("")).toBe(false));
});

describe("validateSubmission", () => {
  it("feedback requires a message", () => {
    const r = validateSubmission({ formType: "feedback", message: "" });
    expect(r.ok).toBe(false);
    expect(r.errors.message).toBeTruthy();
  });
  it("feedback passes with a message", () => {
    const r = validateSubmission({ formType: "feedback", message: "It works", email: "" });
    expect(r.ok).toBe(true);
  });
  it("feedback with a bad email fails", () => {
    const r = validateSubmission({ formType: "feedback", message: "hi", email: "bad" });
    expect(r.ok).toBe(false);
    expect(r.errors.email).toBeTruthy();
  });
  it("early-access requires a valid email", () => {
    expect(validateSubmission({ formType: "early-access", email: "" }).ok).toBe(false);
    expect(validateSubmission({ formType: "early-access", email: "a@b.co" }).ok).toBe(true);
  });
});
