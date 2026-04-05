import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Eye,
  Package,
  ClipboardList,
  Settings,
  ChevronLeft,
} from "lucide-react";

interface AppSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Tablero", icon: LayoutDashboard },
  { id: "pos", label: "Ventas POS", icon: ShoppingCart },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "eye-exam", label: "Examen Visual", icon: Eye },
  { id: "inventory", label: "Inventario", icon: Package },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "settings", label: "Configuración", icon: Settings },
];

const AppSidebar = ({ activeView, onNavigate, collapsed, onToggleCollapse }: AppSidebarProps) => {
  return (
    <aside
      className={`hidden md:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 h-screen sticky top-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(187,90%,50%)] to-[hsl(168,70%,40%)] flex items-center justify-center flex-shrink-0">
          <Eye className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-white tracking-tight">Lumina</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-white border-l-[3px] border-[hsl(var(--cyan-accent))]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white border-l-[3px] border-transparent"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground hover:text-white transition-colors"
      >
        <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </aside>
  );
};

export default AppSidebar;
