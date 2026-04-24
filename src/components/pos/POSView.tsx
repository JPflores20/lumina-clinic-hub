import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ShoppingBag,
  UserPlus,
  UserCircle2,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Download,
  Share2
} from "lucide-react";
import { downloadTicketPDF, shareTicketPDF, TicketData } from "@/utils/pdfGenerator";
import { useBranches } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinancials } from "@/hooks/useFinancials";
import { useInventory } from "@/hooks/useInventory";
import { usePatients } from "@/hooks/usePatients";
import { useOrders } from "@/hooks/useOrders";
import { Product } from "@/types/inventory";
import { Patient } from "@/types/patient";
import { toast } from "sonner";

interface CartItem extends Product {
  quantity: number;
}

const POSView = () => {
  const { user } = useAuth();
  
  // Custom Hooks
  const { fetchProducts, updateProduct, isLoading: invLoading } = useInventory();
  const { fetchPatients, addPatient, fetchClinicalRecords, isLoading: patLoading } = usePatients();
  const { addTransaction, isLoading: finLoading } = useFinancials();
  const { addOrder } = useOrders();

  // Unified Loading
  const isBusy = invLoading || patLoading || finLoading;
  const { selectedBranch } = useBranches();

  // View States
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const [discount, setDiscount] = useState<string>("0");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Patient Selection States
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [newPatFirst, setNewPatFirst] = useState("");
  const [newPatLastP, setNewPatLastP] = useState("");
  const [newPatLastM, setNewPatLastM] = useState("");
  const [newPatPhone, setNewPatPhone] = useState("");
  const [newPatEmail, setNewPatEmail] = useState("");
  const [newPatAddress, setNewPatAddress] = useState("");

  // Post-Checkout states
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastTxData, setLastTxData] = useState<TicketData | null>(null);

  const loadData = async () => {
    const fetchedInv = await fetchProducts();
    const fetchedPat = await fetchPatients();
    setCatalog(fetchedInv);
    setPatients(fetchedPat);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = catalog.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const s = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const dVal = parseFloat(discount) || 0;
    
    let dAmount = 0;
    if (discountType === "percent") {
      dAmount = s * (dVal / 100);
    } else {
      dAmount = dVal;
    }

    const subAfterDiscount = Math.max(0, s - dAmount);
    const t = subAfterDiscount * 0.16;
    setSubtotal(s);
    setTax(t);
    setTotal(subAfterDiscount + t);
  }, [cart, discount, discountType]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
       toast.error("Producto agotado. Modifica el inventario primero.");
       return;
    }
    
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
           toast.error("No hay suficiente stock para añadir más.");
           return prev;
        }
        return prev.map((c) =>
          c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === id) {
             const newQty = c.quantity + delta;
             if (newQty > c.stock) {
                 toast.error("Stock insuficiente.");
                 return c;
             }
             return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
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

  const handleCharge = () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío.");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const processCheckout = async () => {
    // 2. Calcular Totales localmente para la transacción
    const txSubtotal = subtotal;
    const dVal = parseFloat(discount) || 0;
    const txDiscount = discountType === "percent" ? (subtotal * (dVal / 100)) : dVal;
    const txTax = tax;
    const txTotal = total;
    const totalQty = cart.reduce((s, c) => s + c.quantity, 0);

    if (paymentMethod === "cash") {
       const received = parseFloat(amountReceived);
       if (isNaN(received) || received < txTotal) {
          toast.error("El monto recibido es insuficiente para completar la venta.");
          return;
       }
    }

    // 1. Resolver Paciente
    let finalPatientId = selectedPatientId;
    let finalPatientName = "Cliente General";

    if (finalPatientId) {
       const pat = patients.find(p => p.id === finalPatientId);
       if (pat) finalPatientName = pat.fullName;
    }
    
    const description = `Venta (POS) - ${totalQty} arts. - ${finalPatientName ? 'Para: '+finalPatientName : 'Cliente General'}`;

    const txId = await addTransaction({
      type: "INCOME",
      amount: txTotal,
      description: description,
      patientId: finalPatientId || undefined,
      patientName: finalPatientName || undefined,
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      discount: txDiscount
    });

    if (txId) {
      // 3. Deducir Inventario
      for (const item of cart) {
         await updateProduct(item.id, { stock: item.stock - item.quantity });
      }

      // 4. Generar Pedido a Laboratorio Automático si aplica
      if (selectedPatientId) {
        const hasLabItems = cart.some(item => item.category === "FRAME" || item.category === "LENS");
        if (hasLabItems) {
           const records = await fetchClinicalRecords(selectedPatientId);
           if (records && records.length > 0) {
             const latestPrescription = records[0].prescription;
             const frameItem = cart.find(item => item.category === "FRAME");
             const lensItem = cart.find(item => item.category === "LENS");
             
             await addOrder({
               patientName: finalPatientName,
               patientId: selectedPatientId,
               lensType: "MONOFOCAL", // Valor por defecto, se puede ajustar en Pedidos
               frameModel: frameItem ? frameItem.name : "Armazón del Cliente",
               prescription: latestPrescription,
               notes: `Pedido generado automáticamente desde Venta Folio ${txId.substring(0,8)}`,
               branchId: selectedBranch?.id || user?.branchId || null
             });
             toast.info("Se ha enviado una orden al taller automáticamente.");
           } else {
             toast.warning("No se generó orden a taller: El paciente no tiene exámenes (receta) registrados.");
           }
        }
      }

      // 5. Preparar datos del ticket para el modal de éxito
      const ticketData: TicketData = {
        noteNumber: txId.substring(0, 8).toUpperCase(),
        date: new Date().toISOString(),
        branchName: selectedBranch?.name || "Sucursal Local",
        branchAddress: selectedBranch?.address || "Dirección de la sucursal",
        patientName: finalPatientName,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        subtotal: txSubtotal,
        discount: txDiscount,
        tax: txTax,
        total: txTotal
      };

      setLastTxData(ticketData);
      toast.success("Venta procesada y enlazada con éxito.");
      setCart([]); 
      setSelectedPatientId("");
      setAmountReceived("");
      setDiscount("0");
      setDiscountType("amount");
      setIsCheckoutModalOpen(false);
      setIsSuccessModalOpen(true);
      loadData(); // Recargar stock actualizado
    }
  };

  // ELIMINAMOS ESTAS LINEAS YA QUE LAS PASAMOS A USEEFFECT
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full animate-fade-in">
      
      {/* SECCIÓN IZQUIERDA: Herramientas (Buscador y Catálogo) */}
      <div className="flex-1 lg:w-2/3 flex flex-col space-y-4">
        
        {/* ENLACE CON PACIENTE (Novedad) */}
        <Card className="border-border shadow-sm border-primary/20">
           <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <UserCircle2 className="w-4 h-4" /> Cliente / Paciente
                 </span>
                 <p className="text-xs text-muted-foreground mt-1">Asocia esta venta al expediente o registra uno nuevo.</p>
              </div>

              <div className="flex items-center gap-2 flex-1 md:max-w-md w-full">
                <select 
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm flex-1"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">Cliente General (Sin Expediente)</option>
                  {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>
                  ))}
                </select>
                
                <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Registrar Paciente Nuevo
                      </DialogTitle>
                      <DialogDescription>
                        Ingresa los datos personales del paciente para crear su expediente.
                      </DialogDescription>
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

        {/* Buscador de Producto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en el inventario real..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card border-border"
          />
        </div>

        {/* Catálogo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto pb-6">
          {filtered.map((product) => {
             const isAgotado = product.stock <= 0;
             return (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="text-left"
              disabled={isAgotado}
            >
              <Card className={`rounded-2xl shadow-sm hover-lift border-border cursor-pointer h-full transition-all ${isAgotado ? 'opacity-50 grayscale' : ''}`}>
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center justify-between">
                       <Badge variant="secondary" className="text-[10px] uppercase font-medium bg-muted text-muted-foreground border-none">
                         {product.category}
                       </Badge>
                       {product.code && (
                         <span className="text-[10px] font-black text-destructive font-mono uppercase bg-destructive/5 px-2 py-0.5 rounded-md border border-destructive/10">
                           ID: {product.code}
                         </span>
                       )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] w-fit font-bold ${
                        isAgotado ? "border-destructive/50 text-destructive bg-destructive/10" : 
                        product.stock < 5 ? "border-destructive/30 text-destructive" : "border-success/30 text-success"
                      }`}
                    >
                      {isAgotado ? 'AGOTADO' : `${product.stock} en stock`}
                    </Badge>
                   </div>
                  <h3 className="font-semibold text-foreground text-sm mt-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {product.color && (
                      <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-md">
                        {product.color}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-3">
                     <p className="text-xl font-bold text-primary">
                       ${product.price.toFixed(2)}
                     </p>
                  </div>
                </CardContent>
              </Card>
            </button>
             )
          })}
          {filtered.length === 0 && (
             <div className="col-span-full py-10 text-center text-muted-foreground">
                Inventario vacío o sin coincidencias de búsqueda. <br/> Asegúrate de agregar artículos desde la pestaña de Inventario.
             </div>
          )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: Shopping Cart */}
      <div className="lg:w-1/3">
        <Card className="rounded-2xl shadow-sm border-border sticky top-20 flex flex-col max-h-[85vh]">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Carrito de Compras
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {cart.reduce((s, c) => s + c.quantity, 0)} arts.
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Haz clic en un producto para agregarlo
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm bg-muted/20 p-2 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${item.price.toFixed(2)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-semibold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-semibold text-foreground w-16 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Checkout Footer */}
          {cart.length > 0 && (
            <div className="p-4 bg-muted/5 border-t border-border shrink-0">
               {/* Totals */}
               <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impuesto (16%)</span>
                  <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-3xl font-bold text-foreground">
                     ${total.toFixed(2)}
                  </span>
                  </div>
               </div>

               {/* Payment Method */}
               <div className="flex gap-2 mb-4">
                  <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                     paymentMethod === "cash"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                  >
                  <Banknote className="w-4 h-4" />
                  Efectivo
                  </button>
                  <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                     paymentMethod === "card"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                  >
                  <CreditCard className="w-4 h-4" />
                  Tarjeta
                  </button>
               </div>

               {/* Charge Button */}
               <Button 
                  onClick={handleCharge}
                  disabled={isBusy}
                  className="w-full h-12 rounded-xl text-base font-bold bg-success hover:bg-success/90 text-success-foreground"
               >
                  {isBusy ? "Procesando Sistema..." : `Cobrar $${total.toFixed(2)}`}
               </Button>
            </div>
          )}
        </Card>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE PAGO Y CAMBIO */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-5 h-5 text-primary" />
              Confirmar Pago
            </DialogTitle>
            <DialogDescription>
              Completa los detalles del pago y aplica descuentos si es necesario.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Subtotal</Label>
                    <div className="text-xl font-bold">${subtotal.toFixed(2)}</div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-destructive font-bold flex justify-between">
                       Descuento
                       <div className="flex bg-muted rounded-md p-0.5 h-6">
                          <button 
                            type="button"
                            disabled={!isAdmin && user?.permissions?.canApplyDiscounts === false}
                            onClick={() => setDiscountType("amount")}
                            className={`px-2 text-[10px] rounded transition-all ${discountType === 'amount' ? 'bg-white shadow-sm font-bold text-primary' : 'text-muted-foreground'} disabled:opacity-50`}
                          >
                            $
                          </button>
                          <button 
                            type="button"
                            disabled={!isAdmin && user?.permissions?.canApplyDiscounts === false}
                            onClick={() => setDiscountType("percent")}
                            className={`px-2 text-[10px] rounded transition-all ${discountType === 'percent' ? 'bg-white shadow-sm font-bold text-primary' : 'text-muted-foreground'} disabled:opacity-50`}
                          >
                            %
                          </button>
                       </div>
                    </Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        min="0" 
                        max={discountType === 'percent' ? 100 : subtotal}
                        value={discount} 
                        disabled={!isAdmin && user?.permissions?.canApplyDiscounts === false}
                        onChange={(e) => setDiscount(e.target.value)} 
                        className="text-lg font-bold text-destructive border-destructive/20 focus:border-destructive pr-8 disabled:bg-muted/50"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-destructive/40 pointer-events-none">
                        {discountType === 'amount' ? '$' : '%'}
                      </span>
                    </div>
                 </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border border-primary/20">
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider line-height-1">Total Final</span>
                    <span className="text-xs text-muted-foreground italic">(Con IVA aplicado)</span>
                 </div>
                 <span className="text-3xl font-black text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 text-center p-3 rounded-lg border border-border bg-muted/30">
               <span className="text-sm font-semibold flex items-center justify-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" /> Se generará nota de sucursal.
               </span>
            </div>

            {paymentMethod === "cash" && (
               <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                     <label className="text-sm font-bold flex items-center gap-2 text-foreground">
                        <Banknote className="w-4 h-4 text-success" /> Efectivo Recibido
                     </label>
                     <Input 
                        type="number"
                        placeholder="Ingresa el monto..."
                        className="h-12 text-2xl font-bold text-center border-2 focus:border-primary"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        autoFocus
                     />
                  </div>

                  <div className={`p-4 rounded-xl flex flex-col items-center justify-center border transition-all ${parseFloat(amountReceived || "0") >= total ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                     <span className="text-xs font-semibold text-muted-foreground">
                        {parseFloat(amountReceived || "0") >= total ? 'Cambio a entregar:' : 'Monto Faltante:'}
                     </span>
                     <span className={`text-3xl font-black ${parseFloat(amountReceived || "0") >= total ? 'text-success' : 'text-destructive'}`}>
                        ${Math.abs((parseFloat(amountReceived || "0") || 0) - total).toFixed(2)}
                     </span>
                  </div>
               </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsCheckoutModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
               onClick={processCheckout} 
               disabled={isBusy || (paymentMethod === 'cash' && parseFloat(amountReceived || "0") < total)}
               className="flex-[2] bg-success hover:bg-success/90 font-bold"
            >
              {isBusy ? "Procesando..." : "Confirmar y Finalizar Venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ÉXITO Y TICKET */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
             <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-success" />
             </div>
             <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold">¡Venta Exitosa!</DialogTitle>
                <p className="text-muted-foreground text-sm">La transacción ha sido registrada correctamente.</p>
             </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-4 border border-border space-y-3">
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Folio de Venta:</span>
                <span className="font-mono font-bold">{lastTxData?.noteNumber}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cobrado:</span>
                <span className="font-bold text-primary">${lastTxData?.total.toFixed(2)}</span>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3 py-4">
             <Button 
                variant="outline" 
                className="h-12 rounded-xl border-2 hover:bg-muted font-semibold flex items-center justify-center gap-2"
                onClick={() => lastTxData && downloadTicketPDF(lastTxData)}
             >
                <Download className="w-4 h-4" /> Descargar Ticket PDF
             </Button>
             
             <Button 
                className="h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold flex items-center justify-center gap-2"
                onClick={() => lastTxData && shareTicketPDF(lastTxData)}
             >
                <Share2 className="w-4 h-4" /> Enviar por Correo / Compartir
             </Button>
          </div>

          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsSuccessModalOpen(false)} className="w-full">
                Finalizar y Nueva Venta
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSView;
