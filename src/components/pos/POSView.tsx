import { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ShoppingBag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

const catalog: Product[] = [
  { id: 1, name: "Ray-Ban RB5154", category: "Armazón", price: 189, stock: 12 },
  { id: 2, name: "Oakley Holbrook", category: "Armazón", price: 156, stock: 8 },
  { id: 3, name: "Essilor Crizal", category: "Mica", price: 220, stock: 34 },
  { id: 4, name: "Gucci GG0061S", category: "Armazón", price: 340, stock: 5 },
  { id: 5, name: "Zeiss Digital Lens", category: "Mica", price: 280, stock: 18 },
  { id: 6, name: "Tom Ford FT5401", category: "Armazón", price: 295, stock: 3 },
  { id: 7, name: "Hoya Blue Control", category: "Mica", price: 175, stock: 25 },
  { id: 8, name: "Prada VPR 08T", category: "Armazón", price: 265, stock: 7 },
  { id: 9, name: "Varilux X Series", category: "Mica", price: 420, stock: 10 },
];

const POSView = () => {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");

  const filtered = catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full animate-fade-in">
      {/* Product Catalog */}
      <div className="flex-1 lg:w-2/3 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar armazones, micas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-card border-border"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="text-left"
            >
              <Card className="rounded-2xl shadow-sm hover-lift border-border cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      {product.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        product.stock < 5
                          ? "border-destructive/30 text-destructive"
                          : "border-success/30 text-success"
                      }`}
                    >
                      {product.stock} en stock
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mt-3">
                    {product.name}
                  </h3>
                  <p className="text-xl font-bold text-primary mt-1">
                    ${product.price.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="lg:w-1/3">
        <Card className="rounded-2xl shadow-sm border-border sticky top-20">
          <CardHeader className="pb-3">
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
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Haz clic en un producto para agregarlo
              </p>
            ) : (
              <>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-semibold text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold text-foreground w-16 text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-3 space-y-2">
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
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
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
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
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
                <Button className="w-full h-12 rounded-xl text-base font-bold bg-success hover:bg-success/90 text-success-foreground">
                  Cobrar ${total.toFixed(2)}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POSView;
