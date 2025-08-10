import * as Location from 'expo-location';
import { Clinic, LocationCoordinates, UserLocation, Veterinarian } from '../types';

export enum LocationError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface LocationServiceError {
  code: LocationError;
  message: string;
  isRetryable: boolean;
}

class LocationService {
  private static readonly DEFAULT_TIMEOUT = 15000; // 15 seconds
  private static readonly LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private cachedLocation: { location: UserLocation; timestamp: number } | null = null;

  /**
   * Check if location permission is granted
   */
  async hasLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Request location permission with detailed error handling
   */
  async requestLocationPermission(): Promise<{ granted: boolean; error?: LocationServiceError }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        return { granted: true };
      }

      const error: LocationServiceError = {
        code: LocationError.PERMISSION_DENIED,
        message: 'Location permission is required to find nearby veterinarians. Please enable location access in your device settings.',
        isRetryable: true
      };

      return { granted: false, error };
    } catch (error: any) {
      console.error('Error requesting location permission:', error);
      
      const serviceError: LocationServiceError = {
        code: LocationError.UNKNOWN_ERROR,
        message: 'Failed to request location permission. Please try again.',
        isRetryable: true
      };

      return { granted: false, error: serviceError };
    }
  }

  /**
   * Get current location with caching and enhanced error handling
   */
  async getCurrentLocation(options?: { useCache?: boolean; timeout?: number }): Promise<UserLocation> {
    const { useCache = true, timeout = LocationService.DEFAULT_TIMEOUT } = options || {};

    // Return cached location if available and recent
    if (useCache && this.cachedLocation) {
      const isRecentCache = Date.now() - this.cachedLocation.timestamp < LocationService.LOCATION_CACHE_DURATION;
      if (isRecentCache) {
        return this.cachedLocation.location;
      }
    }

    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        const permissionResult = await this.requestLocationPermission();
        if (!permissionResult.granted) {
          throw this.createLocationError(LocationError.PERMISSION_DENIED, 
            permissionResult.error?.message || 'Location permission denied');
        }
      }

      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 100,
        }),
        this.timeoutPromise(timeout)
      ]);

      const userLocation: UserLocation = {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };

      // Add reverse geocoding to get address information
      try {
        const addressInfo = await this.reverseGeocode(userLocation.coordinates);
        userLocation.address = addressInfo.address;
        userLocation.city = addressInfo.city;
        userLocation.state = addressInfo.state;
      } catch (error) {
        console.warn('Failed to get address information:', error);
      }

      // Cache the location
      this.cachedLocation = {
        location: userLocation,
        timestamp: Date.now()
      };

      return userLocation;
    } catch (error: any) {
      if (error.code && error.message && typeof error.isRetryable === 'boolean') {
        throw error;
      }

      // Handle specific location errors
      if (error.code === 'E_LOCATION_UNAVAILABLE') {
        throw this.createLocationError(LocationError.LOCATION_UNAVAILABLE, 
          'Location is currently unavailable. Please check your GPS settings and try again.');
      }

      if (error.code === 'E_LOCATION_TIMEOUT') {
        throw this.createLocationError(LocationError.TIMEOUT, 
          'Location request timed out. Please try again.');
      }

      throw this.createLocationError(LocationError.UNKNOWN_ERROR, 
        `Failed to get current location: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Create a timeout promise for location requests
   */
  private timeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(this.createLocationError(LocationError.TIMEOUT, 
          `Location request timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Create a standardized location service error
   */
  private createLocationError(code: LocationError, message: string): LocationServiceError {
    return {
      code,
      message,
      isRetryable: code !== LocationError.PERMISSION_DENIED
    } as LocationServiceError;
  }

  async reverseGeocode(coordinates: LocationCoordinates): Promise<{ address?: string; city?: string; state?: string }> {
    try {
      const results = await Location.reverseGeocodeAsync(coordinates);
      
      if (results.length > 0) {
        const result = results[0];
        return {
          address: result.street && result.streetNumber 
            ? `${result.streetNumber} ${result.street}` 
            : result.street || result.name || undefined,
          city: result.city || result.subregion || undefined,
          state: result.region || undefined,
        };
      }
      
      return {};
    } catch (error: any) {
      console.error('Error reverse geocoding:', error);
      return {};
    }
  }

  async geocode(address: string): Promise<LocationCoordinates[]> {
    try {
      const results = await Location.geocodeAsync(address);
      return results.map(result => ({
        latitude: result.latitude,
        longitude: result.longitude,
      }));
    } catch (error: any) {
      console.error('Error geocoding:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(point1: LocationCoordinates, point2: LocationCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(point2.latitude - point1.latitude);
    const dLon = this.degToRad(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(point1.latitude)) * Math.cos(this.degToRad(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate distance in miles
   */
  calculateDistanceInMiles(point1: LocationCoordinates, point2: LocationCoordinates): number {
    return this.calculateDistance(point1, point2) * 0.621371; // Convert km to miles
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceKm: number, unit: 'km' | 'mi' = 'km'): string {
    const distance = unit === 'mi' ? distanceKm * 0.621371 : distanceKm;
    
    if (distance < 1) {
      const meters = Math.round(distance * 1000);
      return unit === 'mi' ? `${Math.round(distance * 5280)} ft` : `${meters} m`;
    }
    
    return `${distance.toFixed(1)} ${unit}`;
  }

  /**
   * Filter locations within a specified radius
   */
  filterByRadius<T extends { coordinates: LocationCoordinates }>(
    userLocation: LocationCoordinates,
    locations: T[],
    radiusKm: number
  ): Array<T & { distance: number }> {
    return locations
      .map(location => ({
        ...location,
        distance: this.calculateDistance(userLocation, location.coordinates)
      }))
      .filter(location => location.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Filter veterinarians by proximity
   */
  filterVetsByProximity(
    userLocation: LocationCoordinates,
    vets: Veterinarian[],
    clinics: Clinic[],
    radiusKm: number = 25
  ): Array<Veterinarian & { distance: number; clinic: Clinic }> {
    const clinicMap = new Map(clinics.map(clinic => [clinic.id, clinic]));

    return vets
      .map(vet => {
        const clinic = clinicMap.get(vet.clinic_id);
        if (!clinic) return null;

        const distance = this.calculateDistance(userLocation, clinic.coordinates);
        
        return {
          ...vet,
          distance,
          clinic
        };
      })
      .filter((vet): vet is NonNullable<typeof vet> => vet !== null && vet.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get vets within walking distance (1.5km)
   */
  getWalkableVets(
    userLocation: LocationCoordinates,
    vets: Veterinarian[],
    clinics: Clinic[]
  ): Array<Veterinarian & { distance: number; clinic: Clinic }> {
    return this.filterVetsByProximity(userLocation, vets, clinics, 1.5);
  }

  /**
   * Get emergency vets within a reasonable distance (15km)
   */
  getEmergencyVets(
    userLocation: LocationCoordinates,
    vets: Veterinarian[],
    clinics: Clinic[]
  ): Array<Veterinarian & { distance: number; clinic: Clinic }> {
    const emergencyVets = vets.filter(vet => 
      vet.specialties.some(specialty => 
        specialty.toLowerCase().includes('emergency') || 
        specialty.toLowerCase().includes('urgent')
      )
    );

    return this.filterVetsByProximity(userLocation, emergencyVets, clinics, 15);
  }

  /**
   * Check if a clinic is currently open
   */
  isClinicOpen(clinic: Clinic): boolean {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase() as keyof typeof clinic.hours;
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
    
    const daySchedule = clinic.hours?.[dayOfWeek];
    
    if (!daySchedule || !daySchedule.isOpen || !daySchedule.openTime || !daySchedule.closeTime) {
      return false;
    }

    // Handle break times
    if (daySchedule.breakStart && daySchedule.breakEnd) {
      const isInBreak = currentTime >= daySchedule.breakStart && currentTime < daySchedule.breakEnd;
      if (isInBreak) return false;
    }

    return currentTime >= daySchedule.openTime && currentTime < daySchedule.closeTime;
  }

  /**
   * Filter vets by those with open clinics
   */
  filterOpenVets(
    vets: Array<Veterinarian & { clinic: Clinic }>
  ): Array<Veterinarian & { clinic: Clinic }> {
    return vets.filter(vet => this.isClinicOpen(vet.clinic));
  }

  /**
   * Clear location cache
   */
  clearLocationCache(): void {
    this.cachedLocation = null;
  }

  /**
   * Convert degrees to radians
   */
  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const locationService = new LocationService();