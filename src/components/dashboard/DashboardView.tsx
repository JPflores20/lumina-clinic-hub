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
  LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinancials } from "@/hooks/useFinancials";
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

const activities = [
  { text: "Venta a Juan Pérez", amount: "$2,500", time: "hace 10 min" },
  { text: "Nuevo paciente: Maria García", amount: "", time: "hace 25 min" },
  { text: "Pedido #1042 entregado", amount: "$890", time: "hace 1 hr" },
  { text: "Examen visual: Robert Smith", amount: "$150", time: "hace 2 hrs" },
  { text: "Venta a Emily Chen", amount: "$1,200", time: "hace 3 hrs" },
];

const alerts = [
  { text: "Stock bajo en Ray-Ban RB5154", type: "warning" as const },
  { text: "3 entregas retrasadas", type: "destructive" as const },
  { text: "Pedido #987 listo para entrega", type: "success" as const },
  { text: "Reclamo de seguro pendiente", type: "warning" as const },
];

const DashboardView = ({ onNavigate }: DashboardViewProps) => {
  const { getFinancialSummary, isLoading: loadingFinances } = useFinancials();
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

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
      setRecentTransactions(summary.transactions.slice(0, 5)); // Mostrar sólo 5
    };
    fetchTxs();
  }, [getFinancialSummary]);

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
      value: "12",
      trend: "-",
      trendUp: true,
      icon: CalendarCheck,
      color: "from-[hsl(199,89%,48%)] to-[hsl(210,80%,50%)]",
    },
    {
      title: "Pedidos pendientes",
      value: "8",
      trend: "-",
      trendUp: false,
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
        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Historial de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingFinances ? (
              <p className="text-sm text-center text-muted-foreground p-4">Cargando...</p>
            ) : recentTransactions.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground p-4">No hay actividad reciente.</p>
            ) : (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === "INCOME";
                return (
                  <div key={tx.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      <DollarSign className={`w-3.5 h-3.5 ${isIncome ? 'text-success' : 'text-destructive'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
            {alerts.map((alert, i) => (
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
