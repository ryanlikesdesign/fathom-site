import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { Faq } from "@/components/Faq";

const items = [{ q: "Question one?", a: "Answer one." }];

describe("Faq", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Faq items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
  it("reveals the answer when the question is activated", async () => {
    render(<Faq items={items} />);
    await userEvent.click(screen.getByRole("button", { name: "Question one?" }));
    expect(screen.getByText("Answer one.")).toBeVisible();
  });
});
