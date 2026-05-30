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

  it("emails an early-access request and returns 200", async () => {
    const res = await POST(req({ formType: "early-access", email: "u@x.co" }));
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0][0].subject).toMatch(/early access/i);
  });

  it("returns 502 when the email provider errors", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "down" } });
    const res = await POST(req({ formType: "early-access", email: "u@x.co" }));
    expect(res.status).toBe(502);
  });
});
