import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { axe } from "jest-axe";

// posthog-js touches browser globals on import/use — stub it.
// vi.hoisted so the stub exists before the hoisted vi.mock factory runs.
const ph = vi.hoisted(() => ({ capture: vi.fn(), identify: vi.fn(), reset: vi.fn() }));
vi.mock("posthog-js", () => ({ default: ph }));

import { qrShape } from "@/lib/qr";
import { redeemUrl, trackedRedeemUrl } from "@/lib/promo";
import { PromoGate } from "@/components/PromoGate";

/** The page resolves lock state on the server; this is its locked outcome. */
const locked = {
  initialRep: null,
  initialBatches: [],
  initialCustom: [],
  initialError: null,
};

const BATCHES = [
  {
    batch_id: "526704",
    offer_name: "Outreach",
    duration_label: "3 months free",
    expires_on: "2026-12-20",
    sort_order: 1,
    total: 1000,
    available: 956,
    reserved: 44,
    sent: 0,
    confirmed_redeemed: 0,
    links_opened: 0,
    redeem_clicked: 0,
  },
  {
    batch_id: "526646",
    offer_name: "Family",
    duration_label: "1 year free",
    expires_on: "2026-12-20",
    sort_order: 2,
    total: 500,
    available: 491,
    reserved: 9,
    sent: 0,
    confirmed_redeemed: 0,
    links_opened: 0,
    redeem_clicked: 0,
  },
];

/** Minimal stand-in for the /api/promo endpoints. */
function mockApi({ unlocked = false }: { unlocked?: boolean } = {}) {
  let open = unlocked;
  const calls: Array<{ url: string; method: string; body: unknown }> = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });

    const json = (data: unknown, status = 200) =>
      ({ ok: status < 400, status, json: async () => data }) as Response;

    if (url === "/api/promo/session" && method === "POST") {
      if (body.password !== "fathom-crew") return json({ error: "That password isn't right." }, 401);
      open = true;
      return json({ rep: body.rep });
    }
    if (url === "/api/promo/session" && method === "DELETE") {
      open = false;
      return json({ ok: true });
    }
    if (url === "/api/promo/codes" && method === "GET") {
      if (!open) return json({ error: "Not unlocked." }, 401);
      return json({ rep: "Ada", batches: BATCHES, custom: [] });
    }
    if (url === "/api/promo/codes" && method === "POST") {
      return json({ code: "TESTCODE1234567890", slug: "abcdefghij", batch_id: body.batchId });
    }
    if (url.startsWith("/api/promo/codes/") && method === "PATCH") {
      return json({ ok: true });
    }
    if (url.startsWith("/api/promo/codes/") && method === "GET") {
      return json({ error: "Unknown code." }, 404);
    }
    return json({ error: "unexpected" }, 500);
  });

  vi.stubGlobal("fetch", fetchMock);
  return { calls };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("qrShape (vendored encoder)", () => {
  it("encodes text into a positive, odd-sized module grid with a path", () => {
    const { size, path } = qrShape("https://fathomvision.app/promo/r/abcdefghij?rep=Ada");
    expect(size).toBeGreaterThan(0);
    expect(size % 2).toBe(1); // every QR version has an odd module count
    expect(path.length).toBeGreaterThan(0);
  });
});

describe("redeem links", () => {
  it("builds an Apple offer-code deep link", () => {
    expect(redeemUrl("ABC123")).toContain("ctx=offercodes");
    expect(redeemUrl("ABC123")).toContain("code=ABC123");
  });

  it("points the recipient at our tracking route, not Apple directly", () => {
    // Server-side so the tap is recorded even with JavaScript off.
    expect(trackedRedeemUrl("abcdefghij")).toBe("/promo/r/abcdefghij/redeem");
  });
});

describe("PromoGate", () => {
  it("locked view has no axe violations", async () => {
    mockApi();
    const { container } = render(<PromoGate {...locked} />);
    screen.getByLabelText(/access password/i);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("rejects the wrong password with an alert", async () => {
    mockApi();
    render(<PromoGate {...locked} />);
    await userEvent.type(screen.getByLabelText(/access password/i), "nope");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/isn't right/i);
  });

  it("never checks the password in the browser", async () => {
    const { calls } = mockApi();
    render(<PromoGate {...locked} />);
    await userEvent.type(screen.getByLabelText(/access password/i), "fathom-crew");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));
    await screen.findByRole("heading", { name: /3 months free/i });

    // The gate must go to the server; a client-side comparison would mean the
    // codes could be reached without one.
    expect(calls.some((c) => c.url === "/api/promo/session" && c.method === "POST")).toBe(true);
  });

  it("unlocks and shows both offers as tabs, switching panels on click", async () => {
    mockApi();
    const { container } = render(<PromoGate {...locked} />);
    await userEvent.type(screen.getByLabelText(/your name/i), "Ada");
    await userEvent.type(screen.getByLabelText(/access password/i), "fathom-crew");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));

    const yearTab = await screen.findByRole("tab", { name: /1 year free/i });
    expect(screen.getByRole("tab", { name: /3 months free/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(yearTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("heading", { name: /3 months free/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /1 year free/i })).not.toBeInTheDocument();

    await userEvent.click(yearTab);
    expect(yearTab).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("heading", { name: /1 year free/i })).toBeInTheDocument();

    expect(screen.getByText(/sharing as/i)).toHaveTextContent("Ada");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PromoBoard handing out a code", () => {
  async function unlock() {
    render(<PromoGate {...locked} />);
    await userEvent.type(screen.getByLabelText(/your name/i), "Ada");
    await userEvent.type(screen.getByLabelText(/access password/i), "fathom-crew");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));
    await screen.findByRole("heading", { name: /3 months free/i });
  }

  it("shows remaining stock and hides codes until one is claimed", async () => {
    mockApi();
    await unlock();
    expect(screen.getByText(/956 of 1000 still unused/i)).toBeInTheDocument();
    // No code is on screen until the rep takes one — nothing to leak.
    expect(screen.queryByText(/TESTCODE1234567890/)).not.toBeInTheDocument();
  });

  it("claims the next code from the server on request", async () => {
    const { calls } = mockApi();
    await unlock();

    await userEvent.click(screen.getAllByRole("button", { name: /get a code/i })[0]);

    expect(await screen.findByText("TESTCODE1234567890")).toBeInTheDocument();
    const reserve = calls.find((c) => c.url === "/api/promo/codes" && c.method === "POST");
    expect(reserve?.body).toEqual({ batchId: "526704" });
  });

  it("copying a code marks it handed out server-side and frees the rep for the next", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { calls } = mockApi();
    await unlock();

    await userEvent.click(screen.getAllByRole("button", { name: /get a code/i })[0]);
    await screen.findByText("TESTCODE1234567890");
    await userEvent.click(screen.getAllByRole("button", { name: /^copy code/i })[0]);

    expect(writeText).toHaveBeenCalledWith("TESTCODE1234567890");
    expect(ph.capture).toHaveBeenCalledWith(
      "promo_shared",
      expect.objectContaining({ method: "copy_code", rep_name: "Ada" }),
    );

    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.url).toBe("/api/promo/codes/abcdefghij");
    expect(patch?.body).toMatchObject({ action: "sent", method: "copy_code" });

    // Back to the "take the next one" state.
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /get a code/i })[0]).toBeInTheDocument(),
    );
  });

  it("moves focus into the panel on claim, and back to the button on release", async () => {
    mockApi();
    await unlock();

    const get = screen.getAllByRole("button", { name: /get a code/i })[0];
    get.focus();
    await userEvent.click(get);
    await screen.findByText("TESTCODE1234567890");
    // The button just unmounted; focus must land on the panel's heading, not <body>.
    expect(document.activeElement).toHaveTextContent(/reserved for you/i);

    await userEvent.click(screen.getByRole("button", { name: /^put it back/i }));
    await waitFor(() =>
      expect(document.activeElement).toHaveTextContent(/get a code/i),
    );
  });

  it("spells the code out for screen readers without labeling a paragraph", async () => {
    mockApi();
    await unlock();
    await userEvent.click(screen.getAllByRole("button", { name: /get a code/i })[0]);
    await screen.findByText("TESTCODE1234567890");

    // Visible string is aria-hidden; a sibling carries the NATO reading.
    expect(screen.getByText(/Tango, Echo, Sierra, Tango/)).toBeInTheDocument();
    expect(document.querySelector("p[aria-label]")).toBeNull();
  });

  it("claimed-code state has no axe violations", async () => {
    mockApi();
    const { container } = render(<PromoGate {...locked} />);
    await userEvent.type(screen.getByLabelText(/access password/i), "fathom-crew");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));
    await userEvent.click(await screen.findByRole("button", { name: /get a code/i }));
    await screen.findByText("TESTCODE1234567890");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("can put an unused code back in the pool", async () => {
    const { calls } = mockApi();
    await unlock();

    await userEvent.click(screen.getAllByRole("button", { name: /get a code/i })[0]);
    await screen.findByText("TESTCODE1234567890");
    await userEvent.click(screen.getByRole("button", { name: /^put it back/i }));

    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.body).toMatchObject({ action: "released" });
  });
});

describe("failure states", () => {
  it("marks the password invalid only for a real password failure", async () => {
    mockApi();
    render(<PromoGate {...locked} />);
    await userEvent.type(screen.getByLabelText(/access password/i), "nope");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));

    await screen.findByRole("alert");
    expect(screen.getByLabelText(/access password/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("opens the board on a correct password even if the database is down", async () => {
    // A screen-reader user must not be told the password was wrong when the
    // real problem is that the code database is unreachable.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        const json = (data: unknown, status = 200) =>
          ({ ok: status < 400, status, json: async () => data }) as Response;
        if (url === "/api/promo/session" && method === "POST") return json({ rep: "Ada" });
        return json({ error: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." }, 503);
      }),
    );

    render(<PromoGate {...locked} />);
    await userEvent.type(screen.getByLabelText(/access password/i), "fathom-crew");
    await userEvent.click(screen.getByRole("button", { name: /open the codes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/SUPABASE_URL/);
    // Not bounced back to the password form, and not blamed on the password.
    expect(screen.queryByLabelText(/access password/i)).not.toBeInTheDocument();
  });
});

describe("expired offers", () => {
  const EXPIRED = [
    { ...BATCHES[0], expires_on: "2020-01-01", available: 900 },
    { ...BATCHES[1] },
  ];

  it("marks an expired batch and refuses to hand out its codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ({ ok: true, status: 200, json: async () => ({}) }) as Response),
    );

    render(
      <PromoGate
        initialRep="Ada"
        initialBatches={EXPIRED}
        initialCustom={[]}
        initialError={null}
      />,
    );

    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText(/stopped working on January 1, 2020/i)).toBeInTheDocument();
    // Codes remain in stock, but handing one out would waste someone's time.
    // aria-disabled, not disabled: a removed-from-tab-order button can never be
    // reached to find out why it's unavailable.
    const btn = screen.getByRole("button", { name: /get a code/i });
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn).toHaveAccessibleDescription(/stopped working/i);
  });

  it("shows a live shared code with its cap and expiry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }) as Response),
    );

    render(
      <PromoGate
        initialRep="Ada"
        initialBatches={BATCHES}
        initialCustom={[
          {
            code: "FATHOM2",
            offer_name: "Outreach",
            duration_label: "3 months free",
            redemption_cap: 500,
            expires_on: "2999-01-01",
            active: true,
            note: null,
            synced_at: "2026-09-05T00:00:00Z",
          },
        ]}
        initialError={null}
      />,
    );

    expect(screen.getByText("FATHOM2")).toBeInTheDocument();
    expect(screen.getByText(/up to 500 redemptions/i)).toBeInTheDocument();
    expect(screen.getByText(/doesn't report how many/i)).toBeInTheDocument();
  });
});
