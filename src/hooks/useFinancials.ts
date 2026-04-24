import { useState, useCallback } from "react";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction, TransactionType } from "@/types/financial";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/contexts/BranchContext";
import { toast } from "sonner";

export const useFinancials = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { selectedBranch } = useBranches();

  // Registrar un ingreso o egreso
  const addTransaction = async (
    data: Omit<Transaction, "id" | "userId" | "branchId" | "date"> & { branchId?: string }
  ) => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("Debes iniciar sesión para registrar una transacción.");
      // Si no hay branchId (ej. Admin en modo Global), usamos 'central' como fallback para contabilidad
      const branchIdToUse = data.branchId || selectedBranch?.id || user.branchId || "central";

      // Limpiar campos undefined que rompen addDoc de Firebase
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      // Auto-generación de Número de Nota si no existe
      if (!cleanData.noteNumber) {
         const prefixStr = selectedBranch?.name ? selectedBranch.name : branchIdToUse;
         const prefix = prefixStr.substring(0, 3).toUpperCase();
         const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
         const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
         cleanData.noteNumber = `NOTA-${prefix}-${dateStr}-${randomId}`;
      }

      const newTxRef = await addDoc(collection(db, "transactions"), {
        ...cleanData,
        userId: user.id,
        branchId: branchIdToUse,
        date: serverTimestamp(),
      });

      return newTxRef.id;
    } catch (error: any) {
      console.error("Error registrando transacción:", error);
      toast.error(error.message || "Hubo un error al registrar la transacción.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener transacciones de una sucursal (o todas para un admin)
  const fetchTransactions = useCallback(async (branchId?: string | null) => {
    setIsLoading(true);
    try {
      let q = collection(db, "transactions");
      
      // Si recibimos branchId, filtramos. Si no y selectedBranch existe, usamos ese.
      const filterBranchId = branchId !== undefined ? branchId : selectedBranch?.id;
      
      if (filterBranchId) {
         q = query(q, where("branchId", "==", filterBranchId)) as any;
      } else {
         q = query(q) as any;
      }

      const querySnapshot = await getDocs(q);
      const data: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        let formattedDate = new Date().toISOString();
        if (docData.date && typeof docData.date.toDate === 'function') {
           formattedDate = docData.date.toDate().toISOString();
        }
        data.push({ 
           id: doc.id, 
           ...docData, 
           date: formattedDate 
        } as Transaction);
      });

      return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error("Error al cargar las transacciones financieras.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch?.id]);

  const fetchTransactionsByPatient = useCallback(async (patientId: string) => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "transactions"), 
        where("patientId", "==", patientId)
      );
      const querySnapshot = await getDocs(q);
      const data: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({ 
           id: doc.id, 
           ...docData, 
           date: docData.date?.toDate().toISOString() 
        } as Transaction);
      });
      
      // Ordenar por fecha descendente en el cliente para evitar requerir un índice compuesto en Firebase
      return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error: any) {
      console.error("Error fetching transactions by patient:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener un sumario total
  const getFinancialSummary = useCallback(async (branchId?: string | null) => {
    const txs = await fetchTransactions(branchId);
    let totalIncome = 0;
    let totalExpense = 0;

    txs.forEach((tx) => {
      if (tx.type === "INCOME") totalIncome += tx.amount;
      if (tx.type === "EXPENSE") totalExpense += tx.amount;
    });

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      transactions: txs
    };
  }, [fetchTransactions]);

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    setIsLoading(true);
    try {
      const txRef = doc(db, "transactions", id);
      const { id: _, ...updateData } = data as any;
      
      // No actualizamos la fecha original si no se especifica explícitamente
      await updateDoc(txRef, updateData);
      toast.success("Transacción actualizada con éxito.");
      return true;
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast.error("Error al actualizar la transacción.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addTransaction,
    fetchTransactions,
    fetchTransactionsByPatient,
    getFinancialSummary,
    updateTransaction,
    isLoading
  };
};
