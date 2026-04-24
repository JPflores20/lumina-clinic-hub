export type ProductCategory = "FRAME" | "LENS" | "ACCESSORY" | "CONTACT_LENS";

export interface Product {
  id: string;
  code: string; // SKU o Identificador manual
  name: string;
  category: ProductCategory;
  brand?: string;
  price: number;
  stock: number;
  branchId?: string; // Si es undefined, el admin podría considerarlo "Stock matriz"
  targetGender?: "MEN" | "WOMEN" | "UNISEX" | "KIDS";
  
  // Especifico para armazones y accesorios coloridos
  color?: string;
  
  // Especifico para micas y lentes de contacto
  graduation?: string; 
  
  createdAt?: string;
}
