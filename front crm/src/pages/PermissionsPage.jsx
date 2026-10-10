import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Shield, Search, Loader2, ChevronRight, User as UserIcon, 
  Mail, Briefcase, Folder, CheckCircle2, XCircle, Filter, Sparkles,
  Users, Sliders, CheckSquare, Square, Save, RefreshCw, Layers,
  Stethoscope, Wallet, PhoneCall, BarChart3, LayoutDashboard, Check, Zap, HelpCircle
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const getApiEndpoint = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE.endsWith('/v1')) {
    return `${API_BASE}${cleanPath}`;
  }
  if (API_BASE.endsWith('/api')) {
    return `${API_BASE}/v1${cleanPath}`;
  }
  return `${API_BASE}/api/v1${cleanPath}`;
};

export const ALL_SYSTEM_MODULES = [
  // --- OVERVIEW & QUEUE ---
  { label: 'Polyclinic Dashboard', path: '/polyclinic-dashboard', category: 'Overview & Queue', desc: 'Central Polyclinic & Healthcare operations dashboard' },
  { label: 'Reception Queue', path: '/reception-queue', category: 'Overview & Queue', desc: 'Live patient check-in token waiting queue dispatch board' },
  { label: 'Notifications', path: '/notifications', category: 'Overview & Queue', desc: 'System alerts, notifications & messages' },
  { label: 'Leave Requests', path: '/leaves', category: 'Overview & Queue', desc: 'Leave request application & approval tracking' },

  // --- PATIENT CRM & BOOKING ---
  { label: 'Patient Enquiry CRM', path: '/patient-enquiries', category: 'Patient CRM & Booking', desc: 'Patient lead enquiry registration & appointment conversion' },
  { label: 'Appointments', path: '/appointments', category: 'Patient CRM & Booking', desc: 'Doctor slot booking & appointment management' },
  { label: 'Patient Follow-ups', path: '/patient-followups', category: 'Patient CRM & Booking', desc: 'Post-consultation follow-up reminders & care plans' },

  // --- CLINICAL EMR & LAB ---
  { label: 'Doctor EMR Consultation', path: '/doctor-emr', category: 'Clinical EMR & Lab', desc: 'Electronic medical records, symptoms, vitals & diagnosis' },
  { label: 'Digital Prescriptions', path: '/prescriptions', category: 'Clinical EMR & Lab', desc: 'Structured digital prescriptions with dosage & frequency' },
  { label: 'Laboratory & Diagnostics', path: '/laboratory', category: 'Clinical EMR & Lab', desc: 'Diagnostic test requests, sample collection & report entry' },

  // --- PHARMACY & BILLING ---
  { label: 'Pharmacy Inventory', path: '/pharmacy-inventory', category: 'Pharmacy & Billing', desc: 'Medicine stock, clinic consumables, batch & low stock alerts' },
  { label: 'Billing & Invoices', path: '/billing', category: 'Pharmacy & Billing', desc: 'Consolidated patient healthcare billing & receipts' },
  { label: 'Clinic Accounts & Expenses', path: '/accounts', category: 'Pharmacy & Billing', desc: 'Expense management, salary & cash book overview' },
  { label: 'Payslips', path: '/payslips', category: 'Pharmacy & Billing', desc: 'Employee payslip generation & disbursal records' },
  { label: 'Personal Payslip', path: '/my-payslip', category: 'Pharmacy & Billing', desc: 'Personal confidential salary slip portal for individual employees' },

  // --- STAFF & DOCTORS ---
  { label: 'Doctors & Staff', path: '/doctors-staff', category: 'Staff & Doctors', desc: 'Doctor schedules, fees & visiting doctor payouts' },
  { label: 'Staff Attendance', path: '/staff-attendance', category: 'Staff & Doctors', desc: 'Daily staff attendance logs & roster management' },
  { label: 'Users & Roles', path: '/users', category: 'Staff & Doctors', desc: 'Employee profiles, role assignments & accounts' },
  { label: 'Departments', path: '/departments', category: 'Staff & Doctors', desc: 'Department hierarchy & manager assignments' },
  { label: 'Permission Configuration', path: '/permissions', category: 'Staff & Doctors', desc: 'Custom user menu permission configuration' },

  // --- REPORTS & OPERATIONS ---
  { label: 'Polyclinic Analytics', path: '/polyclinic-reports', category: 'Reports & Operations', desc: 'Revenue, patient counts & inventory analytics' },
  { label: 'AI Health Insights', path: '/ai-report', category: 'Reports & Operations', desc: 'Automated AI reports & diagnostic summaries' },
  { label: 'Task Assignment', path: '/todo', category: 'Reports & Operations', desc: 'Task assignment, status tracking & attachment review' }
];

// Preset Templates for quick batch assignment
const ROLE_PRESETS = {
  'Full Access Admin': ALL_SYSTEM_MODULES.map(m => m.label),
  'Doctor / Physician': ['Polyclinic Dashboard', 'Appointments', 'Doctor EMR Consultation', 'Digital Prescriptions', 'Laboratory & Diagnostics', 'Patient Follow-ups', 'Personal Payslip', 'Notifications'],
  'Receptionist': ['Polyclinic Dashboard', 'Reception Queue', 'Patient Enquiry CRM', 'Appointments', 'Billing & Invoices', 'Patient Follow-ups', 'Personal Payslip', 'Notifications'],
  'Pharmacist': ['Polyclinic Dashboard', 'Pharmacy Inventory', 'Billing & Invoices', 'Digital Prescriptions', 'Personal Payslip', 'Notifications'],
  'Lab Technician': ['Polyclinic Dashboard', 'Laboratory & Diagnostics', 'Personal Payslip', 'Notifications'],
  'Accountant': ['Polyclinic Dashboard', 'Clinic Accounts & Expenses', 'Billing & Invoices', 'Payslips', 'Personal Payslip', 'Notifications'],
  'HR Manager': ['Polyclinic Dashboard', 'Users & Roles', 'Departments', 'Staff Attendance', 'Leave Requests', 'Personal Payslip', 'Notifications']
};

export default function PermissionsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'matrix', 'modules'
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'configured', 'unconfigured', 'superadmin'

  // Selected User State for In-Page Configurator
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [savingUser, setSavingUser] = useState(false);

  // Role Matrix State
  const [selectedRolePreset, setSelectedRolePreset] = useState('Doctor / Physician');

  const getAuthHeaders = useCallback(() => {
    const rawToken = localStorage.getItem('token');
    const cleanToken = rawToken ? rawToken.replace(/"/g, '') : '';
    return { 'Authorization': cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}` };
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiEndpoint('/users'), {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const uList = Array.isArray(data.data) ? data.data : [];
        setUsers(uList);
        if (uList.length > 0 && !selectedUser) {
          // Select first user by default
          const first = uList[0];
          setSelectedUser(first);
          setIsSuperAdmin(Boolean(first.isSuperAdmin || first.role === 'superadmin'));
          setUserPermissions(Array.isArray(first.permissions) && first.permissions.length > 0 ? first.permissions : ['Task Assign', 'Notifications', 'Attendance', 'Leave Requests']);
        }
      } else {
        showToast(data.message || "Failed to load users", "error");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      showToast("Error loading users.", "error");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast, selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle user selection in-page
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsSuperAdmin(Boolean(user.isSuperAdmin || user.role === 'superadmin'));
    setUserPermissions(Array.isArray(user.permissions) && user.permissions.length > 0 ? user.permissions : ['Task Assign', 'Notifications', 'Attendance', 'Leave Requests']);
  };

  // Save permissions directly from page
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      const userId = selectedUser._id || selectedUser.id;
      const res = await fetch(getApiEndpoint(`/users/${userId}/permissions`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permissions: userPermissions,
          isSuperAdmin: isSuperAdmin
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Permissions saved successfully for ${selectedUser.name}!`, "success");
        // Update local user object
        setUsers(prev => prev.map(u => (u._id || u.id) === userId ? { ...u, permissions: userPermissions, isSuperAdmin } : u));
        setSelectedUser(prev => prev ? { ...prev, permissions: userPermissions, isSuperAdmin } : null);
      } else {
        showToast(data.message || "Failed to update permissions.", "error");
      }
    } catch (err) {
      console.error("Error saving permissions:", err);
      showToast("Error saving permissions.", "error");
    } finally {
      setSavingUser(false);
    }
  };

  const togglePermission = (label) => {
    setUserPermissions(prev => 
      prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]
    );
  };

  const applyPreset = (presetName) => {
    const list = ROLE_PRESETS[presetName] || [];
    setUserPermissions(list);
    showToast(`Applied preset template: ${presetName}`, "info");
  };

  const selectAllCategoryModules = () => {
    const targets = filteredModules.map(m => m.label);
    setUserPermissions(prev => Array.from(new Set([...prev, ...targets])));
  };

  const deselectAllCategoryModules = () => {
    const targets = new Set(filteredModules.map(m => m.label));
    setUserPermissions(prev => prev.filter(p => !targets.has(p)));
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        (u.name || '').toLowerCase().includes(q) || 
        (u.email || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterType === 'configured') return Array.isArray(u.permissions) && u.permissions.length > 0;
      if (filterType === 'unconfigured') return !u.permissions || u.permissions.length === 0;
      if (filterType === 'superadmin') return u.isSuperAdmin || u.role === 'superadmin';
      return true;
    });
  }, [users, search, filterType]);

  const categories = useMemo(() => {
    const set = new Set(ALL_SYSTEM_MODULES.map(m => m.category));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredModules = useMemo(() => {
    return ALL_SYSTEM_MODULES.filter(m => {
      const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
      const matchSearch = !moduleSearch || m.label.toLowerCase().includes(moduleSearch.toLowerCase()) || m.desc.toLowerCase().includes(moduleSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, moduleSearch]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Permission Configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Permission Configuration & Access Controls
            </h1>
            <p className="text-xs font-medium text-slate-300 mt-1">
              Select an employee on the left to configure their active sidebar modules, role privileges, and admin access.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <div className="px-3.5 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-slate-200">
            <span className="text-white font-extrabold">{users.length}</span> Total Users
          </div>
          <div className="px-3.5 py-2 bg-emerald-500/20 backdrop-blur-md rounded-xl border border-emerald-500/30 text-emerald-300">
            <span className="text-emerald-200 font-extrabold">{users.filter(u => u.permissions && u.permissions.length > 0).length}</span> Configured
          </div>
          <div className="px-3.5 py-2 bg-purple-500/20 backdrop-blur-md rounded-xl border border-purple-500/30 text-purple-300">
            <span className="text-purple-200 font-extrabold">{ALL_SYSTEM_MODULES.length}</span> System Modules
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'users', label: 'Employee Access Manager', icon: Users },
            { id: 'matrix', label: 'Role Presets & Matrix', icon: Sliders },
            { id: 'modules', label: 'System Modules Directory', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition cursor-pointer"
          title="Refresh User Data"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* TAB 1: IN-PAGE 2-COLUMN SPLIT VIEW (USER SELECTOR ON LEFT, PERMISSION SELECTOR ON RIGHT) */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (4 Cols): Employee Selection Roster List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users size={14} /> Select Employee ({filteredUsers.length})
                </h3>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {['all', 'configured', 'unconfigured', 'superadmin'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                      filterType === type
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Employee Scrollable Roster List */}
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No users found matching filter.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUser && (selectedUser._id || selectedUser.id) === (u._id || u.id);
                    const isSA = Boolean(u.isSuperAdmin || u.role === 'superadmin');
                    const permCount = Array.isArray(u.permissions) ? u.permissions.length : 0;

                    return (
                      <div
                        key={u._id || u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSelected 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{u.role || 'Staff'} • {u.department || 'General'}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {isSA ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Admin
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                              {permCount} Allowed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (8 Cols): IN-PAGE PERMISSION SELECTION & CONFIGURATION PANEL */}
          <div className="lg:col-span-8 space-y-4">
            {selectedUser ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
                
                {/* Header Banner for Selected User */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                      {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        {selectedUser.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedUser.email} • Role: <strong className="text-slate-700 dark:text-slate-300">{selectedUser.role || 'Staff'}</strong> • Dept: <strong className="text-slate-700 dark:text-slate-300">{selectedUser.department || 'General'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Super Admin Toggle Button */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                        <Sparkles size={12} className="text-amber-500" /> Super Admin
                      </p>
                      <p className="text-[9px] text-slate-400">Bypasses module restrictions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSuperAdmin(!isSuperAdmin)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                        isSuperAdmin 
                          ? 'bg-amber-500 text-slate-950 shadow-xs' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isSuperAdmin ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Quick Preset Buttons Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Preset Templates</label>
                    <span className="text-[11px] text-slate-400">Click any preset to auto-select matching modules</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(ROLE_PRESETS).map(pKey => (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => applyPreset(pKey)}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                      >
                        {pKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filters & Module Search inside Right Panel */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative flex-1 w-full">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        placeholder="Search system module permissions..."
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={selectAllCategoryModules}
                        disabled={isSuperAdmin}
                        className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition cursor-pointer disabled:opacity-50"
                      >
                        Select All Filtered
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllCategoryModules}
                        disabled={isSuperAdmin}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
                      >
                        Clear Filtered
                      </button>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          selectedCategory === cat
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* IN-PAGE CHECKBOX MODULE GRID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Category: <strong className="text-slate-900 dark:text-white">{selectedCategory}</strong> ({filteredModules.length} Modules)</span>
                    <span>
                      {isSuperAdmin 
                        ? 'All Granted (Super Admin Enabled)' 
                        : `${userPermissions.length} / ${ALL_SYSTEM_MODULES.length} Granted`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40">
                    {filteredModules.map((item) => {
                      const isChecked = isSuperAdmin || userPermissions.includes(item.label);
                      return (
                        <div 
                          key={item.label}
                          onClick={() => !isSuperAdmin && togglePermission(item.label)}
                          className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                            isChecked 
                              ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500/60 shadow-xs' 
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                          }`}
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                          </div>
                          <div className="shrink-0 pt-0.5">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SAVE BUTTON BAR IN-PAGE */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Configuring: </span>
                    <strong className="text-indigo-600 dark:text-indigo-400">{selectedUser.name}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveUserPermissions}
                    disabled={savingUser}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {savingUser ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>Save Permissions</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Select an employee from the left column roster to view & configure their permissions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Role Presets & Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-indigo-500" /> Role Access Templates & Presets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a role template below to preview default accessible modules.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {Object.keys(ROLE_PRESETS).map(presetKey => (
                <button
                  key={presetKey}
                  onClick={() => setSelectedRolePreset(presetKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedRolePreset === presetKey
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {presetKey}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500" /> Presets for: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{selectedRolePreset}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(ROLE_PRESETS[selectedRolePreset] || []).length} out of {ALL_SYSTEM_MODULES.length} modules granted in this preset.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {ALL_SYSTEM_MODULES.map(m => {
                const isGranted = (ROLE_PRESETS[selectedRolePreset] || []).includes(m.label);
                return (
                  <div 
                    key={m.label} 
                    className={`p-3 rounded-2xl border transition flex items-center gap-3 ${
                      isGranted 
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-200' 
                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    {isGranted ? (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{m.label}</p>
                      <p className="text-[10px] opacity-75 truncate">{m.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: System Modules Directory */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_SYSTEM_MODULES.map((m, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {m.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{m.path}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{m.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
