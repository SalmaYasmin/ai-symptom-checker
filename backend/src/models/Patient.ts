import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  medicalHistory: string[];
  allergies: string[];
  bloodType?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  primaryDoctor: mongoose.Types.ObjectId;
  assignedDoctors: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  medicalHistory: [{ type: String }],
  allergies: [{ type: String }],
  bloodType: { type: String },
  emergencyContact: {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true }
  },
  primaryDoctor: { type: Schema.Types.ObjectId, ref: 'Doctor' },
  assignedDoctors: [{ type: Schema.Types.ObjectId, ref: 'Doctor' }]
}, {
  timestamps: true
});

// Create indexes for faster queries
PatientSchema.index({ primaryDoctor: 1 });
PatientSchema.index({ assignedDoctors: 1 });
PatientSchema.index({ email: 1 });

const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
export default Patient; 