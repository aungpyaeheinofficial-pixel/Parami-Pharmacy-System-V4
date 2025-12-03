import { create } from 'zustand';
import { 
  CartItem, Product, User, Role, Transaction, Customer, Branch, 
  DistributionOrder, PurchaseOrder, Expense, Payable, Receivable, Supplier, AppSettings
} from './types';
import { 
  mockProducts, mockUsers, mockTransactions, mockCustomers, 
  mockDistributionOrders, mockPurchaseOrders, mockExpenses, mockPayables, mockReceivables, mockSuppliers 
} from './data';

// --- Shared Helper for Persistence ---
const getInitialBranchId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('currentBranchId') || 'b1';
  }
  return 'b1';
};

const initialBranchId = getInitialBranchId();

// --- Branch Management Store ---
interface BranchState {
  branches: Branch[];
  currentBranchId: string;
  setBranch: (id: string) => void;
  getCurrentBranch: () => Branch | undefined;
  addBranch: (branch: Branch) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
}

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [
    { 
      id: 'b1', 
      name: 'ပါရမီ(၁) ထားဝယ်', 
      code: 'parami-1', 
      address: 'No. 45, Arzarni Road, Dawei', 
      phone: '09-420012345',
      managerName: 'U Mg Mg',
      email: 'branch1@parami.com',
      status: 'active' 
    }, 
    { 
      id: 'b2', 
      name: 'ပါရမီ(၂) ရန်ကုန်', 
      code: 'parami-2',
      address: 'No. 12, Pyay Road, Yangon',
      phone: '09-420098765', 
      managerName: 'Daw Hla',
      email: 'branch2@parami.com',
      status: 'active'
    } 
  ],
  currentBranchId: initialBranchId,
  
  setBranch: (id: string) => {
    localStorage.setItem('currentBranchId', id);
    set({ currentBranchId: id });
    
    // Trigger sync in other stores
    useProductStore.getState().syncWithBranch(id);
    useCustomerStore.getState().syncWithBranch(id);
    useTransactionStore.getState().syncWithBranch(id);
    useCartStore.getState().clearCart(); // Clear cart on branch switch
    useDistributionStore.getState().syncWithBranch(id);
    usePurchaseStore.getState().syncWithBranch(id);
    useFinanceStore.getState().syncWithBranch(id);
    useSupplierStore.getState().syncWithBranch(id);
  },
  
  getCurrentBranch: () => get().branches.find(b => b.id === get().currentBranchId),

  addBranch: (branch) => set((state) => ({ 
    branches: [...state.branches, branch] 
  })),

  updateBranch: (id, updates) => set((state) => ({
    branches: state.branches.map(b => b.id === id ? { ...b, ...updates } : b)
  })),

  deleteBranch: (id) => set((state) => {
    const newBranches = state.branches.filter(b => b.id !== id);

    // Cascade Delete Effect: Clean up data in other stores asynchronously
    setTimeout(() => {
        // Product Store
        useProductStore.setState(s => ({
            allProducts: s.allProducts.filter(p => p.branchId !== id),
            products: s.products.filter(p => p.branchId !== id)
        }));
        // Customer Store
        useCustomerStore.setState(s => ({
            allCustomers: s.allCustomers.filter(c => c.branchId !== id),
            customers: s.customers.filter(c => c.branchId !== id)
        }));
        // Transaction Store
        useTransactionStore.setState(s => ({
            allTransactions: s.allTransactions.filter(t => t.branchId !== id),
            transactions: s.transactions.filter(t => t.branchId !== id)
        }));
        // Distribution Store
        useDistributionStore.setState(s => ({
             allOrders: s.allOrders.filter(o => o.branchId !== id),
             orders: s.orders.filter(o => o.branchId !== id)
        }));
        // Purchase Store
        usePurchaseStore.setState(s => ({
             allPOs: s.allPOs.filter(p => p.branchId !== id),
             purchaseOrders: s.purchaseOrders.filter(p => p.branchId !== id)
        }));
        // Finance Store
        useFinanceStore.setState(s => ({
             allExpenses: s.allExpenses.filter(e => e.branchId !== id),
             expenses: s.expenses.filter(e => e.branchId !== id),
             allPayables: s.allPayables.filter(p => p.branchId !== id),
             payables: s.payables.filter(p => p.branchId !== id),
             allReceivables: s.allReceivables.filter(r => r.branchId !== id),
             receivables: s.receivables.filter(r => r.branchId !== id),
        }));
        // Supplier Store
        useSupplierStore.setState(s => ({
             allSuppliers: s.allSuppliers.filter(supplier => supplier.branchId !== id),
             suppliers: s.suppliers.filter(supplier => supplier.branchId !== id)
        }));
    }, 0);
    
    // If we deleted the current branch, switch to the first available one
    if (state.currentBranchId === id) {
       const newId = newBranches.length > 0 ? newBranches[0].id : '';
       localStorage.setItem('currentBranchId', newId);
       
       if (newId) {
         // Trigger side effects asynchronously to avoid state conflict
         setTimeout(() => {
            useBranchStore.getState().setBranch(newId);
         }, 0);
       }
       return { branches: newBranches, currentBranchId: newId };
    }
    return { branches: newBranches };
  })
}));

// --- Auth Store ---
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, 
  isAuthenticated: false,
  login: (email: string) => {
    const user = mockUsers.find(u => u.email === email) || mockUsers[0];
    set({ user, isAuthenticated: true });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
}));

// --- Cart Store ---
interface CartState {
  items: CartItem[];
  customer: any | null;
  setCustomer: (customer: any) => void;
  addItem: (product: Product, batchId?: string) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  setCustomer: (customer) => set({ customer }),
  addItem: (product, batchId) => {
    const existing = get().items.find(i => 
      i.id === product.id && 
      (batchId ? i.selectedBatchId === batchId : true)
    );

    if (existing) {
      set({
        items: get().items.map(i => 
          i.cartId === existing.cartId ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      set({ 
        items: [...get().items, { 
          ...product, 
          cartId: Math.random().toString(), 
          quantity: 1, 
          discount: 0,
          selectedBatchId: batchId || product.batches[0]?.id 
        }] 
      });
    }
  },
  removeItem: (cartId) => set({ items: get().items.filter(i => i.cartId !== cartId) }),
  updateQuantity: (cartId, qty) => set({
    items: get().items.map(i => i.cartId === cartId ? { ...i, quantity: Math.max(1, qty) } : i)
  }),
  clearCart: () => set({ items: [], customer: null }),
  total: () => get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
}));

// --- Global UI Store ---
interface GlobalState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

// --- Inventory / Product Management Store ---
interface ProductState {
  allProducts: Product[]; // Master DB
  products: Product[];    // Filtered View
  syncWithBranch: (branchId: string) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  allProducts: mockProducts,
  products: mockProducts.filter(p => p.branchId === initialBranchId), // Init with persisted branch
  
  syncWithBranch: (branchId) => {
    set(state => ({
      products: state.allProducts.filter(p => p.branchId === branchId)
    }));
  },

  setProducts: (products) => set({ products }),
  
  addProduct: (product) => {
    const currentBranchId = useBranchStore.getState().currentBranchId;
    const newProduct = { ...product, branchId: currentBranchId };
    set((state) => ({ 
      allProducts: [newProduct, ...state.allProducts],
      products: [newProduct, ...state.products] 
    }));
  },
  
  updateProduct: (id, updates) => set((state) => {
    const updatedAll = state.allProducts.map((p) => (p.id === id ? { ...p, ...updates } : p));
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allProducts: updatedAll,
      products: updatedAll.filter(p => p.branchId === currentBranchId)
    };
  }),
  
  deleteProduct: (id) => set((state) => {
     const updatedAll = state.allProducts.filter((p) => p.id !== id);
     const currentBranchId = useBranchStore.getState().currentBranchId;
     return {
        allProducts: updatedAll,
        products: updatedAll.filter(p => p.branchId === currentBranchId)
     };
  }),
}));

// --- Customer Management Store ---
interface CustomerState {
  allCustomers: Customer[];
  customers: Customer[];
  syncWithBranch: (branchId: string) => void;
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  allCustomers: mockCustomers,
  customers: mockCustomers.filter(c => c.branchId === initialBranchId),
  
  syncWithBranch: (branchId) => {
    set(state => ({
      customers: state.allCustomers.filter(c => c.branchId === branchId)
    }));
  },

  setCustomers: (customers) => set({ customers }),
  
  addCustomer: (customer) => {
    const currentBranchId = useBranchStore.getState().currentBranchId;
    const newCustomer = { ...customer, branchId: currentBranchId };
    set((state) => ({ 
      allCustomers: [newCustomer, ...state.allCustomers],
      customers: [newCustomer, ...state.customers]
    }));
  },
  
  updateCustomer: (id, updates) => set((state) => {
    const updatedAll = state.allCustomers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allCustomers: updatedAll,
      customers: updatedAll.filter(c => c.branchId === currentBranchId)
    };
  }),
  
  deleteCustomer: (id) => set((state) => {
    const updatedAll = state.allCustomers.filter((c) => c.id !== id);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allCustomers: updatedAll,
      customers: updatedAll.filter(c => c.branchId === currentBranchId)
    };
  }),
}));

// --- Transaction Store ---
interface TransactionState {
  allTransactions: Transaction[];
  transactions: Transaction[];
  syncWithBranch: (branchId: string) => void;
  addTransaction: (transaction: Transaction) => void;
  setTransactions: (transactions: Transaction[]) => void;
  getTransactionsByDateRange: (from: string, to: string) => Transaction[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  allTransactions: mockTransactions,
  transactions: mockTransactions.filter(t => t.branchId === initialBranchId),
  
  syncWithBranch: (branchId) => {
    set(state => ({
      transactions: state.allTransactions.filter(t => t.branchId === branchId)
    }));
  },

  addTransaction: (transaction) => {
     const currentBranchId = useBranchStore.getState().currentBranchId;
     const newTrans = { ...transaction, branchId: currentBranchId };
     set((state) => ({ 
        allTransactions: [newTrans, ...state.allTransactions],
        transactions: [newTrans, ...state.transactions] 
     }));
  },
  
  setTransactions: (transactions) => set({ transactions }),
  
  getTransactionsByDateRange: (from, to) => {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    
    // Only return transactions from currently filtered view
    return get().transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }
}));

// --- Distribution Store ---
interface DistributionState {
  allOrders: DistributionOrder[];
  orders: DistributionOrder[];
  syncWithBranch: (branchId: string) => void;
  addOrder: (order: DistributionOrder) => void;
  updateOrder: (order: DistributionOrder) => void;
  deleteOrder: (id: string) => void;
}

export const useDistributionStore = create<DistributionState>((set) => ({
  allOrders: mockDistributionOrders,
  orders: mockDistributionOrders.filter(o => o.branchId === initialBranchId),
  
  syncWithBranch: (branchId) => {
    set(state => ({
      orders: state.allOrders.filter(o => o.branchId === branchId)
    }));
  },

  addOrder: (order) => {
    const currentBranchId = useBranchStore.getState().currentBranchId;
    const newOrder = { ...order, branchId: currentBranchId };
    set(state => ({
      allOrders: [newOrder, ...state.allOrders],
      orders: [newOrder, ...state.orders]
    }));
  },

  updateOrder: (order) => set(state => {
    const updatedAll = state.allOrders.map(o => o.id === order.id ? order : o);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allOrders: updatedAll,
      orders: updatedAll.filter(o => o.branchId === currentBranchId)
    };
  }),

  deleteOrder: (id) => set(state => {
    const updatedAll = state.allOrders.filter(o => o.id !== id);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allOrders: updatedAll,
      orders: updatedAll.filter(o => o.branchId === currentBranchId)
    };
  })
}));

// --- Purchase Store ---
interface PurchaseState {
  allPOs: PurchaseOrder[];
  purchaseOrders: PurchaseOrder[];
  syncWithBranch: (branchId: string) => void;
  addPO: (po: PurchaseOrder) => void;
  updatePO: (po: PurchaseOrder) => void;
  deletePO: (id: string) => void;
}

export const usePurchaseStore = create<PurchaseState>((set) => ({
  allPOs: mockPurchaseOrders,
  purchaseOrders: mockPurchaseOrders.filter(p => p.branchId === initialBranchId),

  syncWithBranch: (branchId) => {
    set(state => ({
      purchaseOrders: state.allPOs.filter(p => p.branchId === branchId)
    }));
  },

  addPO: (po) => {
    const currentBranchId = useBranchStore.getState().currentBranchId;
    const newPO = { ...po, branchId: currentBranchId };
    set(state => ({
      allPOs: [newPO, ...state.allPOs],
      purchaseOrders: [newPO, ...state.purchaseOrders]
    }));
  },

  updatePO: (po) => set(state => {
    const updatedAll = state.allPOs.map(p => p.id === po.id ? po : p);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allPOs: updatedAll,
      purchaseOrders: updatedAll.filter(p => p.branchId === currentBranchId)
    };
  }),

  deletePO: (id) => set(state => {
    const updatedAll = state.allPOs.filter(p => p.id !== id);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allPOs: updatedAll,
      purchaseOrders: updatedAll.filter(p => p.branchId === currentBranchId)
    };
  })
}));

// --- Finance Store ---
interface FinanceState {
  allExpenses: Expense[];
  expenses: Expense[];
  allPayables: Payable[];
  payables: Payable[];
  allReceivables: Receivable[];
  receivables: Receivable[];
  
  syncWithBranch: (branchId: string) => void;
  
  addExpense: (ex: Expense) => void;
  removeExpense: (id: string) => void;
  
  // Basic marking actions for demo
  markPayablePaid: (id: string) => void;
  markReceivableCollected: (id: string) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  allExpenses: mockExpenses,
  expenses: mockExpenses.filter(e => e.branchId === initialBranchId),
  allPayables: mockPayables,
  payables: mockPayables.filter(p => p.branchId === initialBranchId),
  allReceivables: mockReceivables,
  receivables: mockReceivables.filter(r => r.branchId === initialBranchId),

  syncWithBranch: (branchId) => {
    set(state => ({
      expenses: state.allExpenses.filter(e => e.branchId === branchId),
      payables: state.allPayables.filter(p => p.branchId === branchId),
      receivables: state.allReceivables.filter(r => r.branchId === branchId)
    }));
  },

  addExpense: (ex) => {
    const currentBranchId = useBranchStore.getState().currentBranchId;
    const newEx = { ...ex, branchId: currentBranchId };
    set(state => ({
      allExpenses: [newEx, ...state.allExpenses],
      expenses: [newEx, ...state.expenses]
    }));
  },

  removeExpense: (id) => set(state => {
    const updatedAll = state.allExpenses.filter(e => e.id !== id);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allExpenses: updatedAll,
      expenses: updatedAll.filter(e => e.branchId === currentBranchId)
    };
  }),

  markPayablePaid: (id) => set(state => {
    const updatedAll = state.allPayables.filter(p => p.id !== id);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allPayables: updatedAll,
      payables: updatedAll.filter(p => p.branchId === currentBranchId)
    };
  }),

  markReceivableCollected: (id) => set(state => {
     const updatedAll = state.allReceivables.filter(r => r.id !== id);
     const currentBranchId = useBranchStore.getState().currentBranchId;
     return {
       allReceivables: updatedAll,
       receivables: updatedAll.filter(r => r.branchId === currentBranchId)
     };
  })
}));

// --- Supplier Store ---
interface SupplierState {
  allSuppliers: Supplier[];
  suppliers: Supplier[];
  syncWithBranch: (branchId: string) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  allSuppliers: mockSuppliers,
  suppliers: mockSuppliers.filter(s => s.branchId === initialBranchId),

  syncWithBranch: (branchId) => {
    set(state => ({
      suppliers: state.allSuppliers.filter(s => s.branchId === branchId)
    }));
  },

  addSupplier: (supplier) => {
    const currentBranchId = useBranchStore.getState().currentBranchId;
    const newSupplier = { ...supplier, branchId: currentBranchId };
    set(state => ({
      allSuppliers: [...state.allSuppliers, newSupplier],
      suppliers: [...state.suppliers, newSupplier]
    }));
  },

  updateSupplier: (id, updates) => set(state => {
    const updatedAll = state.allSuppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allSuppliers: updatedAll,
      suppliers: updatedAll.filter(s => s.branchId === currentBranchId)
    };
  }),

  deleteSupplier: (id) => set(state => {
    const updatedAll = state.allSuppliers.filter(s => s.id !== id);
    const currentBranchId = useBranchStore.getState().currentBranchId;
    return {
      allSuppliers: updatedAll,
      suppliers: updatedAll.filter(s => s.branchId === currentBranchId)
    };
  })
}));

// --- Settings Store ---
interface SettingsState {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    companyName: 'Parami Pharmacy',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    language: 'English',
    shopNameReceipt: 'Parami Pharmacy',
    receiptFooter: 'Thank you for shopping with us!',
    paperSize: '80mm (Standard Thermal)',
    defaultPrinter: 'System Default',
    autoPrint: false,
    showImages: true,
    lowStockLimit: 10,
    expiryWarningDays: 90,
    enableEmailReports: false,
    enableCriticalAlerts: false,
    notificationEmail: ''
  },
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),
}));