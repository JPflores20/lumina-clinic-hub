import { useState, useCallback } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/contexts/BranchContext";
import { toast } from "sonner";

export const useInventory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { selectedBranch } = useBranches();

  // Registrar un producto en Firebase
  const addProduct = async (
    data: Omit<Product, "id" | "createdAt" | "branchId"> & { branchId?: string }
  ) => {
    setIsLoading(true);
    try {
      const branchIdToUse = data.branchId || selectedBranch?.id || user?.branchId;
      if (!branchIdToUse && user?.role === "SELLER") {
          throw new Error("El Vendedor no cuenta con una sucursal ligada al inventario.");
      }

      const docRef = await addDoc(collection(db, "inventory"), {
        ...data,
        branchId: branchIdToUse || null,
        createdAt: serverTimestamp(),
      });
      
      toast.success("Producto guardado exitosamente");
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Error al guardar el producto");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Extraer el inventario
  const fetchProducts = useCallback(async (branchIdFilter?: string | null) => {
    setIsLoading(true);
    try {
      let q = collection(db, "inventory");
      
      const filterBranchId = branchIdFilter !== undefined ? branchIdFilter : selectedBranch?.id;
      
      // Si recibimos branchId (o el vendedor está forzado a la suya por Context)
      if (filterBranchId) {
         q = query(q, where("branchId", "==", filterBranchId)) as any;
      } else {
         q = query(q) as any;
      }

      const snapshot = await getDocs(q);
      const inventoryData: Product[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        let formattedDate = undefined;
        if (docData.createdAt && typeof docData.createdAt.toDate === 'function') {
           formattedDate = docData.createdAt.toDate().toISOString();
        }
        inventoryData.push({ id: doc.id, ...docData, createdAt: formattedDate } as Product);
      });

      // Ordenar en el cliente para evitar errores de índices complejos en Firebase
      return inventoryData.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error: any) {
      console.error("Error fetching inventory:", error);
      toast.error("Error al cargar el catálogo de productos");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch?.id]);

  const updateProduct = async (id: string, data: Partial<Product>) => {
    setIsLoading(true);
    try {
      const productRef = doc(db, "inventory", id);
      
      // Limpiar campos undefined que rompen updateDoc de Firebase
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      await updateDoc(productRef, cleanData);
      toast.success("Producto actualizado");
      return true;
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error("Error al actualizar el producto");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setIsLoading(true);
    try {
      const productRef = doc(db, "inventory", id);
      await deleteDoc(productRef);
      toast.success("Producto eliminado del sistema");
      return true;
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar el producto");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    addProduct,
    fetchProducts,
    updateProduct,
    deleteProduct
  };
};
