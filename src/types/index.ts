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
  coordinates: {
    latitude: number;
    longitude: number;
  };
  services: string[];
  openingHours: OpeningHours;
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
  VetList: undefined;
  ClinicDetails: { clinicId: string };
  BookAppointment: { veterinarianId: string; clinicId: string };
  PetProfile: { petId?: string };
  AppointmentDetails: { appointmentId: string };
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