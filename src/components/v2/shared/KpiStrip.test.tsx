import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiStrip } from "./KpiStrip";

describe("KpiStrip", () => {
  const items = [
    { label: "Students", value: 42 },
    { label: "Sessions", value: 68 },
    { label: "Reply", value: "12m" },
    { label: "Rating", value: 4.9, accent: "teal" as const },
  ];

  it("renders each label and value", () => {
    render(<KpiStrip items={items} />);
    items.forEach((kpi) => {
      expect(screen.getByText(kpi.label)).toBeInTheDocument();
      expect(screen.getByText(String(kpi.value))).toBeInTheDocument();
    });
  });

  it("applies the teal accent to the rating column", () => {
    const { container } = render(<KpiStrip items={items} />);
    const teal = container.querySelector(".text-teal");
    expect(teal).not.toBeNull();
    expect(teal?.textContent).toBe("4.9");
  });

  it("uses tabular-nums for numeric values", () => {
    const { container } = render(<KpiStrip items={items} />);
    const tnum = container.querySelector(".tnum");
    expect(tnum).not.toBeNull();
  });
});
