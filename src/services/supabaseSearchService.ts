import { supabase } from '../config/supabase';
import { Veterinarian } from '../types';
import { supabaseVetService } from './supabaseVetService';

export interface SearchFilters {
  query?: string;
  specialties?: string[];
  minRating?: number;
  maxDistance?: number;
  minExperience?: number;
  availableToday?: boolean;
  emergencyOnly?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface SearchResult {
  veterinarians: Veterinarian[];
  totalCount: number;
  hasMore: boolean;
}

export class SupabaseSearchService {
  
  // Main search function with comprehensive filtering
  async searchVeterinarians(
    filters: SearchFilters, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<SearchResult> {
    try {
      console.log('Executing advanced search with filters:', filters);

      let query = supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(*),
          clinics(*)
        `, { count: 'exact' });

      // Apply simple database filters first
      if (filters.minRating && filters.minRating > 0) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.minExperience && filters.minExperience > 0) {
        query = query.gte('experience', filters.minExperience);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Order by rating (best first)
      query = query.order('rating', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error in advanced search:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      let veterinarians = (data || []).map(row => {
        // Map the row to Veterinarian type (similar to the private method in supabaseVetService)
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
          availableSlots: [], // Generate time slots if needed
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } as Veterinarian;
      });
      
      // Apply client-side filters for complex searches
      
      // Text search (name or specialty)
      if (filters.query?.trim()) {
        const searchTerm = filters.query.trim().toLowerCase();
        veterinarians = veterinarians.filter(vet => {
          const nameMatch = vet.name.toLowerCase().includes(searchTerm);
          const specialtyMatch = vet.specialties.some(specialty => 
            specialty.toLowerCase().includes(searchTerm)
          );
          return nameMatch || specialtyMatch;
        });
      }

      // Specialty filters (multiple specialties)
      if (filters.specialties && filters.specialties.length > 0) {
        veterinarians = veterinarians.filter(vet =>
          filters.specialties!.some(specialty => vet.specialties.includes(specialty))
        );
      }

      // Emergency specialties filter
      if (filters.emergencyOnly) {
        const emergencySpecialties = ['Emergency Medicine', 'Critical Care', 'Trauma Surgery', 'Urgent Care'];
        veterinarians = veterinarians.filter(vet =>
          vet.specialties.some(specialty => emergencySpecialties.includes(specialty))
        );
      }
      
      // Apply location and other filters
      let filteredVeterinarians = veterinarians;

      // Distance filtering (client-side since we don't have PostGIS)
      if (filters.location && filters.maxDistance) {
        filteredVeterinarians = filteredVeterinarians.filter(vet => {
          // This would require clinic location data
          // For now, we'll include all results
          return true;
        });
      }

      return {
        veterinarians: filteredVeterinarians,
        totalCount: count || 0,
        hasMore: (count || 0) > offset + limit
      };

    } catch (error) {
      console.error('Error in searchVeterinarians:', error);
      throw error;
    }
  }

  // Search suggestions based on partial input
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      if (!query.trim() || query.length < 2) {
        return [];
      }

      const searchTerm = query.trim().toLowerCase();

      // Get all veterinarians and filter client-side for suggestions
      const { data: nameData, error: nameError } = await supabase
        .from('veterinarians')
        .select('profiles!inner(name)')
        .limit(20);

      if (nameError) {
        console.error('Error fetching name suggestions:', nameError);
      }

      // Get specialties from all vets (this could be optimized with a dedicated specialties table)
      const { data: specialtyData, error: specialtyError } = await supabase
        .from('veterinarians')
        .select('specialties')
        .not('specialties', 'is', null);

      if (specialtyError) {
        console.error('Error fetching specialty suggestions:', specialtyError);
      }

      const suggestions: string[] = [];

      // Add name suggestions (filtered client-side)
      if (nameData) {
        nameData.forEach(item => {
          if (item.profiles?.name && item.profiles.name.toLowerCase().includes(searchTerm)) {
            suggestions.push(item.profiles.name);
          }
        });
      }

      // Add specialty suggestions
      if (specialtyData) {
        const allSpecialties = new Set<string>();
        specialtyData.forEach(item => {
          if (item.specialties) {
            item.specialties.forEach((specialty: string) => {
              if (specialty.toLowerCase().includes(searchTerm)) {
                allSpecialties.add(specialty);
              }
            });
          }
        });
        suggestions.push(...Array.from(allSpecialties).slice(0, 3));
      }

      return suggestions.slice(0, 8); // Limit to 8 suggestions total

    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      return [];
    }
  }

  // Get popular search terms (based on common specialties)
  async getPopularSearches(): Promise<string[]> {
    try {
      // For now, return static popular searches
      // In a real app, you might track search analytics
      return [
        'Emergency Medicine',
        'General Practice', 
        'Surgery',
        'Cardiology',
        'Dermatology',
        'Dental Care',
        'Orthopedics',
        'Ophthalmology'
      ];
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      return [];
    }
  }

  // Search veterinarians by location (requires clinic data with coordinates)
  async searchByLocation(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 25
  ): Promise<Veterinarian[]> {
    try {
      // This would require proper geospatial queries with PostGIS
      // For now, return all veterinarians and filter client-side
      const allVets = await supabaseVetService.getAllVeterinarians();
      
      // In a real implementation, you would:
      // 1. Add lat/lng columns to clinics table
      // 2. Use PostGIS ST_DWithin function
      // 3. Calculate actual distances
      
      return allVets;
    } catch (error) {
      console.error('Error in location search:', error);
      throw error;
    }
  }

  // Search with sorting options
  async searchWithSort(
    filters: SearchFilters,
    sortBy: 'rating' | 'experience' | 'distance' | 'name' = 'rating',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<Veterinarian[]> {
    try {
      const result = await this.searchVeterinarians(filters, 50, 0);
      let veterinarians = result.veterinarians;

      // Apply sorting
      switch (sortBy) {
        case 'rating':
          veterinarians.sort((a, b) => sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating);
          break;
        case 'experience':
          veterinarians.sort((a, b) => sortOrder === 'desc' ? b.experience - a.experience : a.experience - b.experience);
          break;
        case 'name':
          veterinarians.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (sortOrder === 'desc') {
              return nameB.localeCompare(nameA);
            }
            return nameA.localeCompare(nameB);
          });
          break;
        case 'distance':
          // Distance sorting would require location data
          break;
      }

      return veterinarians;
    } catch (error) {
      console.error('Error in sorted search:', error);
      throw error;
    }
  }
}

export const supabaseSearchService = new SupabaseSearchService();