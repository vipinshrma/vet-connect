/**
 * Example usage of location services and vet data functionality
 * This file demonstrates how to use the enhanced location services and mock vet data
 */

import { locationService, LocationError } from '../services/locationService';
import { vetService } from '../services/vetService';
import { 
  mockVeterinarians, 
  mockClinics, 
  getEmergencyVeterinarians,
  getTopRatedVeterinarians,
  searchData 
} from '../data';
import { LocationCoordinates, SearchFilters } from '../types';

/**
 * Example 1: Get user location with error handling
 */
export const getUserLocationExample = async () => {
  try {
    console.log('📍 Getting user location...');
    
    const userLocation = await locationService.getCurrentLocation({
      useCache: true,
      timeout: 10000
    });
    
    console.log('✅ Location obtained:', {
      latitude: userLocation.coordinates.latitude,
      longitude: userLocation.coordinates.longitude,
      address: userLocation.address,
      city: userLocation.city,
      state: userLocation.state
    });
    
    return userLocation;
  } catch (error: any) {
    console.error('❌ Location error:', error.message);
    
    if (error.code === LocationError.PERMISSION_DENIED) {
      console.log('💡 User needs to enable location permissions');
    } else if (error.code === LocationError.TIMEOUT) {
      console.log('💡 Location request timed out - try again');
    }
    
    throw error;
  }
};

/**
 * Example 2: Find nearby veterinarians
 */
export const findNearbyVetsExample = async () => {
  try {
    // San Francisco coordinates for demo
    const userLocation: LocationCoordinates = {
      latitude: 37.7749,
      longitude: -122.4194
    };
    
    console.log('🔍 Finding nearby veterinarians...');
    
    const nearbyVets = await vetService.getNearbyVets({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: 10, // 10km radius
      rating: 4.0, // Minimum 4-star rating
      openNow: true // Only open clinics
    });
    
    console.log(`✅ Found ${nearbyVets.length} nearby veterinarians:`);
    
    nearbyVets.slice(0, 3).forEach((vet, index) => {
      console.log(`${index + 1}. ${vet.name}`);
      console.log(`   📍 ${locationService.formatDistance(vet.distance)} away`);
      console.log(`   ⭐ ${vet.rating}/5 (${vet.reviewCount} reviews)`);
      console.log(`   🏥 ${vet.clinic.name}`);
      console.log(`   📞 ${vet.clinic.phone}`);
      console.log(`   🩺 ${vet.specialties.slice(0, 2).join(', ')}`);
      console.log('');
    });
    
    return nearbyVets;
  } catch (error) {
    console.error('❌ Error finding nearby vets:', error);
    throw error;
  }
};

/**
 * Example 3: Emergency vet search
 */
export const findEmergencyVetsExample = async () => {
  try {
    const userLocation: LocationCoordinates = {
      latitude: 37.7749,
      longitude: -122.4194
    };
    
    console.log('🚨 Finding emergency veterinarians...');
    
    const emergencyVets = await vetService.getEmergencyVets(userLocation, 20);
    
    console.log(`✅ Found ${emergencyVets.length} emergency veterinarians:`);
    
    emergencyVets.forEach((vet, index) => {
      console.log(`${index + 1}. ${vet.name} - ${vet.clinic.name}`);
      console.log(`   📍 ${locationService.formatDistance(vet.distance)} away`);
      console.log(`   🚨 ${vet.specialties.filter(s => s.toLowerCase().includes('emergency')).join(', ')}`);
      console.log(`   📞 ${vet.clinic.phone}`);
      console.log('');
    });
    
    return emergencyVets;
  } catch (error) {
    console.error('❌ Error finding emergency vets:', error);
    throw error;
  }
};

/**
 * Example 4: Advanced search with filters
 */
export const advancedSearchExample = async () => {
  try {
    const userLocation = {
      latitude: 37.7749,
      longitude: -122.4194
    };
    
    const searchFilters: SearchFilters = {
      radius: 15,
      specialties: ['Cardiology', 'Surgery'],
      services: ['Emergency Care', 'Advanced Diagnostics'],
      rating: 4.5,
      availableToday: true,
      openNow: false
    };
    
    console.log('🔍 Performing advanced search...');
    
    const searchResults = await vetService.searchVets({
      query: 'cardiac surgery',
      filters: searchFilters,
      location: userLocation,
      page: 1,
      limit: 10
    });
    
    console.log(`✅ Search results: ${searchResults.totalCount} matches found`);
    console.log(`📄 Page 1 showing ${searchResults.veterinarians.length} veterinarians and ${searchResults.clinics.length} clinics`);
    
    if (searchResults.veterinarians.length > 0) {
      console.log('\n🩺 Veterinarians:');
      searchResults.veterinarians.slice(0, 2).forEach((vet, index) => {
        console.log(`${index + 1}. ${vet.name}`);
        console.log(`   ⭐ ${vet.rating}/5`);
        console.log(`   🩺 ${vet.specialties.join(', ')}`);
      });
    }
    
    if (searchResults.clinics.length > 0) {
      console.log('\n🏥 Clinics:');
      searchResults.clinics.slice(0, 2).forEach((clinic, index) => {
        console.log(`${index + 1}. ${clinic.name}`);
        console.log(`   ⭐ ${clinic.rating}/5`);
        console.log(`   🏪 ${clinic.services.slice(0, 3).join(', ')}`);
      });
    }
    
    return searchResults;
  } catch (error) {
    console.error('❌ Error performing search:', error);
    throw error;
  }
};

/**
 * Example 5: Distance calculations and formatting
 */
export const distanceCalculationExample = () => {
  console.log('📏 Distance calculation examples:');
  
  const point1: LocationCoordinates = { latitude: 37.7749, longitude: -122.4194 }; // SF
  const point2: LocationCoordinates = { latitude: 37.7849, longitude: -122.4094 }; // ~1km away
  
  const distanceKm = locationService.calculateDistance(point1, point2);
  const distanceMi = locationService.calculateDistanceInMiles(point1, point2);
  
  console.log(`📍 Distance between points: ${distanceKm.toFixed(2)} km`);
  console.log(`📍 Distance in miles: ${distanceMi.toFixed(2)} mi`);
  console.log(`📍 Formatted distance: ${locationService.formatDistance(distanceKm)}`);
  console.log(`📍 Formatted distance (miles): ${locationService.formatDistance(distanceKm, 'mi')}`);
  
  return { distanceKm, distanceMi };
};

/**
 * Example 6: Clinic availability checking
 */
export const clinicAvailabilityExample = () => {
  console.log('🕒 Checking clinic availability:');
  
  mockClinics.slice(0, 3).forEach((clinic, index) => {
    const isOpen = locationService.isClinicOpen(clinic);
    console.log(`${index + 1}. ${clinic.name}: ${isOpen ? '✅ Open' : '❌ Closed'}`);
  });
};

/**
 * Example 7: Top-rated vets and data statistics
 */
export const topRatedVetsExample = async () => {
  try {
    console.log('⭐ Getting top-rated veterinarians...');
    
    const topVets = await vetService.getTopRatedVets(5);
    
    console.log(`✅ Top ${topVets.length} veterinarians by rating:`);
    
    topVets.forEach((vet, index) => {
      console.log(`${index + 1}. ${vet.name}`);
      console.log(`   ⭐ ${vet.rating}/5 (${vet.reviewCount} reviews)`);
      console.log(`   🩺 ${vet.specialties[0]}`);
      console.log(`   📅 ${vet.experience} years experience`);
      console.log('');
    });
    
    return topVets;
  } catch (error) {
    console.error('❌ Error getting top-rated vets:', error);
    throw error;
  }
};

/**
 * Example 8: Complete workflow - Find and book vet
 */
export const completeWorkflowExample = async () => {
  try {
    console.log('🔄 Starting complete vet booking workflow...\n');
    
    // Step 1: Get user location
    console.log('Step 1: Getting location...');
    const location = await getUserLocationExample();
    
    // Step 2: Find nearby vets
    console.log('\nStep 2: Finding nearby vets...');
    const nearbyVets = await findNearbyVetsExample();
    
    // Step 3: Get details for first vet
    if (nearbyVets.length > 0) {
      console.log('\nStep 3: Getting vet details...');
      const firstVet = nearbyVets[0];
      const vetDetails = await vetService.getVetDetails(firstVet.id);
      
      if (vetDetails) {
        console.log(`✅ Vet details for ${vetDetails.name}:`);
        console.log(`   🩺 Specialties: ${vetDetails.specialties.join(', ')}`);
        console.log(`   📅 Experience: ${vetDetails.experience} years`);
        console.log(`   ⭐ Rating: ${vetDetails.rating}/5`);
      }
      
      // Step 4: Check availability
      console.log('\nStep 4: Checking availability...');
      const availability = await vetService.checkVetAvailability(firstVet.id);
      console.log(`   ${availability.isAvailable ? '✅ Available now' : '❌ Not available'}`);
      if (availability.nextAvailable) {
        console.log(`   📅 Next available: ${availability.nextAvailable}`);
      }
      
      // Step 5: Get available slots
      console.log('\nStep 5: Getting available slots...');
      const slots = await vetService.getAvailableSlots(firstVet.id, new Date());
      console.log(`   📅 ${slots.length} time slots available today`);
      
      slots.slice(0, 3).forEach((slot, index) => {
        console.log(`   ${index + 1}. ${slot.startTime} - ${slot.endTime}`);
      });
    }
    
    console.log('\n✅ Workflow completed successfully!');
    
  } catch (error) {
    console.error('❌ Workflow error:', error);
  }
};

/**
 * Example 9: Data validation and statistics
 */
export const dataValidationExample = () => {
  console.log('📊 Data validation and statistics:');
  
  // Validate mock data integrity
  const { validateMockData } = require('../data');
  const validation = validateMockData();
  
  console.log(`✅ Data validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
  if (!validation.isValid) {
    validation.errors.forEach((error: string) => {
      console.log(`   ❌ ${error}`);
    });
  }
  
  // Statistics
  console.log(`📈 Statistics:`);
  console.log(`   🩺 Total veterinarians: ${mockVeterinarians.length}`);
  console.log(`   🏥 Total clinics: ${mockClinics.length}`);
  console.log(`   ⭐ Average vet rating: ${(mockVeterinarians.reduce((sum, vet) => sum + vet.rating, 0) / mockVeterinarians.length).toFixed(1)}`);
  console.log(`   🚨 Emergency vets: ${getEmergencyVeterinarians().length}`);
  
  return validation;
};

/**
 * Run all examples
 */
export const runAllExamples = async () => {
  console.log('🚀 Running VetConnect Location & Vet Data Examples\n');
  console.log('=' * 50);
  
  try {
    // Data validation first
    dataValidationExample();
    console.log('\n' + '=' * 50);
    
    // Distance calculations
    distanceCalculationExample();
    console.log('\n' + '=' * 50);
    
    // Clinic availability
    clinicAvailabilityExample();
    console.log('\n' + '=' * 50);
    
    // Top-rated vets
    await topRatedVetsExample();
    console.log('\n' + '=' * 50);
    
    // Emergency vets
    await findEmergencyVetsExample();
    console.log('\n' + '=' * 50);
    
    // Advanced search
    await advancedSearchExample();
    console.log('\n' + '=' * 50);
    
    // Complete workflow (commented out to avoid location permission requests)
    // await completeWorkflowExample();
    
    console.log('🎉 All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
};