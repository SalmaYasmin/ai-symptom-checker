import mongoose, { Schema, Document } from 'mongoose';
import { IPatient } from './Patient.js';
import { IDoctor } from './Doctor.js';

export interface IAppointment extends Document {
  doctorId: IDoctor['_id'] | IDoctor;
  patientId: IPatient['_id'] | IPatient;
  dateTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'regular' | 'follow-up' | 'emergency' | 'consultation';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  dateTime: { type: Date, required: true },
  duration: { type: Number, required: true, default: 30 }, // default 30 minutes
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    required: true 
  },
  type: {
    type: String,
    enum: ['regular', 'follow-up', 'emergency', 'consultation'],
    required: true
  },
  notes: { type: String }
}, {
  timestamps: true
});

// Create indexes for faster queries
AppointmentSchema.index({ doctorId: 1, dateTime: 1 });
AppointmentSchema.index({ patientId: 1, dateTime: 1 });
AppointmentSchema.index({ dateTime: 1 });
AppointmentSchema.index({ status: 1 });

const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export default Appointment; 