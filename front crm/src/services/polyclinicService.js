import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  };
};

export const polyclinicService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/dashboard`, getAuthHeaders());
    return res.data;
  },

  // Patients
  getPatients: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/patients`, getAuthHeaders());
    return res.data;
  },
  createPatient: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/patients`, data, getAuthHeaders());
    return res.data;
  },
  getPatientById: async (id) => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/patients/${id}`, getAuthHeaders());
    return res.data;
  },
  getPatientsByPhone: async (phone) => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/patients/by-phone/${encodeURIComponent(phone)}`, getAuthHeaders());
    return res.data;
  },

  // Family Units & Grouping Engine
  getFamilyUnits: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await axios.get(`${API_URL}/v1/polyclinic/families${query ? `?${query}` : ''}`, getAuthHeaders());
    return res.data;
  },

  // Appointments
  getAppointments: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/appointments`, getAuthHeaders());
    return res.data;
  },
  createAppointment: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/appointments`, data, getAuthHeaders());
    return res.data;
  },
  updateAppointmentStatus: async (id, status) => {
    const res = await axios.patch(`${API_URL}/v1/polyclinic/appointments/${id}/status`, { status }, getAuthHeaders());
    return res.data;
  },

  // EMR & Consultations
  getEmrRecords: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/emr`, getAuthHeaders());
    return res.data;
  },
  createEmrRecord: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/emr`, data, getAuthHeaders());
    return res.data;
  },

  // Prescriptions
  getPrescriptions: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/prescriptions`, getAuthHeaders());
    return res.data;
  },
  createPrescription: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/prescriptions`, data, getAuthHeaders());
    return res.data;
  },

  // Laboratory
  getLabTests: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/lab-tests`, getAuthHeaders());
    return res.data;
  },
  createLabTest: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/lab-tests`, data, getAuthHeaders());
    return res.data;
  },
  updateLabTest: async (id, data) => {
    const res = await axios.put(`${API_URL}/v1/polyclinic/lab-tests/${id}`, data, getAuthHeaders());
    return res.data;
  },

  // Pharmacy & Inventory
  getPharmacyItems: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/pharmacy`, getAuthHeaders());
    return res.data;
  },
  createPharmacyItem: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/pharmacy`, data, getAuthHeaders());
    return res.data;
  },
  updatePharmacyItem: async (id, data) => {
    const res = await axios.put(`${API_URL}/v1/polyclinic/pharmacy/${id}`, data, getAuthHeaders());
    return res.data;
  },

  // Invoices & Billing
  getInvoices: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/invoices`, getAuthHeaders());
    return res.data;
  },
  createInvoice: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/invoices`, data, getAuthHeaders());
    return res.data;
  },

  // Doctor Schedules
  getDoctors: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/doctors`, getAuthHeaders());
    return res.data;
  },
  createDoctorSchedule: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/doctors`, data, getAuthHeaders());
    return res.data;
  },
  updateDoctorSchedule: async (id, data) => {
    const res = await axios.put(`${API_URL}/v1/polyclinic/doctors/${id}`, data, getAuthHeaders());
    return res.data;
  },

  // Follow-ups
  getFollowUps: async () => {
    const res = await axios.get(`${API_URL}/v1/polyclinic/follow-ups`, getAuthHeaders());
    return res.data;
  },
  createFollowUp: async (data) => {
    const res = await axios.post(`${API_URL}/v1/polyclinic/follow-ups`, data, getAuthHeaders());
    return res.data;
  },
  updateFollowUp: async (id, data) => {
    const res = await axios.put(`${API_URL}/v1/polyclinic/follow-ups/${id}`, data, getAuthHeaders());
    return res.data;
  },
  deleteFollowUp: async (id) => {
    const res = await axios.delete(`${API_URL}/v1/polyclinic/follow-ups/${id}`, getAuthHeaders());
    return res.data;
  }
};
