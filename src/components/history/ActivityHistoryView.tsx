import { useState, useEffect } from "react";
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Calendar as CalendarIcon, 
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  FileText,
  User,
  MapPin,
  Clock,
  X,
  Edit,
  Eye,
  Save,
  Trash2,
  Printer,
  Share2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useFinancials } from "@/hooks/useFinancials";
import { Transaction } from "@/types/financial";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { downloadTicketPDF, shareTicketPDF, TicketData } from "@/utils/pdfGenerator";
import { useAuth } from "@/contexts/AuthContext";

const ActivityHistoryView = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editNote, setEditNote] = useState("");
  const [editType, setEditType] = useState<"INCOME" | "EXPENSE">("INCOME");

  const { fetchTransactions, updateTransaction, isLoading } = useFinancials();

  const loadTransactions = async () => {
    const data = await fetchTransactions();
    setAllTransactions(data);
    setFilteredTransactions(data || []);
  };

  useEffect(() => {
    loadTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    let result = [...allTransactions];

    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(tx => 
        (tx.description || "").toLowerCase().includes(term) ||
        (tx.noteNumber || "").toLowerCase().includes(term) ||
        (tx.patientName || "").toLowerCase().includes(term)
      );
    }

    if (filterType !== "ALL") {
      result = result.filter(tx => tx.type === filterType);
    }

    if (dateRange?.from) {
      result = result.filter(tx => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        const from = startOfDay(dateRange.from!);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
        return isWithinInterval(txDate, { start: from, end: to });
      });
    }

    setFilteredTransactions(result);
  }, [searchTerm, filterType, dateRange, allTransactions]);

  const handleExport = () => {
    toast.info("Exportación en Excel próximamente disponible.");
  };

  const openEditModal = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditDesc(tx.description);
    setEditAmount(tx.amount);
    setEditNote(tx.noteNumber || "");
    setEditType(tx.type);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTx) return;
    
    const success = await updateTransaction(selectedTx.id, {
      description: editDesc,
      amount: editAmount,
      noteNumber: editNote,
      type: editType
    });

    if (success) {
      setIsModalOpen(false);
      loadTransactions();
    }
  };

  const getTicketData = (tx: Transaction): TicketData => {
    const items = tx.items || [{
      name: tx.description,
      quantity: 1,
      price: tx.amount / 1.16,
      subtotal: tx.amount / 1.16
    }];

    return {
      noteNumber: tx.noteNumber || tx.id.substring(0, 8).toUpperCase(),
      date: tx.date,
      branchName: branches.find(b => b.id === tx.branchId)?.name || 'Sucursal Local',
      branchAddress: branches.find(b => b.id === tx.branchId)?.address || 'Dirección General',
      patientName: tx.patientName || "Cliente General",
      items: items,
      subtotal: tx.amount / 1.16,
      tax: (tx.amount / 1.16) * 0.16,
      total: tx.amount
    };
  };

  const handlePrintTicket = () => {
    if (!selectedTx) return;
    downloadTicketPDF(getTicketData(selectedTx));
  };

  const handlePrintTicketFromRow = (tx: Transaction) => {
    downloadTicketPDF(getTicketData(tx));
  };

  const handleShareTicket = async () => {
    if (!selectedTx) return;
    await shareTicketPDF(getTicketData(selectedTx));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Actividad</h1>
          <p className="text-muted-foreground mt-2">Seguimiento detallado de todas las transacciones y ventas de la clínica.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
          <Download className="w-4 h-4 mr-2" /> Exportar Reporte
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por descripción, nota o paciente..." 
                className="pl-10 h-10 bg-muted/20 border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={filterType === "ALL" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilterType("ALL")}
                className="h-9 px-4 rounded-lg"
              >
                Todos
              </Button>
              <Button 
                variant={filterType === "INCOME" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilterType("INCOME")}
                className="h-9 px-4 rounded-lg"
              >
                Ingresos
              </Button>
              <Button 
                variant={filterType === "EXPENSE" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilterType("EXPENSE")}
                className="h-9 px-4 rounded-lg"
              >
                Egresos
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    size="sm"
                    className={cn(
                      "h-9 justify-start text-left font-normal px-3 rounded-lg flex items-center gap-2",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd LLL", { locale: es })} -{" "}
                          {format(dateRange.to, "dd LLL", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "dd LLL", { locale: es })
                      )
                    ) : (
                      <span>Seleccionar Rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                  />
                  <div className="p-3 border-t border-border flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setDateRange(undefined)}
                    >
                      Limpiar Rango
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px]">Fecha</TableHead>
                <TableHead className="w-[120px]">Nota / Ticket</TableHead>
                <TableHead>Concepto / Descripción</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead className="w-[120px]">Monto</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Cargando transacciones...</TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No se encontraron transacciones con los filtros actuales.</TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => {
                  const dateObj = new Date(tx.date);
                  const isIncome = tx.type === "INCOME";
                  
                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground truncate">
                            {dateObj.toLocaleDateString("es-MX", { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {dateObj.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {tx.noteNumber ? (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/30 text-primary bg-primary/5">
                            {tx.noteNumber}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">S/N</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{tx.description}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Transacción: {tx.id.substring(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-muted rounded-full">
                            <User className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {tx.patientName || "Cliente General"}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className={`text-base font-bold ${isIncome ? 'text-success' : 'text-destructive'}`}>
                          {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            title="Ver / Descargar Ticket"
                            onClick={() => {
                              setSelectedTx(tx);
                              handlePrintTicketFromRow(tx);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => openEditModal(tx)}
                            disabled={!isAdmin && currentUser?.permissions?.canEditTransactions === false}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Transacción
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles de la nota o venta seleccionada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Folio / Número de Nota</Label>
              <Input 
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="NOTA-XXX"
                className="bg-muted/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Concepto / Descripción</Label>
              <Input 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Venta de..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tipo</Label>
                <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Ingreso (+)</SelectItem>
                    <SelectItem value="EXPENSE">Egreso (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Monto ($)</Label>
                <Input 
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {selectedTx && (
               <div className="mt-2 p-3 bg-muted/20 rounded-lg border border-border/50 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Metadatos</p>
                  <div className="flex justify-between text-xs">
                     <span className="text-muted-foreground">ID Interno:</span>
                     <span className="font-mono">{selectedTx.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-muted-foreground">Fecha Original:</span>
                     <span>{new Date(selectedTx.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-muted-foreground">SucursalID:</span>
                     <span>{selectedTx.branchId}</span>
                  </div>
               </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="flex gap-2 mr-auto">
               <Button variant="outline" size="sm" onClick={handlePrintTicket} className="text-xs">
                  <Printer className="w-4 h-4 mr-1" /> Ticket
               </Button>
               <Button variant="outline" size="sm" onClick={handleShareTicket} className="text-xs">
                  <Share2 className="w-4 h-4 mr-1" /> Compartir
               </Button>
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
               </Button>
               <Button size="sm" onClick={handleUpdate} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? "Guardando..." : <><Save className="w-4 h-4 mr-2" /> Guardar</>}
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityHistoryView;
