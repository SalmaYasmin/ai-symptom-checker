import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescription extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  diagnosis: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema: Schema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, required: true }
  }],
  diagnosis: { type: String, required: true },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date }
}, {
  timestamps: true
});

// Create indexes for faster queries
PrescriptionSchema.index({ patientId: 1 });
PrescriptionSchema.index({ doctorId: 1 });
PrescriptionSchema.index({ status: 1 });
PrescriptionSchema.index({ startDate: -1 });

export default mongoose.model<IPrescription>('Prescription', PrescriptionSchema); 