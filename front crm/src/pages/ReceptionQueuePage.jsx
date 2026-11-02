import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Stethoscope } from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import ConfirmationModal from '../components/ConfirmationModal';
import TakeTokenModal from '../components/TakeTokenModal';
import { Ticket, PlusCircle } from 'lucide-react';

export default function ReceptionQueuePage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTakeTokenModal, setShowTakeTokenModal] = useState(false);

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
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await polyclinicService.getAppointments();
      if (res.success) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const requestStatusUpdate = (item, status) => {
    setConfirmModal({
      isOpen: true,
      title: `Queue Status Action`,
      message: `Move ${item.patientName} (TOKEN #${item.tokenNumber || 1}) to "${status}"?`,
      confirmText: `Move to ${status}`,
      variant: status === 'Completed' ? 'success' : 'primary',
      onConfirm: async () => {
        try {
          const res = await polyclinicService.updateAppointmentStatus(item._id, status);
          if (res.success) fetchQueue();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  const waitingQueue = appointments.filter(a => a.status === 'Checked-In');
  const inConsultation = appointments.filter(a => a.status === 'In-Consultation');
  const completedQueue = appointments.filter(a => a.status === 'Completed');

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" /> Reception Live Queue Tracker
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Real-time check-in, token assignment, waiting room queue, and doctor consultation dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowTakeTokenModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition"
          >
            <Ticket className="w-4 h-4" /> Take Token
          </button>
          <button 
            onClick={fetchQueue}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Waiting Room Queue */}
        <div className="bg-amber-50/40 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-900/40 pb-3">
            <h2 className="font-bold text-amber-900 dark:text-amber-300 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Waiting Room Queue
            </h2>
            <span className="bg-amber-500 text-slate-950 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              {waitingQueue.length}
            </span>
          </div>

          <div className="space-y-3">
            {waitingQueue.length === 0 ? (
              <p className="text-xs text-amber-700/60 dark:text-amber-400/60 text-center py-8">Waiting room clear.</p>
            ) : (
              waitingQueue.map(item => (
                <div key={item._id} className="bg-white dark:bg-[#111622] border border-amber-200/70 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-600">TOKEN #{item.tokenNumber || 1}</span>
                    <span className="text-[11px] text-slate-400">{item.timeSlot}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{item.patientName}</p>
                    <p className="text-xs text-slate-400">Doctor: {item.doctorName}</p>
                  </div>
                  <button
                    onClick={() => requestStatusUpdate(item, 'In-Consultation')}
                    className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    Send to Doctor <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Doctor Consultation */}
        <div className="bg-purple-50/40 dark:bg-purple-950/15 border border-purple-200/60 dark:border-purple-900/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-purple-200/50 dark:border-purple-900/40 pb-3">
            <h2 className="font-bold text-purple-900 dark:text-purple-300 text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-purple-600" /> In Consultation
            </h2>
            <span className="bg-purple-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              {inConsultation.length}
            </span>
          </div>

          <div className="space-y-3">
            {inConsultation.length === 0 ? (
              <p className="text-xs text-purple-700/60 dark:text-purple-400/60 text-center py-8">No active consultations.</p>
            ) : (
              inConsultation.map(item => (
                <div key={item._id} className="bg-white dark:bg-[#111622] border border-purple-200/70 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-600">TOKEN #{item.tokenNumber || 1}</span>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md animate-pulse">
                      Active
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{item.patientName}</p>
                    <p className="text-xs text-slate-400">With {item.doctorName}</p>
                  </div>
                  <button
                    onClick={() => requestStatusUpdate(item, 'Completed')}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Consultation
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Completed Today */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-200/60 dark:border-emerald-900/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200/50 dark:border-emerald-900/40 pb-3">
            <h2 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed
            </h2>
            <span className="bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              {completedQueue.length}
            </span>
          </div>

          <div className="space-y-3">
            {completedQueue.length === 0 ? (
              <p className="text-xs text-emerald-700/60 dark:text-emerald-400/60 text-center py-8">None completed yet today.</p>
            ) : (
              completedQueue.map(item => (
                <div key={item._id} className="bg-white dark:bg-[#111622] border border-emerald-200/70 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>TOKEN #{item.tokenNumber || 1}</span>
                    <span className="text-emerald-600 font-semibold">Done</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{item.patientName}</p>
                  <p className="text-xs text-slate-400">{item.doctorName}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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

      {/* Take Token Walk-in Modal */}
      <TakeTokenModal
        isOpen={showTakeTokenModal}
        onClose={() => setShowTakeTokenModal(false)}
        onSuccess={() => {
          fetchQueue();
        }}
      />
    </div>
  );
}
