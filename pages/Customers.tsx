
import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../components/UI';
import { useCustomerStore } from '../store';
import { Search, UserPlus, Star, Phone, History, Edit2, Trash2, X, Save, Plus, Filter, Loader2, AlertCircle, Check } from 'lucide-react';
import { Customer } from '../types';

const Customers = () => {
  // Use global store
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomerStore();
  
  // State for Modal and Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('All Tiers');

  // Form Data State
  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    phone: '',
    points: 0,
    tier: 'Silver',
    branchId: ''
  });

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.phone.includes(searchTerm) || 
                            c.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === 'All Tiers' || c.tier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [customers, searchTerm, filterTier]);

  // Handlers
  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({
      id: `c${Date.now()}`,
      name: '',
      phone: '',
      points: 0,
      tier: 'Silver',
      branchId: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!customerToDelete) return;
    
    setIsDeleting(true);
    
    // Simulate API delay
    setTimeout(() => {
      deleteCustomer(customerToDelete.id);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      
      // If we were in the edit modal, close it too
      setIsModalOpen(false);
      
      setSuccessMsg('Customer deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      alert('Please fill in Name and Phone Number.');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Customer Directory
            <span className="text-base font-normal text-slate-400 font-mm ml-2">ဖောက်သည်များ</span>
          </h1>
          <p className="text-slate-500 text-sm">Manage customer profiles, loyalty points, and history.</p>
        </div>

        {successMsg && (
             <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <Check size={16} /> {successMsg}
             </div>
        )}

        <Button variant="primary" className="gap-2 shadow-lg shadow-parami/20" onClick={handleAddNew}>
             <UserPlus size={18} /> Add Customer
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm">
         <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
            <div className="relative flex-1 w-full md:max-w-md">
               <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search by name, phone or ID..." 
                 className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-a7/20" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <select 
                 className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none w-full md:w-auto"
                 value={filterTier}
                 onChange={(e) => setFilterTier(e.target.value)}
               >
                 <option value="All Tiers">All Tiers</option>
                 <option value="Silver">Silver</option>
                 <option value="Gold">Gold</option>
                 <option value="Platinum">Platinum</option>
               </select>
            </div>
         </div>
         
         <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Loyalty Tier</th>
                <th className="px-6 py-4">Points Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-slate-600 shrink-0">
                           {c.name.charAt(0)}
                        </div>
                        <div>
                           <p className="font-semibold text-slate-800">{c.name}</p>
                           <p className="text-xs text-slate-400">ID: {c.id}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Phone size={14} /> {c.phone}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <Badge variant={c.tier === 'Platinum' ? 'info' : c.tier === 'Gold' ? 'warning' : 'neutral'}>
                        {c.tier} Member
                     </Badge>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                        <Star size={16} fill="currentColor" />
                        {c.points.toLocaleString()}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Edit"
                        >
                           <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(c)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Delete"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No customers found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
         </div>
      </Card>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="font-bold text-xl text-slate-800">
                   {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 space-y-4">
                 <Input 
                   label="Full Name" 
                   value={formData.name}
                   onChange={(e: any) => setFormData({...formData, name: e.target.value})}
                   placeholder="e.g. U Ba Maung"
                   required
                 />
                 <Input 
                   label="Phone Number" 
                   value={formData.phone}
                   onChange={(e: any) => setFormData({...formData, phone: e.target.value})}
                   placeholder="e.g. 09xxxxxxxxx"
                   required
                 />
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Loyalty Tier</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-a7/20"
                        value={formData.tier}
                        onChange={(e) => setFormData({...formData, tier: e.target.value as any})}
                      >
                         <option value="Silver">Silver</option>
                         <option value="Gold">Gold</option>
                         <option value="Platinum">Platinum</option>
                      </select>
                   </div>
                   <Input 
                     label="Points Balance" 
                     type="number"
                     value={formData.points}
                     onChange={(e: any) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                     min="0"
                   />
                 </div>
                 
                 {editingCustomer && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 font-mono">Customer ID: {formData.id}</p>
                    </div>
                 )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
                 <div>
                    {editingCustomer && (
                       <Button variant="danger" onClick={() => handleDeleteClick(editingCustomer)} className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                          <Trash2 size={18} /> Delete
                       </Button>
                    )}
                 </div>
                 <div className="flex gap-2">
                   <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                   <Button variant="primary" onClick={handleSave} className="shadow-lg shadow-parami/20">
                      <Save size={18} /> Save Customer
                   </Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                   <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Customer</h3>
                <p className="text-slate-500 text-sm mb-6">
                   Are you sure you want to delete <strong>{customerToDelete.name}</strong>? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                   <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                   <Button 
                      variant="danger" 
                      className="flex-1 bg-red-600 hover:bg-red-700 border-red-600 text-white" 
                      onClick={confirmDelete} 
                      disabled={isDeleting}
                    >
                     {isDeleting ? (
                       <span className="flex items-center gap-2 justify-center">
                          <Loader2 size={16} className="animate-spin" /> Deleting...
                       </span>
                     ) : 'Confirm Delete'}
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
