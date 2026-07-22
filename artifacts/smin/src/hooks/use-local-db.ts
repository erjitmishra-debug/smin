import { useEffect, useState } from "react";
import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  commodity: z.string(),
  crs: z.string().regex(/^EPSG:\d+$/i),
  epsg: z.number().int().positive(),
  description: z.string().optional(),
  folderPath: z.string(),
  boundary: z.array(z.object({ easting: z.number(), northing: z.number() })).min(3),
  lastAccessed: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const DrillholeSchema = z.object({
  id: z.string(), holeId: z.string().min(1), easting: z.number().finite(),
  northing: z.number().finite(), elevation: z.number().finite(), maxDepth: z.number().positive(),
  originalEasting: z.number().finite(), originalNorthing: z.number().finite(),
  sourceCrs: z.string(), transformationStatus: z.enum(["approved", "unknown", "failed"]),
  boundaryStatus: z.enum(["inside", "outside", "on_boundary", "near_boundary", "crs_unknown"]),
  status: z.enum(["valid", "warning", "error"]), warnings: z.array(z.string()),
  projectId: z.string(),
});
export type Drillhole = z.infer<typeof DrillholeSchema>;

export const IntervalSchema = z.object({
  id: z.string(), holeId: z.string(), from: z.number().nonnegative(), to: z.number(),
  code: z.string(), recordType: z.enum(["survey", "lithology", "assay"]),
  values: z.record(z.string(), z.string()), validation: z.enum(["valid", "warning", "error"]),
  messages: z.array(z.string()), projectId: z.string(),
});
export type Interval = z.infer<typeof IntervalSchema>;

export type FieldMapping = {
  holeId: string; easting: string; northing: string; elevation: string; maxDepth: string;
  from: string; to: string; code: string; value: string; recordType: Interval["recordType"];
};
export type AuditEvent = { id: string; timestamp: string; user: string; action: string; details: string; projectId: string };
export type ProcessingJob = { id: string; projectId: string; type: string; status: "queued" | "processing" | "completed" | "failed"; progress: number; message?: string; startedAt?: string; completedAt?: string };
type DBState = { projects: Project[]; drillholes: Drillhole[]; intervals: Interval[]; mappings: Record<string, FieldMapping>; audits: AuditEvent[]; jobs: ProcessingJob[]; activeProjectId: string | null };

export const SAMPLE_CSV = `hole_id,easting,northing,elevation,total_depth,hole_type,drilling_method,status
DEMO-001,512220,7812300,680,120,Diamond,Core,Validated
DEMO-002,512280,7812320,682,135,Diamond,Core,Validated
DEMO-003,512340,7812340,685,148,Diamond,Core,Validated
DEMO-004,512400,7812360,688,155,Diamond,Core,Validated
DEMO-005,512460,7812380,690,170,Diamond,Core,Validated
DEMO-006,512520,7812400,693,182,Diamond,Core,Validated
DEMO-007,512580,7812420,696,190,Diamond,Core,Validated
DEMO-008,512640,7812440,699,205,Diamond,Core,Validated
DEMO-009,512700,7812460,701,218,Diamond,Core,Validated
DEMO-010,512760,7812480,704,225,Diamond,Core,Validated
DEMO-011,512320,7812550,687,142,Diamond,Core,Validated
DEMO-012,512440,7812570,691,160,Diamond,Core,Validated
DEMO-013,512560,7812590,695,178,Diamond,Core,Validated
DEMO-014,512680,7812610,700,196,Diamond,Core,Validated
DEMO-015,512800,7812630,706,212,Diamond,Core,Validated`;

const boundary = [
  { easting: 512100, northing: 7812200 }, { easting: 512950, northing: 7812200 },
  { easting: 512950, northing: 7812850 }, { easting: 512100, northing: 7812850 },
];
const defaultProject: Project = { id: "proj_iron_01", name: "SMIN Iron Ore Demo", commodity: "Iron Ore (Fe)", crs: "EPSG:28350", epsg: 28350, description: "Fictional Phase 1 iron-ore validation project.", folderPath: "demo/smin-iron-ore-demo", boundary, lastAccessed: new Date().toISOString() };
const defaultMapping: FieldMapping = { holeId: "hole_id", easting: "easting", northing: "northing", elevation: "elevation", maxDepth: "total_depth", from: "from", to: "to", code: "lithology", value: "result", recordType: "lithology" };

export function pointInPolygon(x: number, y: number, polygon: Project["boundary"]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const intersect = polygon[i].northing > y !== polygon[j].northing > y && x < (polygon[j].easting - polygon[i].easting) * (y - polygon[i].northing) / (polygon[j].northing - polygon[i].northing) + polygon[i].easting;
    if (intersect) inside = !inside;
  }
  return inside;
}
export function distanceToBoundary(x: number, y: number, polygon: Project["boundary"]) {
  return Math.min(...polygon.map((p, i) => {
    const q = polygon[(i + 1) % polygon.length]; const dx = q.easting - p.easting; const dy = q.northing - p.northing;
    const t = Math.max(0, Math.min(1, ((x - p.easting) * dx + (y - p.northing) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (p.easting + t * dx), y - (p.northing + t * dy));
  }));
}
function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean).map((line) => line.split(",").map((v) => v.trim().replace(/^"|"$/g, "")));
  return { headers: rows[0] ?? [], rows: rows.slice(1) };
}
function parseMappedIntervals(text: string, mapping: FieldMapping, projectId: string) {
  const { headers, rows } = parseCsv(text);
  const index = (field: string) => headers.indexOf(field);
  return validateIntervals(rows.map((row) => ({
    holeId: row[index(mapping.holeId)] ?? "",
    from: Number(row[index(mapping.from)]),
    to: Number(row[index(mapping.to)]),
    recordType: mapping.recordType,
    code: row[index(mapping.code)] ?? "",
  })), projectId);
}
function initialState(): DBState {
  try { const saved = typeof localStorage !== "undefined" ? localStorage.getItem("smin_db_v2") : null; if (saved) return JSON.parse(saved) as DBState; } catch { /* reset corrupted local state */ }
  const { headers, rows } = parseCsv(SAMPLE_CSV);
  const drillholes = rows.map((r, index) => makeDrillhole(r, headers, defaultMapping, defaultProject, index));
  return { projects: [defaultProject], drillholes, intervals: [], mappings: { [defaultProject.id]: defaultMapping }, audits: [{ id: "aud_seed", timestamp: new Date().toISOString(), user: "demo.user", action: "Demo Project Loaded", details: "Loaded sample iron-ore collar dataset", projectId: defaultProject.id }], jobs: [], activeProjectId: defaultProject.id };
}
function makeDrillhole(row: string[], headers: string[], mapping: FieldMapping, project: Project, index: number): Drillhole {
  const get = (key: string) => row[Math.max(0, headers.indexOf(key))] ?? "";
  const easting = Number(get(mapping.easting)), northing = Number(get(mapping.northing)), elevation = Number(get(mapping.elevation)), maxDepth = Number(get(mapping.maxDepth));
  const warnings: string[] = []; if (!get(mapping.holeId)) warnings.push("Missing hole ID"); if (![easting, northing, elevation, maxDepth].every(Number.isFinite)) warnings.push("Non-numeric collar field"); if (maxDepth <= 0) warnings.push("Total depth must be greater than zero");
  const approved = project.epsg > 0; const distance = approved && Number.isFinite(easting) && Number.isFinite(northing) ? distanceToBoundary(easting, northing, project.boundary) : Infinity;
  const inside = approved && Number.isFinite(easting) && Number.isFinite(northing) && pointInPolygon(easting, northing, project.boundary);
  const boundaryStatus = !approved ? "crs_unknown" : distance < 2 ? "near_boundary" : inside ? "inside" : "outside";
  if (boundaryStatus === "outside") warnings.push("Transformed collar is outside approved project boundary");
  if (boundaryStatus === "near_boundary") warnings.push("Transformed collar is near the approved project boundary");
  return { id: `dh_${Date.now()}_${index}`, holeId: get(mapping.holeId) || `UNKNOWN_${index + 1}`, easting, northing, elevation, maxDepth, originalEasting: easting, originalNorthing: northing, sourceCrs: project.crs, transformationStatus: approved ? "approved" : "unknown", boundaryStatus, status: warnings.some((w) => w.includes("Missing") || w.includes("Non-numeric") || w.includes("outside")) ? "error" : warnings.length ? "warning" : "valid", warnings, projectId: project.id };
}

let memoryDb = initialState();
const listeners = new Set<() => void>();
function saveDb() { if (typeof localStorage !== "undefined") localStorage.setItem("smin_db_v2", JSON.stringify(memoryDb)); listeners.forEach((listener) => listener()); }
function audit(projectId: string, action: string, details: string) { memoryDb.audits.unshift({ id: `aud_${Date.now()}_${memoryDb.audits.length}`, timestamp: new Date().toISOString(), user: "local.user", action, details, projectId }); }

export function validateIntervals(rows: Array<{ holeId: string; from: number; to: number; recordType: Interval["recordType"]; code: string }>, projectId: string): Interval[] {
  const byHole = new Map<string, typeof rows>(); rows.forEach((row) => byHole.set(row.holeId, [...(byHole.get(row.holeId) ?? []), row]));
  return rows.map((row, index) => {
    const messages: string[] = []; if (!Number.isFinite(row.from) || !Number.isFinite(row.to)) messages.push("From and To must be numeric"); if (row.from < 0) messages.push("From cannot be negative"); if (row.to <= row.from) messages.push("To must be greater than From");
    const peers = byHole.get(row.holeId) ?? []; if (peers.some((peer) => peer !== row && peer.from < row.to && row.from < peer.to)) messages.push("Overlapping interval");
    return { id: `int_${Date.now()}_${index}`, holeId: row.holeId, from: row.from, to: row.to, code: row.code, recordType: row.recordType, values: {}, validation: messages.length ? "error" : "valid", messages, projectId };
  });
}

export const useSminDb = () => {
  const [state, setState] = useState<DBState>(memoryDb);
  useEffect(() => {
    const listener = () => setState({ ...memoryDb });
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  const activeProject = state.projects.find((p) => p.id === state.activeProjectId);
  const setActiveProject = (id: string) => { if (state.projects.some((p) => p.id === id)) { memoryDb.activeProjectId = id; audit(id, "Project Opened", "Opened project workspace"); saveDb(); } };
  const closeProject = () => { if (activeProject) audit(activeProject.id, "Project Closed", "Closed project workspace"); memoryDb.activeProjectId = null; saveDb(); };
  const saveProject = (project: Project) => { ProjectSchema.parse(project); memoryDb.projects = memoryDb.projects.map((p) => p.id === project.id ? project : p); audit(project.id, "Project Saved", "Saved project metadata and spatial controls"); saveDb(); };
  const addProject = (input: Omit<Project, "id" | "lastAccessed" | "epsg" | "folderPath" | "boundary"> & { epsg?: number; folderPath?: string; boundary?: Project["boundary"] }) => {
    const epsg = input.epsg ?? Number(input.crs.replace(/\D/g, "")); const project: Project = { ...input, id: `proj_${Date.now()}`, epsg, crs: `EPSG:${epsg}`, folderPath: input.folderPath ?? `projects/${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, boundary: input.boundary ?? boundary, lastAccessed: new Date().toISOString() }; ProjectSchema.parse(project); memoryDb.projects.push(project); memoryDb.mappings[project.id] = defaultMapping; memoryDb.activeProjectId = project.id; audit(project.id, "Project Created", `Created ${project.name}; project folder structure initialized`); saveDb();
  };
  const importDrillholes = (projectId: string, csvData: string, mapping: FieldMapping) => {
    const project = memoryDb.projects.find((p) => p.id === projectId); if (!project) throw new Error("Project is not open"); const { headers, rows } = parseCsv(csvData); const required = [mapping.holeId, mapping.easting, mapping.northing, mapping.elevation, mapping.maxDepth]; const missing = required.filter((field) => !headers.includes(field)); if (missing.length) throw new Error(`Missing mapped columns: ${missing.join(", ")}`);
    const imported = rows.map((row, index) => makeDrillhole(row, headers, mapping, project, index)); const seen = new Set<string>(); imported.forEach((hole) => { if (seen.has(hole.holeId)) { hole.status = "error"; hole.warnings.push("Duplicate hole ID"); } seen.add(hole.holeId); }); memoryDb.drillholes = [...memoryDb.drillholes.filter((d) => d.projectId !== projectId), ...imported]; memoryDb.mappings[projectId] = mapping; audit(projectId, "CSV Import", `Imported ${imported.length} collars with deterministic coordinate and boundary validation`); saveDb(); return imported;
  };
  const importIntervals = (projectId: string, csvData: string, mapping: FieldMapping) => {
    const project = memoryDb.projects.find((p) => p.id === projectId);
    if (!project) throw new Error("Project is not open");
    const { headers } = parseCsv(csvData);
    const missing = [mapping.holeId, mapping.from, mapping.to, mapping.code].filter((field) => !headers.includes(field));
    if (missing.length) throw new Error(`Missing interval columns: ${missing.join(", ")}`);
    const results = parseMappedIntervals(csvData, mapping, projectId);
    memoryDb.intervals = [...memoryDb.intervals.filter((i) => i.projectId !== projectId || i.recordType !== mapping.recordType), ...results];
    audit(projectId, "Interval Import", `Mapped and validated ${results.length} ${mapping.recordType} intervals`);
    saveDb();
    return results;
  };
  const addIntervals = (projectId: string, rows: Array<{ holeId: string; from: number; to: number; recordType: Interval["recordType"]; code: string }>) => { const results = validateIntervals(rows, projectId); memoryDb.intervals = [...memoryDb.intervals.filter((i) => i.projectId !== projectId || !rows.some((r) => r.holeId === i.holeId)), ...results]; audit(projectId, "Interval Validation", `Validated ${results.length} ${rows[0]?.recordType ?? "interval"} records`); saveDb(); return results; };
  const addJob = (projectId: string, type: string) => { const id = `job_${Date.now()}`; memoryDb.jobs.unshift({ id, projectId, type, status: "processing", progress: 15, startedAt: new Date().toISOString(), message: "Validation stage started" }); audit(projectId, "Processing Started", type); saveDb(); window.setTimeout(() => { const job = memoryDb.jobs.find((item) => item.id === id); if (job) { job.status = "completed"; job.progress = 100; job.completedAt = new Date().toISOString(); job.message = "Completed with persisted audit record"; saveDb(); } }, 650); };
  return { state, activeProject, projectDrillholes: state.drillholes.filter((d) => d.projectId === state.activeProjectId), projectIntervals: state.intervals.filter((i) => i.projectId === state.activeProjectId), projectAudits: state.audits.filter((a) => a.projectId === state.activeProjectId), projectJobs: state.jobs.filter((j) => j.projectId === state.activeProjectId), mapping: activeProject ? state.mappings[activeProject.id] ?? defaultMapping : defaultMapping, setActiveProject, closeProject, saveProject, addProject, importDrillholes, importIntervals, addIntervals, addJob };
};