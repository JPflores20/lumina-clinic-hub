import {
  DollarSign,
  TrendingUp,
  CalendarCheck,
  PackageOpen,
  ShoppingCart,
  FileText,
  ClipboardList,
  CalendarPlus,
  UserPlus,
  Eye,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  Search,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinancials } from "@/hooks/useFinancials";
import { useInventory } from "@/hooks/useInventory";
import { useOrders } from "@/hooks/useOrders";
import { useEffect, useState } from "react";
import { Transaction } from "@/types/financial";

interface DashboardViewProps {
  onNavigate?: (view: string) => void;
}

interface QuickAction {
  label: string;
  icon: LucideIcon;
  color: string;
  view: string;
}

const quickActions: QuickAction[] = [
  { label: "Nueva venta", icon: ShoppingCart, color: "text-primary", view: "pos" },
  { label: "Cotización", icon: FileText, color: "text-info", view: "quotations" },
  { label: "Nuevo pedido", icon: ClipboardList, color: "text-warning", view: "orders" },
  { label: "Agendar cita", icon: CalendarPlus, color: "text-success", view: "patients" },
  { label: "Nuevo paciente", icon: UserPlus, color: "text-primary", view: "patients" },
  { label: "Examen vista", icon: Eye, color: "text-[hsl(270,60%,55%)]", view: "eye-exam" },
];

const DashboardView = ({ onNavigate }: DashboardViewProps) => {
  const { getFinancialSummary, isLoading: loadingFinances } = useFinancials();
  const { fetchProducts } = useInventory();
  const { fetchOrders } = useOrders();
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeAlerts, setActiveAlerts] = useState<{text: string, type: "warning" | "destructive" | "success"}[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    const fetchTxs = async () => {
      const summary = await getFinancialSummary();
      setTotalIncome(summary.income);
      
      const now = new Date();
      let todayIncObj = 0;
      
      // Filtramos las ventas de hoy y ordenamos temporalmente para las recientes
      const todayString = now.toISOString().split("T")[0];
      
      summary.transactions.forEach(t => {
        if (t.type === "INCOME" && t.date.startsWith(todayString)) {
           todayIncObj += t.amount;
        }
      });
      
      setTodayIncome(todayIncObj);
      setAllTransactions(summary.transactions);
      setRecentTransactions(summary.transactions.slice(0, 5)); // Mostrar sólo 5

      // Fetch dynamic alerts data
      const products = await fetchProducts();
      const fetchedOrders = await fetchOrders();

      const newAlerts: {text: string, type: "warning" | "destructive" | "success"}[] = [];
      const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);
      const outOfStockProducts = products.filter(p => p.stock <= 0);

      newAlerts.push(
         ...outOfStockProducts.map(p => ({ 
             text: `Agotado: ${p.name}`, 
             type: "destructive" as const 
         }))
      );
      newAlerts.push(
         ...lowStockProducts.map(p => ({ 
             text: `Stock bajo en ${p.name} (${p.stock} pz)`, 
             type: "warning" as const 
         }))
      );

      const pending = fetchedOrders.filter(o => o.status === "PENDING" || o.status === "IN_PROGRESS");
      setPendingOrdersCount(pending.length);

      const readyOrders = fetchedOrders.filter(o => o.status === "READY");
      if (readyOrders.length > 0) {
         newAlerts.push({ text: `${readyOrders.length} pedido(s) listo(s) para entrega`, type: "success" as const });
      }

      if (newAlerts.length === 0) {
         newAlerts.push({ text: "Todo en orden. No hay alertas críticas.", type: "success" as const });
      }

      setActiveAlerts(newAlerts.slice(0, 6));
    };
    fetchTxs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentKpis = [
    {
      title: "Ventas de hoy",
      value: `$${todayIncome.toFixed(2)}`,
      trend: "-", // Pendiente: Calcular trend real
      trendUp: true,
      icon: DollarSign,
      color: "from-[hsl(187,72%,38%)] to-[hsl(168,70%,40%)]",
    },
    {
      title: "Ingresos Totales",
      value: `$${totalIncome.toFixed(2)}`,
      trend: "-",
      trendUp: true,
      icon: TrendingUp,
      color: "from-[hsl(152,60%,45%)] to-[hsl(152,60%,35%)]",
    },
    {
      title: "Citas de hoy",
      value: "0",
      trend: "-",
      trendUp: true,
      icon: CalendarCheck,
      color: "from-[hsl(199,89%,48%)] to-[hsl(210,80%,50%)]",
    },
    {
      title: "Pedidos pendientes",
      value: pendingOrdersCount.toString(),
      trend: "-",
      trendUp: pendingOrdersCount === 0,
      icon: PackageOpen,
      color: "from-[hsl(38,92%,50%)] to-[hsl(25,90%,50%)]",
    },
  ];

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "¡Buenos días" : now.getHours() < 18 ? "¡Buenas tardes" : "¡Buenas noches";
  const dateStr = now.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayedTransactions = searchTerm.trim() === "" 
    ? recentTransactions 
    : allTransactions.filter(tx => 
        tx.noteNumber?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[hsl(175,40%,95%)] to-[hsl(187,50%,92%)] p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          {greeting}! ☀️
        </h1>
        <p className="text-muted-foreground mt-1">Resumen de tu clínica hoy</p>
        <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {currentKpis.map((kpi) => (
          <Card key={kpi.title} className="rounded-2xl shadow-sm hover-lift border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-foreground">{kpi.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight
                  className={`w-3.5 h-3.5 ${kpi.trendUp ? "text-success" : "text-destructive rotate-90"}`}
                />
                <span className={`text-xs font-semibold ${kpi.trendUp ? "text-success" : "text-destructive"}`}>
                  {kpi.trend}
                </span>
                <span className="text-xs text-muted-foreground">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Acciones Rápidas</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate?.(action.view)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover-lift cursor-pointer"
            >
              <action.icon className={`w-6 h-6 ${action.color}`} />
              <span className="text-xs font-medium text-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity History */}
    <Card className="rounded-2xl shadow-sm border-border flex flex-col h-full">
          <CardHeader className="pb-3 border-b border-border/50 shrink-0">
            <CardTitle className="text-base font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Historial de Actividad
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Filtrar nota..." 
                    className="h-8 pl-8 text-[10px] w-24 sm:w-32 bg-muted/30 border-border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-[10px] font-bold text-primary hover:bg-primary/5"
                  onClick={() => onNavigate?.("history")}
                >
                  Ver Todo <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 flex-1 overflow-y-auto max-h-[400px]">
            {loadingFinances ? (
              <p className="text-sm text-center text-muted-foreground p-4">Cargando...</p>
            ) : displayedTransactions.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground p-4">
                {searchTerm.trim() !== "" ? "No hay resultados para tu búsqueda." : "No hay actividad reciente."}
              </p>
            ) : (
              displayedTransactions.map((tx) => {
                const isIncome = tx.type === "INCOME";
                return (
                  <div key={tx.id} className="flex items-center gap-3 text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      <DollarSign className={`w-3.5 h-3.5 ${isIncome ? 'text-success' : 'text-destructive'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{tx.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {tx.noteNumber && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-primary/10 text-primary border border-primary/20">
                            Nota: {tx.noteNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${isIncome ? 'text-success' : 'text-destructive'}`}>
                      {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Smart Alerts */}
        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Alertas Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <AlertTriangle
                  className={`w-4 h-4 flex-shrink-0 ${
                    alert.type === "warning"
                      ? "text-warning"
                      : alert.type === "destructive"
                      ? "text-destructive"
                      : "text-success"
                  }`}
                />
                <span className="text-sm text-foreground">{alert.text}</span>
                <Badge
                  variant={alert.type === "success" ? "default" : alert.type === "destructive" ? "destructive" : "secondary"}
                  className={`ml-auto text-[10px] ${
                    alert.type === "warning" ? "bg-warning/15 text-warning border-0" : ""
                  } ${alert.type === "success" ? "bg-success/15 text-success border-0" : ""}`}
                >
                  {alert.type === "warning" ? "Advertencia" : alert.type === "destructive" ? "Urgente" : "Info"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
