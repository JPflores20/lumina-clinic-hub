import { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator,
  UserPlus,
  UserCircle2,
  Save,
  ArrowRight,
  ClipboardCheck,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventory } from "@/hooks/useInventory";
import { usePatients } from "@/hooks/usePatients";
import { useQuotations, QuotationLine, Quotation } from "@/hooks/useQuotations";
import { useAuth } from "@/contexts/AuthContext";
import { Product } from "@/types/inventory";
import { Patient } from "@/types/patient";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QuotationsView = () => {
  const { user } = useAuth();
  const { fetchProducts, isLoading: invLoading } = useInventory();
  const { fetchPatients, addPatient, isLoading: patLoading } = usePatients();
  const { addQuotation, fetchQuotations, isLoading: quoLoading } = useQuotations();

  const isBusy = invLoading || patLoading || quoLoading;

  // View States
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<QuotationLine[]>([]);
  
  // Modal de Registro de Paciente
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [newPatFirst, setNewPatFirst] = useState("");
  const [newPatLastP, setNewPatLastP] = useState("");
  const [newPatLastM, setNewPatLastM] = useState("");
  const [newPatPhone, setNewPatPhone] = useState("");
  const [newPatEmail, setNewPatEmail] = useState("");
  const [newPatAddress, setNewPatAddress] = useState("");

  // Selection
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const loadData = async () => {
    const [inv, pat, quo] = await Promise.all([
      fetchProducts(),
      fetchPatients(),
      fetchQuotations()
    ]);
    setCatalog(inv);
    setPatients(pat);
    setQuotations(quo);
  };

  useEffect(() => {
    loadData();
  }, [fetchProducts, fetchPatients, fetchQuotations]);

  const filtered = catalog.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const addToProposal = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    toast.info(`${product.name} añadido al presupuesto.`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === id) return { ...c, quantity: Math.max(0, c.quantity + delta) };
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRegisterPatient = async () => {
    if (!newPatFirst.trim() || !newPatLastP.trim()) {
      toast.error("El nombre y primer apellido son obligatorios.");
      return;
    }
    
    const combinedName = `${newPatFirst.trim()} ${newPatLastP.trim()} ${newPatLastM.trim()}`.trim();
    
    const id = await addPatient({
      firstName: newPatFirst.trim(),
      lastNamePaternal: newPatLastP.trim(),
      lastNameMaternal: newPatLastM.trim(),
      fullName: combinedName,
      phone: newPatPhone,
      email: newPatEmail,
      address: newPatAddress || "Sin dirección",
    });
    
    if (id) {
      // Recargar lista y seleccionar al nuevo
      const updated = await fetchPatients();
      setPatients(updated);
      setSelectedPatientId(id);
      
      // Reset y cerrar
      setNewPatFirst("");
      setNewPatLastP("");
      setNewPatLastM("");
      setNewPatPhone("");
      setNewPatEmail("");
      setNewPatAddress("");
      setIsPatientModalOpen(false);
    }
  };

  const handleSaveQuotation = async () => {
    if (cart.length === 0) {
      toast.error("El presupuesto está vacío.");
      return;
    }

    let finalPatientId = selectedPatientId;
    let finalPatientName = "Cliente General";

    if (selectedPatientId) {
       const p = patients.find(pat => pat.id === selectedPatientId);
       if (p) finalPatientName = p.fullName;
    }

    const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const success = await addQuotation({
       patientId: finalPatientId || undefined,
       patientName: finalPatientName,
       items: cart,
       subtotal,
       tax,
       total
    });

    if (success) {
       setCart([]);
       setSelectedPatientId("");
       loadData();
    }
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <Tabs defaultValue="new" className="w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
           <div className="flex flex-col text-left mr-auto">
             <h2 className="text-2xl font-bold tracking-tight">Presupuestos / Cotizaciones</h2>
             <p className="text-muted-foreground text-sm">Genera una propuesta formal para tus pacientes sin afectar stock.</p>
           </div>
           
           <TabsList className="bg-muted/50 p-1">
             <TabsTrigger value="new" className="px-6">Nueva Cotización</TabsTrigger>
             <TabsTrigger value="list" className="px-6">Historial</TabsTrigger>
           </TabsList>
        </div>

        <TabsContent value="new">
           <div className="flex flex-col xl:flex-row gap-6">
             {/* PANEL IZQUIERDO: SELECCIÓN */}
             <div className="flex-1 space-y-6">
               
               {/* 1. SELECCIÓN DE PACIENTE */}
               <Card className="border-border shadow-sm">
                 <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-3 flex-1 w-full">
                       <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <UserCircle2 className="w-5 h-5" />
                       </div>
                       <select 
                          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm flex-1"
                          value={selectedPatientId}
                          onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                          <option value="">Seleccionar Paciente del Expediente...</option>
                          {patients.map(p => (
                             <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>
                          ))}
                       </select>
                       
                       <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
                         <DialogTrigger asChild>
                           <Button variant="outline" className="h-10 px-4">
                             <UserPlus className="w-4 h-4 mr-2" /> Nuevo
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="sm:max-w-[425px]">
                           <DialogHeader>
                             <DialogTitle className="flex items-center gap-2">
                               <Plus className="w-5 h-5 text-primary" />
                               Registrar Paciente Nuevo
                             </DialogTitle>
                           </DialogHeader>
                           <div className="grid gap-4 py-4">
                             <div className="space-y-2">
                               <label className="text-sm font-semibold">Nombre(s)</label>
                               <Input 
                                 placeholder="Nombres" 
                                 value={newPatFirst}
                                 onChange={e => setNewPatFirst(e.target.value)}
                               />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                 <label className="text-sm font-semibold">Apellido Paterno</label>
                                 <Input 
                                   placeholder="Paterno" 
                                   value={newPatLastP}
                                   onChange={e => setNewPatLastP(e.target.value)}
                                 />
                               </div>
                               <div className="space-y-2">
                                 <label className="text-sm font-semibold flex justify-between">
                                   <span>Apellido Materno</span>
                                   <Badge variant="outline" className="text-[9px] uppercase font-normal opacity-50">Op</Badge>
                                 </label>
                                 <Input 
                                   placeholder="Materno" 
                                   value={newPatLastM}
                                   onChange={e => setNewPatLastM(e.target.value)}
                                 />
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                 <label className="text-sm font-semibold">Teléfono</label>
                                 <div className="relative">
                                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                   <Input 
                                     placeholder="10 dígitos" 
                                     className="pl-10" 
                                     value={newPatPhone}
                                     onChange={e => setNewPatPhone(e.target.value)}
                                   />
                                 </div>
                               </div>
                               <div className="space-y-2">
                                 <label className="text-sm font-semibold">Correo Electrónico</label>
                                 <div className="relative">
                                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                   <Input 
                                     placeholder="ejemplo@correo.com" 
                                     className="pl-10" 
                                     value={newPatEmail}
                                     onChange={e => setNewPatEmail(e.target.value)}
                                   />
                                 </div>
                               </div>
                             </div>
                             <div className="space-y-2">
                               <label className="text-sm font-semibold flex justify-between">
                                 <span>Dirección</span>
                                 <Badge variant="outline" className="text-[9px] uppercase font-normal opacity-50">Opcional</Badge>
                               </label>
                               <div className="relative">
                                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                 <Input 
                                   placeholder="Calle, Número, Colonia" 
                                   className="pl-10" 
                                   value={newPatAddress}
                                   onChange={e => setNewPatAddress(e.target.value)}
                                 />
                               </div>
                             </div>
                           </div>
                           <DialogFooter className="border-t pt-4">
                             <Button variant="ghost" onClick={() => setIsPatientModalOpen(false)}>Cancelar</Button>
                             <Button onClick={handleRegisterPatient} disabled={patLoading}>
                               {patLoading ? "Registrando..." : "Dar de Alta Paciente"}
                             </Button>
                           </DialogFooter>
                         </DialogContent>
                       </Dialog>
                    </div>
                 </CardContent>
               </Card>

               {/* 2. CATÁLOGO / BÚSQUEDA */}
               <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                       placeholder="Buscar armazón, lente o tratamiento..." 
                       value={search}
                       onChange={e=>setSearch(e.target.value)}
                       className="pl-10 h-12 bg-card border-border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                     {filtered.map(p => (
                        <button key={p.id} onClick={() => addToProposal(p)} className="text-left group">
                           <Card className="h-full border-border hover:border-primary/40 hover:shadow-md transition-all rounded-2xl overflow-hidden cursor-pointer group">
                             <CardContent className="p-4 flex flex-col h-full">
                                <Badge variant="secondary" className="w-fit text-[9px] mb-2">{p.category}</Badge>
                                <h4 className="font-semibold text-sm line-clamp-1">{p.name}</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{p.color || "Sin color especificado"}</p>
                                <div className="mt-4 flex items-center justify-between">
                                   <span className="text-lg font-bold text-primary">${p.price.toFixed(2)}</span>
                                   <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus className="w-3 h-3 text-primary" />
                                   </div>
                                </div>
                             </CardContent>
                           </Card>
                        </button>
                     ))}
                  </div>
               </div>
             </div>

             {/* PANEL DERECHO: RESUMEN / COTIZACIÓN */}
             <div className="w-full xl:w-[400px]">
                <Card className="border-primary/20 shadow-lg rounded-2xl sticky top-24 overflow-hidden bg-card/50 backdrop-blur-sm">
                   <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base">Detalle de Propuesta</CardTitle>
                      </div>
                      <CardDescription>Esta cotización no descuenta stock del inventario.</CardDescription>
                   </CardHeader>
                   
                   <CardContent className="p-0 flex flex-col max-h-[60vh]">
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                         {cart.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center gap-3 opacity-40">
                               <FileText className="w-12 h-12" />
                               <p className="text-sm">Agrega productos para cotizar...</p>
                            </div>
                         ) : (
                            cart.map(item => (
                               <div key={item.id} className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                                  <div className="flex-1 min-w-0">
                                     <h5 className="text-[12px] font-bold truncate leading-none mb-1">{item.name}</h5>
                                     <span className="text-[10px] text-muted-foreground">${item.price.toFixed(2)} c/u</span>
                                  </div>
                                  <div className="flex items-center bg-background rounded-lg border px-1">
                                     <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:text-primary transition-colors"><Minus className="w-3 h-3" /></button>
                                     <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                                     <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:text-primary transition-colors"><Plus className="w-3 h-3" /></button>
                                  </div>
                                  <div className="text-right min-w-[70px]">
                                     <span className="text-[12px] font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                               </div>
                            ))
                         )}
                      </div>

                      {cart.length > 0 && (
                         <div className="p-5 border-t bg-muted/20 space-y-4">
                            <div className="space-y-1">
                               <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Subtotal</span>
                                  <span>${subtotal.toFixed(2)}</span>
                               </div>
                               <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>IVA (16%)</span>
                                  <span>${tax.toFixed(2)}</span>
                               </div>
                               <div className="flex justify-between items-baseline pt-2 mt-2 border-t border-dashed border-primary/20 font-bold">
                                  <span className="text-sm">TOTAL</span>
                                  <span className="text-2xl text-primary">${total.toFixed(2)}</span>
                               </div>
                            </div>
                            
                            <Button 
                               onClick={handleSaveQuotation}
                               disabled={isBusy}
                               className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-[hsl(168,70%,40%)] hover:opacity-90 font-bold"
                            >
                               {isBusy ? "Guardando..." : <><Save className="w-4 h-4 mr-2" /> Guardar Cotización</>}
                            </Button>
                         </div>
                      )}
                   </CardContent>
                </Card>
             </div>
           </div>
        </TabsContent>

        <TabsContent value="list" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <Card className="border-border">
              <CardContent className="p-0 overflow-hidden">
                 <Table>
                    <TableHeader className="bg-muted/30">
                       <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Artículos</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Vendedor</TableHead>
                          <TableHead className="text-right">Vencimiento</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {quotations.length === 0 ? (
                          <TableRow>
                             <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No se han generado cotizaciones aún.</TableCell>
                          </TableRow>
                       ) : (
                          quotations.map(quo => (
                             <TableRow key={quo.id} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                                <TableCell className="font-medium text-xs">
                                   {quo.createdOn?.toDate().toLocaleDateString() || "Reciente"}
                                </TableCell>
                                <TableCell>
                                   <div className="flex flex-col">
                                      <span className="text-sm font-bold text-foreground">{quo.patientName}</span>
                                      <span className="text-[10px] text-muted-foreground uppercase opacity-70">ID: {quo.patientId?.substring(0,8) || "Grl"}</span>
                                   </div>
                                </TableCell>
                                <TableCell>
                                   <div className="flex flex-wrap gap-1">
                                      {quo.items.map((item, idx) => (
                                         <Badge key={idx} variant="outline" className="text-[9px] py-0">{item.quantity}x {item.name}</Badge>
                                      ))}
                                   </div>
                                </TableCell>
                                <TableCell className="font-bold text-primary">
                                   ${quo.total.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-xs italic text-muted-foreground">
                                   {quo.createdBy}
                                </TableCell>
                                <TableCell className="text-right">
                                   <Badge className="bg-amber-100 text-amber-700 border-amber-200">En 30 días</Badge>
                                </TableCell>
                             </TableRow>
                          ))
                       )}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuotationsView;
