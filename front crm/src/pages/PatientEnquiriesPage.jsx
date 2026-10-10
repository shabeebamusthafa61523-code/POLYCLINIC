import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  PhoneCall, 
  Plus, 
  Search, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  UserPlus, 
  ArrowRight,
  Filter,
  Activity,
  X
} from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import ConfirmationModal from '../components/ConfirmationModal';

export default function PatientEnquiriesPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatientForAppt, setSelectedPatientForAppt] = useState(null);
  const [showApptModal, setShowApptModal] = useState(false);

  const [doctors, setDoctors] = useState([]);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    onConfirm: () => {}
  });

  // New Patient Enquiry Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    bloodGroup: 'O+',
    address: '',
    notes: '',
    status: 'New'
  });

  // Appointment Form State
  const [apptData, setApptData] = useState({
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    consultationFee: 500,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await polyclinicService.getPatients();
      if (res.success) setPatients(res.patients);

      const docRes = await polyclinicService.getDoctors();
      if (docRes.success && docRes.doctors.length > 0) {
        setDoctors(docRes.doctors);
        setApptData(prev => ({ ...prev, doctor: docRes.doctors[0]?.doctor?._id || docRes.doctors[0]?._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const res = await polyclinicService.createPatient({
        ...newPatient,
        age: Number(newPatient.age) || 30
      });
      if (res.success) {
        setShowModal(false);
        setNewPatient({
          name: '',
          phone: '',
          email: '',
          gender: 'Male',
          age: '',
          bloodGroup: 'O+',
          address: '',
          notes: '',
          status: 'New'
        });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleBookAppt = async (e) => {
    e.preventDefault();
    if (!selectedPatientForAppt) return;
    try {
      const selectedDoc = doctors.find(d => (d.doctor?._id || d._id) === apptData.doctor);
      const res = await polyclinicService.createAppointment({
        patient: selectedPatientForAppt._id,
        patientName: selectedPatientForAppt.name,
        patientPhone: selectedPatientForAppt.phone,
        doctor: apptData.doctor,
        doctorName: selectedDoc?.doctorName || 'Dr. General',
        specialization: selectedDoc?.specialization || 'General Medicine',
        date: apptData.date,
        timeSlot: apptData.timeSlot,
        consultationFee: Number(apptData.consultationFee) || 500,
        notes: apptData.notes,
        status: 'Scheduled'
      });
      if (res.success) {
        setShowApptModal(false);
        const pName = selectedPatientForAppt.name;
        setSelectedPatientForAppt(null);
        setConfirmModal({
          isOpen: true,
          title: 'Appointment Scheduled',
          message: `Appointment (Token #${res.appointment?.tokenNumber}) successfully booked for ${pName}!`,
          confirmText: 'Great!',
          variant: 'success',
          onConfirm: () => { fetchData(); }
        });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      setConfirmModal({
        isOpen: true,
        title: 'Booking Blocked',
        message: errMsg,
        confirmText: 'I Understand',
        variant: 'danger',
        onConfirm: () => {}
      });
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm) ||
    p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-500" /> Patient Enquiry & CRM
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Phone, WhatsApp, web & walk-in healthcare enquiries. Track lead conversion & book appointments.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition text-xs"
        >
          <Plus className="w-4 h-4" /> Register Patient Lead
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search by Patient Name, Phone or ID (e.g. PAT-1001)..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
            <thead className="uppercase bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Name & Phone</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Blood Group</th>
                <th className="py-3.5 px-4">Enquiry Notes</th>
                <th className="py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">Loading patient enquiries...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">No patient enquiries found matching criteria.</td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">{patient.patientId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {patient.name}
                      <div className="text-[11px] font-normal text-slate-400">{patient.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">{patient.age} Yrs / {patient.gender}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{patient.bloodGroup || 'O+'}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">{patient.notes || 'General consultation request'}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => {
                          setSelectedPatientForAppt(patient);
                          setShowApptModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1.5 rounded-xl text-xs transition border border-emerald-200/80 dark:border-emerald-800/50"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Book Appointment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Register New Patient Lead */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-lg w-full shadow-2xl my-auto max-h-[90vh] flex flex-col p-5 sm:p-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-4.5 h-4.5 text-emerald-500" /> Register New Patient Lead
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record patient demographic information, contact details, and symptoms.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreatePatient} className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Patient Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="+91 9876543210"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Age *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 35"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                    <select 
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
                    <select 
                      value={newPatient.bloodGroup}
                      onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                      <option value="O-">O-</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Enquiry Notes</label>
                  <textarea 
                    rows="2"
                    placeholder="Record symptoms or patient request details..."
                    value={newPatient.notes}
                    onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20"
                >
                  Save Patient Lead
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Convert to Appointment */}
      {showApptModal && selectedPatientForAppt && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-md w-full shadow-2xl my-auto max-h-[90vh] flex flex-col p-5 sm:p-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-emerald-500" /> Book Consultation Appointment
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Patient: <span className="font-bold text-slate-900 dark:text-white">{selectedPatientForAppt.name}</span> ({selectedPatientForAppt.phone})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowApptModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleBookAppt} className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Doctor *</label>
                  <select 
                    value={apptData.doctor}
                    onChange={(e) => setApptData({ ...apptData, doctor: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    {doctors.map(d => (
                      <option key={d._id} value={d.doctor?._id || d._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {d.doctorName} ({d.specialization}) - Fee: ₹{d.consultationFee}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                    <input 
                      type="date"
                      required 
                      value={apptData.date}
                      onChange={(e) => setApptData({ ...apptData, date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time Slot</label>
                    <select 
                      value={apptData.timeSlot}
                      onChange={(e) => setApptData({ ...apptData, timeSlot: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="09:00 AM - 09:30 AM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">09:00 AM - 09:30 AM</option>
                      <option value="10:00 AM - 10:30 AM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">10:00 AM - 10:30 AM</option>
                      <option value="11:00 AM - 11:30 AM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">11:00 AM - 11:30 AM</option>
                      <option value="04:00 PM - 04:30 PM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">04:00 PM - 04:30 PM</option>
                      <option value="05:00 PM - 05:30 PM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">05:00 PM - 05:30 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowApptModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20"
                >
                  Confirm Appointment
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
