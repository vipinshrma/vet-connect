import { supabase } from '../config/supabase';
import { Clinic, DatabaseHours, OpeningHours } from '../types';
import { Database } from './supabaseTypes';
import { supabaseVetService } from './supabaseVetService';

type ClinicRow = Database['public']['Tables']['clinics']['Row'];
type ClinicInsert = Database['public']['Tables']['clinics']['Insert'];
type ClinicUpdate = Database['public']['Tables']['clinics']['Update'];

export class SupabaseClinicService {
  // Convert database hours to app format
  private convertDatabaseToAppHours(dbHours: any): OpeningHours {
    const defaultHours: OpeningHours = {
      monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      friday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
      sunday: { isOpen: false, openTime: '09:00', closeTime: '16:00' },
    };

    if (!dbHours) return defaultHours;

    const convertedHours: OpeningHours = {} as OpeningHours;
    const days: (keyof OpeningHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
      const dayData = dbHours[day];
      if (dayData && typeof dayData === 'object' && dayData.hasOwnProperty('is_open')) {
        convertedHours[day] = {
          isOpen: Boolean(dayData.is_open),
          openTime: dayData.open_time || defaultHours[day].openTime,
          closeTime: dayData.close_time || defaultHours[day].closeTime,
        };
      } else {
        convertedHours[day] = defaultHours[day];
      }
    });

    return convertedHours;
  }

  // Convert app hours to database format
  private convertAppToDatabaseHours(appHours: OpeningHours): DatabaseHours {
    const dbHours: DatabaseHours = {} as DatabaseHours;
    const days: (keyof OpeningHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
      dbHours[day] = {
        is_open: appHours[day].isOpen,
        open_time: appHours[day].openTime,
        close_time: appHours[day].closeTime,
      };
    });

    return dbHours;
  }

  // Convert database row to app Clinic type
  private mapToClinic(row: ClinicRow): Clinic {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      phone: row.phone,
      email: row.email || undefined,
      website: row.website || undefined,
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude,
      },
      services: row.services || [],
      hours: this.convertDatabaseToAppHours((row as any).hours || (row as any).opening_hours),
      photos: row.photos || [],
      rating: row.rating,
      reviewCount: row.review_count,
      description: (row as any).description || undefined,
      emergencyContact: (row as any).emergency_contact || undefined,
      licenseNumber: (row as any).license_number || undefined,
      insuranceAccepted: (row as any).insurance_accepted || [],
      paymentMethods: (row as any).payment_methods || ['cash', 'credit-card', 'debit-card'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Get all clinics
  async getAllClinics(): Promise<Clinic[]> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching clinics:', error);
        throw new Error(`Failed to fetch clinics: ${error.message}`);
      }

      return data.map(row => this.mapToClinic(row));
    } catch (error) {
      console.error('Error in getAllClinics:', error);
      throw error;
    }
  }

  // Get clinic by ID
  async getClinicById(clinicId: string): Promise<Clinic | null> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching clinic:', error);
        throw new Error(`Failed to fetch clinic: ${error.message}`);
      }

      return this.mapToClinic(data);
    } catch (error) {
      console.error('Error in getClinicById:', error);
      throw error;
    }
  }

  // Get clinic with computed specialities from associated veterinarians
  async getClinicWithSpecialities(clinicId: string): Promise<(Clinic & { specialities: string[] }) | null> {
    try {
      const clinic = await this.getClinicById(clinicId);
      if (!clinic) return null;

      // Get all veterinarians associated with this clinic
      const vets = await supabaseVetService.getVeterinariansByClinic(clinicId);
      
      // Aggregate all unique specialties from clinic's veterinarians
      const specialitiesSet = new Set<string>();
      vets.forEach(vet => {
        vet.specialties.forEach(specialty => {
          specialitiesSet.add(specialty);
        });
      });

      const specialities = Array.from(specialitiesSet).sort();

      return {
        ...clinic,
        specialities
      };
    } catch (error) {
      console.error('Error in getClinicWithSpecialities:', error);
      throw error;
    }
  }

  // Get clinics by service
  async getClinicsByService(service: string): Promise<Clinic[]> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .contains('services', [service])
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching clinics by service:', error);
        throw new Error(`Failed to fetch clinics by service: ${error.message}`);
      }

      return data.map(row => this.mapToClinic(row));
    } catch (error) {
      console.error('Error in getClinicsByService:', error);
      throw error;
    }
  }

  // Get emergency clinics
  async getEmergencyClinics(): Promise<Clinic[]> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .or('services.cs.{"Emergency Care"}, services.cs.{"24/7 Emergency Care"}, services.cs.{"Urgent Care"}')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching emergency clinics:', error);
        throw new Error(`Failed to fetch emergency clinics: ${error.message}`);
      }

      return data.map(row => this.mapToClinic(row));
    } catch (error) {
      console.error('Error in getEmergencyClinics:', error);
      throw error;
    }
  }

  // Get clinics near coordinates
  async getClinicsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 25
  ): Promise<Clinic[]> {
    try {
      // Use Supabase's PostGIS functions for location queries
      // For now, we'll use a simple bounding box approach
      const latDelta = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching nearby clinics:', error);
        throw new Error(`Failed to fetch nearby clinics: ${error.message}`);
      }

      return data.map(row => this.mapToClinic(row));
    } catch (error) {
      console.error('Error in getClinicsNearLocation:', error);
      throw error;
    }
  }

  // Search clinics
  async searchClinics(query: string): Promise<Clinic[]> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .or(`name.ilike.%${query}%, address.ilike.%${query}%, city.ilike.%${query}%`)
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error searching clinics:', error);
        throw new Error(`Failed to search clinics: ${error.message}`);
      }

      return data.map(row => this.mapToClinic(row));
    } catch (error) {
      console.error('Error in searchClinics:', error);
      throw error;
    }
  }

  // Create clinic (admin function)
  async createClinic(clinicData: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>): Promise<Clinic> {
    try {
      const insertData: ClinicInsert = {
        name: clinicData.name,
        address: clinicData.address,
        city: clinicData.city,
        state: clinicData.state,
        zip_code: clinicData.zip_code,
        phone: clinicData.phone,
        email: clinicData.email || null,
        website: clinicData.website || null,
        latitude: clinicData.coordinates.latitude,
        longitude: clinicData.coordinates.longitude,
        services: clinicData.services,
        photos: clinicData.photos,
        rating: clinicData.rating,
        review_count: clinicData.reviewCount,
      };

      const { data, error } = await supabase
        .from('clinics')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating clinic:', error);
        throw new Error(`Failed to create clinic: ${error.message}`);
      }

      return this.mapToClinic(data);
    } catch (error) {
      console.error('Error in createClinic:', error);
      throw error;
    }
  }

  // Update clinic rating (called after new review)
  async updateClinicRating(clinicId: string, newRating: number, reviewCount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          rating: newRating,
          review_count: reviewCount,
        })
        .eq('id', clinicId);

      if (error) {
        console.error('Error updating clinic rating:', error);
        throw new Error(`Failed to update clinic rating: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateClinicRating:', error);
      throw error;
    }
  }

  // Get veterinarian's associated clinic
  async getVeterinarianClinic(veterinarianId: string): Promise<Clinic | null> {
    try {
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          clinic_id,
          clinics(*)
        `)
        .eq('id', veterinarianId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Veterinarian not found
        }
        console.error('Error fetching veterinarian clinic:', error);
        throw new Error(`Failed to fetch veterinarian clinic: ${error.message}`);
      }

      if (!data.clinic_id || !data.clinics) {
        return null; // No clinic associated
      }

      // Handle case where clinics might be an array or single object
      const clinicData = Array.isArray(data.clinics) ? data.clinics[0] : data.clinics;
      return this.mapToClinic(clinicData as ClinicRow);
    } catch (error) {
      console.error('Error in getVeterinarianClinic:', error);
      throw error;
    }
  }

  // Get clinic management permissions for a veterinarian
  async getClinicPermissions(veterinarianId: string, clinicId: string): Promise<{
    canManage: boolean;
    role: string;
    permissions: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('clinic_managers')
        .select('role, permissions')
        .eq('veterinarian_id', veterinarianId)
        .eq('clinic_id', clinicId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { canManage: false, role: 'none', permissions: {} };
        }
        console.error('Error fetching clinic permissions:', error);
        throw new Error(`Failed to fetch clinic permissions: ${error.message}`);
      }

      return {
        canManage: true,
        role: data.role,
        permissions: data.permissions || {}
      };
    } catch (error) {
      console.error('Error in getClinicPermissions:', error);
      // Return false permissions on error for safety
      return { canManage: false, role: 'none', permissions: {} };
    }
  }

  // Update clinic information
  async updateClinic(clinicId: string, updateData: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    emergencyContact?: string;
    licenseNumber?: string;
    services?: string[];
    insuranceAccepted?: string[];
    paymentMethods?: string[];
    hours?: OpeningHours;
  }): Promise<void> {
    try {
      const updatePayload: any = {};

      // Map camelCase to snake_case for database
      if (updateData.name !== undefined) updatePayload.name = updateData.name;
      if (updateData.address !== undefined) updatePayload.address = updateData.address;
      if (updateData.city !== undefined) updatePayload.city = updateData.city;
      if (updateData.state !== undefined) updatePayload.state = updateData.state;
      if (updateData.zip_code !== undefined) updatePayload.zip_code = updateData.zip_code;
      if (updateData.phone !== undefined) updatePayload.phone = updateData.phone;
      if (updateData.email !== undefined) updatePayload.email = updateData.email;
      if (updateData.website !== undefined) updatePayload.website = updateData.website;
      if (updateData.description !== undefined) updatePayload.description = updateData.description;
      if (updateData.emergencyContact !== undefined) updatePayload.emergency_contact = updateData.emergencyContact;
      if (updateData.licenseNumber !== undefined) updatePayload.license_number = updateData.licenseNumber;
      if (updateData.services !== undefined) updatePayload.services = updateData.services;
      if (updateData.insuranceAccepted !== undefined) updatePayload.insurance_accepted = updateData.insuranceAccepted;
      if (updateData.paymentMethods !== undefined) updatePayload.payment_methods = updateData.paymentMethods;
      if (updateData.hours !== undefined) {
        updatePayload.hours = this.convertAppToDatabaseHours(updateData.hours);
      }

      updatePayload.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('clinics')
        .update(updatePayload)
        .eq('id', clinicId);

      if (error) {
        console.error('Error updating clinic:', error);
        throw new Error(`Failed to update clinic: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateClinic:', error);
      throw error;
    }
  }

  // Create clinic management relationship
  async addClinicManager(clinicId: string, veterinarianId: string, role: 'owner' | 'manager' | 'editor' = 'manager'): Promise<void> {
    try {
      const permissions = {
        edit_profile: true,
        edit_hours: true,
        edit_services: true,
        manage_staff: role === 'owner'
      };

      const { error } = await supabase
        .from('clinic_managers')
        .insert({
          clinic_id: clinicId,
          veterinarian_id: veterinarianId,
          role,
          permissions
        });

      if (error) {
        console.error('Error adding clinic manager:', error);
        throw new Error(`Failed to add clinic manager: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in addClinicManager:', error);
      throw error;
    }
  }

  // Get all managers for a clinic
  async getClinicManagers(clinicId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('clinic_managers')
        .select(`
          *,
          profiles:veterinarians!clinic_managers_veterinarian_id_fkey(
            id,
            profiles!inner(name, email, phone)
          )
        `)
        .eq('clinic_id', clinicId)
        .order('role', { ascending: true });

      if (error) {
        console.error('Error fetching clinic managers:', error);
        throw new Error(`Failed to fetch clinic managers: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClinicManagers:', error);
      throw error;
    }
  }
}

export const supabaseClinicService = new SupabaseClinicService();