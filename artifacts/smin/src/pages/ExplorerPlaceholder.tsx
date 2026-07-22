import React from "react";
import { Map, Lock } from "lucide-react";

export function ExplorerPlaceholder() {
  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto w-full items-center justify-center relative bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03]">
      <div className="max-w-md w-full bg-card border border-card-border p-8 rounded-lg text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 bg-muted/50 rounded-bl text-xs font-mono text-muted-foreground border-b border-l border-border flex items-center gap-1">
          <Lock className="w-3 h-3" /> Phase 2 Module
        </div>

        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Map className="w-10 h-10 text-primary opacity-80" />
        </div>

        <h2 className="text-2xl font-mono font-bold mb-3 text-foreground">
          Spatial Explorer
        </h2>
        <p className="text-muted-foreground font-sans text-sm mb-8 leading-relaxed">
          The interactive 3D block model viewer and spatial correlation engine
          is slated for Phase 2. Currently building topological indexing
          capabilities in the backend.
        </p>

        <div className="bg-secondary/10 border border-secondary/20 p-4 rounded text-left font-mono text-xs text-secondary-foreground space-y-2">
          <div className="flex justify-between items-center border-b border-secondary/10 pb-2">
            <span>WebGL Renderer</span>
            <span className="text-yellow-600 dark:text-yellow-400">In Dev</span>
          </div>
          <div className="flex justify-between items-center border-b border-secondary/10 pb-2">
            <span>Variogram Modeling UI</span>
            <span className="text-yellow-600 dark:text-yellow-400">In Dev</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Point Cloud Streaming</span>
            <span className="text-muted-foreground">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
