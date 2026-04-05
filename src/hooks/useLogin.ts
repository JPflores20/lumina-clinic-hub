import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const authenticate = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      // 1. Caso de emergencia: Auto-aprovisionar al primer admin si no existe
      if (email === "admin@lumina.com" && pass === "lumina123") {
         try {
            await signInWithEmailAndPassword(auth, email, pass);
         } catch (e: any) {
            if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
               // Si no existe, lo creamos
               const cred = await createUserWithEmailAndPassword(auth, email, pass);
               // Y le damos permisos de ADMIN en Firestore
               await setDoc(doc(db, "users", cred.user.uid), {
                  name: "Gael Admin Central",
                  email,
                  role: "ADMIN",
                  status: "ACTIVE",
                  createdAt: serverTimestamp()
               });
               toast.success("Cuenta de Administrador Central Creada y Logueada.");
               navigate("/");
               return true;
            }
         }
      }

      // 2. Intento de login normal
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      
      if (userCredential.user) {
         // Verificamos si tiene documento en Firestore (por si borró la cuenta de DB pero no de Auth)
         const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
         if (!userDoc.exists()) {
            // Autocrear si es el admin de emergencia pero ya tiene auth
            if (email === "admin@lumina.com") {
               await setDoc(doc(db, "users", userCredential.user.uid), {
                  name: "Admin Principal",
                  email,
                  role: "ADMIN",
                  status: "ACTIVE"
               });
            } else {
               toast.error("Tu perfil de usuario no existe en la base de datos.");
               return false;
            }
         }
         
         toast.success("Credenciales correctas. Entrando...");
         navigate("/");
         return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error signing in:", error);
      let errorMsg = "Error al iniciar sesión.";
      
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
         errorMsg = "Correo o contraseña incorrectos.";
      } else if (error.code === "auth/too-many-requests") {
         errorMsg = "Demasiados intentos. Intenta más tarde.";
      }
      
      toast.error(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { authenticate, isLoading };
};
