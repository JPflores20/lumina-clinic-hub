export type Role = 'ADMIN' | 'SELLER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: Role;
  branchId?: string; // Required if SELLER. Admin might not have one initially.
  status?: UserStatus;
  permissions?: {
    canAccessFinancials: boolean;
    canAccessInventory: boolean;
    canAccessPatients: boolean;
    canApplyDiscounts: boolean;
    canEditTransactions: boolean;
    canDeleteItems: boolean;
  };
}
