import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("renders children", () => {
    render(<Chip>Verified</Chip>);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("applies the teal variant class", () => {
    const { container } = render(<Chip variant="teal">Available</Chip>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/text-teal/);
    expect(el.className).toMatch(/bg-teal-dim/);
  });

  it("applies the orange variant class", () => {
    const { container } = render(<Chip variant="orange">Pro</Chip>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/text-orange/);
  });

  it("renders a leading dot when requested", () => {
    const { container } = render(<Chip leadingDot>Live</Chip>);
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });
});
