import React from "react";
import { Link, useLocation } from "wouter";
import {
  Database,
  Map as MapIcon,
  Activity,
  Settings,
  FileSpreadsheet,
  Layers,
  History,
  Moon,
  Sun,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "../hooks/use-theme";
import { useSminDb } from "../hooks/use-local-db";

export function Sidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { activeProject } = useSminDb();

  const navItems = [
    { label: "Project Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Drillhole Import", path: "/import", icon: FileSpreadsheet },
    { label: "Processing Queue", path: "/processing", icon: Activity },
    { label: "Spatial Explorer", path: "/explorer", icon: MapIcon },
    { label: "Audit Log", path: "/audit", icon: History },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col font-mono text-sm">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-sidebar-primary font-bold tracking-wider">
          <Layers className="w-5 h-5" />
          <span>SMIN</span>
        </div>
        <button
          onClick={toggleTheme}
          className="text-sidebar-foreground hover:text-sidebar-primary transition-colors"
          title="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/30">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-sans font-semibold">
          Active Project
        </div>
        <div className="flex items-center gap-2 justify-between">
          <div
            className="truncate font-medium text-sidebar-foreground"
            title={activeProject?.name || "No Project"}
          >
            {activeProject?.name || "No Project"}
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 px-3">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-3 font-sans font-semibold">
            Workspace Config
          </div>
          <Link
            href="/projects"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === "/projects" ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
          >
            <Database className="w-4 h-4" />
            <span>Switch Project</span>
          </Link>
          <Link
            href="/setup"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === "/setup" ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
          >
            <Settings className="w-4 h-4" />
            <span>Project Settings</span>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground flex justify-between items-center">
          <span>Phase 1 · offline</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>{" "}
          Local DB Active
        </span>
      </div>
    </div>
  );
}
