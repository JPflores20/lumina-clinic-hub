import { useState, useCallback } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth as mainAuth } from "@/lib/firebase"; // Importar auth principal para resets
import { collection, addDoc, getDocs, orderBy, query, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Importamos 'db' (firestore oficial)
import { Branch } from "@/types/branch";
import { User, Role } from "@/types/auth";
import { toast } from "sonner";

// Configuración para la App Secundaria (Permite crear usuarios Auth sin desloguear al Admin)
// Nota: Usamos la misma config que el app principal.
const firebaseConfig = {
  apiKey: "AIzaSyBWsXGgEvDOa6y9j5LVtU6imULey9Bks8I",
  authDomain: "lumina-24eb0.firebaseapp.com",
  projectId: "lumina-24eb0",
  storageBucket: "lumina-24eb0.firebasestorage.app",
  messagingSenderId: "888450762276",
  appId: "1:888450762276:web:bd011d2708e29536b7bab1",
};

export const useAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "branches"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      const branchesData: Branch[] = [];
      snapshot.forEach((doc) => {
        branchesData.push({ id: doc.id, ...doc.data() } as Branch);
      });
      return branchesData;
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      toast.error("Error al cargar las sucursales");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBranch = async (data: Omit<Branch, "id">) => {
    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, "branches"), data);
      toast.success("Sucursal creada exitosamente");
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding branch:", error);
      toast.error("Error al crear la sucursal");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as User);
      });
      return usersData;
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar los usuarios");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addUser = async (data: Omit<User, "id"> & { password?: string }) => {
    setIsLoading(true);
    try {
      if (!data.password) throw new Error("La contraseña es requerida para el registro inicial.");

      // 1. Crear el usuario en FIREBASE AUTHENTICATION (App Secundaria)
      const secondaryApp = initializeApp(firebaseConfig, "secondary");
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const uid = userCredential.user.uid;

      // 2. Cerrar sesión de la app secundaria (IMPORTANTE para no interferir con futuras creaciones)
      await signOut(secondaryAuth);
      // Eliminar la app secundaria de la memoria
      await deleteApp(secondaryApp);

      // 3. Crear el perfil en FIRESTORE usando el UID vinculado
      await setDoc(doc(db, "users", uid), {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        branchId: data.branchId || null,
        status: data.status || "ACTIVE",
        createdAt: new Date().toISOString()
      });

      toast.success("Cajero registrado en Authentication y base de datos con éxito.");
      return uid;
    } catch (error: any) {
      console.error("Error adding user:", error);
      let msg = "Error al crear el usuario.";
      if (error.code === "auth/email-already-in-use") msg = "Este correo ya está registrado en Firebase.";
      if (error.code === "auth/weak-password") msg = "La contraseña es muy débil (mínimo 6 caracteres).";
      
      toast.error(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, data);
      toast.success("Cajero actualizado");
      return true;
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Error al actualizar el cajero");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", id);
      await deleteDoc(userRef);
      toast.success("Cajero eliminado del sistema");
      return true;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Error al eliminar el cajero");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserPassword = async (email: string) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(mainAuth, email);
      toast.success(`Se ha enviado un correo de recuperación a ${email}.`);
      return true;
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error("Error al enviar el correo de recuperación.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fetchBranches,
    addBranch,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    resetUserPassword
  };
};
