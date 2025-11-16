import { Appointment } from '../types';

/**
 * Utility functions to serialize/deserialize Date objects for Redux state
 * Redux requires all state to be serializable (plain objects, arrays, primitives)
 * Date objects are not serializable, so we convert them to ISO strings
 */

/**
 * Serialize a Date object to ISO string
 */
export function serializeDate(date: Date | string | undefined | null): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') {
    // Validate string date
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      console.warn('Invalid date string:', date);
      return new Date().toISOString(); // Return current date as fallback
    }
    return date; // Return original string if valid
  }
  if (date instanceof Date) {
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid Date object detected:', date);
      return new Date().toISOString(); // Return current date as fallback
    }
    return date.toISOString();
  }
  return undefined;
}

/**
 * Deserialize an ISO string to Date object
 */
export function deserializeDate(date: Date | string | undefined | null): Date | undefined {
  if (!date) return undefined;
  if (date instanceof Date) {
    // Check if date is valid
    if (isNaN(date.getTime())) return undefined;
    return date;
  }
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return undefined;
    return parsed;
  }
  return undefined;
}

/**
 * Serialize an Appointment's Date fields to ISO strings for Redux storage
 */
export function serializeAppointment(appointment: Appointment): Appointment {
  // Helper to ensure we always get a valid ISO string, never undefined or invalid date
  const ensureValidISOString = (date: Date | string | undefined | null): string => {
    if (!date) {
      return new Date().toISOString();
    }
    
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        console.warn('Invalid date string in appointment:', date);
        return new Date().toISOString();
      }
      return date; // Return original if valid
    }
    
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        console.warn('Invalid Date object (NaN) in appointment:', date);
        return new Date().toISOString();
      }
      return date.toISOString();
    }
    
    return new Date().toISOString();
  };

  // Safely serialize all date fields, ensuring we always get valid ISO strings
  return {
    ...appointment,
    date: ensureValidISOString(appointment.date),
    createdAt: ensureValidISOString(appointment.createdAt),
    updatedAt: ensureValidISOString(appointment.updatedAt),
  } as any; // Type assertion needed because TypeScript expects Date, but we're storing strings
}

/**
 * Deserialize an Appointment's ISO string dates back to Date objects for component use
 */
export function deserializeAppointment(appointment: Appointment): Appointment {
  return {
    ...appointment,
    date: deserializeDate(appointment.date) || new Date(),
    createdAt: deserializeDate(appointment.createdAt) || new Date(),
    updatedAt: deserializeDate(appointment.updatedAt) || new Date(),
  } as Appointment;
}

/**
 * Serialize an array of appointments
 */
export function serializeAppointments(appointments: Appointment[]): Appointment[] {
  return appointments.map(serializeAppointment);
}

/**
 * Deserialize an array of appointments
 */
export function deserializeAppointments(appointments: Appointment[]): Appointment[] {
  return appointments.map(deserializeAppointment);
}

/**
 * Helper to safely convert a date value (Date or string) to Date object
 * Used in components that need to work with dates from Redux
 */
export function toDate(date: Date | string | undefined | null): Date {
  if (!date) return new Date();
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return new Date();
    return date;
  }
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return new Date();
    return parsed;
  }
  return new Date();
}

/**
 * Helper to safely convert a date value to ISO string
 */
export function toISOString(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return new Date().toISOString();
    return date.toISOString();
  }
  return new Date().toISOString();
}

