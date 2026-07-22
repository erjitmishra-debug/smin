import React, { useState } from "react";
import { SAMPLE_CSV, type FieldMapping, useSminDb } from "../hooks/use-local-db";
import { FileSpreadsheet, UploadCloud, AlertCircle } from "lucide-react";

export function ImportPage() {
  const { activeProject, importDrillholes, importIntervals, mapping, projectDrillholes, projectIntervals } = useSminDb();
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<{ count: number; errors: number } | null>(null);
  const [error, setError] = useState("");
  const [intervalResult, setIntervalResult] = useState<{ count: number; errors: number } | null>(null);
  const [map, setMap] = useState<FieldMapping>(mapping);

  if (!activeProject) {
    return <div className="p-8 font-mono">No active project.</div>;
  }

  const handleImport = () => {
    if (!csvText.trim()) return;
    try {
      const imported = importDrillholes(activeProject.id, csvText, map);
      setResult({ count: imported.length, errors: imported.filter((hole) => hole.status === "error").length });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed");
      setResult(null);
    }
    setCsvText("");
  };

  const loadSample = () => setCsvText(SAMPLE_CSV);
  const fields = Object.keys(map) as Array<keyof FieldMapping>;
  const handleIntervals = () => {
    if (!csvText.trim()) return;
    try {
      const imported = importIntervals(activeProject.id, csvText, map);
      setIntervalResult({ count: imported.length, errors: imported.filter((interval) => interval.validation === "error").length });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Interval validation failed");
      setIntervalResult(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold tracking-tight mb-2">
          Drillhole Import Workflow
        </h1>
        <p className="text-muted-foreground text-sm font-sans">
          Paste collar CSV data to validate and ingest into the spatial index.
        </p>
      </div>

      {result && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded mb-6 flex items-center gap-3">
          <UploadCloud className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="font-mono text-sm text-green-700 dark:text-green-300">
            Successfully ingested {result.count} collars; {result.errors} critical records require review.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-card border border-card-border rounded flex flex-col">
            <div className="p-4 border-b border-card-border bg-muted/20 flex justify-between items-center">
              <h3 className="font-mono font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> CSV Payload
              </h3>
              <button
                onClick={loadSample}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80 transition-colors font-mono"
              >
                Load Sample
              </button>
            </div>
            <div className="p-4">
              <textarea
                className="w-full h-64 bg-input border border-border rounded p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/50"
                placeholder="HOLE_ID, EASTING, NORTHING, ELEVATION, MAX_DEPTH&#10;..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-t border-card-border">
              {fields.filter((field) => field !== "recordType").map((field) => (
                <label key={field} className="text-xs font-mono text-muted-foreground uppercase">
                  {field}
                  <input value={map[field]} onChange={(event) => setMap({ ...map, [field]: event.target.value })} className="mt-1 w-full bg-input border border-border rounded px-2 py-1 text-foreground normal-case" />
                </label>
              ))}
              <label className="text-xs font-mono text-muted-foreground uppercase">record type
                <select value={map.recordType} onChange={(event) => setMap({ ...map, recordType: event.target.value as FieldMapping["recordType"] })} className="mt-1 w-full bg-input border border-border rounded px-2 py-1 text-foreground normal-case">
                  <option value="survey">Survey</option><option value="lithology">Lithology</option><option value="assay">Assay</option>
                </select>
              </label>
            </div>
            <div className="p-4 border-t border-card-border bg-muted/10 flex justify-end">
              <button
                onClick={handleImport}
                disabled={!csvText.trim()}
                className="bg-primary text-primary-foreground px-6 py-2 rounded font-mono font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Validate & Import
              </button>
              <button
                onClick={handleIntervals}
                disabled={!csvText.trim()}
                className="ml-2 border border-primary text-primary px-4 py-2 rounded font-mono font-bold hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Validate mapped intervals
              </button>
            </div>
          </div>
          {error && <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm font-mono text-destructive">{error}</div>}
          {intervalResult && <div className="bg-primary/10 border border-primary/20 rounded p-3 text-sm font-mono text-primary">Validated {intervalResult.count} {map.recordType} intervals; {intervalResult.errors} errors. Persisted interval records: {projectIntervals.length}.</div>}
          {projectDrillholes.length > 0 && <div className="text-xs font-mono text-muted-foreground">Current project records: {projectDrillholes.length}. Re-import replaces the project collar table.</div>}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card border border-card-border rounded p-4">
            <h3 className="font-mono font-bold mb-3 border-b border-border pb-2">
              Format Requirements
            </h3>
            <ul className="text-sm font-sans space-y-3 text-muted-foreground">
              <li>
                Header row is{" "}
                <strong className="text-foreground">strictly required</strong>.
              </li>
              <li>
                Expected columns in order:
                <div className="font-mono text-xs bg-muted/50 p-2 rounded mt-1 text-foreground">
                  HOLE_ID, EASTING, NORTHING, ELEVATION, MAX_DEPTH
                </div>
              </li>
              <li>
                Coordinates must be in project CRS:{" "}
                <span className="font-mono text-xs text-primary">
                  {activeProject.crs}
                </span>
              </li>
              <li>Values must be numeric.</li>
            </ul>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
            <h3 className="font-mono font-bold mb-2 flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" /> Strict Validation
            </h3>
            <p className="text-xs font-sans text-destructive-foreground/80">
              During ingestion, collars are cross-referenced with the
              topographic DTM. Discrepancies &gt;2m will trigger warnings.
              Overlapping assay intervals will cause hard errors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
