
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Badge } from '../components/UI';
import { Settings as SettingsIcon, Database, Bell, Shield, Printer, Globe, Save, Download, RefreshCw, AlertTriangle, Check, Lock, Smartphone, FileJson, Trash2, Mail, Building2, Plus, Edit2, MapPin, Phone, User, Activity, X, Upload } from 'lucide-react';
import { useProductStore, useAuthStore, useTransactionStore, useCartStore, useCustomerStore, useBranchStore, useSettingsStore, useSupplierStore } from '../store';
import { Role, Branch } from '../types';

// Helper components for tabs
const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button 
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
      active 
      ? 'bg-white text-parami shadow-sm border border-slate-200' 
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={18} className={active ? 'text-parami' : 'text-slate-400'} />
    {label}
  </button>
);

const ProfileSettings = ({ onSave, loading }: any) => {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateUser(formData);
    onSave();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card title="My Profile">
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative w-32 h-32 rounded-full border-4 border-slate-100 shadow-lg overflow-hidden bg-slate-200 cursor-pointer"
                >
                    <img 
                        src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`} 
                        alt="Profile" 
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <Upload className="text-white drop-shadow-md" size={24} />
                    </div>
                </div>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                />

                <div className="text-center">
                    <Button variant="ghost" className="text-sm h-8" onClick={() => fileInputRef.current?.click()}>Change Photo</Button>
                    <p className="text-xs text-slate-400 mt-1">Allowed *.jpeg, *.jpg, *.png</p>
                </div>
            </div>
            
            <div className="flex-1 space-y-4 max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        label="Full Name" 
                        value={formData.name} 
                        onChange={(e: any) => setFormData({...formData, name: e.target.value})} 
                    />
                    <div className="opacity-75">
                         <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                         <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium flex items-center gap-2">
                             <Shield size={14} /> {user?.role}
                         </div>
                    </div>
                </div>
                
                <Input 
                    label="Email Address" 
                    value={formData.email} 
                    onChange={(e: any) => setFormData({...formData, email: e.target.value})} 
                />
            </div>
        </div>
      </Card>
      
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
};

const BranchManagement = () => {
  const { branches, addBranch, updateBranch, deleteBranch } = useBranchStore();
  const { user } = useAuthStore();
  const allTransactions = useTransactionStore(state => state.allTransactions);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<Branch>({
    id: '',
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    managerName: '',
    status: 'active'
  });

  // Access checks
  if (user?.role !== Role.ADMIN) {
      return (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              <Shield size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-700">Access Restricted</h3>
              <p>Only Administrators can manage branches.</p>
          </div>
      );
  }

  const handleAddNew = () => {
      setEditingBranch(null);
      setFormData({
          id: `b${Date.now()}`,
          name: '',
          code: '',
          address: '',
          phone: '',
          email: '',
          managerName: '',
          status: 'active'
      });
      setErrorMessage('');
      setIsModalOpen(true);
  };

  const handleEdit = (branch: Branch) => {
      setEditingBranch(branch);
      setFormData({ ...branch });
      setErrorMessage('');
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!formData.name || !formData.code) {
          setErrorMessage("Branch Name and Code are required.");
          return;
      }
      
      // Basic duplicate code check
      const duplicate = branches.find(b => b.code === formData.code && b.id !== formData.id);
      if (duplicate) {
          setErrorMessage("Branch Code must be unique.");
          return;
      }

      if (editingBranch) {
          updateBranch(editingBranch.id, formData);
      } else {
          addBranch(formData);
      }
      setIsModalOpen(false);
  };
  
  const handleRequestDelete = (branch: Branch) => {
      // 1. Check if it's the only remaining branch
      if (branches.length <= 1) {
          alert("Cannot delete the only remaining branch");
          return;
      }
      
      // 2. Check if user is currently viewing this branch
      const currentBranchId = useBranchStore.getState().currentBranchId;
      if (branch.id === currentBranchId) {
          alert("Cannot delete the branch you are currently viewing. Please switch to another branch first.");
          return;
      }
      
      // Proceed to delete confirmation regardless of transactions
      // The store logic will cascade delete all associated data
      
      setBranchToDelete(branch);
      setDeleteConfirmText('');
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (deleteConfirmText !== 'DELETE') return;
      if (branchToDelete) {
          setIsDeleting(true);
          
          // Simulate network delay
          setTimeout(() => {
              deleteBranch(branchToDelete.id);
              setIsDeleting(false);
              setIsDeleteModalOpen(false);
              setBranchToDelete(null);
          }, 800);
      }
  };

  return (
      <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
              <div>
                  <h3 className="text-lg font-bold text-slate-800">Branch Management</h3>
                  <p className="text-sm text-slate-500">Add, edit, or deactivate pharmacy branches.</p>
              </div>
              <Button variant="primary" onClick={handleAddNew} className="gap-2">
                  <Plus size={16} /> Add Branch
              </Button>
          </div>

          <Card className="p-0 overflow-hidden">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs font-semibold">
                      <tr>
                          <th className="px-6 py-4">Branch Name</th>
                          <th className="px-6 py-4">Code</th>
                          <th className="px-6 py-4">Location</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {branches.map(branch => {
                          const isCurrentBranch = branch.id === useBranchStore.getState().currentBranchId;
                          return (
                              <tr key={branch.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4">
                                      <div className="font-medium text-slate-800 flex items-center gap-2">
                                          {branch.name}
                                          {isCurrentBranch && <span className="text-[10px] bg-a7/10 text-a7 px-1.5 py-0.5 rounded font-bold">CURRENT</span>}
                                      </div>
                                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                          <User size={10} /> {branch.managerName || 'No Manager'}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-slate-600">{branch.code}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-1.5 text-slate-600">
                                          <MapPin size={14} className="text-slate-400" />
                                          <span className="truncate max-w-[200px]">{branch.address || 'N/A'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                                          <Phone size={12} /> {branch.phone || 'N/A'}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <Badge variant={branch.status === 'active' ? 'success' : 'neutral'}>
                                          {branch.status.toUpperCase()}
                                      </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2 opacity-100">
                                          <button 
                                              onClick={() => handleEdit(branch)}
                                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                              title="Edit Branch"
                                          >
                                              <Edit2 size={16} />
                                          </button>
                                          <button 
                                              onClick={() => handleRequestDelete(branch)}
                                              className={`p-1.5 rounded transition-colors ${
                                                isCurrentBranch 
                                                  ? 'text-slate-300 cursor-not-allowed' 
                                                  : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                              }`}
                                              disabled={isCurrentBranch}
                                              title={isCurrentBranch ? "Cannot delete current branch" : "Delete Branch"}
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </Card>

          {/* Add/Edit Modal */}
          {isModalOpen && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <h3 className="font-bold text-xl text-slate-800">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
                          <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                              <X size={20} />
                          </button>
                      </div>
                      
                      <div className="p-6 space-y-4 overflow-y-auto">
                          {errorMessage && (
                              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                  <AlertTriangle size={16} /> {errorMessage}
                              </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                  <Input 
                                      label="Branch Name" 
                                      value={formData.name} 
                                      onChange={(e: any) => setFormData({...formData, name: e.target.value})} 
                                      placeholder="e.g. Parami (3) Mandalay" 
                                      required 
                                  />
                              </div>
                              <div className="col-span-2">
                                  <Input 
                                      label="Branch Code" 
                                      value={formData.code} 
                                      onChange={(e: any) => setFormData({...formData, code: e.target.value})} 
                                      placeholder="e.g. parami-3" 
                                      disabled={!!editingBranch} 
                                      required 
                                  />
                                  <p className="text-[10px] text-slate-400 mt-1">Unique identifier. Cannot be changed later.</p>
                              </div>
                          </div>
                          
                          <Input label="Address" value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} placeholder="Full physical address" />
                          
                          <div className="grid grid-cols-2 gap-4">
                              <Input label="Phone" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} />
                              <Input label="Manager Name" value={formData.managerName} onChange={(e: any) => setFormData({...formData, managerName: e.target.value})} />
                          </div>
                          
                          <Input label="Email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} type="email" />
                          
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Branch Status</label>
                              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                          type="radio" 
                                          name="status" 
                                          checked={formData.status === 'active'} 
                                          onChange={() => setFormData({...formData, status: 'active'})}
                                          className="text-parami focus:ring-parami w-4 h-4"
                                      />
                                      <span className="text-sm font-medium text-slate-700">Active</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                          type="radio" 
                                          name="status" 
                                          checked={formData.status === 'inactive'} 
                                          onChange={() => setFormData({...formData, status: 'inactive'})}
                                          className="text-slate-500 focus:ring-slate-500 w-4 h-4"
                                      />
                                      <span className="text-sm font-medium text-slate-700">Inactive</span>
                                  </label>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Inactive branches are hidden from the switcher but keep their data.</p>
                          </div>
                      </div>
                      
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                          <Button variant="primary" onClick={handleSave}>
                              {editingBranch ? 'Update Branch' : 'Create Branch'}
                          </Button>
                      </div>
                  </div>
              </div>
          )}

          {/* Delete Confirm Modal */}
          {isDeleteModalOpen && branchToDelete && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-red-100">
                      <div className="p-6 text-center">
                          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 ring-4 ring-red-50">
                              <AlertTriangle size={32} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Branch - Warning!</h3>
                          
                          <div className="text-slate-600 text-sm mb-6 bg-red-50 p-4 rounded-lg border border-red-100 text-left">
                              <p className="mb-2">Are you sure you want to delete <strong className="text-red-700">{branchToDelete.name}</strong>?</p>
                              <p className="mb-2 text-xs font-semibold">This will permanently delete:</p>
                              <ul className="list-disc list-inside space-y-1 text-xs text-red-600 font-medium pl-1">
                                  <li>All customers in this branch</li>
                                  <li>All products and inventory</li>
                                  <li>All purchase orders</li>
                                  <li>All sales records</li>
                                  <li>All financial records</li>
                                  <li>All settings</li>
                              </ul>
                              <p className="mt-3 text-xs font-bold uppercase text-red-700">This action CANNOT be undone.</p>
                          </div>
                          
                          <div className="mb-6 text-left">
                              <label className="block text-xs font-bold text-slate-700 mb-1">To confirm deletion, type "DELETE" below</label>
                              <input 
                                  type="text" 
                                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono placeholder:text-slate-300"
                                  placeholder="DELETE"
                                  value={deleteConfirmText}
                                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                              />
                          </div>

                          <div className="flex gap-3">
                              <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                              <Button 
                                  variant="danger" 
                                  className="flex-1 bg-red-600 hover:bg-red-700 border-transparent text-white shadow-lg shadow-red-500/30 disabled:bg-slate-300 disabled:shadow-none" 
                                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                  onClick={confirmDelete}
                              >
                                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                              </Button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

const GeneralSettings = ({ onSave, loading }: any) => {
  const { settings, updateSettings } = useSettingsStore();
  
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card title="Company Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Company Name" 
              value={settings.companyName} 
              onChange={(e: any) => updateSettings({ companyName: e.target.value })} 
            />
            <Input 
              label="Tax ID" 
              value={settings.taxId} 
              onChange={(e: any) => updateSettings({ taxId: e.target.value })} 
            />
            <Input 
              label="Phone" 
              value={settings.phone} 
              onChange={(e: any) => updateSettings({ phone: e.target.value })} 
            />
            <Input 
              label="Email" 
              value={settings.email} 
              onChange={(e: any) => updateSettings({ email: e.target.value })} 
            />
            <div className="md:col-span-2">
                <Input 
                  label="Address" 
                  value={settings.address} 
                  onChange={(e: any) => updateSettings({ address: e.target.value })} 
                />
            </div>
          </div>
      </Card>

      <Card title="Regional Settings">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
                <Globe className="text-slate-400" size={24} />
                <div>
                  <p className="font-medium text-slate-800">Language</p>
                  <p className="text-xs text-slate-500">Select system primary language</p>
                </div>
            </div>
            <select 
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-a7/20 outline-none"
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
            >
                <option>English</option>
                <option>Myanmar (Unicode)</option>
            </select>
          </div>
      </Card>
      
      <div className="flex justify-end">
        <Button variant="primary" onClick={onSave} disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

const PrintingSettings = ({ onSave, loading }: any) => {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card title="Receipt Configuration">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Shop Name on Receipt" 
                  value={settings.shopNameReceipt} 
                  onChange={(e: any) => updateSettings({ shopNameReceipt: e.target.value })} 
                />
                <Input 
                  label="Receipt Footer Message" 
                  value={settings.receiptFooter} 
                  onChange={(e: any) => updateSettings({ receiptFooter: e.target.value })} 
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Paper Size</label>
                    <select 
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-a7/20 outline-none"
                      value={settings.paperSize}
                      onChange={(e) => updateSettings({ paperSize: e.target.value })}
                    >
                        <option>80mm (Standard Thermal)</option>
                        <option>58mm (Small Thermal)</option>
                        <option>A4 / Letter</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Printer</label>
                    <select 
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-a7/20 outline-none"
                      value={settings.defaultPrinter}
                      onChange={(e) => updateSettings({ defaultPrinter: e.target.value })}
                    >
                        <option>System Default</option>
                        <option>EPSON TM-T82</option>
                        <option>Xprinter XP-80C</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-700">Auto-print receipt after sale</span>
                  <input 
                    type="checkbox" 
                    checked={settings.autoPrint} 
                    onChange={(e) => updateSettings({ autoPrint: e.target.checked })}
                    className="w-5 h-5 text-parami rounded focus:ring-parami" 
                  />
                </label>
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-700">Show product images on POS</span>
                  <input 
                    type="checkbox" 
                    checked={settings.showImages} 
                    onChange={(e) => updateSettings({ showImages: e.target.checked })}
                    className="w-5 h-5 text-parami rounded focus:ring-parami" 
                  />
                </label>
            </div>
          </div>
      </Card>
      <div className="flex justify-end">
        <Button variant="primary" onClick={onSave} disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

const BackupSettings = ({ onExport, onClearData, isAdmin }: any) => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <Card title="Data Management">
       <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
          <div className="flex items-start gap-3">
             <Database className="text-blue-600 mt-1" size={20} />
             <div>
                <h4 className="font-bold text-blue-800 text-sm">System Backup</h4>
                <p className="text-blue-600 text-xs mt-1">
                   Last backup performed on: <span className="font-mono font-medium">Never</span>
                </p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 rounded-xl hover:border-a7 hover:shadow-md transition-all group">
             <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-a7 group-hover:text-white transition-colors">
                <FileJson size={20} />
             </div>
             <h4 className="font-bold text-slate-800 text-sm">Export Data (JSON)</h4>
             <p className="text-xs text-slate-500 mt-1 mb-4">Download a full copy of your product inventory and settings.</p>
             <Button variant="outline" onClick={onExport} className="w-full text-xs">
                <Download size={14} className="mr-1" /> Download JSON
             </Button>
          </div>
          
           <div className="p-4 border border-slate-200 rounded-xl hover:border-a7 hover:shadow-md transition-all group">
             <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-a7 group-hover:text-white transition-colors">
                <RefreshCw size={20} />
             </div>
             <h4 className="font-bold text-slate-800 text-sm">Sync with Cloud</h4>
             <p className="text-xs text-slate-500 mt-1 mb-4">Manually trigger a synchronization with the central server.</p>
             <Button variant="outline" className="w-full text-xs">
                <RefreshCw size={14} className="mr-1" /> Sync Now
             </Button>
          </div>
       </div>
    </Card>

    <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50/50">
       <div className="p-4 border-b border-red-200 bg-red-50 flex items-center gap-2">
          <Trash2 size={18} className="text-red-600" />
          <h4 className="font-bold text-red-800 text-sm">Clear Data</h4>
       </div>
       <div className="p-4 flex items-center justify-between">
          <div>
             <p className="text-sm font-medium text-slate-800">Clear Business Data</p>
             <p className="text-xs text-slate-500">Permanently empty products, customers, transactions, and cart.</p>
          </div>
          <Button 
            variant="danger" 
            onClick={onClearData}
            disabled={!isAdmin}
            className={!isAdmin ? "opacity-50 cursor-not-allowed" : "!bg-red-600 !text-white !border-red-600 hover:!bg-red-700 shadow-lg shadow-red-500/30"}
            title={!isAdmin ? "Requires Admin privileges" : ""}
          >
             <Trash2 size={16} /> Clear Data
          </Button>
       </div>
       {!isAdmin && (
           <div className="px-4 pb-4">
               <p className="text-xs text-red-500 bg-red-100/50 p-2 rounded border border-red-100">
                   Note: You must be logged in as an Administrator to perform this action.
               </p>
           </div>
       )}
    </div>
  </div>
);

const NotificationSettings = ({ onSave, loading }: any) => {
  const { settings, updateSettings } = useSettingsStore();

  return (
   <div className="space-y-6 animate-in fade-in duration-300">
     <Card title="Alert Thresholds">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Low Stock Warning Level</label>
              <div className="flex items-center gap-2">
                 <input 
                   type="number" 
                   value={settings.lowStockLimit}
                   onChange={(e) => updateSettings({ lowStockLimit: parseInt(e.target.value) || 0 })}
                   className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-a7/20" 
                 />
                 <span className="text-sm text-slate-500">Units</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Products below this quantity will be flagged.</p>
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry Warning Days</label>
               <div className="flex items-center gap-2">
                 <input 
                   type="number" 
                   value={settings.expiryWarningDays} 
                   onChange={(e) => updateSettings({ expiryWarningDays: parseInt(e.target.value) || 0 })}
                   className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-a7/20" 
                 />
                 <span className="text-sm text-slate-500">Days</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Batches expiring within these days will be flagged.</p>
           </div>
        </div>
     </Card>

     <Card title="Email Notifications">
        <div className="space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                     <Mail size={18} />
                  </div>
                  <div>
                     <p className="text-sm font-medium text-slate-800">Daily Summary Report</p>
                     <p className="text-xs text-slate-500">Receive daily sales summary via email</p>
                  </div>
               </div>
               <input 
                 type="checkbox" 
                 checked={settings.enableEmailReports}
                 onChange={(e) => updateSettings({ enableEmailReports: e.target.checked })}
                 className="w-5 h-5 text-parami rounded focus:ring-parami" 
               />
            </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                     <AlertTriangle size={18} />
                  </div>
                  <div>
                     <p className="text-sm font-medium text-slate-800">Critical Alerts</p>
                     <p className="text-xs text-slate-500">Instant email for low stock or expired items</p>
                  </div>
               </div>
               <input 
                 type="checkbox" 
                 checked={settings.enableCriticalAlerts}
                 onChange={(e) => updateSettings({ enableCriticalAlerts: e.target.checked })}
                 className="w-5 h-5 text-parami rounded focus:ring-parami" 
               />
            </div>
            
            <Input 
              label="Notification Email" 
              type="email" 
              value={settings.notificationEmail} 
              onChange={(e: any) => updateSettings({ notificationEmail: e.target.value })} 
            />
        </div>
     </Card>

     <div className="flex justify-end">
      <Button variant="primary" onClick={onSave} disabled={loading} className="min-w-[120px]">
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
   </div>
  );
};

const SecuritySettings = ({ onSave, loading }: any) => (
   <div className="space-y-6 animate-in fade-in duration-300">
      <Card title="Change Password">
         <div className="space-y-4 max-w-md">
            <Input label="Current Password" type="password" />
            <Input label="New Password" type="password" />
            <Input label="Confirm New Password" type="password" />
         </div>
         <div className="mt-6">
             <Button variant="primary" onClick={onSave} disabled={loading} className="min-w-[120px]">
               {loading ? 'Updating...' : 'Update Password'}
             </Button>
         </div>
      </Card>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
              <Shield className="text-amber-600 mt-0.5" size={20} />
              <div>
                  <h4 className="font-bold text-amber-900 text-sm">Two-Factor Authentication</h4>
                  <p className="text-xs text-amber-700 mt-1 mb-3">Add an extra layer of security to your account.</p>
                  <Button variant="outline" className="text-xs border-amber-300 bg-white hover:bg-amber-100 text-amber-800">
                      Enable 2FA
                  </Button>
              </div>
          </div>
      </div>
   </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    params.set('tab', activeTab);
    navigate(`?${params.toString()}`, { replace: true });
  }, [activeTab, navigate]);

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  const handleExportData = () => {
    const data = {
      products: useProductStore.getState().products,
      settings: useSettingsStore.getState().settings,
      customers: useCustomerStore.getState().customers
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClearData = () => {
    if (window.confirm('WARNING: This will delete ALL business data including products, customers, and transactions. This cannot be undone. Are you sure?')) {
        // Clear all stores
        const stores = [
            useProductStore, useCustomerStore, useTransactionStore, useCartStore, 
            useSupplierStore, useSettingsStore
        ];
        
        // This is a rough reset - in a real app, you'd have specific reset actions
        window.location.reload(); 
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 px-2 mb-6">Settings</h2>
        
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Account</p>
          <TabButton id="profile" label="My Profile" icon={User} active={activeTab === 'profile'} onClick={setActiveTab} />

          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">System</p>
          <TabButton id="general" label="General" icon={SettingsIcon} active={activeTab === 'general'} onClick={setActiveTab} />
          <TabButton id="branches" label="Branch Management" icon={Building2} active={activeTab === 'branches'} onClick={setActiveTab} />
          <TabButton id="printing" label="Printing & POS" icon={Printer} active={activeTab === 'printing'} onClick={setActiveTab} />
          <TabButton id="notifications" label="Notifications" icon={Bell} active={activeTab === 'notifications'} onClick={setActiveTab} />
          
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-6">Security</p>
          <TabButton id="security" label="Security" icon={Shield} active={activeTab === 'security'} onClick={setActiveTab} />
          <TabButton id="backup" label="Backup & Data" icon={Database} active={activeTab === 'backup'} onClick={setActiveTab} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="relative">
           {successMsg && (
              <div className="absolute top-0 right-0 left-0 -mt-12 z-50 flex justify-center pointer-events-none">
                 <div className="bg-emerald-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
                    <Check size={16} /> {successMsg}
                 </div>
              </div>
           )}

           {activeTab === 'profile' && <ProfileSettings onSave={handleSave} loading={isLoading} />}
           {activeTab === 'general' && <GeneralSettings onSave={handleSave} loading={isLoading} />}
           {activeTab === 'branches' && <BranchManagement />}
           {activeTab === 'printing' && <PrintingSettings onSave={handleSave} loading={isLoading} />}
           {activeTab === 'notifications' && <NotificationSettings onSave={handleSave} loading={isLoading} />}
           {activeTab === 'security' && <SecuritySettings onSave={handleSave} loading={isLoading} />}
           {activeTab === 'backup' && (
              <BackupSettings 
                onExport={handleExportData} 
                onClearData={handleClearData} 
                isAdmin={user?.role === Role.ADMIN} 
              />
           )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
