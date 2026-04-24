import { useState, useCallback } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Patient, PatientRecord } from "@/types/patient";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/contexts/BranchContext";
import { toast } from "sonner";

export const usePatients = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { selectedBranch } = useBranches();

  const fetchPatients = useCallback(async (branchIdFilter?: string | null) => {
    setIsLoading(true);
    try {
      let q = collection(db, "patients");
      const filterBranchId = branchIdFilter !== undefined ? branchIdFilter : selectedBranch?.id;
      
      if (filterBranchId) {
         q = query(q, where("branchId", "==", filterBranchId)) as any;
      } else {
         q = query(q) as any;
      }

      const snapshot = await getDocs(q);
      const data: Patient[] = [];
      snapshot.forEach((doc) => {
        const item = doc.data();
        let formattedDate = "";
        if (item.registeredAt && typeof item.registeredAt.toDate === 'function') {
           formattedDate = item.registeredAt.toDate().toISOString();
        }
        data.push({ id: doc.id, ...item, registeredAt: formattedDate } as Patient);
      });
      
      // Ordenar en el cliente (evita error de índices en Firebase)
      return data.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Error al cargar el directorio de pacientes.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch?.id]);

  const addPatient = async (data: Omit<Patient, "id" | "registeredAt" | "branchId"> & { branchId?: string }) => {
    setIsLoading(true);
    try {
      const branchIdToUse = data.branchId || selectedBranch?.id || user?.branchId;
      if (!branchIdToUse) {
          throw new Error("Se requiere asignar una sucursal para dar de alta al paciente.");
      }

      // Limpiar campos undefined que rompen addDoc de Firebase
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      const docRef = await addDoc(collection(db, "patients"), {
        ...cleanData,
        branchId: branchIdToUse,
        registeredAt: serverTimestamp(),
      });
      
      toast.success("Paciente registrado con éxito.");
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding patient:", error);
      toast.error(error.message || "Error al registrar al paciente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClinicalRecords = useCallback(async (patientId: string) => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, `patients/${patientId}/clinical_records`),
        orderBy("examDate", "desc")
      );

      const snapshot = await getDocs(q);
      const records: PatientRecord[] = [];
      snapshot.forEach((doc) => {
        const item = doc.data();
        let formattedDate = "";
        if (item.examDate && typeof item.examDate.toDate === 'function') {
           formattedDate = item.examDate.toDate().toISOString();
        }
        records.push({ id: doc.id, ...item, examDate: formattedDate } as PatientRecord);
      });
      return records;
    } catch (error) {
      console.error("Error fetching patient records:", error);
      toast.error("Error al cargar el expediente clínico.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addClinicalRecord = async (
    patientId: string, 
    data: Omit<PatientRecord, "id" | "examDate" | "patientId" | "branchId"> & { branchId?: string }
  ) => {
    setIsLoading(true);
    try {
      const branchIdToUse = data.branchId || selectedBranch?.id || user?.branchId;
      if (!branchIdToUse) {
          throw new Error("Se requiere una sucursal para generar un examen clínico.");
      }

      // Limpiar campos undefined que rompen addDoc de Firebase
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      const docRef = await addDoc(collection(db, `patients/${patientId}/clinical_records`), {
        ...cleanData,
        patientId, // link for easier cross-querying if needed
        branchId: branchIdToUse,
        examDate: serverTimestamp(),
      });
      
      toast.success("Examen guardado en el expediente.");
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding clinical record:", error);
      toast.error(error.message || "Error al guardar el examen clínico.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePatient = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "patients", id));
      toast.success("Paciente eliminado correctamente.");
      return true;
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("Error al eliminar al paciente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fetchPatients,
    addPatient,
    fetchClinicalRecords,
    addClinicalRecord,
    deletePatient
  };
};
