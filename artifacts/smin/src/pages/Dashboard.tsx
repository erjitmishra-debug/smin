import React from "react";
import { useSminDb } from "../hooks/use-local-db";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Info,
} from "lucide-react";
import { Link } from "wouter";

export function Dashboard() {
  const { activeProject, projectDrillholes, projectJobs } = useSminDb();

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center h-full">
        <Database className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-mono mb-2">No Active Project</h2>
        <p className="max-w-md mb-6">
          Select or create a project to access the workspace capabilities.
        </p>
        <Link
          href="/projects"
          className="bg-primary text-primary-foreground px-4 py-2 rounded font-mono hover:bg-primary/90 transition-colors"
        >
          Go to Project Explorer
        </Link>
      </div>
    );
  }

  const validHoles = projectDrillholes.filter(
    (d) => d.status === "valid",
  ).length;
  const warningHoles = projectDrillholes.filter(
    (d) => d.status === "warning",
  ).length;
  const errorHoles = projectDrillholes.filter(
    (d) => d.status === "error",
  ).length;

  const activeJobs = projectJobs.filter(
    (j) => j.status === "queued" || j.status === "processing",
  ).length;

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold tracking-tight mb-2">
          Workspace Overview
        </h1>
        <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
          <span className="bg-accent/10 text-accent px-2 py-1 rounded border border-accent/20">
            {activeProject.commodity}
          </span>
          <span className="flex items-center gap-1">
            <Info className="w-4 h-4" /> {activeProject.crs}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-card-border p-4 rounded flex flex-col justify-between">
          <div className="text-muted-foreground font-mono text-sm uppercase mb-2">
            Total Drillholes
          </div>
          <div className="text-3xl font-bold font-mono">
            {projectDrillholes.length}
          </div>
        </div>

        <div className="bg-card border border-card-border p-4 rounded flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <div className="text-muted-foreground font-mono text-sm uppercase mb-2">
            Valid Collars
          </div>
          <div className="text-3xl font-bold font-mono text-green-600 dark:text-green-400">
            {validHoles}
          </div>
        </div>

        <div className="bg-card border border-card-border p-4 rounded flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="text-muted-foreground font-mono text-sm uppercase mb-2">
            Warnings
          </div>
          <div className="text-3xl font-bold font-mono text-yellow-600 dark:text-yellow-400">
            {warningHoles}
          </div>
        </div>

        <div className="bg-card border border-card-border p-4 rounded flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <div className="text-muted-foreground font-mono text-sm uppercase mb-2">
            Active Jobs
          </div>
          <div className="text-3xl font-bold font-mono">{activeJobs}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
        <div className="lg:col-span-2 bg-card border border-card-border rounded flex flex-col">
          <div className="p-4 border-b border-card-border flex justify-between items-center">
            <h3 className="font-mono font-bold">Recent Drillholes</h3>
            <Link
              href="/import"
              className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80 transition-colors font-mono"
            >
              Import New
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-sm font-mono text-left whitespace-nowrap">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="pb-2 font-normal">Hole ID</th>
                  <th className="pb-2 font-normal text-right">Easting</th>
                  <th className="pb-2 font-normal text-right">Northing</th>
                  <th className="pb-2 font-normal text-right">Max Depth</th>
                  <th className="pb-2 font-normal text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectDrillholes.slice(0, 10).map((dh) => (
                  <tr
                    key={dh.id}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <td className="py-3 font-medium">{dh.holeId}</td>
                    <td className="py-3 text-right">{dh.easting.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      {dh.northing.toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      {dh.maxDepth.toFixed(2)}m
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          dh.status === "valid"
                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                            : dh.status === "warning"
                              ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                              : "bg-red-500/20 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {dh.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {projectDrillholes.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No drillholes found. Import data to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded flex flex-col">
          <div className="p-4 border-b border-card-border">
            <h3 className="font-mono font-bold">Workspace Health</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-4">
            {errorHoles > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <div className="font-bold text-sm mb-1 text-destructive font-mono">
                    CRITICAL DATA ERRORS
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {errorHoles} holes have fatal validation errors and will be
                    excluded from domain modeling.
                  </div>
                </div>
              </div>
            )}
            {warningHoles > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded flex gap-3 items-start">
                <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm mb-1 text-yellow-600 dark:text-yellow-400 font-mono">
                    DATA WARNINGS
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {warningHoles} holes have minor warnings. Review before
                    resource estimation.
                  </div>
                </div>
              </div>
            )}
            {errorHoles === 0 &&
              warningHoles === 0 &&
              projectDrillholes.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  <div>
                    <div className="font-bold text-sm mb-1 text-green-600 dark:text-green-400 font-mono">
                      ALL SYSTEMS NOMINAL
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Collar and assay data validated. Ready for downstream
                      processing.
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
