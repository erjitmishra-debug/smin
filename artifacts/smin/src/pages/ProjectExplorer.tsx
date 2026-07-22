import React, { useState } from "react";
import { useSminDb } from "../hooks/use-local-db";
import { useLocation } from "wouter";
import { FolderGit2, Plus, ArrowRight } from "lucide-react";
import { nativeCloseProject, nativeOpenProject, nativeSaveProject } from "../lib/native";

export function ProjectExplorer() {
  const { state, setActiveProject, closeProject } = useSminDb();
  const [, setLocation] = useLocation();
  const { projects, activeProjectId } = state;

  const handleSelect = async (id: string) => {
    const project = projects.find((item) => item.id === id);
    try {
      if (project) await nativeOpenProject(project.folderPath);
    } catch (error) {
      console.error("Native project open failed", error);
    }
    setActiveProject(id);
    setLocation("/");
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight mb-2">
            Project Explorer
          </h1>
          <p className="text-muted-foreground text-sm font-sans">
            Select a workspace or establish a new project environment.
          </p>
        </div>
        <button
          onClick={() => setLocation("/setup")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-mono text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            onClick={() => handleSelect(proj.id)}
            className={`cursor-pointer group relative bg-card border rounded p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${activeProjectId === proj.id ? "border-primary shadow-md" : "border-card-border hover:border-primary/50"}`}
          >
            {activeProjectId === proj.id && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl">
                Active
              </div>
            )}

            <div className="flex items-start gap-3 mb-4">
              <div
                className={`p-2 rounded bg-muted/50 ${activeProjectId === proj.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
              >
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-lg leading-tight">
                  {proj.name}
                </h3>
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  {proj.commodity}
                </div>
              </div>
            </div>

            <div className="text-sm font-sans text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
              {proj.description || "No description provided."}
            </div>

            <div className="flex justify-between items-center border-t border-border pt-4 mt-auto">
              <div className="text-xs font-mono text-muted-foreground/80">
                Accessed: {new Date(proj.lastAccessed).toLocaleDateString()}
              </div>
              <ArrowRight
                className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${activeProjectId === proj.id ? "text-primary" : "text-muted-foreground/30 group-hover:text-primary/70"}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 border-t border-border pt-4 flex justify-between items-center">
        <span className="text-xs font-mono text-muted-foreground">Open projects are stored in the local project database.</span>
        {activeProjectId && <div className="flex gap-2">
          <button onClick={() => void nativeSaveProject()} className="border border-border px-3 py-2 rounded text-xs font-mono hover:bg-muted">Save project</button>
          <button onClick={async () => { await nativeCloseProject(); closeProject(); }} className="border border-border px-3 py-2 rounded text-xs font-mono hover:bg-muted">Close active project</button>
        </div>}
      </div>
    </div>
  );
}
