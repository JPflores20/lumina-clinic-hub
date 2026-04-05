import { Prescription } from "./patient";

export type OrderStatus = "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "CANCELLED";
export type LensType = "MONOFOCAL" | "BIFOCAL" | "PROGRESSIVE" | "CONTACT_LENS" | "OTHER";

export interface Order {
  id: string;
  patientName: string;
  patientId?: string;
  branchId: string;
  
  // Especificaciones
  frameModel: string;
  lensType: LensType;
  prescription: Prescription;
  notes?: string;
  
  // Estado y Flujo
  status: OrderStatus;
  orderDate: string; // ISO string de Firebase Timestamp
  deliveryDate?: string; 
}
