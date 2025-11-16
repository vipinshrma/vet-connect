import { supabase } from '../config/supabase';
import { Appointment } from '../types';
import { Database } from './supabaseTypes';

type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export class SupabaseAppointmentService {
  // Convert database row to app Appointment type
  private mapToAppointment(row: AppointmentRow): Appointment {
    // Helper to safely create Date from database field
    const safeDate = (dateValue: string | null | undefined): Date => {
      if (!dateValue) return new Date();
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? new Date() : date;
    };

    return {
      id: row.id,
      petId: row.pet_id,
      veterinarianId: row.veterinarian_id,
      clinicId: row.clinic_id,
      ownerId: row.owner_id,
      date: safeDate(row.appointment_date),
      timeSlot: {
        id: `${row.start_time}-${row.end_time}`,
        startTime: row.start_time,
        endTime: row.end_time,
        isAvailable: false, // Booked appointments are not available
      },
      reason: row.reason,
      status: row.status,
      notes: row.notes || undefined,
      prescription: row.prescription || undefined,
      cost: row.cost || undefined,
      createdAt: safeDate(row.created_at),
      updatedAt: safeDate(row.updated_at),
    };
  }

  // Convert database row with relations to app Appointment type
  private mapToAppointmentWithRelations(row: any): Appointment {
    const appointment = this.mapToAppointment(row);
    
    // Add veterinarian data if present
    if (row.veterinarians) {
      const vetProfile = row.veterinarians.profiles;
      appointment.veterinarian = {
        id: row.veterinarians.id,
        name: vetProfile?.name || 'Unknown Veterinarian',
        email: vetProfile?.email || '',
        phone: vetProfile?.phone || '',
        photoURL: vetProfile?.photo_url,
        specialties: row.veterinarians.specialties || [],
        experience: row.veterinarians.experience,
        rating: row.veterinarians.rating,
        reviewCount: row.veterinarians.review_count,
        clinic_id: row.clinic_id,
        availableSlots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Add pet data if present
    if (row.pets) {
      appointment.pet = {
        id: row.pets.id,
        name: row.pets.name,
        species: row.pets.species,
        breed: row.pets.breed,
        age: row.pets.age,
        photoURL: row.pets.photo_url,
        ownerId: row.pets.owner_id || row.owner_id,
        gender: 'male', // Default, should be in database
        medicalHistory: [],
        vaccinations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Add owner data if present (for vet view)
    if (row.profiles) {
      appointment.owner = {
        id: row.profiles.id,
        name: row.profiles.name,
        email: row.profiles.email,
        phone: row.profiles.phone,
      };
    }

    return appointment;
  }

  // Create a new appointment
  async createAppointment(appointmentData: {
    pet_id: string;
    appointment_date: string;
    reason: string;
    notes?: string;
    veterinarian_id: string;
    clinic_id: string;
    owner_id: string;
    start_time: string;
    end_time: string;
  }): Promise<Appointment> {
    try {
      const insertData: AppointmentInsert = {
        pet_id: appointmentData.pet_id,
        veterinarian_id: appointmentData.veterinarian_id,
        clinic_id: appointmentData.clinic_id,
        owner_id: appointmentData.owner_id,
        appointment_date: appointmentData.appointment_date,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        reason: appointmentData.reason,
        notes: appointmentData.notes || null,
        status: 'scheduled',
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw new Error(`Failed to create appointment: ${error.message}`);
      }

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error in createAppointment:', error);
      throw error;
    }
  }

  // Get appointments for a user (pet owner)
  async getUserAppointments(userId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          veterinarians(
            id,
            specialties,
            experience,
            rating,
            review_count,
            profiles(
              id,
              name,
              email,
              phone,
              photo_url
            )
          ),
          pets(
            id,
            name,
            species,
            breed,
            age,
            photo_url
          )
        `)
        .eq('owner_id', userId)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching user appointments:', error);
        throw new Error(`Failed to fetch user appointments: ${error.message}`);
      }

      return data.map((row) => this.mapToAppointmentWithRelations(row));
    } catch (error) {
      console.error('Error in getUserAppointments:', error);
      throw error;
    }
  }

  // Get appointments for a veterinarian
  async getVetAppointments(vetId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          pets(
            id,
            name,
            species,
            breed,
            age,
            photo_url,
            owner_id
          ),
          profiles(
            id,
            name,
            email,
            phone
          )
        `)
        .eq('veterinarian_id', vetId)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching vet appointments:', error);
        throw new Error(`Failed to fetch vet appointments: ${error.message}`);
      }

      return data.map((row) => this.mapToAppointmentWithRelations(row));
    } catch (error) {
      console.error('Error in getVetAppointments:', error);
      throw error;
    }
  }

  // Get appointments for a clinic
  async getClinicAppointments(clinicId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching clinic appointments:', error);
        throw new Error(`Failed to fetch clinic appointments: ${error.message}`);
      }

      return data.map((row) => this.mapToAppointment(row));
    } catch (error) {
      console.error('Error in getClinicAppointments:', error);
      throw error;
    }
  }

  // Get appointment by ID with related veterinarian, pet, and owner profile
  async getAppointmentById(appointmentId: string, viewerUserId?: string): Promise<Appointment | null> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          veterinarians(
            id,
            specialties,
            experience,
            rating,
            review_count,
            profiles(
              id,
              name,
              email,
              phone,
              photo_url
            )
          ),
          pets(
            id,
            name,
            species,
            breed,
            age,
            photo_url,
            owner_id
          ),
          profiles(
            id,
            name,
            email,
            phone
          )
        `)
        .eq('id', appointmentId);

      // Optional additional protection: restrict to owner or veterinarian viewer
      if (viewerUserId) {
        query = query.or(`owner_id.eq.${viewerUserId},veterinarian_id.eq.${viewerUserId}`);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching appointment:', error);
        throw new Error(`Failed to fetch appointment: ${error.message}`);
      }

      return this.mapToAppointmentWithRelations(data);
    } catch (error) {
      console.error('Error in getAppointmentById:', error);
      throw error;
    }
  }

  // Update appointment status
  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentRow['status'],
    userId: string
  ): Promise<Appointment> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .or(`owner_id.eq.${userId},veterinarian_id.eq.${userId}`) // Allow owner or vet to update
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment status:', error);
        throw new Error(`Failed to update appointment status: ${error.message}`);
      }

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      throw error;
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId: string, userId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled', userId);
  }

  // Confirm appointment (for vets)
  async confirmAppointment(appointmentId: string, vetId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'confirmed', vetId);
  }

  // Complete appointment with notes and prescription
  async completeAppointment(
    appointmentId: string,
    vetId: string,
    notes?: string,
    prescription?: string[],
    cost?: number
  ): Promise<Appointment> {
    try {
      const updateData: AppointmentUpdate = {
        status: 'completed',
        notes: notes || null,
        prescription: prescription || null,
        cost: cost || null,
      };

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .eq('veterinarian_id', vetId)
        .select()
        .single();

      if (error) {
        console.error('Error completing appointment:', error);
        throw new Error(`Failed to complete appointment: ${error.message}`);
      }

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error in completeAppointment:', error);
      throw error;
    }
  }

  // Get upcoming appointments for a user
  async getUpcomingAppointments(userId: string): Promise<Appointment[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('owner_id', userId)
        .gte('appointment_date', today)
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming appointments:', error);
        throw new Error(`Failed to fetch upcoming appointments: ${error.message}`);
      }

      return data.map((row) => this.mapToAppointment(row));
    } catch (error) {
      console.error('Error in getUpcomingAppointments:', error);
      throw error;
    }
  }

  // Get past appointments for a user
  async getPastAppointments(userId: string): Promise<Appointment[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('owner_id', userId)
        .or(`appointment_date.lt.${today},status.eq.completed,status.eq.cancelled`)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching past appointments:', error);
        throw new Error(`Failed to fetch past appointments: ${error.message}`);
      }

      return data.map((row) => this.mapToAppointment(row));
    } catch (error) {
      console.error('Error in getPastAppointments:', error);
      throw error;
    }
  }

  // Check if a time slot is available
  async isTimeSlotAvailable(
    veterinarianId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('veterinarian_id', veterinarianId)
        .eq('appointment_date', date)
        .not('status', 'eq', 'cancelled')
        .or(`and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},start_time.lt.${endTime})`);

      if (error) {
        console.error('Error checking time slot availability:', error);
        throw new Error(`Failed to check time slot availability: ${error.message}`);
      }

      return data.length === 0; // Available if no conflicting appointments
    } catch (error) {
      console.error('Error in isTimeSlotAvailable:', error);
      throw error;
    }
  }


  // Get appointments for a specific date
  async getAppointmentsByDate(date: string, userId?: string): Promise<Appointment[]> {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', date);

      if (userId) {
        query = query.or(`owner_id.eq.${userId},veterinarian_id.eq.${userId}`);
      }

      const { data, error } = await query
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments by date:', error);
        throw new Error(`Failed to fetch appointments by date: ${error.message}`);
      }

      return data.map((row) => this.mapToAppointment(row));
    } catch (error) {
      console.error('Error in getAppointmentsByDate:', error);
      throw error;
    }
  }
}

export const supabaseAppointmentService = new SupabaseAppointmentService();