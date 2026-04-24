import { describe, it, expect } from "vitest";
import { extractStepCount } from "@/lib/stepOcr";

describe("extractStepCount", () => {
  it("parses comma-grouped thousands", () => {
    expect(extractStepCount("Today 8,432 steps")).toBe(8432);
  });

  it("parses space-grouped thousands", () => {
    expect(extractStepCount("12 345 steps")).toBe(12345);
  });

  it("parses plain digits next to 'steps'", () => {
    expect(extractStepCount("Steps 9876 walked today")).toBe(9876);
  });

  it("parses Indian lakh grouping", () => {
    expect(extractStepCount("Steps today 12,345")).toBe(12345);
  });

  it("ignores numbers next to kcal", () => {
    expect(extractStepCount("8,432 steps 2,134 kcal")).toBe(8432);
  });

  it("ignores the current year", () => {
    const year = new Date().getFullYear();
    expect(extractStepCount(`${year} 8,432 steps`)).toBe(8432);
  });

  // TW-022 real-world layouts -------------------------------------------------

  it("Apple Watch: picks step count over distance decimal and clock time", () => {
    // Reads like: "8:47  Steps  6,419  Distance  4.34 KM"
    expect(
      extractStepCount("8:47 Steps 6,419 Distance 4.34 KM Flights Climbed 12"),
    ).toBe(6419);
  });

  it("Apple Watch variant: 3,925 steps with 2.54KM and 8:51 clock", () => {
    expect(
      extractStepCount("8:51 Steps 3,925 Distance 2.54 KM"),
    ).toBe(3925);
  });

  it("Samsung Health: picks actual steps over step goal and kcal", () => {
    // Reads like: "6,729 / 15,000 steps ... 2,397 kcal"
    expect(
      extractStepCount("6,729 / 15,000 steps 2,397 kcal 44% 611 29"),
    ).toBe(6729);
  });

  it("Mi Fit: picks step count over numeric step goal label", () => {
    expect(extractStepCount("Goal 10,000 Steps 7,245 walked")).toBe(7245);
  });

  it("Google Fit: 8,432 steps over 2,134 kcal", () => {
    expect(extractStepCount("8,432 steps • 2,134 kcal")).toBe(8432);
  });

  it("returns null when no plausible number", () => {
    expect(extractStepCount("no digits here at all")).toBe(null);
  });

  it("returns null when only a tiny number is present", () => {
    expect(extractStepCount("42 steps")).toBe(null);
  });

  it("returns null on empty input", () => {
    expect(extractStepCount("")).toBe(null);
  });
});
