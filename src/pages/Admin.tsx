import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BranchesManagement } from "@/components/admin/BranchesManagement";
import { UsersManagement } from "@/components/admin/UsersManagement";

const AdminPanel = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las sucursales y da de alta a los cajeros para controlar el acceso a la plataforma.
        </p>
      </div>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="branches">Sucursales</TabsTrigger>
          <TabsTrigger value="users">Cajeros / Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="branches" className="mt-6">
          <BranchesManagement />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
