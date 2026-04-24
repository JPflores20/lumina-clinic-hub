import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { User, Role } from "@/types/auth";
import { Branch } from "@/types/branch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Power, Edit2, UserCog, Save, X, ShieldAlert, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const UsersManagement = () => {
  const { fetchUsers, addUser, updateUser, deleteUser, fetchBranches, resetUserPassword, isLoading } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SELLER");
  const [branchId, setBranchId] = useState("");
  
  // Estados para Edición
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<Role>("SELLER");
  const [editBranchId, setEditBranchId] = useState("");
  const [permissions, setPermissions] = useState({
    canAccessFinancials: true,
    canAccessInventory: true,
    canAccessPatients: true,
    canApplyDiscounts: true,
    canEditTransactions: false,
    canDeleteItems: false,
  });
  const [editPermissions, setEditPermissions] = useState({
    canAccessFinancials: true,
    canAccessInventory: true,
    canAccessPatients: true,
    canApplyDiscounts: true,
    canEditTransactions: false,
    canDeleteItems: false,
  });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const loadData = async () => {
    const [fetchedUsers, fetchedBranches] = await Promise.all([fetchUsers(), fetchBranches()]);
    setUsers(fetchedUsers);
    setBranches(fetchedBranches);
  };

  useEffect(() => {
    loadData();
  }, [fetchUsers, fetchBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    
    const id = await addUser({ 
       name, 
       email, 
       phone,
       password,
       role, 
       branchId: role === "SELLER" ? branchId : undefined,
       permissions: role === "ADMIN" ? {
          canAccessFinancials: true,
          canAccessInventory: true,
          canAccessPatients: true,
          canApplyDiscounts: true,
          canEditTransactions: true,
          canDeleteItems: true,
       } : permissions
    });
    
    if (id) {
      setIsAdding(false);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("SELLER");
      setBranchId("");
      loadData();
    }
  };

  const handleOpenEdit = (user: User) => {
    setUserToEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditRole(user.role);
    setEditBranchId(user.branchId || "");
    setEditPermissions(user.permissions || {
      canAccessFinancials: user.role === "ADMIN",
      canAccessInventory: user.role === "ADMIN",
      canAccessPatients: user.role === "ADMIN",
      canApplyDiscounts: user.role === "ADMIN",
      canEditTransactions: user.role === "ADMIN",
      canDeleteItems: user.role === "ADMIN",
    });
  };

  const handleUpdateUser = async () => {
    if (!userToEdit) return;
    const success = await updateUser(userToEdit.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      role: editRole,
      branchId: editRole === "SELLER" ? editBranchId : undefined,
      permissions: editPermissions
    });
    
    if (success) {
      setUserToEdit(null);
      loadData();
    }
  };

  const getBranchName = (id?: string) => {
    if (!id) return "Sucursales Varias / Admin";
    return branches.find(b => b.id === id)?.name || "Sin Sucursal";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Cajeros y Usuarios</h2>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Nuevo Usuario</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-border shadow-sm animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Registrar Nuevo Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Completo</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del cajero" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo Electrónico</label>
                <Input value={email} type="email" onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono / Celular</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 dígitos" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña de Ingreso</label>
                <Input value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <select 
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  value={role} 
                  onChange={e => setRole(e.target.value as Role)}
                >
                  <option value="SELLER">Vendedor (Cajero)</option>
                  <option value="ADMIN">Administrador General</option>
                </select>
              </div>

              {role === "SELLER" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sucursal Asignada</label>
                  <select 
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                    value={branchId} 
                    onChange={e => setBranchId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Seleccione una óptica...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="lg:col-span-3 border-t pt-4 mt-2">
                 <label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Permisos y Accesos (Cajero)</label>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="flex items-center space-x-2">
                       <Switch id="p-fin" checked={permissions.canAccessFinancials} onCheckedChange={(v) => setPermissions({...permissions, canAccessFinancials: v})} />
                       <Label htmlFor="p-fin" className="text-[11px]">Finanzas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                       <Switch id="p-inv" checked={permissions.canAccessInventory} onCheckedChange={(v) => setPermissions({...permissions, canAccessInventory: v})} />
                       <Label htmlFor="p-inv" className="text-[11px]">Inventario</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                       <Switch id="p-pat" checked={permissions.canAccessPatients} onCheckedChange={(v) => setPermissions({...permissions, canAccessPatients: v})} />
                       <Label htmlFor="p-pat" className="text-[11px]">Pacientes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                       <Switch id="p-disc" checked={permissions.canApplyDiscounts} onCheckedChange={(v) => setPermissions({...permissions, canApplyDiscounts: v})} />
                       <Label htmlFor="p-disc" className="text-[11px]">Descuentos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                       <Switch id="p-edit" checked={permissions.canEditTransactions} onCheckedChange={(v) => setPermissions({...permissions, canEditTransactions: v})} />
                       <Label htmlFor="p-edit" className="text-[11px]">Editar Venta</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                       <Switch id="p-del" checked={permissions.canDeleteItems} onCheckedChange={(v) => setPermissions({...permissions, canDeleteItems: v})} />
                       <Label htmlFor="p-del" className="text-[11px]">Eliminar</Label>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-3 flex justify-end">
                <Button type="submit" disabled={isLoading} className="w-full lg:w-fit bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Registrar Empleado
                </Button>
              </div>
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
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No hay usuarios registrados.</TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className={user.status === 'INACTIVE' ? 'opacity-60 bg-muted/20' : ''}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role === "ADMIN" ? "Administrador" : "Vendedor"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getBranchName(user.branchId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={user.status === 'INACTIVE' ? 'text-destructive border-destructive/50' : 'text-success border-success/50'}>
                        {user.status === 'INACTIVE' ? 'Inactivo' : 'Activo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-1">
                          <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 text-muted-foreground hover:text-primary" 
                             title={user.status === 'INACTIVE' ? 'Activar' : 'Desactivar'}
                             onClick={() => {
                               updateUser(user.id, { status: user.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE' }).then(() => loadData());
                             }}
                          >
                             <Power className="h-4 w-4" />
                          </Button>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 text-muted-foreground hover:text-primary" 
                             title="Editar Información"
                             onClick={() => handleOpenEdit(user)}
                          >
                             <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                             title="Eliminar"
                             onClick={() => setUserToDelete(user)}
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edición de Usuario */}
      <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Editar Perfil: {userToEdit?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre Completo</label>
              <Input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="col-span-3"
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                 <label className="text-sm font-medium">Correo Electrónico</label>
                 <Badge variant="outline" className="text-[9px] uppercase tracking-tighter opacity-60">Authentication ID</Badge>
              </div>
              <Input 
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)} 
                className="bg-background"
                placeholder="ejemplo@lumina.com"
              />
            </div>
            
            <div className="grid gap-2 p-3 bg-muted/40 rounded-xl border border-dashed">
              <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" /> Seguridad y Login
              </label>
              <div className="flex items-center justify-between gap-4 mt-2">
                <div className="text-[11px] text-muted-foreground flex-1 leading-tight">
                  Para actualizar la contraseña o recuperar acceso, el sistema enviará un enlace seguro al correo de este cajero.
                </div>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  className="h-8 text-xs font-bold"
                  onClick={() => resetUserPassword(editEmail)}
                >
                  Cambiar Password
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Teléfono de Contacto</label>
              <Input 
                value={editPhone} 
                onChange={(e) => setEditPhone(e.target.value)} 
                placeholder="Sin teléfono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Rol de Usuario</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value as Role)}
                >
                  <option value="SELLER">Vendedor (Cajero)</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              
              {editRole === "SELLER" && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Sucursal</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={editBranchId} 
                    onChange={(e) => setEditBranchId(e.target.value)}
                  >
                    <option value="">Seleccione sucursal...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
               <label className="text-xs font-bold uppercase text-muted-foreground mb-4 block">Configuración de Privilegios</label>
               <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                     <Label className="text-xs font-medium">Módulo Finanzas</Label>
                     <Switch checked={editPermissions.canAccessFinancials} onCheckedChange={(v) => setEditPermissions({...editPermissions, canAccessFinancials: v})} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                     <Label className="text-xs font-medium">Módulo Inventario</Label>
                     <Switch checked={editPermissions.canAccessInventory} onCheckedChange={(v) => setEditPermissions({...editPermissions, canAccessInventory: v})} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                     <Label className="text-xs font-medium">Gestión Pacientes</Label>
                     <Switch checked={editPermissions.canAccessPatients} onCheckedChange={(v) => setEditPermissions({...editPermissions, canAccessPatients: v})} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                     <Label className="text-xs font-medium">Aplicar Descuentos</Label>
                     <Switch checked={editPermissions.canApplyDiscounts} onCheckedChange={(v) => setEditPermissions({...editPermissions, canApplyDiscounts: v})} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                     <Label className="text-xs font-medium">Editar Transacciones</Label>
                     <Switch checked={editPermissions.canEditTransactions} onCheckedChange={(v) => setEditPermissions({...editPermissions, canEditTransactions: v})} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                     <Label className="text-xs font-medium">Eliminar Registros</Label>
                     <Switch checked={editPermissions.canDeleteItems} onCheckedChange={(v) => setEditPermissions({...editPermissions, canDeleteItems: v})} />
                  </div>
               </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0 font-bold border-t pt-4">
            <Button variant="outline" onClick={() => setUserToEdit(null)}>
              <X className="w-4 h-4 mr-2" /> Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" /> Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Confirmación para eliminar */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {userToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. Se borrará su perfil de Firestore y no podrá acceder al sistema. Su cuenta de Authentication deberá borrarse manualmente en la consola de Firebase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (userToDelete) {
                  deleteUser(userToDelete.id).then(() => {
                    loadData();
                    setUserToDelete(null);
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
