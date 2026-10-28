import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true,
    unique: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: { type: String, required: true },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null,
    set: v => (v && mongoose.isValidObjectId(v) ? v : null)
  },
  items: [{
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Consultation', 'Laboratory', 'Pharmacy', 'Procedure', 'Consumable', 'Other'],
      default: 'Consultation'
    },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }],
  totalAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Pending', 'Refunded'],
    default: 'Pending'
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
    default: 'Cash'
  },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Billing', billingSchema);
