import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Resend: vi.fn(function (this: any) { return { emails: { send: sendMock } }; }),
}));

import { POST } from "@/app/api/submit/route";

function req(body: unknown) {
  return new Request("http://test/api/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
  process.env.RESEND_API_KEY = "test";
  process.env.CONTACT_EMAIL = "ryan@example.com";
});

describe("POST /api/submit", () => {
  it("rejects invalid submissions with 400 and does not email", async () => {
    const res = await POST(req({ formType: "feedback", message: "" }));
    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("silently drops honeypot hits with 200 and no email", async () => {
    const res = await POST(req({ formType: "feedback", message: "hi", company: "spam" }));
    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("emails a valid feedback submission and returns 200", async () => {
    const res = await POST(req({ formType: "feedback", message: "Great app", email: "u@x.co" }));
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const arg = sendMock.mock.calls[0][0];
    expect(arg.to).toBe("ryan@example.com");
    expect(arg.subject).toMatch(/feedback/i);
    expect(arg.text).toContain("Great app");
  });

  it("sends as fathom, lowercase, in the sender name and the subject", async () => {
    delete process.env.FROM_EMAIL;
    await POST(req({ formType: "feedback", category: "Bug", message: "Great app", email: "u@x.co" }));
    const arg = sendMock.mock.calls[0][0];
    expect(arg.from).toBe("fathom <support@fathomvision.app>");
    expect(arg.subject).toBe("fathom feedback: Bug");
  });

  it.each([
    // The value .env.local and Vercel carried before the rename: only its address is used.
    ["Fathom <support@fathomvision.app>", "fathom <support@fathomvision.app>"],
    ["fathom <onboarding@resend.dev>", "fathom <onboarding@resend.dev>"],
    ["onboarding@resend.dev", "fathom <onboarding@resend.dev>"],
    // Unreadable: fall back to the site's own address rather than send a broken header.
    ["Fathom", "fathom <support@fathomvision.app>"],
    ["a@b.co\r\nBcc: x@y.co", "fathom <support@fathomvision.app>"],
  ])("takes only the address from FROM_EMAIL=%j", async (env, expected) => {
    process.env.FROM_EMAIL = env;
    try {
      await POST(req({ formType: "feedback", message: "Great app", email: "u@x.co" }));
      expect(sendMock.mock.calls[0][0].from).toBe(expected);
    } finally {
      delete process.env.FROM_EMAIL;
    }
  });

  it("returns 502 when the email provider errors", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "down" } });
    const res = await POST(req({ formType: "feedback", message: "Great app", email: "u@x.co" }));
    expect(res.status).toBe(502);
  });

  it("rejects an unknown formType with 400 and does not email", async () => {
    const res = await POST(req({ formType: "nope", email: "a@b.co", message: "spam" }));
    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("drops a honeypot hit even when the body is otherwise invalid", async () => {
    const res = await POST(req({ formType: "feedback", message: "", company: "spam" }));
    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
