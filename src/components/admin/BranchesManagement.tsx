import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Branch } from "@/types/branch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export const BranchesManagement = () => {
  const { fetchBranches, addBranch, isLoading } = useAdmin();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const loadBranches = async () => {
    const data = await fetchBranches();
    setBranches(data);
  };

  useEffect(() => {
    loadBranches();
  }, [fetchBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;
    
    const id = await addBranch({ name, address });
    if (id) {
      setIsAdding(false);
      setName("");
      setAddress("");
      loadBranches();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Sucursales (Ópticas)</h2>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Nueva Sucursal</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-border shadow-sm animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Registrar Nueva Sucursal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Nombre de la Óptica</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Óptica Centro" required />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle Principal #123" required />
              </div>
              <Button type="submit" disabled={isLoading} className="mb-0.5">
                Guardar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="w-[100px]">ID interno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No hay sucursales registradas.</TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.address}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{branch.id.slice(0, 6)}...</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
