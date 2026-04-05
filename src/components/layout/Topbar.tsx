import { Search, Bell, Menu, LogOut, MapPin, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/contexts/BranchContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

const Topbar = ({ onMobileMenuToggle }: TopbarProps) => {
  const { user, logout, isAdmin } = useAuth();
  const { branches, selectedBranch, setSelectedBranch } = useBranches();

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <header className="sticky top-0 z-40 h-16 bg-card/80 backdrop-blur-lg border-b border-border flex items-center px-4 md:px-6 gap-4">
      {/* Mobile menu */}
      <button onClick={onMobileMenuToggle} className="md:hidden text-muted-foreground hover:text-foreground">
        <Menu className="w-5 h-5" />
      </button>

      {/* Branch Selector (For Admin) or Display (For Seller) */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
        <MapPin className="w-3.5 h-3.5 text-primary" />
        {isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-primary transition-colors outline-none">
                {selectedBranch ? selectedBranch.name : "Visión Global"}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Cambiar Sucursal</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedBranch(null)}>
                Visión Global (Todas)
              </DropdownMenuItem>
              {branches.map((b) => (
                <DropdownMenuItem key={b.id} onClick={() => setSelectedBranch(b)}>
                  {b.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-xs font-semibold">
            {selectedBranch?.name || "Sin Sucursal Asignada"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 pl-3 border-l border-border cursor-pointer hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-none">{user?.name || "Cargando..."}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">
                  {isAdmin ? "Administrador" : "Cajero / Vendedor"}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground cursor-default">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Topbar;
