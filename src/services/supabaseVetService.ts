import { supabase } from '../config/supabase';
import { Veterinarian, TimeSlot } from '../types';
import { Database } from './supabaseTypes';

type VeterinarianRow = Database['public']['Tables']['veterinarians']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type VeterinarianInsert = Database['public']['Tables']['veterinarians']['Insert'];

// Extended type for joining veterinarians with profiles
type VeterinarianWithProfile = VeterinarianRow & {
  profiles: ProfileRow;
};

export class SupabaseVetService {
  // Generate mock time slots (in real app, this would come from the vet's schedule)
  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let slotId = 1;

    // Morning slots: 8:00 AM - 12:00 PM
    for (let hour = 8; hour < 12; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + 30;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const adjustedEndMinute = endMinute >= 60 ? 0 : endMinute;
        const endTime = `${endHour.toString().padStart(2, '0')}:${adjustedEndMinute.toString().padStart(2, '0')}`;
        
        slots.push({
          id: `slot-${slotId++}`,
          startTime,
          endTime,
          isAvailable: Math.random() > 0.3, // 70% chance of being available
        });
      }
    }

    // Afternoon slots: 1:00 PM - 6:00 PM
    for (let hour = 13; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + 30;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const adjustedEndMinute = endMinute >= 60 ? 0 : endMinute;
        const endTime = `${endHour.toString().padStart(2, '0')}:${adjustedEndMinute.toString().padStart(2, '0')}`;
        
        slots.push({
          id: `slot-${slotId++}`,
          startTime,
          endTime,
          isAvailable: Math.random() > 0.3,
        });
      }
    }

    return slots;
  }

  // Convert database row to app Veterinarian type
  private mapToVeterinarian(row: VeterinarianWithProfile): Veterinarian {
    return {
      id: row.id,
      name: row.profiles.name,
      email: row.profiles.email,
      phone: row.profiles.phone || '',
      photoURL: row.profiles.photo_url || undefined,
      specialties: row.specialties || [],
      experience: row.experience,
      rating: row.rating,
      reviewCount: row.review_count,
      clinic_id: row.clinic_id || '',
      availableSlots: this.generateTimeSlots(), // In real app, fetch from schedule table
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Get all veterinarians
  async getAllVeterinarians(): Promise<Veterinarian[]> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*),
          clinics(*)
        `)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching veterinarians:', error);
        throw new Error(`Failed to fetch veterinarians: ${error.message}`);
      }

      return (data || []).map(row => this.mapToVeterinarian(row));
    } catch (error) {
      console.error('Error in getAllVeterinarians:', error);
      throw error;
    }
  }

  // Get veterinarian by ID
  async getVeterinarianById(vetId: string): Promise<Veterinarian | null> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*),
          clinics(*)
        `)
        .eq('id', vetId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching veterinarian:', error);
        throw new Error(`Failed to fetch veterinarian: ${error.message}`);
      }

      return this.mapToVeterinarian(data);
    } catch (error) {
      console.error('Error in getVeterinarianById:', error);
      throw error;
    }
  }

  // Get veterinarians by clinic
  async getVeterinariansByClinic(clinic_id: string): Promise<Veterinarian[]> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*),
          clinics(*)
        `)
        .eq('clinic_id', clinic_id)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching veterinarians by clinic:', error);
        throw new Error(`Failed to fetch veterinarians by clinic: ${error.message}`);
      }

      return (data || []).map(row => this.mapToVeterinarian(row));
    } catch (error) {
      console.error('Error in getVeterinariansByClinic:', error);
      throw error;
    }
  }

  // Get veterinarians by specialty
  async getVeterinariansBySpecialty(specialty: string): Promise<Veterinarian[]> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*)
        `)
        .contains('specialties', [specialty])
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching veterinarians by specialty:', error);
        throw new Error(`Failed to fetch veterinarians by specialty: ${error.message}`);
      }

      return (data || []).map(row => this.mapToVeterinarian(row));
    } catch (error) {
      console.error('Error in getVeterinariansBySpecialty:', error);
      throw error;
    }
  }

  // Get emergency veterinarians
  async getEmergencyVeterinarians(): Promise<Veterinarian[]> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*)
        `)
        .or('specialties.cs.{"Emergency Medicine"}, specialties.cs.{"Critical Care"}, specialties.cs.{"Trauma Surgery"}, specialties.cs.{"Urgent Care"}')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching emergency veterinarians:', error);
        throw new Error(`Failed to fetch emergency veterinarians: ${error.message}`);
      }

      return (data || []).map(row => this.mapToVeterinarian(row));
    } catch (error) {
      console.error('Error in getEmergencyVeterinarians:', error);
      throw error;
    }
  }

  // Get top-rated veterinarians
  async getTopRatedVeterinarians(limit: number = 5): Promise<Veterinarian[]> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*)
        `)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top-rated veterinarians:', error);
        throw new Error(`Failed to fetch top-rated veterinarians: ${error.message}`);
      }

      return (data || []).map(row => this.mapToVeterinarian(row));
    } catch (error) {
      console.error('Error in getTopRatedVeterinarians:', error);
      throw error;
    }
  }

  // Search veterinarians
  async searchVeterinarians(query: string): Promise<Veterinarian[]> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(name)
        `)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error searching veterinarians:', error);
        throw new Error(`Failed to search veterinarians: ${error.message}`);
      }

      return (data || []).map(row => this.mapToVeterinarian(row));
    } catch (error) {
      console.error('Error in searchVeterinarians:', error);
      throw error;
    }
  }

  // Get available veterinarians for a specific date/time
  async getAvailableVeterinarians(
    date: string,
    timeSlot?: string
  ): Promise<Veterinarian[]> {
    try {
      // First get all veterinarians
      const vets = await this.getAllVeterinarians();

      // Filter out those with appointments at the specified time
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('veterinarian_id')
        .eq('appointment_date', date)
        .eq('start_time', timeSlot || '');

      if (error) {
        console.error('Error fetching appointments:', error);
        // Return all vets if we can't check appointments
        return vets;
      }

      const bookedVetIds = appointments.map(apt => apt.veterinarian_id);
      return vets.filter(vet => !bookedVetIds.includes(vet.id));
    } catch (error) {
      console.error('Error in getAvailableVeterinarians:', error);
      throw error;
    }
  }

  // Update veterinarian rating (called after new review)
  async updateVeterinarianRating(vetId: string, newRating: number, reviewCount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('veterinarians')
        .update({
          rating: newRating,
          review_count: reviewCount,
        })
        .eq('id', vetId);

      if (error) {
        console.error('Error updating veterinarian rating:', error);
        throw new Error(`Failed to update veterinarian rating: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateVeterinarianRating:', error);
      throw error;
    }
  }

  // Create veterinarian profile
  async createVeterinarianProfile(
    userId: string,
    vetData: {
      specialties: string[];
      experience: number;
      clinic_id?: string;
    }
  ): Promise<void> {
    try {
      const insertData: VeterinarianInsert = {
        id: userId,
        specialties: vetData.specialties,
        experience: vetData.experience,
        clinic_id: vetData.clinic_id || null,
        rating: 0,
        review_count: 0,
      };

      const { error } = await supabase
        .from('veterinarians')
        .insert(insertData);

      if (error) {
        console.error('Error creating veterinarian profile:', error);
        throw new Error(`Failed to create veterinarian profile: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in createVeterinarianProfile:', error);
      throw error;
    }
  }

  // Update veterinarian profile
  async updateVeterinarianProfile(
    vetId: string,
    vetData: {
      specialties?: string[];
      experience?: number;
      clinic_id?: string;
    }
  ): Promise<void> {
    try {
      const updateData: Partial<VeterinarianInsert> = {};
      
      if (vetData.specialties !== undefined) {
        updateData.specialties = vetData.specialties;
      }
      if (vetData.experience !== undefined) {
        updateData.experience = vetData.experience;
      }
      if (vetData.clinic_id !== undefined) {
        updateData.clinic_id = vetData.clinic_id || null;
      }

      const { error } = await supabase
        .from('veterinarians')
        .update(updateData)
        .eq('id', vetId);

      if (error) {
        console.error('Error updating veterinarian profile:', error);
        throw new Error(`Failed to update veterinarian profile: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateVeterinarianProfile:', error);
      throw error;
    }
  }

  // Delete veterinarian profile
  async deleteVeterinarianProfile(vetId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('veterinarians')
        .delete()
        .eq('id', vetId);

      if (error) {
        console.error('Error deleting veterinarian profile:', error);
        throw new Error(`Failed to delete veterinarian profile: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteVeterinarianProfile:', error);
      throw error;
    }
  }
}

export const supabaseVetService = new SupabaseVetService();