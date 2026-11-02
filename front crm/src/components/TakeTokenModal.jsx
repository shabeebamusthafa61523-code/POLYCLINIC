import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Ticket, 
  Search, 
  UsersRound, 
  UserPlus, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Stethoscope, 
  Phone, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight
} from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import { normalizePhoneNumber, formatDisplayPhone } from '../utils/phone.util';

export default function TakeTokenModal({ isOpen, onClose, onSuccess }) {
  const [patientType, setPatientType] = useState('existing'); // 'existing' | 'new'
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);

  // Existing Patient Search State
  const [searchPhone, setSearchPhone] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [familyLookup, setFamilyLookup] = useState(null); // { normalizedPhone, isFamily, count, members }
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchingFamily, setSearchingFamily] = useState(false);
  const searchContainerRef = useRef(null);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    gender: 'Male',
    age: '',
    bloodGroup: 'Unknown',
    address: '',
    relation: 'Self',
    notes: ''
  });
  const [newPatientFamilyCheck, setNewPatientFamilyCheck] = useState(null);

  // Consultation Details State
  const [tokenData, setTokenData] = useState({
    doctor: '',
    doctorName: '',
    specialization: 'General Medicine',
    consultationFee: 600,
    notes: '',
    timeSlot: 'Immediate Walk-in'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successToken, setSuccessToken] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      fetchAllPatients();
      resetForm();
    }
  }, [isOpen]);

  // Click outside listener to close search suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setPatientType('existing');
    setSearchPhone('');
    setShowSuggestions(false);
    setFamilyLookup(null);
    setSelectedMember(null);
    setNewPatient({
      name: '',
      phone: '',
      gender: 'Male',
      age: '',
      bloodGroup: 'Unknown',
      address: '',
      relation: 'Self',
      notes: ''
    });
    setNewPatientFamilyCheck(null);
    setErrorMsg('');
    setSuccessToken(null);
  };

  const fetchDoctors = async () => {
    try {
      const res = await polyclinicService.getDoctors();
      if (res.success && res.doctors.length > 0) {
        setDoctors(res.doctors);
        const doc = res.doctors[0];
        setTokenData(prev => ({
          ...prev,
          doctor: doc.doctor?._id || doc._id,
          doctorName: doc.doctorName || 'Dr. Rajesh Gupta',
          specialization: doc.specialization || 'General Medicine',
          consultationFee: doc.consultationFee || 600
        }));
      }
    } catch (err) {
      console.error('Fetch doctors error:', err);
    }
  };

  const fetchAllPatients = async () => {
    try {
      const res = await polyclinicService.getPatients();
      if (res.success && res.patients) {
        setAllPatients(res.patients);
      }
    } catch (err) {
      console.error('Fetch patients error:', err);
    }
  };

  // Group all patients by normalized phone for instant prefix lookups
  const phoneGroups = useMemo(() => {
    const map = new Map();
    allPatients.forEach(p => {
      const norm = normalizePhoneNumber(p.phone);
      if (!norm) return;
      if (!map.has(norm)) {
        map.set(norm, {
          normalizedPhone: norm,
          displayPhone: formatDisplayPhone(norm),
          rawPhone: p.phone,
          members: []
        });
      }
      map.get(norm).members.push(p);
    });

    return Array.from(map.values()).map(g => {
      g.members.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      g.isFamily = g.members.length >= 2;
      g.primaryName = g.members[0]?.name || '';
      return g;
    });
  }, [allPatients]);

  // Real-time suggestions: List patients/numbers starting with typed numbers or matching names
  const matchingPhoneGroups = useMemo(() => {
    const raw = searchPhone.trim();
    if (!raw) return [];
    const digits = raw.replace(/\D/g, '');
    const text = raw.toLowerCase();

    return phoneGroups.filter(g => {
      // 1. Phone number starts with typed digits!
      const phoneStartsWith = digits.length > 0 && (
        g.normalizedPhone.startsWith(digits) ||
        g.rawPhone.replace(/\D/g, '').startsWith(digits)
      );

      // 2. Or matches member name or PAT ID
      const nameOrIdMatches = text.length >= 2 && g.members.some(m => 
        (m.name && m.name.toLowerCase().includes(text)) || 
        (m.patientId && m.patientId.toLowerCase().includes(text))
      );

      return phoneStartsWith || nameOrIdMatches;
    }).slice(0, 8); // Top 8 suggestions
  }, [searchPhone, phoneGroups]);

  // When a receptionist clicks a suggestion from the starting-numbers list
  const handleSelectPhoneGroup = async (group) => {
    setSearchPhone(group.normalizedPhone);
    setShowSuggestions(false);

    // Immediate optimistic load from local grouped data
    const initialLookup = {
      normalizedPhone: group.normalizedPhone,
      displayPhone: group.displayPhone,
      isFamily: group.isFamily,
      count: group.members.length,
      members: group.members.map((m, idx) => ({ ...m, isPrimary: idx === 0 }))
    };
    setFamilyLookup(initialLookup);
    setSelectedMember(group.members[0]);

    // Fetch live visit counts & latest history in background
    try {
      setSearchingFamily(true);
      const res = await polyclinicService.getPatientsByPhone(group.normalizedPhone);
      if (res.success && res.members && res.members.length > 0) {
        setFamilyLookup(res);
        // Maintain selection
        const currentId = group.members[0]?._id;
        const matched = res.members.find(m => m._id === currentId) || res.members[0];
        setSelectedMember(matched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingFamily(false);
    }
  };

  // Real-time debounce lookup for Existing Patient Phone if entered without clicking suggestion
  useEffect(() => {
    const cleaned = searchPhone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      if (cleaned.length === 0) {
        setFamilyLookup(null);
        setSelectedMember(null);
      }
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingFamily(true);
        const res = await polyclinicService.getPatientsByPhone(cleaned);
        if (res.success && res.members && res.members.length > 0) {
          setFamilyLookup(res);
          setShowSuggestions(false);
          if (res.members.length === 1) {
            setSelectedMember(res.members[0]);
          } else if (!selectedMember) {
            setSelectedMember(res.members[0]);
          }
        }
      } catch (err) {
        console.error('Phone lookup error:', err);
      } finally {
        setSearchingFamily(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchPhone]);

  // Real-time lookup for New Patient Phone (to detect if this belongs to an existing family)
  useEffect(() => {
    const cleaned = newPatient.phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setNewPatientFamilyCheck(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await polyclinicService.getPatientsByPhone(cleaned);
        if (res.success && res.count > 0) {
          setNewPatientFamilyCheck(res);
          if (res.members[0]?.address && !newPatient.address) {
            setNewPatient(prev => ({ ...prev, address: res.members[0].address }));
          }
        } else {
          setNewPatientFamilyCheck(null);
        }
      } catch (err) {
        console.error(err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [newPatient.phone]);

  const handleDoctorChange = (docId) => {
    const doc = doctors.find(d => (d.doctor?._id || d._id) === docId);
    setTokenData({
      ...tokenData,
      doctor: docId,
      doctorName: doc?.doctorName || 'Doctor',
      specialization: doc?.specialization || 'General Medicine',
      consultationFee: doc?.consultationFee || 600
    });
  };

  const handleSwitchToExisting = (member) => {
    setPatientType('existing');
    setSearchPhone(member.phone || newPatient.phone);
    setSelectedMember(member);
    setNewPatientFamilyCheck(null);
  };

  // Submit and Issue Walk-in Token
  const handleGenerateToken = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setLoading(true);
      let targetPatient = null;

      // 1. Resolve Patient
      if (patientType === 'existing') {
        if (!selectedMember) {
          setErrorMsg('Please select a patient or family member to issue a token.');
          setLoading(false);
          return;
        }
        targetPatient = selectedMember;
      } else {
        // Register New Patient First
        if (!newPatient.name.trim() || !newPatient.phone.trim() || !newPatient.age) {
          setErrorMsg('Please fill in Name, Phone, and Age for the new patient.');
          setLoading(false);
          return;
        }

        const createRes = await polyclinicService.createPatient({
          name: newPatient.name.trim(),
          phone: newPatient.phone.trim(),
          gender: newPatient.gender,
          age: Number(newPatient.age),
          bloodGroup: newPatient.bloodGroup,
          address: newPatient.address.trim(),
          notes: newPatient.relation !== 'Self' ? `Family member (${newPatient.relation}). ${newPatient.notes}` : newPatient.notes,
          status: 'Visited'
        });

        if (!createRes.success) {
          setErrorMsg(createRes.message || 'Failed to register patient profile.');
          setLoading(false);
          return;
        }
        targetPatient = createRes.patient;
      }

      // 2. Create Appointment with status 'Checked-In'
      const apptRes = await polyclinicService.createAppointment({
        patient: targetPatient._id,
        patientName: targetPatient.name,
        patientPhone: targetPatient.phone,
        doctor: tokenData.doctor,
        doctorName: tokenData.doctorName,
        specialization: tokenData.specialization,
        date: new Date().toISOString().split('T')[0],
        timeSlot: tokenData.timeSlot,
        consultationFee: Number(tokenData.consultationFee) || 600,
        notes: tokenData.notes ? `Walk-in Queue: ${tokenData.notes}` : 'Immediate Walk-in Queue',
        status: 'Checked-In'
      });

      if (apptRes.success) {
        setSuccessToken({
          appointment: apptRes.appointment,
          patient: targetPatient
        });
        if (onSuccess) {
          onSuccess(apptRes.appointment);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error issuing token.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Issue Walk-in Consultation Token</h2>
              <p className="text-emerald-100 text-xs">
                Direct waiting queue dispatch with intelligent family contact detection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/30 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {successToken ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
                Token Successfully Issued
              </span>
              <div className="text-5xl font-black text-slate-900 dark:text-white mt-3">
                TOKEN #{successToken.appointment?.tokenNumber}
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                {successToken.patient?.name} ({successToken.patient?.patientId})
              </p>
              <p className="text-xs text-slate-400">
                Doctor: {successToken.appointment?.doctorName} • {successToken.appointment?.specialization}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-w-sm mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Appointment Ref:</span>
                <span className="font-bold text-slate-900 dark:text-white">{successToken.appointment?.appointmentNo}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status:</span>
                <span className="font-bold text-amber-500">Checked-In (Waiting Room)</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Fee Amount:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{successToken.appointment?.consultationFee}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Phone:</span>
                <span className="font-bold text-slate-900 dark:text-white">{successToken.patient?.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSuccessToken(null);
                  resetForm();
                  fetchAllPatients();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
              >
                + Issue Another Token
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                Go to Waiting Queue
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateToken} className="p-6 space-y-6">
            
            {/* Step 1: Patient Type Selector */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setPatientType('existing'); setErrorMsg(''); }}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  patientType === 'existing'
                    ? 'bg-white dark:bg-[#1a2234] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" /> Existing Patient
              </button>

              <button
                type="button"
                onClick={() => { setPatientType('new'); setErrorMsg(''); }}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  patientType === 'new'
                    ? 'bg-white dark:bg-[#1a2234] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" /> New Patient (Walk-in)
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ---------------- FLOW A: EXISTING PATIENT ---------------- */}
            {patientType === 'existing' && (
              <div className="space-y-4">
                <div ref={searchContainerRef} className="relative">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Patient or Family Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={searchPhone}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => {
                        setSearchPhone(e.target.value);
                        setShowSuggestions(true);
                      }}
                      placeholder="Type phone numbers starting with e.g. 98, 98765..."
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {searchingFamily && (
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Start typing any numbers: matching patient accounts and family units will list below immediately.
                  </p>

                  {/* AUTOCOMPLETE / STARTING NUMBERS SUGGESTION LIST */}
                  {showSuggestions && matchingPhoneGroups.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-[#161c2a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Numbers Starting With "{searchPhone.replace(/\D/g, '') || searchPhone}"</span>
                        <span className="text-emerald-500 font-semibold">{matchingPhoneGroups.length} match(es)</span>
                      </div>
                      {matchingPhoneGroups.map((group) => (
                        <div
                          key={group.normalizedPhone}
                          onClick={() => handleSelectPhoneGroup(group)}
                          className="p-3 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 cursor-pointer transition flex items-center justify-between gap-3 text-left group"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-emerald-500 transition">
                                {group.displayPhone}
                              </span>
                              {group.isFamily ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                  <UsersRound className="w-3 h-3" /> Family Unit ({group.members.length} members)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  <User className="w-3 h-3" /> Solo Patient
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {group.isFamily
                                ? `Members: ${group.members.map(m => m.name).join(', ')}`
                                : `${group.primaryName} • ${group.members[0]?.patientId} • ${group.members[0]?.age} yrs (${group.members[0]?.gender})`}
                            </p>
                          </div>
                          
                          <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1 rounded-lg transition flex items-center gap-1">
                            Select <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Family / Multi-Member Results */}
                {familyLookup && familyLookup.members && familyLookup.members.length > 0 && (
                  <div className="bg-slate-50 dark:bg-[#161c2a] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        {familyLookup.isFamily ? (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                            <UsersRound className="w-4 h-4" /> Family Unit ({familyLookup.count} Members under {familyLookup.displayPhone})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" /> Patient Account ({familyLookup.displayPhone})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Select Member Visiting Today
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-0.5">
                      {familyLookup.members.map((member) => {
                        const isSelected = selectedMember?._id === member._id;

                        return (
                          <div
                            key={member._id}
                            onClick={() => setSelectedMember(member)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition relative flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-400'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {member.name}
                                </p>
                                {member.isPrimary && (
                                  <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-500">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {member.patientId} • {member.age} yrs • {member.gender}
                              </p>
                              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                Visits: {member.visitCount || 0}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Button to Add New Dependent to this exact family */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Not listed above?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientType('new');
                          setNewPatient(prev => ({
                            ...prev,
                            phone: familyLookup.normalizedPhone,
                            address: familyLookup.members[0]?.address || ''
                          }));
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> + Register New Member to this Family
                      </button>
                    </div>
                  </div>
                )}

                {/* No results message */}
                {searchPhone.replace(/\D/g, '').length >= 10 && familyLookup && familyLookup.members.length === 0 && !searchingFamily && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between">
                    <span>No registered patient found for this phone number.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientType('new');
                        setNewPatient(prev => ({ ...prev, phone: searchPhone }));
                      }}
                      className="font-bold underline ml-2"
                    >
                      Register as New Patient
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- FLOW B: NEW PATIENT ---------------- */}
            {patientType === 'new' && (
              <div className="space-y-4">
                {/* Family Phone Alert if number already belongs to a family */}
                {newPatientFamilyCheck && newPatientFamilyCheck.members.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                      <UsersRound className="w-4 h-4" />
                      Shared Family Phone Detected!
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      This number is already registered with <span className="font-bold text-slate-900 dark:text-white">{newPatientFamilyCheck.members[0]?.name} (Primary)</span> and {newPatientFamilyCheck.members.length} member(s).
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSwitchToExisting(newPatientFamilyCheck.members[0])}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        Select Existing Member ({newPatientFamilyCheck.members[0]?.name})
                      </button>
                      <span className="text-xs text-slate-400">or continue registering new member below.</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="125"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      placeholder="e.g. 34"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={newPatient.bloodGroup}
                      onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Relation (if Family Number)
                    </label>
                    <select
                      value={newPatient.relation}
                      onChange={(e) => setNewPatient({ ...newPatient, relation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Self">Self (Primary)</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    placeholder="Residential address"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Doctor & Consultation Fee Assignment */}
            <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> Consultation & Doctor Assignment
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Doctor *
                  </label>
                  <select
                    required
                    value={tokenData.doctor}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161c2a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {doctors.map(d => (
                      <option key={d._id} value={d.doctor?._id || d._id}>
                        {d.doctorName} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={tokenData.consultationFee}
                    onChange={(e) => setTokenData({ ...tokenData, consultationFee: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161c2a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Visit / Symptoms
                </label>
                <input
                  type="text"
                  value={tokenData.notes}
                  onChange={(e) => setTokenData({ ...tokenData, notes: e.target.value })}
                  placeholder="e.g. Mild fever, pediatric checkup, routine consultation"
                  className="w-full px-3 py-2 bg-white dark:bg-[#161c2a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-white transition"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Token...
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" /> Issue Walk-in Token
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
