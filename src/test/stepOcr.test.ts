import { describe, it, expect } from "vitest";
import { extractStepCount } from "@/lib/stepOcr";

describe("extractStepCount", () => {
  it("parses comma-grouped thousands", () => {
    expect(extractStepCount("Today 8,432 steps")).toBe(8432);
  });

  it("parses space-grouped thousands", () => {
    expect(extractStepCount("12 345 steps")).toBe(12345);
  });

  it("parses plain digits", () => {
    expect(extractStepCount("Steps 9876 Goal 10000")).toBe(10000);
  });

  it("parses Indian lakh grouping", () => {
    // Indian lakh grouping for a plausible 12,345 daily step count rendered
    // as "12,345" by fitness trackers that localise to en-IN.
    expect(extractStepCount("Steps today 12,345")).toBe(12345);
  });

  it("ignores numbers next to kcal", () => {
    expect(extractStepCount("8,432 steps 2,134 kcal")).toBe(8432);
  });

  it("ignores the current year", () => {
    const year = new Date().getFullYear();
    expect(extractStepCount(`${year} 8,432 steps`)).toBe(8432);
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