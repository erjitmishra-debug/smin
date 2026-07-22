import { useMemo, useState } from "react";
import { Map, Crosshair, Box, Info } from "lucide-react";
import { useSminDb } from "../hooks/use-local-db";

export function SpatialExplorer() {
  const { activeProject, projectDrillholes } = useSminDb();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedHole = projectDrillholes.find((hole) => hole.id === selected);
  const bounds = useMemo(() => {
    if (!activeProject) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    return {
      minX: Math.min(...activeProject.boundary.map((point) => point.easting)),
      maxX: Math.max(...activeProject.boundary.map((point) => point.easting)),
      minY: Math.min(...activeProject.boundary.map((point) => point.northing)),
      maxY: Math.max(...activeProject.boundary.map((point) => point.northing)),
    };
  }, [activeProject]);
  if (!activeProject) return <div className="p-8 font-mono">No active project.</div>;
  const px = (easting: number) => 8 + ((easting - bounds.minX) / (bounds.maxX - bounds.minX)) * 84;
  const py = (northing: number) => 92 - ((northing - bounds.minY) / (bounds.maxY - bounds.minY)) * 84;
  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto w-full">
      <div className="mb-6">
        <div className="flex items-center gap-3"><h1 className="text-2xl font-mono font-bold">Spatial QA Viewer</h1><span className="text-xs font-mono border border-primary/40 text-primary px-2 py-1 rounded">PHASE 1</span></div>
        <p className="text-muted-foreground text-sm mt-2">Approved CRS: {activeProject.crs}. Boundary classification uses transformed project coordinates before inside/outside status is assigned.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 min-h-[560px]">
        <div className="bg-card border border-card-border rounded p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3"><div className="font-mono font-bold flex gap-2 items-center"><Map className="w-4 h-4 text-primary" /> Boundary + collar plan</div><div className="text-xs font-mono text-muted-foreground">E {bounds.minX.toFixed(0)}–{bounds.maxX.toFixed(0)} / N {bounds.minY.toFixed(0)}–{bounds.maxY.toFixed(0)}</div></div>
          <div className="relative flex-1 min-h-[470px] rounded border border-border overflow-hidden bg-slate-950">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)", backgroundSize: "10% 10%" }} />
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <polygon points={activeProject.boundary.map((point) => `${px(point.easting)},${py(point.northing)}`).join(" ")} fill="rgba(232, 117, 59, .12)" stroke="#e8753b" strokeWidth=".6" />
              {projectDrillholes.map((hole) => <g key={hole.id} onClick={() => setSelected(hole.id)} className="cursor-pointer"><line x1={px(hole.easting)} y1={py(hole.northing)} x2={px(hole.easting) + 1.3} y2={Math.min(96, py(hole.northing) + hole.maxDepth / 20)} stroke={hole.status === "error" ? "#ef4444" : hole.status === "warning" ? "#eab308" : "#40d49b"} strokeWidth=".8" /><circle cx={px(hole.easting)} cy={py(hole.northing)} r={selected === hole.id ? "1.8" : "1.2"} fill={hole.status === "error" ? "#ef4444" : hole.status === "warning" ? "#eab308" : "#40d49b"} stroke="#0f172a" strokeWidth=".5" /></g>)}
            </svg>
            <div className="absolute left-3 top-3 text-[10px] font-mono text-slate-400">N ↑</div><div className="absolute left-3 bottom-3 text-[10px] font-mono text-slate-400">PROJECT CRS / PLAN VIEW</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded p-4"><h3 className="font-mono font-bold mb-4 flex items-center gap-2"><Crosshair className="w-4 h-4 text-primary" /> Selected object</h3>{selectedHole ? <div className="space-y-3 text-sm font-mono"><div className="text-lg font-bold">{selectedHole.holeId}</div><div className="grid grid-cols-2 gap-2 text-muted-foreground"><span>Easting {selectedHole.easting.toFixed(2)}</span><span>Northing {selectedHole.northing.toFixed(2)}</span><span>Elevation {selectedHole.elevation.toFixed(2)}</span><span>Depth {selectedHole.maxDepth.toFixed(2)} m</span></div><div className="border-t border-border pt-3"><div>Status: <span className="text-primary">{selectedHole.boundaryStatus}</span></div><div>Transform: {selectedHole.transformationStatus}</div></div>{selectedHole.warnings.length > 0 && <div className="text-yellow-500 text-xs">{selectedHole.warnings.join(" / ")}</div>}</div> : <p className="text-sm text-muted-foreground">Select a collar or trace in the viewer.</p>}</div>
          <div className="bg-card border border-card-border rounded p-4 space-y-3"><h3 className="font-mono font-bold flex items-center gap-2"><Box className="w-4 h-4 text-primary" /> Trace display</h3><div className="text-xs text-muted-foreground">Traces are rendered from collar elevation and total depth. This is a presentation-ready Phase 1 line viewer; solids and block models are not yet developed.</div><div className="flex gap-4 text-xs font-mono"><span className="text-emerald-400">{projectDrillholes.filter((hole) => hole.status === "valid").length} valid</span><span className="text-yellow-400">{projectDrillholes.filter((hole) => hole.status === "warning").length} warning</span><span className="text-red-400">{projectDrillholes.filter((hole) => hole.status === "error").length} error</span></div></div>
          <div className="bg-primary/10 border border-primary/20 rounded p-4 flex gap-3"><Info className="w-4 h-4 text-primary shrink-0" /><p className="text-xs text-muted-foreground">Coordinate status is only calculated after the source and project CRS are approved. Original coordinates remain available in the properties panel.</p></div>
        </div>
      </div>
    </div>
  );
}