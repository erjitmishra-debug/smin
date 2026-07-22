import React, { useState } from "react";
import { useSminDb } from "../hooks/use-local-db";
import { useLocation } from "wouter";
import { Settings, Save } from "lucide-react";
import { nativeCreateProject } from "../lib/native";

export function ProjectSetup() {
  const { addProject } = useSminDb();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    name: "",
    commodity: "Gold (Au)",
    crs: "EPSG:28350",
    description: "",
  });

  const [nativeError, setNativeError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.crs) return;
    try {
      await nativeCreateProject(".", {
        name: form.name,
        commodity: form.commodity,
        epsg: Number(form.crs.replace(/\D/g, "")),
        description: form.description,
        folder: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      });
    } catch (error) {
      setNativeError(error instanceof Error ? error.message : "Native project creation failed");
      return;
    }
    addProject(form);
    setLocation("/");
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold tracking-tight mb-2 flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" /> Project Setup
        </h1>
        <p className="text-muted-foreground text-sm font-sans">
          Establish spatial parameters and metadata for a new workspace.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-card-border rounded p-6 flex flex-col gap-6 shadow-sm"
      >
        {nativeError && <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm font-mono text-destructive">{nativeError}</div>}
        <div className="space-y-2">
          <label className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
            Project Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full bg-input border border-border rounded px-4 py-2 font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="e.g. Northern Flank Extension"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
              Target Commodity
            </label>
            <select
              className="w-full bg-input border border-border rounded px-4 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              value={form.commodity}
              onChange={(e) => setForm({ ...form, commodity: e.target.value })}
            >
              <option value="Gold (Au)">Gold (Au)</option>
              <option value="Iron Ore (Fe)">Iron Ore (Fe)</option>
              <option value="Copper (Cu)">Copper (Cu)</option>
              <option value="Lithium (Li)">Lithium (Li)</option>
              <option value="Nickel (Ni)">Nickel (Ni)</option>
              <option value="Base Metals">Base Metals (Poly)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
              Coordinate Sys (CRS) <span className="text-destructive">*</span>
            </label>
            <select
              required
              className="w-full bg-input border border-border rounded px-4 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              value={form.crs}
              onChange={(e) => setForm({ ...form, crs: e.target.value })}
            >
              <option value="EPSG:28350">EPSG:28350 — GDA94 / MGA zone 50</option>
              <option value="EPSG:32750">EPSG:32750 — WGS 84 / UTM zone 50S</option>
              <option value="EPSG:4326">EPSG:4326 — WGS 84 geographic</option>
              <option value="EPSG:3857">EPSG:3857 — Web Mercator</option>
            </select>
            <p className="text-xs text-muted-foreground font-sans">
              Must match drillhole payload coordinates.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono font-bold uppercase tracking-wide text-foreground">
            Description
          </label>
          <textarea
            className="w-full h-24 bg-input border border-border rounded p-4 font-sans text-sm focus:outline-none focus:border-primary resize-none"
            placeholder="Brief scope of work or campaign details..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="border-t border-border pt-6 mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setLocation("/projects")}
            className="px-6 py-2 rounded font-mono font-bold hover:bg-muted transition-colors border border-transparent hover:border-border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!form.name || !form.crs}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded font-mono font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Initialize Project
          </button>
        </div>
      </form>
    </div>
  );
}
