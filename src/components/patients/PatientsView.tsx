import { useState, useEffect } from "react";
import { usePatients } from "@/hooks/usePatients";
import { useOrders } from "@/hooks/useOrders";
import { useAdmin } from "@/hooks/useAdmin";
import { useFinancials } from "@/hooks/useFinancials";
import { useAuth } from "@/contexts/AuthContext";
import { Patient, PatientRecord } from "@/types/patient";
import { Branch } from "@/types/branch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, FileText, Send, ShoppingBag, Phone, MapPin, Building2, Plus, Mail } from "lucide-react";
import { toast } from "sonner";
import { Transaction } from "@/types/financial";
import { Badge } from "@/components/ui/badge";

export const PatientsView = () => {
  const { fetchPatients, addPatient, fetchClinicalRecords, addClinicalRecord, isLoading } = usePatients();
  const { addOrder } = useOrders();
  const { fetchBranches } = useAdmin();
  const { fetchTransactionsByPatient } = useFinancials();
  const { isAdmin } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [patientTransactions, setPatientTransactions] = useState<Transaction[]>([]);

  // New Patient Form
  const [firstName, setFirstName] = useState("");
  const [lastNamePaternal, setLastNamePaternal] = useState("");
  const [lastNameMaternal, setLastNameMaternal] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [branchId, setBranchId] = useState("");

  // New Exam Form Active
  const [isExamining, setIsExamining] = useState(false);
  const [examData, setExamData] = useState({
    sphereOd: 0, cylinderOd: 0, axisOd: 0, addOd: 0,
    sphereOi: 0, cylinderOi: 0, axisOi: 0, addOi: 0,
    pupillaryDistance: 62,
    notes: ""
  });
  
  // Create Order Config (when sending exam to Lab)
  const [isSendingToLab, setIsSendingToLab] = useState<PatientRecord | null>(null);
  const [labFrameModel, setLabFrameModel] = useState("");

  const loadData = async () => {
    const [fetchedPatients, fetchedBranches] = await Promise.all([
      fetchPatients(),
      isAdmin ? fetchBranches() : Promise.resolve([])
    ]);
    setPatients(fetchedPatients);
    if (isAdmin) setBranches(fetchedBranches);
  };

  useEffect(() => {
    loadData();
  }, [fetchPatients]);

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsExamining(false);
    const [records, txs] = await Promise.all([
       fetchClinicalRecords(patient.id),
       fetchTransactionsByPatient(patient.id)
    ]);
    setPatientRecords(records);
    setPatientTransactions(txs);
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastNamePaternal) {
      toast.error("Nombre y primer apellido obligatorios.");
      return;
    }

    const combinedName = `${firstName.trim()} ${lastNamePaternal.trim()} ${lastNameMaternal.trim()}`.trim();

    const id = await addPatient({
      firstName,
      lastNamePaternal,
      lastNameMaternal,
      fullName: combinedName,
      phone,
      email,
      address: address || "Sin dirección",
      branchId: isAdmin ? branchId : undefined
    });

    if (id) {
      setIsAdding(false);
      setFirstName("");
      setLastNamePaternal("");
      setLastNameMaternal("");
      setPhone("");
      setEmail("");
      setAddress("");
      loadData();
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const recordId = await addClinicalRecord(selectedPatient.id, {
      prescription: {
        sphereOd: Number(examData.sphereOd),
        cylinderOd: Number(examData.cylinderOd),
        axisOd: Number(examData.axisOd),
        addOd: Number(examData.addOd),
        sphereOi: Number(examData.sphereOi),
        cylinderOi: Number(examData.cylinderOi),
        axisOi: Number(examData.axisOi),
        addOi: Number(examData.addOi),
        pupillaryDistance: Number(examData.pupillaryDistance),
        notes: examData.notes
      }
    });

    if (recordId) {
      setIsExamining(false);
      // reload records
      const records = await fetchClinicalRecords(selectedPatient.id);
      setPatientRecords(records);
    }
  };

  const handleSendToLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSendingToLab || !selectedPatient || !labFrameModel) return;

    const successId = await addOrder({
      patientName: selectedPatient.fullName,
      patientId: selectedPatient.id,
      lensType: "MONOFOCAL", // simplification for the demo, could be expanding in the UI
      frameModel: labFrameModel,
      prescription: isSendingToLab.prescription,
      notes: "Orden generada desde el expediente clínico.",
      branchId: selectedPatient.branchId // destination = the patient's registering clinic
    });

    if (successId) {
       setIsSendingToLab(null);
       setLabFrameModel("");
       toast.info("Ve a la pestaña Pedidos para darle seguimiento.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* LEFT COLUMN: Patient Directory */}
      <div className="md:w-1/3 flex flex-col space-y-4">
         <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
         </div>
         <p className="text-muted-foreground text-sm">Directorio clínico y expedientes.</p>
         
         <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <UserPlus className="w-4 h-4 mr-2" /> Nuevo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Registro de Nuevo Paciente
                </DialogTitle>
                <DialogDescription>
                  Ingresa los datos personales para crear el expediente clínico.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPatient} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Nombre(s)</label>
                  <Input 
                    value={firstName} 
                    onChange={e=>setFirstName(e.target.value)} 
                    placeholder="Escribe el o los nombres" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Apellido Paterno</label>
                    <Input 
                      value={lastNamePaternal} 
                      onChange={e=>setLastNamePaternal(e.target.value)} 
                      placeholder="Primer Apellido" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex justify-between">
                       <span>Apellido Materno</span>
                       <Badge variant="outline" className="text-[9px] uppercase font-normal opacity-50 border-none px-0">Opcional</Badge>
                    </label>
                    <Input 
                      value={lastNameMaternal} 
                      onChange={e=>setLastNameMaternal(e.target.value)} 
                      placeholder="Segundo Apellido" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={phone} 
                        onChange={e=>setPhone(e.target.value)} 
                        placeholder="10 dígitos" 
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        placeholder="ejemplo@correo.com" 
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary">Sucursal de Origen</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-sm"
                        value={branchId} 
                        onChange={e => setBranchId(e.target.value)}
                        required
                      >
                        <option value="">Selecciona Sucursal...</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold flex justify-between">
                    <span>Dirección / Notas</span>
                    <Badge variant="outline" className="text-[9px] uppercase font-normal opacity-50 border-none px-0">Opcional</Badge>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={address} 
                      onChange={e=>setAddress(e.target.value)} 
                      placeholder="Calle, Colonia, Ciudad" 
                      className="pl-10"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Registrar Paciente"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
         </Dialog>

         <div className="flex-1 overflow-y-auto pr-1">
            {patients.map(p => (
              <div 
                key={p.id}
                onClick={() => handlePatientSelect(p)}
                className={`p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${selectedPatient?.id === p.id ? 'bg-primary/5 border-primary' : 'bg-card hover:bg-muted/50 border-border'}`}
              >
                <div className="font-medium text-sm">{p.fullName}</div>
                <div className="text-xs text-muted-foreground">{p.phone || "Sin teléfono"}</div>
              </div>
            ))}
            {patients.length === 0 && !isLoading && (
              <div className="text-center p-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                 No hay pacientes registrados.
              </div>
            )}
         </div>
      </div>

      {/* RIGHT COLUMN: Medical Record (Expediente) */}
      <div className="md:w-2/3">
        {!selectedPatient ? (
           <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center border rounded-lg bg-muted/10 p-8">
              <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Ningún paciente seleccionado</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Selecciona un paciente del directorio a la izquierda o registra uno nuevo para ver su expediente y realizar exámenes.</p>
           </div>
        ) : (
           <Card className="h-full border-border shadow-sm flex flex-col">
             <CardHeader className="border-b bg-muted/5 py-4">
               <div className="flex justify-between items-start">
                 <div>
                   <CardTitle className="text-2xl">{selectedPatient.fullName}</CardTitle>
                   <CardDescription className="mt-1">
                      En sucursal: {isAdmin ? (branches.find(b=>b.id===selectedPatient.branchId)?.name || 'Local') : 'Local'} • Registrado: {new Date(selectedPatient.registeredAt).toLocaleDateString()}
                   </CardDescription>
                 </div>
                 {!isExamining && (
                    <Button onClick={() => setIsExamining(true)}>
                      <FileText className="w-4 h-4 mr-2" /> Realizar Examen
                    </Button>
                 )}
               </div>
             </CardHeader>
             
             <CardContent className="p-0 flex-1 overflow-y-auto">
                {isExamining ? (
                  // EXAM FORM
                  <div className="p-6 bg-primary/5 border-b border-primary/10">
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-primary">Nuevo Examen Clínico</h4>
                        <Button variant="ghost" size="sm" onClick={()=>setIsExamining(false)}>Cancelar</Button>
                     </div>
                     <form onSubmit={handleSaveExam} className="space-y-6">
                        
                        <div className="grid grid-cols-2 gap-8">
                           {/* OJO DERECHO */}
                           <div className="space-y-3">
                              <h5 className="text-sm font-bold border-b pb-1 text-center bg-muted/30 py-1 rounded">OJO DERECHO (OD)</h5>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Esfera: <Input type="number" step="0.25" value={examData.sphereOd} onChange={e=>setExamData({...examData, sphereOd: e.target.value as any})} className="h-8"/></div>
                                <div>Cilindro: <Input type="number" step="0.25" value={examData.cylinderOd} onChange={e=>setExamData({...examData, cylinderOd: e.target.value as any})} className="h-8"/></div>
                                <div>Eje (°): <Input type="number" value={examData.axisOd} onChange={e=>setExamData({...examData, axisOd: e.target.value as any})} className="h-8"/></div>
                                <div>ADD: <Input type="number" step="0.25" value={examData.addOd} onChange={e=>setExamData({...examData, addOd: e.target.value as any})} className="h-8"/></div>
                              </div>
                           </div>

                           {/* OJO IZQUIERDO */}
                           <div className="space-y-3">
                              <h5 className="text-sm font-bold border-b pb-1 text-center bg-muted/30 py-1 rounded">OJO IZQUIERDO (OI)</h5>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Esfera: <Input type="number" step="0.25" value={examData.sphereOi} onChange={e=>setExamData({...examData, sphereOi: e.target.value as any})} className="h-8"/></div>
                                <div>Cilindro: <Input type="number" step="0.25" value={examData.cylinderOi} onChange={e=>setExamData({...examData, cylinderOi: e.target.value as any})} className="h-8"/></div>
                                <div>Eje (°): <Input type="number" value={examData.axisOi} onChange={e=>setExamData({...examData, axisOi: e.target.value as any})} className="h-8"/></div>
                                <div>ADD: <Input type="number" step="0.25" value={examData.addOi} onChange={e=>setExamData({...examData, addOi: e.target.value as any})} className="h-8"/></div>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-end">
                           <div>
                              <span className="text-sm">Distancia Interpupilar (DIP mm)</span>
                              <Input type="number" value={examData.pupillaryDistance} onChange={e=>setExamData({...examData, pupillaryDistance: e.target.value as any})} />
                           </div>
                           <Button type="submit" className="bg-success hover:bg-success/90" disabled={isLoading}>Guardar en Expediente</Button>
                        </div>
                     </form>
                  </div>
                ) : (
                  // HISTORY AND SALES LIST
                  <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* EXAMES */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Historial Clínico</h4>
                        {patientRecords.length === 0 ? (
                        <p className="text-sm border border-dashed rounded-lg text-center text-muted-foreground py-6">No hay exámenes registrados.</p>
                        ) : (
                        <div className="space-y-4">
                            {patientRecords.map((record) => {
                            const d = new Date(record.examDate);
                            return (
                                <div key={record.id} className="border rounded-lg p-4 bg-muted/5 hover:bg-muted/10 transition-colors">
                                    <div className="flex justify-between items-center mb-3">
                                    <div className="font-semibold text-sm">
                                        {d.toLocaleDateString()}
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 border-primary/30 text-primary" onClick={() => setIsSendingToLab(record)}>
                                        <Send className="w-3.5 h-3.5 bg-transparent" />
                                    </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 text-sm mt-2">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-xs w-8">OD:</span>
                                            <span>{record.prescription.sphereOd} / {record.prescription.cylinderOd} / {record.prescription.axisOd}°</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-bold text-xs w-8">OI:</span>
                                            <span>{record.prescription.sphereOi} / {record.prescription.cylinderOi} / {record.prescription.axisOi}°</span>
                                        </div>
                                        {record.prescription.addOd !== 0 && <div className="text-xs">ADD: {record.prescription.addOd}</div>}
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground font-mono">DIP: {record.prescription.pupillaryDistance}mm</div>
                                </div>
                            )
                            })}
                        </div>
                        )}
                    </div>
                    {/* TRANSACTIONS */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" /> Compras POS
                        </h4>
                        {patientTransactions.length === 0 ? (
                        <p className="text-sm border border-dashed rounded-lg text-center text-muted-foreground py-6">El paciente no tiene historial de compras.</p>
                        ) : (
                        <div className="space-y-3">
                            {patientTransactions.map(tx => {
                                const d = new Date(tx.date);
                                return (
                                <div key={tx.id} className="border-l-4 border-l-success bg-muted/10 rounded-r-lg p-3 text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-success">${tx.amount.toFixed(2)}</span>
                                        <span className="text-xs text-muted-foreground">{d.toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs leading-relaxed">{tx.description}</p>
                                </div>
                                );
                            })}
                        </div>
                        )}
                    </div>
                  </div>
                )}
             </CardContent>
           </Card>
        )}
      </div>

      {/* DIALOG: Send Order to Lab */}
      <Dialog open={isSendingToLab !== null} onOpenChange={(open) => !open && setIsSendingToLab(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar a Laboratorio</DialogTitle>
            <DialogDescription>
              Genera una orden de fabricación con la receta seleccionada para <b>{selectedPatient?.fullName}</b>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendToLab} className="space-y-4 py-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Modelo de Armazón (Elegido por el paciente)</label>
               <Input 
                 placeholder="Ej. Aviador Dorado" 
                 value={labFrameModel} 
                 onChange={e => setLabFrameModel(e.target.value)}
                 required 
               />
               <p className="text-xs text-muted-foreground">Este pedido aparecerá directamente en la pestaña general de Pedidos.</p>
             </div>
             <DialogFooter>
               <Button type="button" variant="ghost" onClick={() => setIsSendingToLab(null)}>Cancelar</Button>
               <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                 <Send className="w-4 h-4 mr-2" /> Confirmar Envío a Taller
               </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientsView;
