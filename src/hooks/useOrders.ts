import { useState, useCallback } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus } from "@/types/order";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/contexts/BranchContext";
import { toast } from "sonner";

export const useOrders = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAdmin } = useAuth();
  const { selectedBranch } = useBranches();

  const fetchOrders = useCallback(async (branchIdFilter?: string | null) => {
    setIsLoading(true);
    try {
      let q = collection(db, "orders");
      
      const filterBranchId = branchIdFilter !== undefined ? branchIdFilter : selectedBranch?.id;
      
      if (filterBranchId) {
         q = query(q, where("branchId", "==", filterBranchId), orderBy("orderDate", "desc")) as any;
      } else {
         q = query(q, orderBy("orderDate", "desc")) as any;
      }

      const snapshot = await getDocs(q);
      const ordersData: Order[] = [];
      snapshot.forEach((docSnapshot) => {
        const docData = docSnapshot.data();
        let formattedDate = new Date().toISOString();
        if (docData.orderDate && typeof docData.orderDate.toDate === 'function') {
           formattedDate = docData.orderDate.toDate().toISOString();
        }
        ordersData.push({ id: docSnapshot.id, ...docData, orderDate: formattedDate } as Order);
      });
      return ordersData;
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar los pedidos de laboratorio");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch?.id]);

  const addOrder = async (
    data: Omit<Order, "id" | "orderDate" | "branchId" | "status"> & { branchId?: string }
  ) => {
    setIsLoading(true);
    try {
      const branchIdToUse = data.branchId || selectedBranch?.id || user?.branchId;
      if (!branchIdToUse && !isAdmin) {
          throw new Error("Se requiere una sucursal destino para el pedido.");
      }

      const docRef = await addDoc(collection(db, "orders"), {
        ...data,
        branchId: branchIdToUse || null,
        status: "PENDING",
        orderDate: serverTimestamp(),
      });
      
      toast.success("Pedido enviado a laboratorio exitosamente");
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding order:", error);
      toast.error(error.message || "Error al generar el pedido");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsLoading(true);
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      toast.success(`Estado del pedido actualizado a ${newStatus}`);
      return true;
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error("No se pudo actualizar el estado del pedido");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeOrders = useCallback((callback: (orders: Order[]) => void, branchIdFilter?: string | null) => {
    let q = collection(db, "orders");
    const filterBranchId = branchIdFilter !== undefined ? branchIdFilter : selectedBranch?.id;
    
    let queryRef;
    if (filterBranchId) {
       queryRef = query(q, where("branchId", "==", filterBranchId), orderBy("orderDate", "desc"));
    } else {
       queryRef = query(q, orderBy("orderDate", "desc"));
    }

    return onSnapshot(queryRef, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((docSnapshot) => {
        const docData = docSnapshot.data();
        let formattedDate = new Date().toISOString();
        if (docData.orderDate && typeof docData.orderDate.toDate === 'function') {
           formattedDate = docData.orderDate.toDate().toISOString();
        }
        ordersData.push({ id: docSnapshot.id, ...docData, orderDate: formattedDate } as Order);
      });
      callback(ordersData);
    }, (error) => {
      console.error("Error subscribing to orders:", error);
      toast.error("Conexión en tiempo real con el taller interrumpida.");
    });
  }, [selectedBranch?.id]);

  return {
    isLoading,
    fetchOrders,
    subscribeOrders,
    addOrder,
    updateOrderStatus
  };
};
