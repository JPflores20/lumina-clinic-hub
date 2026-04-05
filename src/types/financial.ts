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
}
