// Export all mock data and helper functions
export * from './mockClinics';
export * from './mockVeterinarians';
export * from './mockReviews';
export * from './mockPets';

// Re-export types for convenience
export type { Clinic, Veterinarian, Review, TimeSlot, OpeningHours, DaySchedule } from '../types';

// Combined data helpers
import { mockClinics, getClinicById } from './mockClinics';
import { mockVeterinarians, getVeterinarianById, getVeterinariansByClinic } from './mockVeterinarians';
import { mockReviews, getReviewsByVeterinarian, getReviewsByClinic } from './mockReviews';
import { mockPets, getPetById, getPetsByOwner } from './mockPets';

/**
 * Get complete veterinarian data with clinic and reviews
 */
export const getCompleteVetData = (veterinarianId: string) => {
  const veterinarian = getVeterinarianById(veterinarianId);
  if (!veterinarian) return null;

  const clinic = getClinicById(veterinarian.clinicId);
  const reviews = getReviewsByVeterinarian(veterinarianId);

  return {
    veterinarian,
    clinic,
    reviews,
    reviewCount: reviews.length,
    averageRating: reviews.length > 0 
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0
  };
};

/**
 * Get complete clinic data with veterinarians and reviews
 */
export const getCompleteClinicData = (clinicId: string) => {
  const clinic = getClinicById(clinicId);
  if (!clinic) return null;

  const veterinarians = getVeterinariansByClinic(clinicId);
  const reviews = getReviewsByClinic(clinicId);

  return {
    clinic,
    veterinarians,
    reviews,
    reviewCount: reviews.length,
    averageRating: reviews.length > 0 
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0
  };
};

/**
 * Search data across all entities
 */
export const searchData = (query: string) => {
  const lowerQuery = query.toLowerCase();

  const matchingVets = mockVeterinarians.filter(vet =>
    vet.name.toLowerCase().includes(lowerQuery) ||
    vet.specialties.some(specialty => specialty.toLowerCase().includes(lowerQuery))
  );

  const matchingClinics = mockClinics.filter(clinic =>
    clinic.name.toLowerCase().includes(lowerQuery) ||
    clinic.services.some(service => service.toLowerCase().includes(lowerQuery)) ||
    clinic.city.toLowerCase().includes(lowerQuery) ||
    clinic.address.toLowerCase().includes(lowerQuery)
  );

  return {
    veterinarians: matchingVets,
    clinics: matchingClinics,
    totalResults: matchingVets.length + matchingClinics.length
  };
};

/**
 * Get popular services across all clinics
 */
export const getPopularServices = () => {
  const serviceCount = new Map<string, number>();

  mockClinics.forEach(clinic => {
    clinic.services.forEach(service => {
      serviceCount.set(service, (serviceCount.get(service) || 0) + 1);
    });
  });

  return Array.from(serviceCount.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([service, count]) => ({ service, count }));
};

/**
 * Get popular specialties across all veterinarians
 */
export const getPopularSpecialties = () => {
  const specialtyCount = new Map<string, number>();

  mockVeterinarians.forEach(vet => {
    vet.specialties.forEach(specialty => {
      specialtyCount.set(specialty, (specialtyCount.get(specialty) || 0) + 1);
    });
  });

  return Array.from(specialtyCount.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([specialty, count]) => ({ specialty, count }));
};

// Data validation helpers
export const validateMockData = () => {
  const errors: string[] = [];

  // Check that all veterinarians have valid clinic IDs
  mockVeterinarians.forEach(vet => {
    if (!getClinicById(vet.clinicId)) {
      errors.push(`Veterinarian ${vet.name} (${vet.id}) has invalid clinic ID: ${vet.clinicId}`);
    }
  });

  // Check that all reviews have valid vet and clinic IDs
  mockReviews.forEach(review => {
    if (!getVeterinarianById(review.veterinarianId)) {
      errors.push(`Review ${review.id} has invalid veterinarian ID: ${review.veterinarianId}`);
    }
    if (!getClinicById(review.clinicId)) {
      errors.push(`Review ${review.id} has invalid clinic ID: ${review.clinicId}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};