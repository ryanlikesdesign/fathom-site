// @vitest-environment node
//
// The link-preview cards render: the homepage's, and the redeem link's in
// each state its lookup can end in. The renderer only runs in Node (under
// jsdom its bytes cross realms), hence this file's own environment.
// test/metadata.test.ts holds the words, the alts and the fonts.
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/promoDb", () => ({
  // "stub" has a code, "down" is a database error, anything else is a dead link.
  findBySlug: async (slug: string) => {
    if (slug === "down") throw new Error("database down");
    return slug === "stub"
      ? { code: "A1B2C3", slug, status: "reserved", offerName: "Outreach", durationLabel: "3 months free", shortLabel: "3 mo" }
      : null;
  },
}));

import HomeImage, { size } from "@/app/opengraph-image";
import RedeemImage from "@/app/promo/r/[id]/opengraph-image";

async function expectPng(res: Response) {
  expect(res.headers.get("content-type")).toBe("image/png");
  const png = Buffer.from(await res.arrayBuffer());
  expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
  // IHDR: width and height, big-endian, at bytes 16 and 20.
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([size.width, size.height]);
}

describe("the link-preview cards", () => {
  it("renders the homepage card", async () => {
    await expectPng(await HomeImage());
  }, 30_000);

  it.each(["stub", "down", "gone"])("renders the redeem card for %s", async (id) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expectPng(await RedeemImage({ params: Promise.resolve({ id }) }));
  }, 30_000);
});
