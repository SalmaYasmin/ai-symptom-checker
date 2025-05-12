import express from 'express';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';
import Patient, { IPatient } from '../models/Patient.js';
import Appointment, { IAppointment } from '../models/Appointment.js';

dotenv.config();

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all doctors');
    const doctors = await Doctor.find();
    console.log('Found doctors:', doctors);
    res.json({ 
      count: doctors.length,
      doctors: doctors 
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific doctor
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching doctor with ID:', id);
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      console.log('Doctor not found with ID:', id);
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    console.log('Found doctor:', doctor);
    res.json(doctor);
  } catch (error: any) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get doctor's patients
router.get('/:id/patients', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching patients for doctor with ID:', id);
    
    // First verify if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Find all patients that have notes or prescriptions with this doctor
    // Note: This is a simplified version. In a real application, you might want to:
    // 1. Add pagination
    // 2. Add filtering options
    // 3. Include more patient details
    // 4. Add proper access control
    const patients = await Patient.find({
      $or: [
        { 'primaryDoctor': id },
        { 'assignedDoctors': id }
      ]
    }).select('firstName lastName email phone medicalHistory'); // Select specific fields to return

    res.json({
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      patientCount: patients.length,
      patients: patients
    });
  } catch (error: any) {
    console.error('Error fetching doctor patients:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get doctor's schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching schedule for doctor with ID:', id);
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Return the doctor's availability schedule
    res.json({
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      specialization: doctor.specialization,
      availability: doctor.availability
    });
  } catch (error: any) {
    console.error('Error fetching doctor schedule:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get doctor's daily schedule with patient details
router.get('/:id/daily-schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    // Use provided date or default to today
    const targetDate = date ? new Date(date as string) : new Date();
    
    // Set time to start of day (midnight) in ET
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Set time to end of day (23:59:59.999) in ET
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Fetching schedule for doctor ${id} on ${targetDate.toISOString()}`);

    // First verify if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Find all appointments for this doctor on the specified date
    const appointments = await Appointment.find({
      doctorId: id,
      dateTime: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'scheduled' // Only get active appointments
    }).sort({ dateTime: 1 }) // Sort by time
    .populate<{ patientId: IPatient }>({
      path: 'patientId',
      select: 'firstName lastName email phone medicalHistory allergies bloodType'
    });

    // Transform the data to include formatted time and patient details
    const scheduledPatients = appointments.map(apt => ({
      appointmentId: apt._id,
      time: apt.dateTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/New_York'
      }),
      duration: apt.duration,
      type: apt.type,
      patient: {
        id: apt.patientId._id,
        name: `${apt.patientId.firstName} ${apt.patientId.lastName}`,
        email: apt.patientId.email,
        phone: apt.patientId.phone,
        medicalHistory: apt.patientId.medicalHistory,
        allergies: apt.patientId.allergies,
        bloodType: apt.patientId.bloodType
      },
      notes: apt.notes
    }));

    res.json({
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      date: targetDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'America/New_York'
      }),
      totalAppointments: scheduledPatients.length,
      schedule: scheduledPatients
    });

  } catch (error: any) {
    console.error('Error fetching doctor daily schedule:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Create a new doctor
router.post('/', async (req, res) => {
  try {
    console.log('Attempting to create doctor with data:', req.body);
    const doctorData = req.body;
    const doctor = new Doctor(doctorData);
    console.log('Doctor model instance created:', doctor);
    
    const savedDoctor = await doctor.save();
    console.log('Doctor saved successfully:', savedDoctor);
    
    res.status(201).json({ 
      message: 'Doctor created successfully',
      doctor: savedDoctor
    });
  } catch (error: any) {
    console.error('Error creating doctor:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate entry. Email or license number already exists.' 
      });
    }
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router; 