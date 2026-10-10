import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Stethoscope, Users, Calendar, Clock, DollarSign, Award, CheckCircle2, UserCheck, Plus, X, Shield, Phone, Mail } from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import ConfirmationModal from '../components/ConfirmationModal';

export default function DoctorsStaffPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Adding Doctor / Staff
  const [form, setForm] = useState({
    doctorName: '',
    specialization: 'General Medicine',
    consultationFee: 500,
    honorariumType: 'Percentage',
    honorariumRate: 70,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: ['09:00 AM - 01:00 PM', '04:00 PM - 08:00 PM']
  });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await polyclinicService.getDoctors();
      if (res.success) setDoctors(res.doctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setForm(prev => {
      const exists = prev.availableDays.includes(day);
      const availableDays = exists
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day];
      return { ...prev, availableDays };
    });
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await polyclinicService.createDoctorSchedule(form);
      if (res.success) {
        setShowAddModal(false);
        const name = form.doctorName;
        setForm({
          doctorName: '',
          specialization: 'General Medicine',
          consultationFee: 500,
          honorariumType: 'Percentage',
          honorariumRate: 70,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timeSlots: ['09:00 AM - 01:00 PM', '04:00 PM - 08:00 PM']
        });
        fetchDoctors();
        setConfirmModal({
          isOpen: true,
          title: 'Clinic Staff Added',
          message: `Healthcare staff member "${name}" registered successfully!`,
          confirmText: 'Great!',
          variant: 'success',
          onConfirm: () => {}
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-500" /> Doctors & Healthcare Staff Directory
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Register clinic doctors, nurses, receptionists, specializations, consultation fees & payout schedules.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition text-xs"
        >
          <Plus className="w-4 h-4" /> Add Clinic Staff & Doctor
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-400 text-xs">Loading staff profiles...</div>
        ) : doctors.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-400 text-xs">No doctors or healthcare staff registered.</div>
        ) : (
          doctors.map((doc) => {
            const estConsultations = 12;
            const totalCollected = estConsultations * (doc.consultationFee || 500);
            const estPayout = doc.honorariumType === 'Percentage'
              ? Math.round(totalCollected * ((doc.honorariumRate || 70) / 100))
              : estConsultations * (doc.honorariumRate || 350);

            return (
              <div key={doc._id} className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{doc.doctorName}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{doc.specialization}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{doc.consultationFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Honorarium / Share:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{doc.honorariumType} ({doc.honorariumRate}%)</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 font-bold">
                    <span className="text-slate-400">Est. Monthly Payout:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">₹{estPayout.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Working Days:</p>
                  <div className="flex flex-wrap gap-1">
                    {(doc.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']).map((day, i) => (
                      <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Clinic Staff & Doctor */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-lg w-full shadow-2xl my-auto max-h-[90vh] flex flex-col p-5 sm:p-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-4.5 h-4.5 text-emerald-500" /> Register Clinic Staff & Doctor
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set specialization, consultation fee, payout rate, and available working days.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <form onSubmit={handleCreateStaff} className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Doctor / Staff Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Gupta"
                    value={form.doctorName}
                    onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Specialization / Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology & General Medicine"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={form.consultationFee}
                      onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payout Rate (%)</label>
                    <input
                      type="number"
                      value={form.honorariumRate}
                      onChange={(e) => setForm({ ...form, honorariumRate: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Available Working Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isSelected = form.availableDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                            isSelected 
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
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
