import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Branch } from "@/types/branch";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

interface BranchContextType {
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSeller } = useAuth();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const fetchBranches = async () => {
      try {
        const q = query(collection(db, "branches"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        const data: Branch[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Branch);
        });
        setBranches(data);
      } catch (e) {
        console.error("Error fetching branches for context:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    // Lógica principal: si es vendedor, forzar su sucursal
    if (isSeller && user?.branchId) {
      const sellerBranch = branches.find(b => b.id === user.branchId);
      if (sellerBranch) {
        setSelectedBranch(sellerBranch);
      }
    } else if (!isSeller && branches.length > 0 && !selectedBranch) {
      // Si es Admin, por defecto selecciona la primera sucursal o lo dejamos en null para ver "Visión Global"
      setSelectedBranch(null); 
    }
  }, [user, isSeller, branches]);

  return (
    <BranchContext.Provider value={{ branches, selectedBranch, setSelectedBranch, isLoading }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranches = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranches debe usarse dentro de un BranchProvider");
  }
  return context;
};
