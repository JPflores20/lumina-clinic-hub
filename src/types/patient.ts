export interface Patient {
  id: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal?: string;
  fullName: string;
  address: string;
  phone?: string;
  email?: string;
  registeredAt: string;
  branchId: string; // A qué sucursal pertenece originariamente
}

export interface Prescription {
  // Ojo Derecho (OD)
  sphereOd: number;
  cylinderOd: number;
  axisOd: number;
  addOd?: number;
  // Ojo Izquierdo (OI)
  sphereOi: number;
  cylinderOi: number;
  axisOi: number;
  addOi?: number;
  
  pupillaryDistance: number;
  notes?: string;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  branchId: string;
  examDate: string;
  prescription: Prescription;
  frameModel?: string; // Modelo del armazón
}

export interface Appointment {
  id: string;
  patientId: string;
  branchId: string;
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}
