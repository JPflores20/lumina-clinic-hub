import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Role } from "@/types/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  isAdmin: boolean;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ya no usamos mocks

/* 
const MOCK_SELLER: User = {
  id: "seller-456",
  name: "Vendedor 1",
  email: "seller@lumina.com",
  role: "SELLER",
  branchId: "branch-abc"
};
*/

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
             const data = userDoc.data();
             setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                name: data.name || "Usuario",
                role: data.role || "SELLER",
                branchId: data.branchId,
                status: data.status || "ACTIVE"
             } as User);
          } else {
             // Si el documento en Firestore no existe, cerramos sesión para evitar estados inconsistentes
             setUser(null);
          }
        } catch (e) {
          console.error("Error al cargar perfil de Firestore:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => {
    auth.signOut();
  };

  const isAdmin = user?.role === "ADMIN";
  const isSeller = user?.role === "SELLER";

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, isAdmin, isSeller }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
