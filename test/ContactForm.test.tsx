import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "jest-axe";
import { ContactForm } from "@/components/ContactForm";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ContactForm (feedback)", () => {
  it("has no axe violations", async () => {
    const { container } = render(<ContactForm formType="feedback" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows an error summary when required message is missing", async () => {
    render(<ContactForm formType="feedback" />);
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/message/i);
  });

  it("posts and shows success on valid submit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm formType="feedback" />);
    await userEvent.type(screen.getByLabelText(/message/i), "Love it");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/thank|received|got it/i);
    expect(fetchMock).toHaveBeenCalledWith("/api/submit", expect.objectContaining({ method: "POST" }));
  });
});
