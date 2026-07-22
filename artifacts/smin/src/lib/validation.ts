import { pointInPolygon, distanceToBoundary, validateIntervals, type Project } from "../hooks/use-local-db";

export function runPhaseOneValidation(project: Project, rows: Array<{ holeId: string; easting: number; northing: number; elevation: number; maxDepth: number }>) {
  return rows.map((row) => {
    const numeric = [row.easting, row.northing, row.elevation, row.maxDepth].every(Number.isFinite);
    const distance = numeric ? distanceToBoundary(row.easting, row.northing, project.boundary) : Infinity;
    const inside = numeric && pointInPolygon(row.easting, row.northing, project.boundary);
    return { holeId: row.holeId, numeric, inside, distance, status: !numeric ? "error" : distance < 2 ? "near_boundary" : inside ? "inside" : "outside" };
  });
}

export { validateIntervals };