import React from "react";
import { useSminDb } from "../hooks/use-local-db";
import { History, Search } from "lucide-react";

export function AuditLog() {
  const { activeProject, projectAudits } = useSminDb();

  if (!activeProject) {
    return <div className="p-8 font-mono">No active project.</div>;
  }

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold tracking-tight mb-2">
          Audit Log
        </h1>
        <p className="text-muted-foreground text-sm font-sans">
          Immutable record of data mutations and workspace state changes.
        </p>
      </div>

      <div className="bg-card border border-card-border rounded overflow-hidden flex flex-col h-full min-h-[400px]">
        <div className="p-4 border-b border-card-border bg-muted/20 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by action or user..."
              className="w-full bg-input border border-border rounded pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="relative border-l-2 border-border ml-4 space-y-8 pb-8">
            {projectAudits.map((audit) => (
              <div key={audit.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-foreground">
                      {audit.action}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {audit.user}
                    </span>
                  </div>
                  <div className="text-sm font-sans text-muted-foreground">
                    {audit.details}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground/60 mt-1">
                    {new Date(audit.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {projectAudits.length === 0 && (
              <div className="pl-6 text-muted-foreground font-mono text-sm">
                No audit events recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
