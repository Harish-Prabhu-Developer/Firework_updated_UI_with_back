import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>,
}));

vi.mock("@/assets/hero-banner.jpg", () => ({ default: "hero-banner.jpg" }));
vi.mock("@/assets/hero-discount.png", () => ({ default: "hero-discount.png" }));


import HeroCarousel from "./HeroCarousel";

describe("HeroCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders all navigation buttons", () => {
    render(<HeroCarousel />);
    expect(screen.getByLabelText("Previous slide")).toBeTruthy();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();
  });

  it("renders navigation dots for each slide", () => {
    render(<HeroCarousel />);
    const dots = screen.getAllByRole("button").filter(
      (b) => b.getAttribute("aria-label")?.startsWith("Go to slide")
    );
    expect(dots).toHaveLength(2);
  });

  it("navigates to a specific slide when a dot is clicked", () => {
    render(<HeroCarousel />);
    const dots = screen.getAllByRole("button").filter(
      (b) => b.getAttribute("aria-label") === "Go to slide 2"
    );
    fireEvent.click(dots[0]);
    expect(screen.getByAltText("Slide 2")).toBeTruthy();
  });

  it("navigates to next slide on next button click", () => {
    render(<HeroCarousel />);
    expect(screen.getByAltText("Slide 1")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(screen.getByAltText("Slide 2")).toBeTruthy();
  });

  it("navigates to previous slide on prev button click", () => {
    render(<HeroCarousel />);
    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(screen.getByAltText("Slide 2")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Previous slide"));
    expect(screen.getByAltText("Slide 1")).toBeTruthy();
  });
});
