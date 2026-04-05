import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

const Topbar = ({ onMobileMenuToggle }: TopbarProps) => {
  return (
    <header className="sticky top-0 z-40 h-16 bg-card/80 backdrop-blur-lg border-b border-border flex items-center px-4 md:px-6 gap-4">
      {/* Mobile menu */}
      <button onClick={onMobileMenuToggle} className="md:hidden text-muted-foreground hover:text-foreground">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pacientes, productos, pedidos..."
          className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary h-9 rounded-lg"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground border-2 border-card">
            3
          </Badge>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none">Admin</p>
            <p className="text-xs text-muted-foreground">Gerente</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
