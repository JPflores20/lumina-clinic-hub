export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  branchId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO String
  description: string;
  userId: string; // Quién registró la transacción
  patientId?: string; // Paciente asociado (si aplica)
  patientName?: string; // Nombre del paciente para fácil lectura
  noteNumber?: string; // Número de nota o recibo de compra
  items?: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  discount?: number; // Descuento aplicado a la transacción
}
