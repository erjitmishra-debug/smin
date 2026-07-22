import { describe, expect, it } from "vitest";
import { pointInPolygon, validateIntervals, type Project } from "../hooks/use-local-db";
import { runPhaseOneValidation } from "./validation";

const project = {
  id: "test", name: "Test", commodity: "Fe", crs: "EPSG:28350", epsg: 28350,
  folderPath: "projects/test", boundary: [{ easting: 0, northing: 0 }, { easting: 100, northing: 0 }, { easting: 100, northing: 100 }, { easting: 0, northing: 100 }],
  lastAccessed: new Date().toISOString(),
} satisfies Project;

describe("SMIN Phase 1 validation", () => {
  it("classifies transformed coordinates against the approved boundary", () => {
    expect(pointInPolygon(50, 50, project.boundary)).toBe(true);
    expect(runPhaseOneValidation(project, [{ holeId: "IN", easting: 50, northing: 50, elevation: 10, maxDepth: 20 }])[0].status).toBe("inside");
    expect(runPhaseOneValidation(project, [{ holeId: "OUT", easting: 150, northing: 50, elevation: 10, maxDepth: 20 }])[0].status).toBe("outside");
  });
  it("rejects non-numeric coordinates and invalid depth intervals", () => {
    expect(runPhaseOneValidation(project, [{ holeId: "BAD", easting: Number.NaN, northing: 50, elevation: 10, maxDepth: 20 }])[0].status).toBe("error");
    expect(validateIntervals([{ holeId: "DH-1", from: 20, to: 10, recordType: "assay", code: "Fe" }], "test")[0].validation).toBe("error");
  });
  it("detects overlaps per hole", () => {
    const result = validateIntervals([
      { holeId: "DH-1", from: 0, to: 10, recordType: "lithology", code: "BIF" },
      { holeId: "DH-1", from: 9, to: 20, recordType: "lithology", code: "SHALE" },
    ], "test");
    expect(result.every((interval) => interval.validation === "error")).toBe(true);
  });
});