/**
 * Accessibility utilities for VetConnect app
 */

import Constants from 'expo-constants';
import { Clinic, Review, Veterinarian } from '../types';

/**
 * Generate accessibility labels for veterinarian cards
 */
export const getVetAccessibilityLabel = (vet: Veterinarian & { distance?: number }): string => {
  const parts = [
    `Dr. ${vet.name}`,
    `${vet.experience} years experience`,
    `Rating ${vet.rating} out of 5 stars`,
    `${vet.reviewCount} reviews`,
    `Specialties: ${vet.specialties.join(', ')}`
  ];

  if (vet.distance !== undefined) {
    parts.push(`Distance: ${vet.distance.toFixed(1)} kilometers`);
  }

  return parts.join('. ');
};

/**
 * Generate accessibility labels for clinic cards
 */
export const getClinicAccessibilityLabel = (clinic: Clinic & { distance?: number }): string => {
  const parts = [
    clinic.name,
    `Located at ${clinic.address}, ${clinic.city}, ${clinic.state}`,
    `Phone: ${clinic.phone}`,
    `Rating ${clinic.rating} out of 5 stars`,
    `${clinic.reviewCount} reviews`,
    `Services: ${clinic.services.slice(0, 3).join(', ')}${clinic.services.length > 3 ? ' and more' : ''}`
  ];

  if (clinic.distance !== undefined) {
    parts.push(`Distance: ${clinic.distance.toFixed(1)} kilometers`);
  }

  return parts.join('. ');
};

/**
 * Generate accessibility hints for interactive elements
 */
export const getVetCardAccessibilityHint = (): string => {
  return 'Double tap to view veterinarian details and book appointment';
};

export const getClinicCardAccessibilityHint = (): string => {
  return 'Double tap to view clinic details and available veterinarians';
};

export const getCallButtonAccessibilityHint = (phone: string): string => {
  return `Double tap to call ${phone}`;
};

export const getDirectionsAccessibilityHint = (clinicName: string): string => {
  return `Double tap to get directions to ${clinicName}`;
};

/**
 * Generate accessibility labels for reviews
 */
export const getReviewAccessibilityLabel = (review: Review): string => {
  const rating = `${review.rating} star${review.rating !== 1 ? 's' : ''}`;
  const date = review.createdAt.toLocaleDateString();
  
  return `Review: ${rating} rating. ${review.comment}. Posted on ${date}`;
};

/**
 * Generate accessibility labels for rating displays
 */
export const getRatingAccessibilityLabel = (rating: number, reviewCount?: number): string => {
  const ratingText = `${rating} out of 5 stars`;
  const reviewText = reviewCount ? ` based on ${reviewCount} review${reviewCount !== 1 ? 's' : ''}` : '';
  
  return ratingText + reviewText;
};

/**
 * Generate accessibility labels for time slots
 */
export const getTimeSlotAccessibilityLabel = (startTime: string, endTime: string, isAvailable: boolean): string => {
  const timeRange = `${startTime} to ${endTime}`;
  const availability = isAvailable ? 'available' : 'not available';
  
  return `Time slot ${timeRange}, ${availability}`;
};

/**
 * Generate accessibility labels for clinic hours
 */
export const getClinicHoursAccessibilityLabel = (clinic: Clinic): string => {
  const today = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase() as keyof typeof clinic.openingHours;
  const todaySchedule = clinic.openingHours[today];
  
  if (!todaySchedule.isOpen) {
    return 'Closed today';
  }
  
  let hoursText = `Open today from ${todaySchedule.openTime} to ${todaySchedule.closeTime}`;
  
  if (todaySchedule.breakStart && todaySchedule.breakEnd) {
    hoursText += `, closed for lunch from ${todaySchedule.breakStart} to ${todaySchedule.breakEnd}`;
  }
  
  return hoursText;
};

/**
 * Generate accessibility labels for distance and directions
 */
export const getDistanceAccessibilityLabel = (distance: number, unit: 'km' | 'mi' = 'km'): string => {
  const convertedDistance = unit === 'mi' ? distance * 0.621371 : distance;
  const unitText = unit === 'mi' ? 'miles' : 'kilometers';
  
  if (convertedDistance < 1) {
    const meters = Math.round(convertedDistance * 1000);
    return unit === 'mi' 
      ? `${Math.round(convertedDistance * 5280)} feet away`
      : `${meters} meters away`;
  }
  
  return `${convertedDistance.toFixed(1)} ${unitText} away`;
};

/**
 * Generate accessibility labels for emergency status
 */
export const getEmergencyAccessibilityLabel = (isEmergency: boolean): string => {
  return isEmergency ? 'Emergency veterinarian available 24/7' : 'Regular veterinary hours';
};

/**
 * Generate accessibility labels for specialties
 */
export const getSpecialtiesAccessibilityLabel = (specialties: string[]): string => {
  if (specialties.length === 0) return 'No specialties listed';
  if (specialties.length === 1) return `Specialty: ${specialties[0]}`;
  
  const lastSpecialty = specialties[specialties.length - 1];
  const otherSpecialties = specialties.slice(0, -1);
  
  return `Specialties: ${otherSpecialties.join(', ')} and ${lastSpecialty}`;
};

/**
 * Generate accessibility labels for services
 */
export const getServicesAccessibilityLabel = (services: string[]): string => {
  if (services.length === 0) return 'No services listed';
  if (services.length === 1) return `Service: ${services[0]}`;
  
  const displayServices = services.slice(0, 3);
  const remainingCount = services.length - 3;
  
  let label = `Services: ${displayServices.join(', ')}`;
  
  if (remainingCount > 0) {
    label += ` and ${remainingCount} more service${remainingCount !== 1 ? 's' : ''}`;
  }
  
  return label;
};

/**
 * Format phone numbers for accessibility
 */
export const formatPhoneForAccessibility = (phone: string): string => {
  // Remove formatting and add pauses for better screen reader pronunciation
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  
  return phone;
};

/**
 * Generate accessibility labels for booking status
 */
export const getBookingStatusAccessibilityLabel = (isAvailable: boolean, nextAvailable?: string): string => {
  if (isAvailable) {
    return 'Available for booking now';
  }
  
  if (nextAvailable) {
    return `Not currently available. Next available: ${nextAvailable}`;
  }
  
  return 'Not currently available for booking';
};

/**
 * Generate accessibility labels for filter buttons
 */
export const getFilterAccessibilityLabel = (filterName: string, isActive: boolean, count?: number): string => {
  const status = isActive ? 'active' : 'inactive';
  const countText = count !== undefined ? `, ${count} options` : '';
  
  return `${filterName} filter, ${status}${countText}`;
};

/**
 * Generate accessibility labels for search results
 */
export const getSearchResultsAccessibilityLabel = (veterinarians: number, clinics: number): string => {
  const vetText = `${veterinarians} veterinarian${veterinarians !== 1 ? 's' : ''}`;
  const clinicText = `${clinics} clinic${clinics !== 1 ? 's' : ''}`;
  
  if (veterinarians > 0 && clinics > 0) {
    return `Search results: ${vetText} and ${clinicText} found`;
  } else if (veterinarians > 0) {
    return `Search results: ${vetText} found`;
  } else if (clinics > 0) {
    return `Search results: ${clinicText} found`;
  } else {
    return 'No search results found';
  }
};
const MAPBOX_TOKEN =
  Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

export const fetchPostalCode = async (lat: number, lng: number) => {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token missing; unable to fetch postal code.');
    return null;
  }

  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
  );
  const data = await res.json();
  const postalCodeObj = data.features[0]?.context?.find((c: { id: string }) => c.id.startsWith("postcode."));
  return postalCodeObj ? postalCodeObj.text : null;
};
