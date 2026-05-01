import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const calendarSource = readFileSync(resolve(process.cwd(), "src/pages/Calendar.tsx"), "utf8");
const dateCellBlock = calendarSource.slice(
  calendarSource.indexOf("{/* Date Cells */}"),
  calendarSource.indexOf("{/* Status Legend (boundary swatches only) */}")
);
const legendBlock = calendarSource.slice(
  calendarSource.indexOf("{/* Status Legend (boundary swatches only) */}"),
  calendarSource.indexOf("</motion.div>", calendarSource.indexOf("{/* Status Legend (boundary swatches only) */}"))
);
const calendarRenderBlock = calendarSource.slice(
  calendarSource.indexOf("{/* Calendar Sections */}"),
  calendarSource.indexOf("{/* Trainer Action Sheet */}")
);

describe("Calendar boundary-only UI", () => {
  it("renders date cells as numbers with border-state classes, not dots or icons", () => {
    expect(dateCellBlock).toContain("getDayMarkBorder");
    expect(dateCellBlock).toContain("hasCompletedWorkout");
    expect(dateCellBlock).toContain("hasStepLog");
    expect(dateCellBlock).toContain("border-2");
    expect(dateCellBlock).not.toMatch(/<(?:Dumbbell|Check|Clock|X|AlertCircle|CalendarOff|UserX|Palmtree)\b/);
    expect(dateCellBlock).not.toMatch(/absolute|rounded-full|bottom-|top-|left-|right-|w-\d(?:\.\d)?\s+h-\d(?:\.\d)?/);
  });

  it("keeps the calendar legend as boundary swatches only", () => {
    expect(legendBlock).toContain("rounded-md");
    expect(legendBlock).toContain("Logged");
    expect(legendBlock).toContain("Holiday");
    expect(legendBlock).toContain("Trainer Leave");
    expect(legendBlock).toContain("Client Leave");
    expect(legendBlock).not.toMatch(/Completed|Missed|Pending/);
    expect(legendBlock).not.toMatch(/rounded-full/);
  });

  it("blocks the old Completed/Missed/Pending dot calendar from returning anywhere in the calendar render", () => {
    // "hasCompletedWorkout" is a variable name, not UI text — exclude it from the pattern
    expect(calendarRenderBlock).not.toMatch(/(?<!hasCompleted)(?:Completed|Missed|Pending)(?!Workout)/);
    expect(calendarRenderBlock).not.toMatch(/rounded-full/);
    expect(calendarRenderBlock).not.toMatch(/<(?:Check|Clock|X|AlertCircle)\b/);
  });
});