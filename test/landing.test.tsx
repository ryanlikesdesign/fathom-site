import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { Phone } from "@/components/landing/Phone";
import { HomeScreen } from "@/components/landing/screens/HomeScreen";
import { LookoutScreen } from "@/components/landing/screens/LookoutScreen";
import { GoScreen } from "@/components/landing/screens/GoScreen";
import { LiveTaskScreen } from "@/components/landing/screens/LiveTaskScreen";
import { AssistantScreen } from "@/components/landing/screens/AssistantScreen";
import { PointScreen } from "@/components/landing/screens/PointScreen";

describe("Phone frame", () => {
  it("is one named image with the app's tab bar", async () => {
    const { container } = render(
      <Phone activeTab="Home" label="Fathom home screen">
        <p>Screen</p>
      </Phone>,
    );
    expect(screen.getByRole("img", { name: "Fathom home screen" })).toBeInTheDocument();
    for (const t of ["Home", "Assistant", "History", "Settings"]) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
    // Nothing inside a picture may be focusable.
    expect(container.querySelectorAll("button, a, [tabindex]").length).toBe(0);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("screens use only controls the app has", () => {
  const invented = [/ask or command/i, /quick scan/i, /mark complete/i, /end navigation/i, /accept plan/i];

  it("Home shows the tiles with their real subtitles and the Snapshot options chevron", () => {
    const { container } = render(<HomeScreen />);
    for (const t of ["Snapshot", "Lookout", "Go", "Task"]) expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByText("Quick scan of your surroundings")).toBeInTheDocument();
    expect(screen.queryByText("Assistant")).toBeNull(); // it's a tab, not a tile
    expect(container.querySelector('[title="Snapshot options"]')).not.toBeNull();
  });

  it("every active screen has Ask Fathom, End and More actions, and no invented control", () => {
    const screens = [
      <LookoutScreen key="l" captions={["Glass doors ahead."]} />,
      <GoScreen key="g" destination="the counter" bearing={2} metres={8} caption="Turn slightly right." />,
      <LiveTaskScreen key="t" steps={["Find the sheet", "Sign it", "Sit down"]} done={1} />,
      <PointScreen key="p" beats={["A vending machine.", "Buttons read: Water, Cola.", "Card reader on the right."]} />,
    ];
    for (const s of screens) {
      const { container, unmount } = render(s);
      expect(screen.getByText("Ask Fathom")).toBeInTheDocument();
      expect(screen.getByText("End")).toBeInTheDocument();
      expect(container.querySelector('[title="More actions"]')).not.toBeNull();
      for (const re of invented) expect(screen.queryByText(re)).toBeNull();
      unmount();
    }
  });

  it("Live Task carries the app's BETA badge", () => {
    render(<LiveTaskScreen steps={["a", "b", "c"]} done={0} />);
    expect(screen.getByText("BETA")).toBeInTheDocument();
  });

  it("Assistant shows the goal, the plan, and the app's two chips", () => {
    render(<AssistantScreen goal="Renew my library card" plan={["Go to the desk", "Ask", "Fill in the form"]} />);
    expect(screen.getByText(/Renew my library card/)).toBeInTheDocument();
    expect(screen.getByText("Activities")).toBeInTheDocument();
    expect(screen.getByText("Ask Fathom")).toBeInTheDocument();
  });

  it("Point renders the answer in three beats, in order", () => {
    render(<PointScreen beats={["A vending machine.", "Buttons read: Water.", "Card reader on the right."]} />);
    const beats = screen.getAllByText(/vending|Buttons|Card reader/).map((e) => e.textContent);
    expect(beats).toEqual(["A vending machine.", "Buttons read: Water.", "Card reader on the right."]);
  });
});
