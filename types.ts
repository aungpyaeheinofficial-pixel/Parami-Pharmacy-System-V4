export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  PHARMACIST = 'PHARMACIST',
  CASHIER = 'CASHIER'
}

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  EXPIRED = 'EXPIRED'
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  status: 'active' | 'inactive' | 'archived';
  archivedAt?: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  branchId?: string; // Optional: if user is restricted to a branch
}

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string; // ISO date
  quantity: number;
  costPrice: number;
}

export interface Product {
  id: string;
  sku: string;
  gtin?: string; // Global Trade Item Number (GS1)
  nameEn: string;
  nameMm: string;
  genericName?: string;
  category: string;
  description?: string;
  price: number;
  image: string;
  stockLevel: number;
  minStockLevel: number;
  batches: Batch[];
  requiresPrescription: boolean;
  branchId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  branchId: string;
}

export interface CartItem extends Product {
  cartId: string; // unique ID for cart entry
  selectedBatchId?: string;
  quantity: number;
  discount: number;
}

export interface Sale {
  id: string;
  date: string;
  total: number;
  items: CartItem[];
  customer?: Customer;
  cashierId: string;
  paymentMethod: 'CASH' | 'CARD' | 'KBZ_PAY';
  branchId: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  date: string; // ISO Date YYYY-MM-DD
  description: string;
  paymentMethod?: string;
  branchId: string;
}

// Distribution Types
export interface DistributionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface DistributionOrder {
  id: string;
  customer: string;
  address: string;
  status: 'PENDING' | 'PACKING' | 'DELIVERING' | 'COMPLETED';
  total: number;
  date: string;
  deliveryTime: string;
  paymentType: 'CASH' | 'CREDIT';
  itemsList: DistributionItem[];
  branchId: string;
}

// Purchase Types
export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  paymentType: 'CASH' | 'CREDIT';
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  branchId: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  credit: number;
  outstanding: number;
  branchId: string;
}

// Finance Types
export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'PAID' | 'PENDING';
  branchId: string;
}

export interface Payable {
  id: string;
  supplierName: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  status: 'OVERDUE' | 'DUE_SOON' | 'NORMAL';
  branchId: string;
}

export interface Receivable {
  id: string;
  customerName: string;
  orderId: string;
  amount: number;
  dueDate: string;
  status: 'OVERDUE' | 'NORMAL';
  branchId: string;
}

export interface AppSettings {
  companyName: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  language: string;
  shopNameReceipt: string;
  receiptFooter: string;
  paperSize: string;
  defaultPrinter: string;
  autoPrint: boolean;
  showImages: boolean;
  lowStockLimit: number;
  expiryWarningDays: number;
  enableEmailReports: boolean;
  enableCriticalAlerts: boolean;
  notificationEmail: string;
}