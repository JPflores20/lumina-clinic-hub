import { useState, useEffect } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Order, OrderStatus } from "@/types/order";
import { Branch } from "@/types/branch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Search, MapPin, Eye } from "lucide-react";

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "PENDING": return "bg-warning text-warning-foreground";
    case "IN_PROGRESS": return "bg-primary text-primary-foreground";
    case "READY": return "bg-success text-success-foreground";
    case "DELIVERED": return "bg-muted text-muted-foreground";
    case "CANCELLED": return "bg-destructive text-destructive-foreground";
    default: return "bg-secondary";
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case "PENDING": return "Pendiente";
    case "IN_PROGRESS": return "En Laboratorio";
    case "READY": return "Listo para Entrega";
    case "DELIVERED": return "Entregado";
    case "CANCELLED": return "Cancelado";
    default: return status;
  }
};

export const OrdersView = () => {
  const { fetchOrders, addOrder, updateOrderStatus, isLoading } = useOrders();
  const { fetchBranches } = useAdmin();
  const { isAdmin } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const loadData = async () => {
    const [fetchedOrders, fetchedBranches] = await Promise.all([
      fetchOrders(),
      isAdmin ? fetchBranches() : Promise.resolve([]) 
    ]);
    setOrders(fetchedOrders);
    if (isAdmin) setBranches(fetchedBranches);
  };

  useEffect(() => {
    loadData();
  }, [fetchOrders]);

  const handleSimulateOrder = async () => {
    // Para probar el renderizado cronológico
    await addOrder({
      patientName: "Paciente Simulado " + Math.floor(Math.random() * 1000),
      frameModel: "Ray-Ban RX53" + Math.floor(Math.random() * 99),
      lensType: "MONOFOCAL",
      prescription: {
        sphereOd: -1.50, cylinderOd: -0.50, axisOd: 180,
        sphereOi: -1.75, cylinderOi: -0.50, axisOi: 175,
        pupillaryDistance: 62
      },
      branchId: branches[0]?.id || undefined, // Lo asigna a la primera sucursal si es admin
    });
    loadData();
  };

  const getBranchName = (id?: string) => {
    if (!id) return "Desconocida";
    return branches.find(b => b.id === id)?.name || "Sucursal Local";
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos de Laboratorio</h1>
          <p className="text-muted-foreground mt-2">Seguimiento cronológico de la fabricación y entrega de lentes.</p>
        </div>
        <Button onClick={handleSimulateOrder} variant="outline" disabled={isLoading} className="border-primary/20 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> Simular Pedido Test
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Registro Histórico
          </CardTitle>
          {/* Opcional: Agregar input de Search en un futuro */}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px]">Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Fabricación (Armazón / Mica)</TableHead>
                <TableHead>Receta (Graduación Escencial)</TableHead>
                <TableHead>Sucursal Destino</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No hay pedidos registrados. Usa el botón "Simular Pedido" para pruebas.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const dateObj = new Date(order.orderDate);
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="align-top">
                        <div className="font-semibold text-foreground">
                          {dateObj.toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dateObj.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      
                      <TableCell className="align-top">
                        <div className="font-medium text-foreground">{order.patientName}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5 max-w-[120px] truncate">
                          ID: {order.id.slice(0,8)}...
                        </div>
                      </TableCell>
                      
                      <TableCell className="align-top">
                        <div className="font-medium text-[hsl(var(--cyan-accent))]">
                          {order.frameModel}
                        </div>
                        <Badge variant="outline" className="mt-1 text-[10px] uppercase">
                          {order.lensType}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="align-top text-xs space-y-1">
                        <div className="flex gap-2">
                          <span className="font-semibold w-6">OD:</span>
                          <span className="text-muted-foreground">Esf: {order.prescription.sphereOd} | Cil: {order.prescription.cylinderOd} | Eje: {order.prescription.axisOd}°</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-semibold w-6">OI:</span>
                          <span className="text-muted-foreground">Esf: {order.prescription.sphereOi} | Cil: {order.prescription.cylinderOi} | Eje: {order.prescription.axisOi}°</span>
                        </div>
                        <div className="text-muted-foreground mt-1 pt-1 border-t border-border/50 inline-block">
                          DIP: {order.prescription.pupillaryDistance}mm
                        </div>
                      </TableCell>
                      
                      <TableCell className="align-top">
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-medium">{isAdmin ? getBranchName(order.branchId) : "Sucursal Actual"}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="align-top text-right">
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${getStatusColor(order.status)} border-0 hover:${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          
                          {/* Controles rápidos de estado */}
                          {order.status === "PENDING" && (
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 text-primary" onClick={() => updateOrderStatus(order.id, "IN_PROGRESS")}>
                              Pasar a Taller
                            </Button>
                          )}
                          {order.status === "IN_PROGRESS" && (
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 text-success" onClick={() => updateOrderStatus(order.id, "READY")}>
                              Marcar Listo
                            </Button>
                          )}
                           {order.status === "READY" && (
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 text-muted-foreground" onClick={() => updateOrderStatus(order.id, "DELIVERED")}>
                              Entregar a Paciente
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersView;
