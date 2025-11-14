// User Types
export type UserType = 'pet-owner' | 'veterinarian';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  userType: UserType;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  hasSeenOnboarding: boolean;
}

// Pet Types
export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age: number;
  weight?: number;
  gender: 'male' | 'female';
  photoURL?: string;
  ownerId: string;
  medicalHistory?: string[];
  vaccinations?: Vaccination[];
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  nextDue?: string;
  veterinarianId: string;
}

export interface PetPrescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  instructions?: string;
  status: 'active' | 'completed' | 'expired' | 'discontinued';
  prescribedDate: string;
  veterinarianId?: string;
  followUpDate?: string;
}

export interface PetHealthReminder {
  id: string;
  label: string;
  dueDate: string;
  type: 'vaccination' | 'follow-up' | 'medication';
  status: 'upcoming' | 'overdue' | 'completed';
}

export interface PetHealthOverview {
  lastVisit?: string;
  primaryVeterinarian?: string;
  nextAppointment?: string;
  notes?: string;
  reminders: PetHealthReminder[];
  vitals?: {
    weight?: number;
    weightUnit?: 'kg' | 'lb';
    bodyCondition?: 'underweight' | 'normal' | 'overweight';
  };
}

export type PetTimelineEntryType = 'treatment' | 'vaccination' | 'prescription' | 'note';

export interface PetTimelineEntry {
  id: string;
  entryType: PetTimelineEntryType;
  title: string;
  description?: string;
  date: string;
  veterinarianName?: string;
  tags?: string[];
  status?: 'completed' | 'overdue' | 'scheduled';
  metadata?: Record<string, any>;
}

export interface OwnerNote {
  id: string;
  petId: string;
  ownerId: string;
  note: string;
  noteType?: 'observation' | 'medication' | 'diet';
  createdAt: string;
  updatedAt: string;
}

// Veterinarian Types
export interface Veterinarian {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  specialties: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  clinic_id: string;
  availableSlots: TimeSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  website?: string;
  description?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  latitude: number;
  longitude: number;
  services: string[];
  insuranceAccepted: string[];
  paymentMethods: string[];
  hours: OpeningHours;
  photos?: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "17:00"
  breakStart?: string; // "12:00"
  breakEnd?: string; // "13:00"
}

// Database format for hours (snake_case)
export interface DatabaseHours {
  monday: DatabaseDaySchedule;
  tuesday: DatabaseDaySchedule;
  wednesday: DatabaseDaySchedule;
  thursday: DatabaseDaySchedule;
  friday: DatabaseDaySchedule;
  saturday: DatabaseDaySchedule;
  sunday: DatabaseDaySchedule;
}

export interface DatabaseDaySchedule {
  is_open: boolean;
  open_time?: string;
  close_time?: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  petId: string;
  veterinarianId: string;
  clinicId: string;
  ownerId: string;
  date: Date;
  timeSlot: TimeSlot;
  reason: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  prescription?: string[];
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
  // Optional populated relations from database joins
  veterinarian?: Veterinarian;
  pet?: Pet;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface TimeSlot {
  id: string;
  startTime: string; // "09:00"
  endTime: string; // "09:30"
  isAvailable: boolean;
  isBooked?: boolean;
  appointmentId?: string;
  slotType?: 'regular' | 'break' | 'blocked';
}

// Schedule Management Types
export interface VeterinarianSchedule {
  id: string;
  veterinarianId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isWorking: boolean;
  startTime: string; // "08:00"
  endTime: string; // "17:00"
  breakStartTime?: string; // "12:00"
  breakEndTime?: string; // "13:00"
  slotDuration: number; // Duration in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleException {
  id: string;
  veterinarianId: string;
  exceptionDate: string; // YYYY-MM-DD
  exceptionType: 'unavailable' | 'custom_hours' | 'break_change';
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  slotDuration?: number;
  notes?: string;
  createdAt: string;
}

export interface VeterinarianDaySchedule {
  dayOfWeek: number;
  dayName: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  slotDuration: number;
}

export interface WeeklySchedule {
  [key: number]: VeterinarianDaySchedule; // key is dayOfWeek (0-6)
}

// Database format for schedule (snake_case)
export interface DatabaseSchedule {
  id: string;
  veterinarian_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
  slot_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  veterinarianId: string;
  clinicId: string;
  appointmentId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

// Location Types
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  coordinates: LocationCoordinates;
  address?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
}

// Search Types
export interface SearchFilters {
  radius: number; // in kilometers
  specialties: string[];
  services: string[];
  rating: number;
  availableToday: boolean;
  openNow: boolean;
}

export interface SearchResult {
  veterinarians: Veterinarian[];
  clinics: Clinic[];
  totalCount: number;
  page: number;
  hasMore: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  VetDetails: { veterinarianId: string };
  VetProfile: { veterinarianId: string };
  VetProfileSetup: { userId: string };
  VetProfileEdit: { veterinarianId: string };
  VetList: { bookingMode?: boolean } | undefined;
  AdvancedSearch: undefined;
  MyClinicProfile: undefined;
  ScheduleManagement: undefined;
  ClinicDetails: { clinicId: string };
  BookAppointment: { veterinarianId: string; clinicId: string };
  RescheduleAppointment: { appointmentId: string };
  EmergencyCare: undefined;
  PetProfile: { petId?: string };
  AppointmentDetails: { appointmentId: string };
  PetHealth: { petId: string };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Map: undefined;
  Appointments: undefined;
  Pets: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  userType: UserType;
}

export interface PetForm {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age: number;
  weight?: number;
  gender: 'male' | 'female';
  medicalHistory?: string;
}

export interface AppointmentForm {
  petId: string;
  date: Date;
  timeSlotId: string;
  reason: string;
  notes?: string;
}

// Error Types
export interface ErrorState {
  message: string;
  code?: string;
  field?: string;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}
