import { Route, Switch, Router as WouterRouter } from "wouter";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { ImportPage } from "./pages/ImportPage";
import { ProjectExplorer } from "./pages/ProjectExplorer";
import { ProjectSetup } from "./pages/ProjectSetup";
import { ProcessingQueue } from "./pages/ProcessingQueue";
import { AuditLog } from "./pages/AuditLog";
import { SpatialExplorer } from "./pages/SpatialExplorer";

function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-mono font-bold text-primary mb-2">404</h1>
      <p className="text-muted-foreground font-mono">
        Module not found or offline.
      </p>
    </div>
  );
}

function Router() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={ProjectExplorer} />
          <Route path="/setup" component={ProjectSetup} />
          <Route path="/import" component={ImportPage} />
          <Route path="/processing" component={ProcessingQueue} />
          <Route path="/audit" component={AuditLog} />
          <Route path="/explorer" component={SpatialExplorer} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
