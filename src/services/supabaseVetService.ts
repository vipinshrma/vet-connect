import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { TimeSlot, Veterinarian } from '../types';
import { getSpecialtyNamesForQuickFilter, specialtyMatchesQuickFilter } from '../utils/specialtyMapping';
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
    // Ensure specialties is always an array
    const specialties = Array.isArray(row.specialties) ? row.specialties : (row.specialties ? [row.specialties] : []);
    
    console.log('🔄 [DEBUG] Mapping veterinarian:', {
      id: row.id,
      rawSpecialties: row.specialties,
      processedSpecialties: specialties,
      experience: row.experience,
    });

    return {
      id: row.id,
      name: row.profiles.name,
      email: row.profiles.email,
      phone: row.profiles.phone || '',
      photoURL: ((row.profiles as any).photo_url as string | undefined) || row.profiles.photo_url || undefined,
      specialties: specialties,
      experience: row.experience,
      rating: row.rating,
      reviewCount: row.review_count,
      clinic_id: row.clinic_id || '',
      availableSlots: this.generateTimeSlots(), // In real app, fetch from schedule table
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Get all veterinarians
  async getAllVeterinarians(_locationParams?: { latitude: number, longitude: number }): Promise<Veterinarian[]> {
    try {
      // Simplified query to avoid complex select typing issues
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
      console.log('🔍 [DEBUG] Fetching veterinarian by ID:', vetId);
      
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          id,
          specialties,
          experience,
          rating,
          review_count,
          clinic_id,
          created_at,
          updated_at,
          profiles!inner(*),
          clinics(*)
        `)
        .eq('id', vetId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ [WARN] Veterinarian not found:', vetId);
          return null; // Not found
        }
        console.error('❌ [ERROR] Error fetching veterinarian:', error);
        throw new Error(`Failed to fetch veterinarian: ${error.message}`);
      }

      const dbData = data as any;
      console.log('📦 [DEBUG] Raw veterinarian data from DB:', {
        id: dbData?.id,
        specialties: dbData?.specialties,
        experience: dbData?.experience,
        clinic_id: dbData?.clinic_id,
      });

      const mappedVet = this.mapToVeterinarian(data as any);
      
      console.log('✅ [DEBUG] Mapped veterinarian data:', {
        id: mappedVet?.id,
        name: mappedVet?.name,
        specialties: mappedVet?.specialties,
        experience: mappedVet?.experience,
      });

      return mappedVet;
    } catch (error) {
      console.error('❌ [ERROR] Error in getVeterinarianById:', error);
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

  // Get veterinarians by specialty (supports quick filter keys)
  async getVeterinariansBySpecialty(specialty: string): Promise<Veterinarian[]> {
    try {
      // Get mapped specialty names for the quick filter key
      const specialtyNames = getSpecialtyNamesForQuickFilter(specialty);
      
      // If we have mapped specialties, use OR query with .cs. operator
      if (specialtyNames.length > 0 && specialtyNames[0] !== specialty) {
        // Build OR condition for all mapped specialties
        const orConditions = specialtyNames
          .map(s => `specialties.cs.{${s}}`)
          .join(',');
        
        const { data, error } = await supabase
          .from('veterinarians')
          .select(`
            *,
            profiles!inner(*)
          `)
          .or(orConditions)
          .order('rating', { ascending: false });

        if (error) {
          console.error('Error fetching veterinarians by specialty:', error);
          // Fallback to client-side filtering
          return this.getVeterinariansBySpecialtyClientSide(specialty);
        }

        const results = (data || []).map(row => this.mapToVeterinarian(row));
        
        // If we got results, return them
        if (results.length > 0) {
          console.log(`Found ${results.length} veterinarians for specialty "${specialty}" from Supabase`);
          return results;
        }
        
        // If no results from database query, try client-side filtering
        console.log(`No results from database query for "${specialty}", trying client-side filtering`);
        return this.getVeterinariansBySpecialtyClientSide(specialty);
      }
      
      // Fallback: try exact match first
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
        return this.getVeterinariansBySpecialtyClientSide(specialty);
      }

      const results = (data || []).map(row => this.mapToVeterinarian(row));
      
      // If we got results, return them
      if (results.length > 0) {
        console.log(`Found ${results.length} veterinarians for specialty "${specialty}" from Supabase`);
        return results;
      }
      
      // Fallback to client-side filtering for case-insensitive matching
      return this.getVeterinariansBySpecialtyClientSide(specialty);
    } catch (error) {
      console.error('Error in getVeterinariansBySpecialty:', error);
      // Fallback to client-side filtering on error
      return this.getVeterinariansBySpecialtyClientSide(specialty);
    }
  }

  // Client-side filtering for specialty (case-insensitive, partial matching)
  private async getVeterinariansBySpecialtyClientSide(quickFilterKey: string): Promise<Veterinarian[]> {
    try {
      // Get all veterinarians
      const allVets = await this.getAllVeterinarians();
      
      // Filter using specialty matching
      const filtered = allVets.filter(vet =>
        vet.specialties.some(specialty =>
          specialtyMatchesQuickFilter(specialty, quickFilterKey)
        )
      );
      
      console.log(`Found ${filtered.length} veterinarians for "${quickFilterKey}" using client-side filtering`);
      return filtered;
    } catch (error) {
      console.error('Error in getVeterinariansBySpecialtyClientSide:', error);
      return [];
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

  // Get top-rated veterinarians with optional quality filters
  async getTopRatedVeterinarians(
    limit: number = 5,
    minRating?: number,
    minReviews?: number
  ): Promise<Veterinarian[]> {
    try {
      let query = supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*)
        `);

      // Apply quality filters if provided
      if (minRating !== undefined && minRating > 0) {
        query = query.gte('rating', minRating);
        console.log(`Filtering top-rated vets with minimum rating: ${minRating}`);
      }

      if (minReviews !== undefined && minReviews > 0) {
        query = query.gte('review_count', minReviews);
        console.log(`Filtering top-rated vets with minimum reviews: ${minReviews}`);
      }

      // Order by rating (descending) and limit results
      const { data, error } = await query
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top-rated veterinarians:', error);
        throw new Error(`Failed to fetch top-rated veterinarians: ${error.message}`);
      }

      const results = (data || []).map(row => this.mapToVeterinarian(row));
      console.log(`Found ${results.length} top-rated veterinarians from Supabase (rating >= ${minRating || 0}, reviews >= ${minReviews || 0})`);
      
      return results;
    } catch (error) {
      console.error('Error in getTopRatedVeterinarians:', error);
      throw error;
    }
  }

  // Search veterinarians by name, specialty, or clinic
  async searchVeterinarians(query: string): Promise<Veterinarian[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const searchQuery = query.trim().toLowerCase();
      
      // First, let's get all veterinarians and filter client-side for now
      // This is more reliable than complex Supabase queries
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*),
          clinics(*)
        `)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error searching veterinarians:', error);
        throw new Error(`Failed to search veterinarians: ${error.message}`);
      }

      const allVeterinarians = (data || []).map(row => this.mapToVeterinarian(row));
      
      // Client-side filtering for search
      const filteredVeterinarians = allVeterinarians.filter(vet => {
        // Search by name (case-insensitive)
        const nameMatch = vet.name.toLowerCase().includes(searchQuery);
        
        // Search by specialty (case-insensitive)
        const specialtyMatch = vet.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchQuery)
        );
        
        return nameMatch || specialtyMatch;
      });

      return filteredVeterinarians;
    } catch (error) {
      console.error('Error in searchVeterinarians:', error);
      throw error;
    }
  }

  // Advanced search with filters
  async advancedSearchVeterinarians(filters: {
    query?: string;
    specialty?: string;
    location?: { lat: number; lng: number; radius: number };
    rating?: number;
    experience?: number;
  }): Promise<Veterinarian[]> {
    try {
      let supabaseQuery = supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*),
          clinics(*)
        `);

      // Apply database-level filters that are safe
      if (filters.rating) {
        supabaseQuery = supabaseQuery.gte('rating', filters.rating);
      }

      if (filters.experience) {
        supabaseQuery = supabaseQuery.gte('experience', filters.experience);
      }

      const { data, error } = await supabaseQuery.order('rating', { ascending: false });

      if (error) {
        console.error('Error in advanced search:', error);
        throw new Error(`Failed to search veterinarians: ${error.message}`);
      }

      let results = (data || []).map(row => this.mapToVeterinarian(row));

      // Apply client-side filters for complex searches
      if (filters.query?.trim()) {
        const searchQuery = filters.query.trim().toLowerCase();
        results = results.filter(vet => {
          const nameMatch = vet.name.toLowerCase().includes(searchQuery);
          const specialtyMatch = vet.specialties.some(specialty => 
            specialty.toLowerCase().includes(searchQuery)
          );
          return nameMatch || specialtyMatch;
        });
      }

      if (filters.specialty) {
        results = results.filter(vet => 
          vet.specialties.includes(filters.specialty!)
        );
      }

      // Client-side location filtering (since PostGIS might not be available)
      if (filters.location) {
        results = results.filter(() => {
          // This would require clinic location data
          // For now, we'll skip location filtering in Supabase and do it client-side
          return true;
        });
      }

      return results;
    } catch (error) {
      console.error('Error in advancedSearchVeterinarians:', error);
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
      console.log('🔧 [DEBUG] updateVeterinarianProfile called:', {
        vetId,
        vetData,
      });

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

      console.log('🔧 [DEBUG] Update data prepared:', updateData);

      const { data, error } = await supabase
        .from('veterinarians')
        .update(updateData)
        .eq('id', vetId)
        .select();

      if (error) {
        console.error('❌ [ERROR] Error updating veterinarian profile:', error);
        throw new Error(`Failed to update veterinarian profile: ${error.message}`);
      }

      console.log('✅ [SUCCESS] Veterinarian profile updated:', data);
    } catch (error) {
      console.error('❌ [ERROR] Error in updateVeterinarianProfile:', error);
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

  // Upload veterinarian profile image to Supabase Storage and update profiles.photo_url
  async uploadVetPhoto(vetId: string, photoUri: string): Promise<string> {
    try {
      const fileExtension = photoUri.split('.').pop() || 'jpg';
      const fileName = `vet-${vetId}-${Date.now()}.${fileExtension}`;
      const filePath = fileName;

      const response = await fetch(photoUri);
      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Image file is empty or corrupted');
      }

      const bucket = (Constants.expoConfig?.extra as any)?.SUPABASE_STORAGE_BUCKET || 'vet-connect-media';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExtension}`,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload photo: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Update profiles.photo_url with the public URL (profile id equals vet id)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...( { photo_url: publicUrl } as any ),
          updated_at: new Date().toISOString(),
        })
        .eq('id', vetId);

      if (updateError) {
        // Cleanup uploaded file if DB update fails
        await supabase.storage.from(bucket).remove([filePath]);
        throw new Error(`Failed to update veterinarian image: ${updateError.message}`);
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading vet photo:', error);
      throw error;
    }
  }

  // Open image picker and upload selected image for veterinarian
  async selectAndUploadVetPhoto(
    vetId: string,
    callbacks?: { onImageSelected?: () => void }
  ): Promise<string | null> {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      throw new Error('Permission to access camera roll is required!');
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      callbacks?.onImageSelected?.();
      const photoUrl = await this.uploadVetPhoto(vetId, result.assets[0].uri);
      return photoUrl;
    }

    return null;
  }
}

export const supabaseVetService = new SupabaseVetService();