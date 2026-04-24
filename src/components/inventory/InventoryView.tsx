import { useState, useEffect } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useAdmin } from "@/hooks/useAdmin";
import { Product, ProductCategory } from "@/types/inventory";
import { Branch } from "@/types/branch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const InventoryView = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const { fetchProducts, addProduct, updateProduct, deleteProduct, isLoading } = useInventory();
  const { fetchBranches } = useAdmin();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("FRAME");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [branchId, setBranchId] = useState("");
  const [productCode, setProductCode] = useState("");

  // Edit States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    color: "",
    price: "",
    stock: "",
    category: "FRAME" as ProductCategory,
    branchId: "",
    code: ""
  });

  const loadData = async () => {
    const [fetchedProducts, fetchedBranches] = await Promise.all([
      fetchProducts(),
      isAdmin ? fetchBranches() : Promise.resolve([]) // Vendedor no necesita cargar todas las sucursales para el form si el backend lo fuerza
    ]);
    setProducts(fetchedProducts);
    if (isAdmin) setBranches(fetchedBranches);
  };

  useEffect(() => {
    loadData();
  }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock || !productCode) {
      toast.error("El nombre, precio, stock y código son obligatorios.");
      return;
    }
    
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || isNaN(parsedStock)) return;

    const id = await addProduct({
      name,
      code: productCode,
      category,
      price: parsedPrice,
      stock: parsedStock,
      color,
      brand,
      branchId: isAdmin ? branchId : undefined
    });

    if (id) {
      setIsAdding(false);
      // Reset form
      setName("");
      setProductCode("");
      setPrice("");
      setStock("1");
      setColor("");
      setBrand("");
      setCategory("FRAME");
      loadData();
    }
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      brand: product.brand || "",
      color: product.color || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      branchId: product.branchId || "",
      code: product.code || ""
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    
    const parsedPrice = parseFloat(editForm.price);
    const parsedStock = parseInt(editForm.stock, 10);

    if (isNaN(parsedPrice) || isNaN(parsedStock)) {
      toast.error("Por favor ingresa valores válidos.");
      return;
    }

    const success = await updateProduct(editingProduct.id, {
      name: editForm.name,
      brand: editForm.brand,
      color: editForm.color,
      price: parsedPrice,
      stock: parsedStock,
      category: editForm.category,
      branchId: editForm.branchId || undefined,
      code: editForm.code
    });

    if (success) {
      setIsEditModalOpen(false);
      loadData();
    }
  };

  const getBranchName = (id?: string) => {
    if (!id) return "Global / Matriz";
    return branches.find(b => b.id === id)?.name || "Sucursal Local";
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground mt-2">Control de armazones, micas y existencias de la óptica.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Agregar Artículo</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-border shadow-sm animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Nuevo Artículo (Armazón)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">ID / Código Producto</label>
                <Input value={productCode} onChange={e => setProductCode(e.target.value)} placeholder="Ej. L-001, RX-99" required />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Nombre / Modelo</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Ray-Ban Wayfarer" required />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Marca (Opcional)</label>
                <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Cacharel, Ray-Ban..." />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Color</label>
                <Input value={color} onChange={e => setColor(e.target.value)} placeholder="Negro, Tortuga..." />
              </div>
              
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Precio ($)</label>
                <Input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" required />
              </div>
              
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Stock (Cantidad)</label>
                <Input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="1" required />
              </div>

              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Tipo</label>
                <select 
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={category} 
                  onChange={e => setCategory(e.target.value as ProductCategory)}
                >
                  <option value="FRAME">Armazón</option>
                  <option value="LENS">Mica</option>
                  <option value="ACCESSORY">Accesorio</option>
                  <option value="CONTACT_LENS">Lente de Contacto</option>
                </select>
              </div>

              {isAdmin && (
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-sm font-medium">Asignar a Sucursal</label>
                  <select 
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={branchId} 
                    onChange={e => setBranchId(e.target.value)}
                  >
                    <option value="">Bodega / Todas</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <Button type="submit" disabled={isLoading} className="mb-0.5 lg:col-span-1 w-full bg-success hover:bg-success/90">
                Guardar Producto
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID / Código</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Detalles</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                {isAdmin && <TableHead>Sucursal</TableHead>}
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 4} className="text-center py-8 text-muted-foreground">
                    Aún no haz añadido armazones.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  return (
                  <TableRow key={product.id} className={isOutOfStock ? "opacity-50 bg-muted/20" : ""}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px] tracking-tight bg-muted/50">
                         {product.code || 'S/ID'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {product.name}
                        {isOutOfStock && <span className="text-[10px] text-destructive font-bold uppercase">(Agotado)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{product.brand || "Sin marca"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {product.category === "FRAME" ? "ARMAZÓN" : 
                           product.category === "LENS" ? "MICA" : 
                           product.category}
                        </Badge>
                        {product.color && <Badge variant="secondary" className="text-[10px]">{product.color}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className={`font-semibold ${isOutOfStock ? 'text-muted-foreground' : 'text-success'}`}>
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${product.stock > 3 ? "text-foreground" : "text-destructive"}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-sm text-muted-foreground uppercase text-[10px]">
                        {getBranchName(product.branchId)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" 
                            onClick={() => handleOpenEdit(product)}
                            disabled={!isAdmin && currentUser?.permissions?.canAccessInventory === false}
                          >
                              <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" 
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar ${product.name}?`)) {
                                 deleteProduct(product.id).then(()=> loadData());
                              }
                            }}
                            disabled={!isAdmin && currentUser?.permissions?.canDeleteItems === false}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE EDICIÓN PROFESIONAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Editar Artículo
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Código / ID</Label>
              <Input 
                className="col-span-3 font-mono" 
                value={editForm.code} 
                onChange={e => setEditForm({...editForm, code: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nombre</Label>
              <Input 
                className="col-span-3" 
                value={editForm.name} 
                onChange={e => setEditForm({...editForm, name: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Marca</Label>
              <Input 
                className="col-span-3" 
                value={editForm.brand} 
                onChange={e => setEditForm({...editForm, brand: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Color</Label>
              <Input 
                className="col-span-3" 
                value={editForm.color} 
                onChange={e => setEditForm({...editForm, color: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-2">
                  <Label>Precio ($)</Label>
                  <Input 
                     type="number" 
                     value={editForm.price} 
                     onChange={e => setEditForm({...editForm, price: e.target.value})} 
                  />
               </div>
               <div className="flex flex-col gap-2">
                  <Label>Stock</Label>
                  <Input 
                     type="number" 
                     value={editForm.stock} 
                     onChange={e => setEditForm({...editForm, stock: e.target.value})} 
                  />
               </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tipo</Label>
              <select 
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                value={editForm.category} 
                onChange={e => setEditForm({...editForm, category: e.target.value as ProductCategory})}
              >
                <option value="FRAME">Armazón</option>
                <option value="LENS">Mica</option>
                <option value="ACCESSORY">Accesorio</option>
                <option value="CONTACT_LENS">Lente de Contacto</option>
              </select>
            </div>
            {isAdmin && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Sucursal</Label>
                <select 
                  className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  value={editForm.branchId} 
                  onChange={e => setEditForm({...editForm, branchId: e.target.value})}
                >
                  <option value="">Bodega / Todas</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryView;
