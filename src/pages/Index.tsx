import { useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import Topbar from "@/components/layout/Topbar";
import BottomNav from "@/components/layout/BottomNav";
import DashboardView from "@/components/dashboard/DashboardView";
import POSView from "@/components/pos/POSView";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case "pos":
        return <POSView />;
      case "dashboard":
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {renderView()}
        </main>
      </div>

      <BottomNav activeView={activeView} onNavigate={setActiveView} />
    </div>
  );
};

export default Index;
