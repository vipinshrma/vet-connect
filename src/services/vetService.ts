import { Veterinarian, Clinic, SearchFilters, SearchResult, LocationCoordinates } from '../types';
import { 
  mockVeterinarians, 
  mockClinics, 
  getVeterinarianById, 
  getClinicById,
  getVeterinariansBySpecialty,
  getEmergencyVeterinarians,
  getTopRatedVeterinarians,
  getAvailableVeterinarians
} from '../data';
import { locationService } from './locationService';

export interface NearbyVetParams {
  latitude: number;
  longitude: number;
  radius?: number;
  specialties?: string[];
  services?: string[];
  rating?: number;
  openNow?: boolean;
  emergencyOnly?: boolean;
}

class VetService {
  /**
   * Get nearby veterinarians with enhanced filtering
   */
  async getNearbyVets(params: NearbyVetParams): Promise<Array<Veterinarian & { distance: number; clinic: Clinic }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const { latitude, longitude, radius = 25, specialties, services, rating, openNow, emergencyOnly } = params;
    const userLocation: LocationCoordinates = { latitude, longitude };

    let filteredVets = mockVeterinarians;

    // Filter by emergency only
    if (emergencyOnly) {
      filteredVets = getEmergencyVeterinarians();
    }

    // Filter by specialties
    if (specialties && specialties.length > 0) {
      filteredVets = filteredVets.filter(vet =>
        specialties.some(specialty =>
          vet.specialties.some(vetSpecialty =>
            vetSpecialty.toLowerCase().includes(specialty.toLowerCase())
          )
        )
      );
    }

    // Filter by rating
    if (rating) {
      filteredVets = filteredVets.filter(vet => vet.rating >= rating);
    }

    // Get vets with distance and clinic information
    const vetsWithDistance = locationService.filterVetsByProximity(
      userLocation,
      filteredVets,
      mockClinics,
      radius
    );

    // Filter by services
    if (services && services.length > 0) {
      return vetsWithDistance.filter(vet =>
        services.some(service =>
          vet.clinic.services.some(clinicService =>
            clinicService.toLowerCase().includes(service.toLowerCase())
          )
        )
      );
    }

    // Filter by open now
    if (openNow) {
      return locationService.filterOpenVets(vetsWithDistance);
    }

    return vetsWithDistance;
  }

  /**
   * Search veterinarians and clinics with advanced filtering
   */
  async searchVets(params: { 
    query: string; 
    filters: SearchFilters; 
    location: { latitude: number; longitude: number };
    page?: number;
    limit?: number;
  }): Promise<SearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const { query, filters, location, page = 1, limit = 20 } = params;
    const lowerQuery = query.toLowerCase();

    // Filter veterinarians by search query
    let matchingVets = mockVeterinarians.filter(vet =>
      vet.name.toLowerCase().includes(lowerQuery) ||
      vet.specialties.some(specialty => specialty.toLowerCase().includes(lowerQuery))
    );

    // Filter clinics by search query
    let matchingClinics = mockClinics.filter(clinic =>
      clinic.name.toLowerCase().includes(lowerQuery) ||
      clinic.services.some(service => service.toLowerCase().includes(lowerQuery)) ||
      clinic.city.toLowerCase().includes(lowerQuery)
    );

    // Apply filters to veterinarians
    if (filters.specialties.length > 0) {
      matchingVets = matchingVets.filter(vet =>
        filters.specialties.some(specialty =>
          vet.specialties.some(vetSpecialty =>
            vetSpecialty.toLowerCase().includes(specialty.toLowerCase())
          )
        )
      );
    }

    if (filters.services.length > 0) {
      const clinicsWithServices = mockClinics.filter(clinic =>
        filters.services.some(service =>
          clinic.services.some(clinicService =>
            clinicService.toLowerCase().includes(service.toLowerCase())
          )
        )
      );
      const clinicIds = new Set(clinicsWithServices.map(c => c.id));
      matchingVets = matchingVets.filter(vet => clinicIds.has(vet.clinicId));
      matchingClinics = matchingClinics.filter(clinic => clinicIds.has(clinic.id));
    }

    if (filters.rating > 0) {
      matchingVets = matchingVets.filter(vet => vet.rating >= filters.rating);
      matchingClinics = matchingClinics.filter(clinic => clinic.rating >= filters.rating);
    }

    // Filter by location and radius
    const userLocation: LocationCoordinates = location;
    const vetsWithDistance = locationService.filterVetsByProximity(
      userLocation,
      matchingVets,
      mockClinics,
      filters.radius
    );

    const clinicsWithDistance = locationService.filterByRadius(
      userLocation,
      matchingClinics,
      filters.radius
    );

    // Filter by availability and open status
    let finalVets = vetsWithDistance;
    if (filters.openNow) {
      finalVets = locationService.filterOpenVets(finalVets);
    }

    if (filters.availableToday) {
      finalVets = finalVets.filter(vet => 
        vet.availableSlots.some(slot => slot.isAvailable)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVets = finalVets.slice(startIndex, endIndex);
    const paginatedClinics = clinicsWithDistance.slice(startIndex, endIndex);

    return {
      veterinarians: paginatedVets.map(v => ({ ...v, distance: undefined }) as Veterinarian),
      clinics: paginatedClinics.map(c => ({ ...c, distance: undefined }) as Clinic),
      totalCount: finalVets.length + clinicsWithDistance.length,
      page,
      hasMore: endIndex < (finalVets.length + clinicsWithDistance.length),
    };
  }

  /**
   * Get detailed veterinarian information
   */
  async getVetDetails(vetId: string): Promise<Veterinarian | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return getVeterinarianById(vetId) || null;
  }

  /**
   * Get detailed clinic information
   */
  async getClinicDetails(clinicId: string): Promise<Clinic | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return getClinicById(clinicId) || null;
  }

  /**
   * Get emergency veterinarians within specified radius
   */
  async getEmergencyVets(location: LocationCoordinates, radius: number = 15): Promise<Array<Veterinarian & { distance: number; clinic: Clinic }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return locationService.getEmergencyVets(location, mockVeterinarians, mockClinics);
  }

  /**
   * Get veterinarians available for walk-in appointments
   */
  async getWalkInVets(location: LocationCoordinates): Promise<Array<Veterinarian & { distance: number; clinic: Clinic }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const walkableVets = locationService.getWalkableVets(location, mockVeterinarians, mockClinics);
    return locationService.filterOpenVets(walkableVets);
  }

  /**
   * Get top-rated veterinarians
   */
  async getTopRatedVets(limit: number = 10): Promise<Veterinarian[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return getTopRatedVeterinarians(limit);
  }

  /**
   * Get veterinarians by specialty
   */
  async getVetsBySpecialty(specialty: string, location?: LocationCoordinates, radius: number = 50): Promise<Array<Veterinarian & { distance?: number; clinic?: Clinic }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const specialtyVets = getVeterinariansBySpecialty(specialty);
    
    if (location) {
      return locationService.filterVetsByProximity(location, specialtyVets, mockClinics, radius);
    }
    
    return specialtyVets.map(vet => ({
      ...vet,
      clinic: getClinicById(vet.clinicId)!
    }));
  }

  /**
   * Get available time slots for a veterinarian
   */
  async getAvailableSlots(vetId: string, date: Date): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const vet = getVeterinarianById(vetId);
    if (!vet) return [];

    // Filter slots based on date and availability
    // In a real app, this would check actual availability for the specific date
    return vet.availableSlots.filter(slot => slot.isAvailable);
  }

  /**
   * Check if veterinarian is currently available
   */
  async checkVetAvailability(vetId: string): Promise<{ isAvailable: boolean; nextAvailable?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const vet = getVeterinarianById(vetId);
    if (!vet) return { isAvailable: false };

    const clinic = getClinicById(vet.clinicId);
    if (!clinic) return { isAvailable: false };

    const isOpen = locationService.isClinicOpen(clinic);
    const hasSlots = vet.availableSlots.some(slot => slot.isAvailable);

    return {
      isAvailable: isOpen && hasSlots,
      nextAvailable: isOpen ? undefined : 'Tomorrow 8:00 AM'
    };
  }

  /**
   * Get emergency clinics within specified radius
   */
  async getEmergencyClinics(location?: LocationCoordinates, radius: number = 25): Promise<Array<Clinic & { distance?: number }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Filter clinics that have emergency services
    const emergencyClinics = mockClinics.filter(clinic =>
      clinic.services.some(service =>
        service.toLowerCase().includes('emergency') ||
        service.toLowerCase().includes('24/7') ||
        service.toLowerCase().includes('24 hour')
      )
    );

    if (location) {
      // Calculate distance and filter by radius
      return emergencyClinics
        .map(clinic => ({
          ...clinic,
          distance: locationService.calculateDistance(
            location.latitude,
            location.longitude,
            clinic.latitude,
            clinic.longitude
          )
        }))
        .filter(clinic => clinic.distance! <= radius)
        .sort((a, b) => a.distance! - b.distance!);
    }

    return emergencyClinics;
  }
}

export const vetService = new VetService();