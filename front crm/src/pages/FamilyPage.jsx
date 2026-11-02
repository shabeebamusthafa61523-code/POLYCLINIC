import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UsersRound, 
  UserCheck, 
  PhoneCall, 
  User, 
  Search, 
  Calendar, 
  Stethoscope, 
  Plus, 
  ArrowUpDown, 
  RefreshCw, 
  Clock, 
  Heart, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Phone, 
  MessageSquare, 
  Copy, 
  ExternalLink, 
  X, 
  FileText,
  UserPlus
} from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import ConfirmationModal from '../components/ConfirmationModal';
import PatientMedicalCardModal from '../components/PatientMedicalCardModal';

export default function FamilyPage() {
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState([]);
  const [kpis, setKpis] = useState({
    sharedFamilyAccounts: 0,
    familyMembersInSharedGroups: 0,
    totalPhoneAccounts: 0,
    soloNumbers: 0
  });

  const [activeTab, setActiveTab] = useState('shared'); // 'shared', 'all', 'solo'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('members'); // 'members', 'phone', 'name', 'visits'

  // Modals
  const [selectedPatientForCard, setSelectedPatientForCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);

  // Book Appointment Modal
  const [showApptModal, setShowApptModal] = useState(false);
  const [selectedPatientForAppt, setSelectedPatientForAppt] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [apptData, setApptData] = useState({
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    consultationFee: 600,
    notes: ''
  });

  // Add Family Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [targetFamily, setTargetFamily] = useState(null);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    bloodGroup: 'Unknown',
    address: '',
    relation: 'Spouse',
    allergies: '',
    medicalHistory: '',
    notes: ''
  });

  // Feedback Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    variant: 'primary',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchFamilies();
    fetchDoctors();
  }, [activeTab, sortBy]);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const res = await polyclinicService.getFamilyUnits({
        tab: activeTab,
        search: searchQuery,
        sort: sortBy
      });
      if (res.success) {
        setFamilies(res.families || []);
        if (res.kpis) setKpis(res.kpis);
      }
    } catch (err) {
      console.error('Failed to fetch families:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await polyclinicService.getDoctors();
      if (res.success && res.doctors.length > 0) {
        setDoctors(res.doctors);
        const doc = res.doctors[0];
        setApptData(prev => ({
          ...prev,
          doctor: doc.doctor?._id || doc._id,
          consultationFee: doc.consultationFee || 600
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFamilies();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setConfirmModal({
      isOpen: true,
      title: 'Copied',
      message: `Phone number "${text}" copied to clipboard.`,
      confirmText: 'Done',
      variant: 'primary',
      onConfirm: () => {}
    });
  };

  // Open "Add Family Member" modal pre-filled
  const handleOpenAddMember = (family) => {
    setTargetFamily(family);
    setNewMemberData({
      name: '',
      phone: family.rawPhone || family.normalizedPhone,
      email: '',
      gender: 'Male',
      age: '',
      bloodGroup: 'Unknown',
      address: family.address || '',
      relation: 'Child',
      allergies: '',
      medicalHistory: '',
      notes: ''
    });
    setShowAddMemberModal(true);
  };

  const handleSaveFamilyMember = async (e) => {
    e.preventDefault();
    if (!newMemberData.name || !newMemberData.age) {
      alert('Please provide member name and age.');
      return;
    }

    try {
      const payload = {
        name: newMemberData.name.trim(),
        phone: newMemberData.phone.trim(),
        email: newMemberData.email.trim(),
        gender: newMemberData.gender,
        age: Number(newMemberData.age),
        bloodGroup: newMemberData.bloodGroup,
        address: newMemberData.address.trim(),
        medicalHistory: newMemberData.medicalHistory ? newMemberData.medicalHistory.split(',').map(s => s.trim()) : [],
        allergies: newMemberData.allergies ? newMemberData.allergies.split(',').map(s => s.trim()) : [],
        notes: newMemberData.notes ? `Relation: ${newMemberData.relation}. ${newMemberData.notes}` : `Relation: ${newMemberData.relation}`
      };

      const res = await polyclinicService.createPatient(payload);
      if (res.success) {
        setShowAddMemberModal(false);
        fetchFamilies();
        setConfirmModal({
          isOpen: true,
          title: 'Family Member Registered',
          message: `Successfully added ${payload.name} to Family (${familyDisplay(targetFamily)}).`,
          confirmText: 'Great!',
          variant: 'success',
          onConfirm: () => {}
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Open Book Slot Modal
  const handleOpenBookSlot = (member) => {
    setSelectedPatientForAppt(member);
    setShowApptModal(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientForAppt) return;

    const selectedDoc = doctors.find(d => (d.doctor?._id || d._id) === apptData.doctor);

    try {
      const res = await polyclinicService.createAppointment({
        patient: selectedPatientForAppt._id,
        patientName: selectedPatientForAppt.name,
        patientPhone: selectedPatientForAppt.phone,
        doctor: apptData.doctor,
        doctorName: selectedDoc?.doctorName || 'Dr. Rajesh Gupta',
        specialization: selectedDoc?.specialization || 'General Medicine',
        date: apptData.date,
        timeSlot: apptData.timeSlot,
        consultationFee: Number(apptData.consultationFee) || 600,
        notes: apptData.notes,
        status: 'Scheduled'
      });

      if (res.success) {
        setShowApptModal(false);
        fetchFamilies();
        setConfirmModal({
          isOpen: true,
          title: 'Appointment Scheduled',
          message: `Token #${res.appointment?.tokenNumber} booked for ${selectedPatientForAppt.name} with ${selectedDoc?.doctorName || 'Doctor'}.`,
          confirmText: 'Awesome',
          variant: 'success',
          onConfirm: () => {}
        });
      }
    } catch (err) {
      setConfirmModal({
        isOpen: true,
        title: 'Booking Notice',
        message: err.response?.data?.message || err.message,
        confirmText: 'I Understand',
        variant: 'danger',
        onConfirm: () => {}
      });
    }
  };

  const familyDisplay = (f) => f?.displayPhone || f?.normalizedPhone || 'Family';

  return (
    <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-10 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold tracking-wide border border-emerald-500/20">
              <UsersRound className="w-3.5 h-3.5" /> Patient Grouping Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Family & Shared Contact Directory
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              Consolidated family healthcare accounts grouped dynamically by normalized phone numbers. View shared consultation histories, manage dependents, and book appointments seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchFamilies}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-[#111622] border border-amber-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Shared Family Accounts
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <UsersRound className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.sharedFamilyAccounts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Phones with 2+ family members</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-[#111622] border border-emerald-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Members in Shared Groups
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.familyMembersInSharedGroups}
            </div>
            <p className="text-xs text-slate-500 mt-1">Patients in multi-member units</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-[#111622] border border-blue-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Total Phone Accounts
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.totalPhoneAccounts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Unique registered phone keys</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-[#111622] border border-slate-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Solo Numbers
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.soloNumbers}
            </div>
            <p className="text-xs text-slate-500 mt-1">Single patient contact records</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Controls */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Navigation & Filtering Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('shared')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'shared'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UsersRound className="w-3.5 h-3.5" />
              Shared Families (2+)
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'shared' ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-800'
              }`}>
                {kpis.sharedFamilyAccounts}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              All Phone Numbers
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-800'
              }`}>
                {kpis.totalPhoneAccounts}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('solo')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'solo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Solo Numbers (1)
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'solo' ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-800'
              }`}>
                {kpis.soloNumbers}
              </span>
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phone, member, or PAT ID..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); fetchFamilies(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="members">Sort: Most Members First</option>
                <option value="visits">Sort: Most Family Visits</option>
                <option value="name">Sort: Primary Name (A-Z)</option>
                <option value="phone">Sort: Phone Number (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Family Units Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 mt-3">Grouping patient family profiles...</p>
        </div>
      ) : families.length === 0 ? (
        <div className="bg-white dark:bg-[#111622] border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <UsersRound className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No Family Units Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No patient accounts matched "${searchQuery}". Try searching by phone digits or patient name.`
              : `There are currently no accounts in the "${activeTab}" category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {families.map((family) => {
            const isMultiMember = family.members.length >= 2;

            return (
              <div 
                key={family.normalizedPhone}
                className="bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 md:p-6 shadow-sm hover:border-emerald-500/40 transition space-y-5"
              >
                {/* Unified Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-wide">
                          {family.displayPhone}
                        </span>
                        <button
                          onClick={() => copyToClipboard(family.normalizedPhone)}
                          title="Copy Phone Number"
                          className="text-slate-400 hover:text-emerald-500 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">
                        {family.address ? family.address : 'Address not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Badge: Members count */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isMultiMember
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}>
                      <UsersRound className="w-3.5 h-3.5" />
                      {family.members.length} {family.members.length === 1 ? 'Solo Patient' : 'Family Members'}
                    </span>

                    {/* Badge: Total Visits */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                      <Stethoscope className="w-3.5 h-3.5" />
                      {family.totalFamilyVisits} Total Family Visits
                    </span>

                    {/* Quick WhatsApp Link */}
                    <a
                      href={`https://wa.me/91${family.normalizedPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>

                {/* Family Members List / Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {family.members.map((member) => {
                    const initials = member.name
                      ? member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'P';

                    return (
                      <div
                        key={member._id}
                        className="bg-slate-50/70 dark:bg-[#161c2a] border border-slate-200/70 dark:border-slate-800/80 rounded-xl p-4 space-y-3 relative hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                              member.gender === 'Female'
                                ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20'
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            }`}>
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {member.name}
                                </span>
                                {member.isPrimary && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                    ⭐ Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {member.patientId} • {member.age} yrs • {member.gender} • Blood: <span className="font-semibold text-slate-600 dark:text-slate-300">{member.bloodGroup || 'Unknown'}</span>
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                            {member.visitCount || 0} Visits
                          </span>
                        </div>

                        {/* Medical Tags & Allergies */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {member.medicalHistory && member.medicalHistory.length > 0 ? (
                            member.medicalHistory.map((m, idx) => (
                              <span key={idx} className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                {m}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px]">No major history</span>
                          )}

                          {member.allergies && member.allergies.length > 0 && member.allergies[0] !== 'None' && (
                            <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                              <AlertCircle className="w-3 h-3" /> Allergy: {member.allergies.join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Individual Action Buttons */}
                        <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/60 pt-2.5">
                          <button
                            onClick={() => {
                              setSelectedPatientForCard(member);
                              setShowCardModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-500 text-xs font-semibold transition"
                          >
                            <FileText className="w-3.5 h-3.5" /> Medical Card
                          </button>

                          <button
                            onClick={() => handleOpenBookSlot(member)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Book Slot
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Card Footer: Add Family Member Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => handleOpenAddMember(family)}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl transition border border-slate-200 dark:border-slate-700"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                    + Add Member to this Family
                  </button>

                  {family.latestFamilyVisit && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Latest Family Visit: {new Date(family.latestFamilyVisit).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Add Family Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <UsersRound className="w-5 h-5 text-emerald-500" />
                Add Member to Family Unit ({targetFamily?.displayPhone})
              </h3>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFamilyMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberData.name}
                    onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Relationship to Family
                  </label>
                  <select
                    value={newMemberData.relation}
                    onChange={(e) => setNewMemberData({ ...newMemberData, relation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Spouse">Spouse (Wife/Husband)</option>
                    <option value="Child">Child (Son/Daughter)</option>
                    <option value="Parent">Parent (Father/Mother)</option>
                    <option value="Sibling">Sibling (Brother/Sister)</option>
                    <option value="Other">Other Dependent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="125"
                    value={newMemberData.age}
                    onChange={(e) => setNewMemberData({ ...newMemberData, age: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Gender
                  </label>
                  <select
                    value={newMemberData.gender}
                    onChange={(e) => setNewMemberData({ ...newMemberData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={newMemberData.bloodGroup}
                    onChange={(e) => setNewMemberData({ ...newMemberData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Shared Contact Phone
                  </label>
                  <input
                    type="text"
                    disabled
                    value={newMemberData.phone}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Residential Address (Inherited)
                </label>
                <input
                  type="text"
                  value={newMemberData.address}
                  onChange={(e) => setNewMemberData({ ...newMemberData, address: e.target.value })}
                  placeholder="Shared home address"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Known Allergies
                  </label>
                  <input
                    type="text"
                    value={newMemberData.allergies}
                    onChange={(e) => setNewMemberData({ ...newMemberData, allergies: e.target.value })}
                    placeholder="e.g. Dust, Penicillin"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Medical History
                  </label>
                  <input
                    type="text"
                    value={newMemberData.medicalHistory}
                    onChange={(e) => setNewMemberData({ ...newMemberData, medicalHistory: e.target.value })}
                    placeholder="e.g. Asthma, Diabetes"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                >
                  Save Family Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Book Appointment Modal */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Book Appointment for {selectedPatientForAppt?.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPatientForAppt?.patientId} • Shared Phone: {selectedPatientForAppt?.phone}
                </p>
              </div>
              <button onClick={() => setShowApptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Select Consulting Doctor *
                </label>
                <select
                  required
                  value={apptData.doctor}
                  onChange={(e) => {
                    const doc = doctors.find(d => (d.doctor?._id || d._id) === e.target.value);
                    setApptData({
                      ...apptData,
                      doctor: e.target.value,
                      consultationFee: doc?.consultationFee || 600
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {doctors.map(d => (
                    <option key={d._id} value={d.doctor?._id || d._id}>
                      {d.doctorName} ({d.specialization}) - ₹{d.consultationFee || 600}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={apptData.date}
                    onChange={(e) => setApptData({ ...apptData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={apptData.timeSlot}
                    onChange={(e) => setApptData({ ...apptData, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                    <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                    <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                    <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                    <option value="04:30 PM - 05:00 PM">04:30 PM - 05:00 PM</option>
                    <option value="05:00 PM - 05:30 PM">05:00 PM - 05:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  value={apptData.consultationFee}
                  onChange={(e) => setApptData({ ...apptData, consultationFee: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Symptoms / Reason for Visit
                </label>
                <textarea
                  rows="2"
                  value={apptData.notes}
                  onChange={(e) => setApptData({ ...apptData, notes: e.target.value })}
                  placeholder="e.g. Follow-up checkup, fever, pediatric consultation..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApptModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Medical Card Modal */}
      {showCardModal && selectedPatientForCard && (
        <PatientMedicalCardModal
          isOpen={showCardModal}
          onClose={() => {
            setShowCardModal(false);
            setSelectedPatientForCard(null);
          }}
          patient={selectedPatientForCard}
        />
      )}

      {/* Confirmation / Alert Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
