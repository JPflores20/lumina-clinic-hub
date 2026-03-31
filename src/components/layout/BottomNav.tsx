import { LayoutDashboard, ShoppingCart, Users, MoreHorizontal } from "lucide-react";

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const items = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "pos", label: "POS", icon: ShoppingCart },
  { id: "patients", label: "Patients", icon: Users },
  { id: "settings", label: "Menu", icon: MoreHorizontal },
];

const BottomNav = ({ activeView, onNavigate }: BottomNavProps) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
