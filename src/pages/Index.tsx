import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import Topbar from "@/components/layout/Topbar";
import BottomNav from "@/components/layout/BottomNav";
import DashboardView from "@/components/dashboard/DashboardView";
import POSView from "@/components/pos/POSView";
import InventoryView from "@/components/inventory/InventoryView";
import OrdersView from "@/components/orders/OrdersView";
import PatientsView from "@/components/patients/PatientsView";
import QuotationsView from "@/components/quotations/QuotationsView";
import AdminPanel from "@/pages/Admin";

const Index = () => {
  const { isSeller } = useAuth();
  const [activeView, setActiveView] = useState(isSeller ? "pos" : "dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case "pos":
        return <POSView />;
      case "patients":
        return <PatientsView />;
      case "inventory":
        return <InventoryView />;
      case "orders":
        return <OrdersView />;
      case "quotations":
        return <QuotationsView />;
      case "admin":
        return <AdminPanel />;
      case "eye-exam":
      case "settings":
        return <PatientsView />; // Temporal mientras se crean vistas específicas
      case "dashboard":
      default:
        return <DashboardView onNavigate={setActiveView} />;
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
