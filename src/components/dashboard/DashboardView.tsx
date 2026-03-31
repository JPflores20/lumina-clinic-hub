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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const kpis = [
  {
    title: "Sales Today",
    value: "$4,280",
    trend: "+12%",
    trendUp: true,
    icon: DollarSign,
    color: "from-[hsl(187,72%,38%)] to-[hsl(168,70%,40%)]",
  },
  {
    title: "Monthly Revenue",
    value: "$68,450",
    trend: "+5.2%",
    trendUp: true,
    icon: TrendingUp,
    color: "from-[hsl(152,60%,45%)] to-[hsl(152,60%,35%)]",
  },
  {
    title: "Appointments Today",
    value: "12",
    trend: "+3",
    trendUp: true,
    icon: CalendarCheck,
    color: "from-[hsl(199,89%,48%)] to-[hsl(210,80%,50%)]",
  },
  {
    title: "Pending Orders",
    value: "8",
    trend: "-2",
    trendUp: false,
    icon: PackageOpen,
    color: "from-[hsl(38,92%,50%)] to-[hsl(25,90%,50%)]",
  },
];

const quickActions = [
  { label: "New Sale", icon: ShoppingCart, color: "text-primary" },
  { label: "New Quote", icon: FileText, color: "text-info" },
  { label: "New Order", icon: ClipboardList, color: "text-warning" },
  { label: "Schedule Appt.", icon: CalendarPlus, color: "text-success" },
  { label: "New Patient", icon: UserPlus, color: "text-primary" },
  { label: "Eye Exam", icon: Eye, color: "text-[hsl(270,60%,55%)]" },
];

const activities = [
  { text: "Sale to John Doe", amount: "$2,500", time: "10 min ago" },
  { text: "New patient: Maria García", amount: "", time: "25 min ago" },
  { text: "Order #1042 delivered", amount: "$890", time: "1 hr ago" },
  { text: "Eye exam: Robert Smith", amount: "$150", time: "2 hrs ago" },
  { text: "Sale to Emily Chen", amount: "$1,200", time: "3 hrs ago" },
];

const alerts = [
  { text: "Low stock on Ray-Ban RB5154", type: "warning" as const },
  { text: "3 delayed deliveries", type: "destructive" as const },
  { text: "Lab order #987 ready for pickup", type: "success" as const },
  { text: "Insurance claim pending review", type: "warning" as const },
];

const DashboardView = () => {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
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
        <p className="text-muted-foreground mt-1">Summary of your clinic today</p>
        <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
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
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
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
              Activity History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
                {a.amount && (
                  <span className="text-sm font-semibold text-foreground">{a.amount}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Smart Alerts */}
        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Smart Alerts
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
                  {alert.type === "warning" ? "Warning" : alert.type === "destructive" ? "Urgent" : "Info"}
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
