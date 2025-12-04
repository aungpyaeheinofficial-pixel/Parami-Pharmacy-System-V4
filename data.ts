import { Product, Role, User, Customer, Transaction, DistributionOrder, PurchaseOrder, Expense, Payable, Receivable, Supplier } from './types';

// Branches
// b1: Parami(1) Dawei
// b2: Parami(2) Yangon

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Kaung Kaung',
    email: 'admin@parami.com',
    role: Role.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
  },
  {
    id: 'u2',
    name: 'Kyaw Kyaw',
    email: 'pos@parami.com',
    role: Role.CASHIER,
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    branchId: 'b1'
  }
];

export const mockCustomers: Customer[] = [
  { id: 'c1', name: 'U Ba Maung', phone: '095123456', points: 1250, tier: 'Gold', branchId: 'b1' },
  { id: 'c2', name: 'Daw Hla', phone: '097987654', points: 450, tier: 'Silver', branchId: 'b1' },
  { id: 'c3', name: 'Ko Aung', phone: '092500112', points: 2100, tier: 'Platinum', branchId: 'b2' },
  { id: 'c4', name: 'City Clinic', phone: '099999999', points: 5000, tier: 'Platinum', branchId: 'b1' },
  { id: 'c5', name: 'Royal Hospital', phone: '098888888', points: 12000, tier: 'Platinum', branchId: 'b2' }
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    sku: '8850123456789',
    gtin: '08850123456789',
    nameEn: 'Paracetamol 500mg',
    nameMm: 'ပါရာစီတမော ၅၀၀ မီလီဂရမ်',
    genericName: 'Paracetamol',
    category: 'Analgesics',
    description: 'Relieves pain and fever',
    price: 500,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200',
    stockLevel: 150,
    minStockLevel: 50,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'STRIP',
    batches: [
      { id: 'batch1', batchNumber: 'B001', expiryDate: '2025-12-31', quantity: 100, costPrice: 300 },
      { id: 'batch2', batchNumber: 'B002', expiryDate: '2024-06-30', quantity: 50, costPrice: 320 }
    ]
  },
  {
    id: 'p2',
    sku: '8859876543210',
    gtin: '08859876543210',
    nameEn: 'Amoxicillin 250mg',
    nameMm: 'အမောက်စီဆလင် ၂၅၀ မီလီဂရမ်',
    genericName: 'Amoxicillin',
    category: 'Antibiotics',
    description: 'Antibiotic for bacterial infections',
    price: 1500,
    image: '',
    stockLevel: 20,
    minStockLevel: 30,
    requiresPrescription: true,
    branchId: 'b1',
    unit: 'STRIP',
    batches: [
      { id: 'batch3', batchNumber: 'B003', expiryDate: '2024-03-15', quantity: 20, costPrice: 1000 }
    ]
  },
  {
    id: 'p3',
    sku: '8851111111111',
    nameEn: 'Vitamin C 1000mg',
    nameMm: 'ဗီတာမင် စီ ၁၀၀၀ မီလီဂရမ်',
    category: 'Vitamins',
    description: 'Immune system support',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1550572017-edc9535071aa?auto=format&fit=crop&q=80&w=200',
    stockLevel: 200,
    minStockLevel: 20,
    requiresPrescription: false,
    branchId: 'b2',
    unit: 'BOTTLE',
    batches: [
        { id: 'batch4', batchNumber: 'B004', expiryDate: '2026-01-01', quantity: 200, costPrice: 2000 }
    ]
  },
  {
    id: 'p4',
    sku: '8852222222222',
    nameEn: 'Omeprazole 20mg',
    nameMm: 'အိုမီပရာဇော ၂၀ မီလီဂရမ်',
    genericName: 'Omeprazole',
    category: 'Gastrointestinal',
    description: 'For acid reflux and ulcers',
    price: 800,
    image: '',
    stockLevel: 10,
    minStockLevel: 25,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'STRIP',
    batches: [
        { id: 'batch5', batchNumber: 'B005', expiryDate: '2024-02-28', quantity: 10, costPrice: 500 }
    ]
  }
];

export const mockTransactions: Transaction[] = [
  { id: 't1', type: 'INCOME', category: 'Sales', amount: 15000, date: '2024-03-10', description: 'Daily Sales', branchId: 'b1', paymentMethod: 'CASH' },
  { id: 't2', type: 'EXPENSE', category: 'Utilities', amount: 50000, date: '2024-03-08', description: 'Electricity Bill', branchId: 'b1' },
  { id: 't3', type: 'INCOME', category: 'Sales', amount: 25000, date: '2024-03-11', description: 'Daily Sales', branchId: 'b2', paymentMethod: 'KBZ_PAY' },
  { id: 't4', type: 'INCOME', category: 'Sales', amount: 4500, date: '2024-03-12', description: 'POS Sale', branchId: 'b1', paymentMethod: 'CASH' }
];

export const mockDistributionOrders: DistributionOrder[] = [
  { 
      id: 'ord1', 
      customer: 'City Mart', 
      address: 'No 1, Pyay Rd', 
      status: 'PENDING', 
      total: 150000, 
      date: '2024-03-12', 
      deliveryTime: '10:00', 
      paymentType: 'CREDIT', 
      branchId: 'b1',
      itemsList: [
          { id: 'di1', name: 'Paracetamol', quantity: 100, price: 400 },
          { id: 'di2', name: 'Vitamin C', quantity: 50, price: 2200 }
      ]
  },
  {
      id: 'ord2',
      customer: 'Sein Gay Har',
      address: 'Hledan Center',
      status: 'DELIVERING',
      total: 50000,
      date: '2024-03-11',
      deliveryTime: '14:00',
      paymentType: 'CASH',
      branchId: 'b1',
      itemsList: [
          { id: 'di3', name: 'Amoxicillin', quantity: 30, price: 1400 }
      ]
  }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
    {
        id: 'po1',
        supplierId: 's1',
        supplierName: 'AA Medical',
        date: '2024-03-01',
        status: 'RECEIVED',
        paymentType: 'CREDIT',
        items: [
            { id: 'pi1', name: 'Paracetamol', quantity: 1000, unitCost: 300 }
        ],
        totalAmount: 300000,
        notes: 'Monthly restock',
        branchId: 'b1'
    },
    {
        id: 'po2',
        supplierId: 's2',
        supplierName: 'Shwe Mi',
        date: '2024-03-05',
        status: 'PENDING',
        paymentType: 'CASH',
        items: [
             { id: 'pi2', name: 'Vitamin C', quantity: 500, unitCost: 1800 }
        ],
        totalAmount: 900000,
        branchId: 'b1'
    }
];

export const mockExpenses: Expense[] = [
    { id: 'e1', category: 'Rent', amount: 300000, date: '2024-03-01', description: 'Shop Rent March', status: 'PAID', branchId: 'b1' },
    { id: 'e2', category: 'Salary', amount: 150000, date: '2024-03-01', description: 'Staff Salary', status: 'PAID', branchId: 'b1' },
    { id: 'e3', category: 'Maintenance', amount: 25000, date: '2024-03-10', description: 'AC Repair', status: 'PENDING', branchId: 'b1' }
];

export const mockSuppliers: Supplier[] = [
    { id: 's1', name: 'AA Medical', contact: '091234567', email: 'sales@aamedical.com', credit: 1000000, outstanding: 300000, branchId: 'b1' },
    { id: 's2', name: 'Shwe Mi', contact: '098765432', email: 'info@shwemi.com', credit: 500000, outstanding: 0, branchId: 'b1' }
];

export const mockPayables: Payable[] = [
    { id: 'py1', supplierName: 'AA Medical', invoiceNo: 'INV-001', amount: 300000, dueDate: '2024-03-31', status: 'DUE_SOON', branchId: 'b1' }
];

export const mockReceivables: Receivable[] = [
    { id: 'rc1', customerName: 'City Mart', orderId: 'ord1', amount: 150000, dueDate: '2024-03-20', status: 'NORMAL', branchId: 'b1' }
];