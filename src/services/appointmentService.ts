import { Appointment, AppointmentForm, TimeSlot } from '../types';

class AppointmentService {
  async getUserAppointments(userId: string): Promise<Appointment[]> {
    // TODO: Fetch user appointments from Firestore
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: '1',
        petId: '1',
        veterinarianId: '1',
        clinicId: '1',
        ownerId: userId,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        timeSlot: {
          id: '1',
          startTime: '10:00',
          endTime: '10:30',
          isAvailable: false,
        },
        reason: 'Annual checkup',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async getAvailableSlots(veterinarianId: string, date: Date): Promise<TimeSlot[]> {
    // TODO: Fetch available slots from Firestore
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: '1',
        startTime: '09:00',
        endTime: '09:30',
        isAvailable: true,
      },
      {
        id: '2',
        startTime: '09:30',
        endTime: '10:00',
        isAvailable: true,
      },
      {
        id: '3',
        startTime: '10:00',
        endTime: '10:30',
        isAvailable: false,
      },
      {
        id: '4',
        startTime: '11:00',
        endTime: '11:30',
        isAvailable: true,
      },
    ];
  }

  async bookAppointment(appointmentData: AppointmentForm & { veterinarianId: string; clinicId: string; userId: string }): Promise<Appointment> {
    // TODO: Create appointment in Firestore
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      id: Date.now().toString(),
      petId: appointmentData.petId,
      veterinarianId: appointmentData.veterinarianId,
      clinicId: appointmentData.clinicId,
      ownerId: appointmentData.userId,
      date: appointmentData.date,
      timeSlot: {
        id: appointmentData.timeSlotId,
        startTime: '10:00',
        endTime: '10:30',
        isAvailable: false,
      },
      reason: appointmentData.reason,
      status: 'scheduled',
      notes: appointmentData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    // TODO: Update appointment status in Firestore
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  async rescheduleAppointment(params: { appointmentId: string; newDate: Date; newTimeSlotId: string }): Promise<Appointment> {
    // TODO: Update appointment in Firestore
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: params.appointmentId,
      petId: '1',
      veterinarianId: '1',
      clinicId: '1',
      ownerId: '1',
      date: params.newDate,
      timeSlot: {
        id: params.newTimeSlotId,
        startTime: '14:00',
        endTime: '14:30',
        isAvailable: false,
      },
      reason: 'Annual checkup',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getAppointmentDetails(appointmentId: string): Promise<Appointment> {
    // TODO: Fetch appointment details from Firestore
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      id: appointmentId,
      petId: '1',
      veterinarianId: '1',
      clinicId: '1',
      ownerId: '1',
      date: new Date(),
      timeSlot: {
        id: '1',
        startTime: '10:00',
        endTime: '10:30',
        isAvailable: false,
      },
      reason: 'Annual checkup',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export const appointmentService = new AppointmentService();