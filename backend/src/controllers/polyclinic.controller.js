import mongoose from 'mongoose';
import Patient from '../models/patient.model.js';
import Appointment from '../models/appointment.model.js';
import EMR from '../models/emr.model.js';
import Prescription from '../models/prescription.model.js';
import Laboratory from '../models/laboratory.model.js';
import PharmacyInventory from '../models/pharmacyInventory.model.js';
import Billing from '../models/billing.model.js';
import FollowUp from '../models/followUp.model.js';
import DoctorSchedule from '../models/doctorSchedule.model.js';
import User from '../models/user.model.js';
import Lead from '../models/lead.model.js';

// Seed Initial Healthcare Demo Data if DB is empty
export const seedPolyclinicData = async () => {
  try {
    const patientCount = await Patient.countDocuments();
    if (patientCount === 0) {
      console.log('🌱 Seeding initial Polyclinic demo data...');
      
      const patients = await Patient.insertMany([
        { patientId: 'PAT-1001', name: 'Rahul Sharma', phone: '+91 9876543210', email: 'rahul@example.com', gender: 'Male', age: 34, bloodGroup: 'O+', address: 'MG Road, Bangalore', medicalHistory: ['Hypertension'], allergies: ['Penicillin'] },
        { patientId: 'PAT-1002', name: 'Ananya Verma', phone: '+91 9812345678', email: 'ananya@example.com', gender: 'Female', age: 28, bloodGroup: 'A+', address: 'Indiranagar, Bangalore', medicalHistory: ['Asthma'], allergies: ['Dust'] },
        { patientId: 'PAT-1003', name: 'Vikram Nair', phone: '+91 9900112233', email: 'vikram@example.com', gender: 'Male', age: 45, bloodGroup: 'B+', address: 'Koramangala, Bangalore', medicalHistory: ['Type 2 Diabetes'], allergies: ['None'] }
      ]);

      // Seed Doctor User
      let doctorUser = await User.findOne({ role: { $in: ['Doctor', '1', '2'] } });
      if (!doctorUser) {
        doctorUser = await User.create({
          name: 'Dr. Rajesh Gupta',
          email: 'dr.rajesh@polyclinic.com',
          phone: '9876500000',
          password: 'password123',
          role: 'Doctor',
          departmentName: 'General Medicine'
        });
      }

      await DoctorSchedule.create({
        doctor: doctorUser._id,
        doctorName: doctorUser.name || 'Dr. Rajesh Gupta',
        specialization: 'Cardiology & General Medicine',
        consultationFee: 600,
        honorariumType: 'Percentage',
        honorariumRate: 75,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        timeSlots: ['09:00 AM - 01:00 PM', '04:00 PM - 08:00 PM']
      });

      const today = new Date();
      const appointment = await Appointment.create({
        appointmentNo: 'APT-1001',
        patient: patients[0]._id,
        patientName: patients[0].name,
        patientPhone: patients[0].phone,
        doctor: doctorUser._id,
        doctorName: doctorUser.name || 'Dr. Rajesh Gupta',
        specialization: 'General Medicine',
        date: today,
        timeSlot: '10:00 AM - 10:30 AM',
        status: 'Checked-In',
        tokenNumber: 1,
        consultationFee: 600
      });

      const emr = await EMR.create({
        patient: patients[0]._id,
        appointment: appointment._id,
        doctor: doctorUser._id,
        doctorName: doctorUser.name || 'Dr. Rajesh Gupta',
        symptoms: 'Mild fever, dry cough, body pain',
        vitals: { bp: '120/80', pulse: '78', temp: '99.2 F', weight: '72 kg', spo2: '98%' },
        diagnosis: 'Viral Upper Respiratory Infection',
        treatmentPlan: 'Rest, hydration, and 5-day antiviral/antipyretic course.',
        consultationNotes: 'Patient advised to follow up if fever persists after 3 days.',
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await Prescription.create({
        prescriptionNo: 'RX-1001',
        emr: emr._id,
        patient: patients[0]._id,
        patientName: patients[0].name,
        doctor: doctorUser._id,
        doctorName: doctorUser.name || 'Dr. Rajesh Gupta',
        medicines: [
          { name: 'Paracetamol 650mg', dosage: '1 tablet', frequency: '1-0-1', duration: '5 Days', instructions: 'After food' },
          { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: '0-0-1', duration: '5 Days', instructions: 'Before sleep' },
          { name: 'Vitamin C 500mg', dosage: '1 tablet', frequency: '1-0-0', duration: '10 Days', instructions: 'After food' }
        ]
      });

      await Laboratory.create({
        labTestNo: 'LAB-1001',
        patient: patients[0]._id,
        patientName: patients[0].name,
        doctor: doctorUser._id,
        doctorName: doctorUser.name || 'Dr. Rajesh Gupta',
        testName: 'Complete Blood Count (CBC)',
        category: 'Pathology',
        status: 'Completed',
        cost: 450,
        resultNotes: 'Hemoglobin: 14.2 g/dL, WBC: 8,500 /uL. Normal limits.'
      });

      await PharmacyInventory.insertMany([
        { itemCode: 'MED-101', name: 'Paracetamol 650mg', category: 'Medicine', batchNumber: 'PCM-2026', quantity: 150, minStockLevel: 20, purchasePrice: 2, sellingPrice: 5, expiryDate: new Date('2027-12-31') },
        { itemCode: 'MED-102', name: 'Amoxicillin 500mg', category: 'Medicine', batchNumber: 'AMX-2026', quantity: 12, minStockLevel: 25, purchasePrice: 8, sellingPrice: 18, expiryDate: new Date('2027-08-15') },
        { itemCode: 'MED-103', name: 'Cetirizine 10mg', category: 'Medicine', batchNumber: 'CET-2026', quantity: 80, minStockLevel: 15, purchasePrice: 1.5, sellingPrice: 4, expiryDate: new Date('2027-10-20') },
        { itemCode: 'CON-201', name: 'Surgical Latex Gloves (Box of 100)', category: 'Consumable', batchNumber: 'GLV-99', quantity: 5, minStockLevel: 10, purchasePrice: 250, sellingPrice: 400, expiryDate: new Date('2028-05-30') },
        { itemCode: 'CON-202', name: 'Disposable Syringes 5ml (Pack of 50)', category: 'Consumable', batchNumber: 'SYR-88', quantity: 18, minStockLevel: 15, purchasePrice: 150, sellingPrice: 250, expiryDate: new Date('2028-09-10') }
      ]);

      await Billing.create({
        invoiceNo: 'INV-1001',
        patient: patients[0]._id,
        patientName: patients[0].name,
        appointment: appointment._id,
        items: [
          { description: 'General Doctor Consultation', category: 'Consultation', qty: 1, unitPrice: 600, amount: 600 },
          { description: 'Complete Blood Count (CBC)', category: 'Laboratory', qty: 1, unitPrice: 450, amount: 450 },
          { description: 'Paracetamol & Antihistamines', category: 'Pharmacy', qty: 1, unitPrice: 150, amount: 150 }
        ],
        totalAmount: 1200,
        discount: 0,
        tax: 0,
        netAmount: 1200,
        paidAmount: 1200,
        pendingAmount: 0,
        status: 'Paid',
        paymentMode: 'UPI'
      });

      await FollowUp.create({
        patient: patients[0]._id,
        patientName: patients[0].name,
        patientPhone: patients[0].phone,
        doctor: doctorUser._id,
        doctorName: doctorUser.name || 'Dr. Rajesh Gupta',
        appointment: appointment._id,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        purpose: 'Post-viral recovery check-up',
        status: 'Pending'
      });

      console.log('✅ Polyclinic demo data successfully seeded!');
    }
  } catch (err) {
    console.error('⚠️ Polyclinic seeding notice:', err.message);
  }
};

// 1. Dashboard Overview Stats
export const getPolyclinicDashboard = async (req, res) => {
  try {
    await seedPolyclinicData();

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const totalPatients = await Patient.countDocuments();
    const todayAppointments = await Appointment.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } });
    const waitingQueue = await Appointment.countDocuments({ status: 'Checked-In' });
    const inConsultation = await Appointment.countDocuments({ status: 'In-Consultation' });
    const completedToday = await Appointment.countDocuments({ status: 'Completed', date: { $gte: todayStart, $lte: todayEnd } });
    
    // Revenue calculations
    const todayInvoices = await Billing.find({ date: { $gte: todayStart, $lte: todayEnd } });
    const todayRevenue = todayInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);

    const allInvoices = await Billing.find({});
    const totalRevenue = allInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const pendingPayments = allInvoices.reduce((acc, inv) => acc + (inv.pendingAmount || 0), 0);

    // Inventory Alerts
    const allItems = await PharmacyInventory.find({});
    const lowStockItems = allItems.filter(item => item.quantity <= item.minStockLevel);
    
    // Low stock count
    const lowStockCount = lowStockItems.length;

    // Doctor count
    const doctorSchedules = await DoctorSchedule.find({}).populate('doctor', 'name email phone');

    res.json({
      success: true,
      stats: {
        totalPatients,
        todayAppointments,
        waitingQueue,
        inConsultation,
        completedToday,
        todayRevenue,
        totalRevenue,
        pendingPayments,
        lowStockCount
      },
      lowStockItems,
      doctors: doctorSchedules
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Patient Management
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json({ success: true, patients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    const count = await Patient.countDocuments();
    const patientId = `PAT-${1001 + count}`;
    const patient = await Patient.create({ ...req.body, patientId });
    res.status(201).json({ success: true, patient });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    const appointments = await Appointment.find({ patient: req.params.id }).sort({ date: -1 });
    const emrs = await EMR.find({ patient: req.params.id }).sort({ createdAt: -1 });
    const prescriptions = await Prescription.find({ patient: req.params.id }).sort({ createdAt: -1 });
    const labTests = await Laboratory.find({ patient: req.params.id }).sort({ createdAt: -1 });
    const bills = await Billing.find({ patient: req.params.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      patient,
      history: {
        appointments,
        emrs,
        prescriptions,
        labTests,
        bills
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Appointments & Queue Management
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ date: -1, tokenNumber: 1 });
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    let patientName = req.body.patientName;
    let patientPhone = req.body.patientPhone;

    if (req.body.patient) {
      const p = await Patient.findById(req.body.patient);
      if (p) {
        patientName = p.name;
        patientPhone = p.phone;
      }
    }

    // Check if patient already has an active/open appointment (Scheduled, Checked-In, In-Consultation)
    const activeQuery = [];
    if (req.body.patient) {
      activeQuery.push({ patient: req.body.patient });
    }
    if (patientPhone) {
      activeQuery.push({ patientPhone });
    }

    if (activeQuery.length > 0) {
      const existingActive = await Appointment.findOne({
        $or: activeQuery,
        status: { $in: ['Scheduled', 'Checked-In', 'In-Consultation'] }
      });

      if (existingActive) {
        return res.status(400).json({
          success: false,
          message: `Patient "${patientName || 'this patient'}" already has an active appointment (${existingActive.appointmentNo} - Status: ${existingActive.status}). A patient cannot book more than one active appointment at a time.`
        });
      }
    }

    const count = await Appointment.countDocuments();
    const appointmentNo = `APT-${1001 + count}`;
    
    // Auto calculate token number for the date
    const dateStart = new Date(req.body.date || Date.now());
    dateStart.setHours(0,0,0,0);
    const dateEnd = new Date(req.body.date || Date.now());
    dateEnd.setHours(23,59,59,999);
    
    const todayCount = await Appointment.countDocuments({ date: { $gte: dateStart, $lte: dateEnd } });
    const tokenNumber = todayCount + 1;

    const appointment = await Appointment.create({
      ...req.body,
      appointmentNo,
      tokenNumber,
      patientName,
      patientPhone
    });

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updateFields = { status };
    if (status === 'Checked-In') updateFields.checkInTime = new Date();
    if (status === 'In-Consultation') updateFields.consultationStartTime = new Date();
    if (status === 'Completed') updateFields.consultationEndTime = new Date();

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 4. Doctor Consultation (EMR)
export const getEmrRecords = async (req, res) => {
  try {
    const emrs = await EMR.find().populate('patient').sort({ createdAt: -1 });
    res.json({ success: true, emrs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createEmrRecord = async (req, res) => {
  try {
    let doctorId = req.body.doctor || req.user?._id;
    let doctorName = req.body.doctorName;

    if (!doctorId && req.body.appointment) {
      const appt = await Appointment.findById(req.body.appointment);
      if (appt && appt.doctor) {
        doctorId = appt.doctor;
        if (!doctorName) doctorName = appt.doctorName;
      }
    }

    if (!doctorId) {
      const docUser = await User.findOne({ role: { $in: ['Doctor', '1', '2'] } });
      if (docUser) {
        doctorId = docUser._id;
        if (!doctorName) doctorName = docUser.name;
      }
    }

    const emrData = {
      ...req.body,
      ...(doctorId ? { doctor: doctorId } : {}),
      doctorName: doctorName || 'Dr. Rajesh Gupta'
    };

    const emr = await EMR.create(emrData);
    
    // Update appointment status to Completed if appointment ID provided
    if (req.body.appointment) {
      await Appointment.findByIdAndUpdate(req.body.appointment, { status: 'Completed', consultationEndTime: new Date() });
    }

    // Auto create follow-up reminder if followUpDate is specified
    if (req.body.followUpDate) {
      const patient = await Patient.findById(req.body.patient);
      if (patient) {
        const followUpPayload = {
          patient: patient._id,
          patientName: patient.name,
          patientPhone: patient.phone,
          doctorName: doctorName || 'Dr. Rajesh Gupta',
          followUpDate: req.body.followUpDate,
          purpose: 'Scheduled Consultation Follow-up'
        };
        if (doctorId && mongoose.isValidObjectId(doctorId)) {
          followUpPayload.doctor = doctorId;
        }
        if (req.body.appointment && mongoose.isValidObjectId(req.body.appointment)) {
          followUpPayload.appointment = req.body.appointment;
        }
        await FollowUp.create(followUpPayload);
      }
    }

    res.status(201).json({ success: true, emr });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5. Prescriptions
export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.json({ success: true, prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPrescription = async (req, res) => {
  try {
    let doctorId = req.body.doctor || req.user?._id;
    let doctorName = req.body.doctorName;

    if (!doctorId) {
      const docUser = await User.findOne({ role: { $in: ['Doctor', '1', '2'] } });
      if (docUser) {
        doctorId = docUser._id;
        if (!doctorName) doctorName = docUser.name;
      }
    }

    const count = await Prescription.countDocuments();
    const prescriptionNo = `RX-${1001 + count}`;
    const prescription = await Prescription.create({
      ...req.body,
      ...(doctorId ? { doctor: doctorId } : {}),
      doctorName: doctorName || 'Dr. Rajesh Gupta',
      prescriptionNo
    });
    res.status(201).json({ success: true, prescription });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 6. Laboratory & Diagnostic Management
export const getLabTests = async (req, res) => {
  try {
    const labTests = await Laboratory.find().sort({ createdAt: -1 });
    res.json({ success: true, labTests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createLabTest = async (req, res) => {
  try {
    const count = await Laboratory.countDocuments();
    const labTestNo = `LAB-${1001 + count}`;
    const payload = { ...req.body, labTestNo };
    if (!payload.doctor || !mongoose.isValidObjectId(payload.doctor)) {
      delete payload.doctor;
    }
    const labTest = await Laboratory.create(payload);
    res.status(201).json({ success: true, labTest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateLabTest = async (req, res) => {
  try {
    const labTest = await Laboratory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, labTest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 7. Pharmacy & Inventory
export const getPharmacyItems = async (req, res) => {
  try {
    const items = await PharmacyInventory.find().sort({ name: 1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPharmacyItem = async (req, res) => {
  try {
    const item = await PharmacyInventory.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updatePharmacyItem = async (req, res) => {
  try {
    const item = await PharmacyInventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 8. Billing & Invoicing
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Billing.find().sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const count = await Billing.countDocuments();
    const invoiceNo = `INV-${1001 + count}`;
    
    let totalAmount = 0;
    const items = (req.body.items || []).map(item => {
      const amount = (item.qty || 1) * (item.unitPrice || 0);
      totalAmount += amount;
      return { ...item, amount };
    });

    const discount = req.body.discount || 0;
    const tax = req.body.tax || 0;
    const netAmount = totalAmount - discount + tax;
    const paidAmount = req.body.paidAmount || netAmount;
    const pendingAmount = netAmount - paidAmount;
    const status = pendingAmount <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Pending');

    const billingPayload = {
      ...req.body,
      invoiceNo,
      items,
      totalAmount,
      netAmount,
      paidAmount,
      pendingAmount,
      status
    };
    if (!billingPayload.appointment || !mongoose.isValidObjectId(billingPayload.appointment)) {
      delete billingPayload.appointment;
    }

    const invoice = await Billing.create(billingPayload);

    res.status(201).json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 9. Doctors & Staff Schedules
export const getDoctorSchedules = async (req, res) => {
  try {
    const doctors = await DoctorSchedule.find().populate('doctor');
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createDoctorSchedule = async (req, res) => {
  try {
    const doc = await DoctorSchedule.create(req.body);
    res.status(201).json({ success: true, doctor: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateDoctorSchedule = async (req, res) => {
  try {
    const doc = await DoctorSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, doctor: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 10. Patient Follow-ups
export const getFollowUps = async (req, res) => {
  try {
    const followUps = await FollowUp.find().sort({ followUpDate: 1 });
    res.json({ success: true, followUps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createFollowUp = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.doctor || !mongoose.isValidObjectId(payload.doctor)) {
      delete payload.doctor;
    }
    if (!payload.appointment || !mongoose.isValidObjectId(payload.appointment)) {
      delete payload.appointment;
    }
    const followUp = await FollowUp.create(payload);
    res.status(201).json({ success: true, followUp });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateFollowUp = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.doctor !== undefined && (!payload.doctor || !mongoose.isValidObjectId(payload.doctor))) {
      payload.doctor = null;
    }
    if (payload.appointment !== undefined && (!payload.appointment || !mongoose.isValidObjectId(payload.appointment))) {
      payload.appointment = null;
    }
    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json({ success: true, followUp });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteFollowUp = async (req, res) => {
  try {
    await FollowUp.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Follow-up record removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
