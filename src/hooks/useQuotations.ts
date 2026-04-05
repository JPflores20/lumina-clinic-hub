import { useState, useCallback } from "react";
import { collection, addDoc, getDocs, orderBy, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface QuotationLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Quotation {
  id?: string;
  patientId?: string;
  patientName?: string;
  items: QuotationLine[];
  subtotal: number;
  tax: number;
  total: number;
  branchId?: string;
  createdBy: string;
  createdOn: any;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
}

export const useQuotations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const addQuotation = async (data: Omit<Quotation, "createdBy" | "createdOn" | "status">) => {
    setIsLoading(true);
    try {
      // Limpiar campos undefined que rompen addDoc de Firebase
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      const docRef = await addDoc(collection(db, "quotations"), {
        ...cleanData,
        createdBy: user?.name || "Sistema",
        createdOn: Timestamp.now(),
        status: "PENDING",
        branchId: user?.branchId || "central"
      });
      toast.success("Cotización generada y guardada con éxito.");
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding quotation:", error);
      toast.error("Error al guardar la cotización.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuotations = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "quotations"), orderBy("createdOn", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
    } catch (error: any) {
      console.error("Error fetching quotations:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { addQuotation, fetchQuotations, isLoading };
};
