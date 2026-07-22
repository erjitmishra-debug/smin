import React from "react";
import { useSminDb } from "../hooks/use-local-db";
import { Activity, Play, CheckCircle2, XCircle, Clock } from "lucide-react";

export function ProcessingQueue() {
  const { activeProject, projectJobs, addJob } = useSminDb();

  if (!activeProject) {
    return <div className="p-8 font-mono">No active project.</div>;
  }

  const triggerJob = (type: string) => {
    addJob(activeProject.id, type);
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight mb-2">
            Processing Queue
          </h1>
          <p className="text-muted-foreground text-sm font-sans">
            Monitor heavy computational tasks and block model updates.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => triggerJob("Variogram Computation")}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded font-mono text-sm hover:bg-secondary/80 transition-colors"
          >
            <Play className="w-4 h-4" /> Compute Variogram
          </button>
          <button
            onClick={() => triggerJob("Block Model Update")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-mono text-sm hover:bg-primary/90 transition-colors"
          >
            <Play className="w-4 h-4" /> Update Block Model
          </button>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded overflow-hidden">
        <table className="w-full text-sm font-mono text-left whitespace-nowrap">
          <thead className="bg-muted/30">
            <tr className="text-muted-foreground border-b border-border">
              <th className="py-3 px-4 font-normal">Job ID</th>
              <th className="py-3 px-4 font-normal">Task Type</th>
              <th className="py-3 px-4 font-normal">Status</th>
              <th className="py-3 px-4 font-normal w-1/3">Progress</th>
              <th className="py-3 px-4 font-normal text-right">Started</th>
            </tr>
          </thead>
          <tbody>
            {projectJobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-border/50 hover:bg-muted/10 transition-colors"
              >
                <td className="py-4 px-4 font-medium text-muted-foreground">
                  {job.id.replace("job_", "")}
                </td>
                <td className="py-4 px-4 font-bold">{job.type}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {job.status === "completed" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {job.status === "processing" && (
                      <Activity className="w-4 h-4 text-primary animate-pulse" />
                    )}
                    {job.status === "queued" && (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    )}
                    {job.status === "failed" && (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="capitalize">{job.status}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${job.status === "completed" ? "bg-green-500" : job.status === "failed" ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {job.progress}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right text-muted-foreground">
                  {job.startedAt
                    ? new Date(job.startedAt).toLocaleTimeString()
                    : "-"}
                </td>
              </tr>
            ))}
            {projectJobs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No processing jobs recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
