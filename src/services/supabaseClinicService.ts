import { supabase } from '../config/supabase';
import { Clinic } from '../types';
import { Database } from './supabaseTypes';

type ClinicRow = Database['public']['Tables']['clinics']['Row'];
type ClinicInsert = Database['public']['Tables']['clinics']['Insert'];
type ClinicUpdate = Database['public']['Tables']['clinics']['Update'];

export class SupabaseClinicService {
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
      openingHours: {
        monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        friday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
        sunday: { isOpen: false },
      }, // Note: We'll need to add opening_hours to the database schema later
      photos: row.photos || [],
      rating: row.rating,
      reviewCount: row.review_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
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

      return data.map(this.mapToClinic);
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

      return data.map(this.mapToClinic);
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

      return data.map(this.mapToClinic);
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

      return data.map(this.mapToClinic);
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

      return data.map(this.mapToClinic);
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
        zip_code: clinicData.zipCode,
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
}

export const supabaseClinicService = new SupabaseClinicService();