// Supabase database types
// These match the database schema from supabase-setup.sql

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          user_type: 'pet-owner' | 'veterinarian';
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          user_type: 'pet-owner' | 'veterinarian';
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          user_type?: 'pet-owner' | 'veterinarian';
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pets: {
        Row: {
          id: string;
          name: string;
          species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
          breed: string | null;
          age: number;
          weight: number | null;
          gender: 'male' | 'female';
          photo_url: string | null;
          owner_id: string;
          medical_history: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
          breed?: string | null;
          age: number;
          weight?: number | null;
          gender: 'male' | 'female';
          photo_url?: string | null;
          owner_id: string;
          medical_history?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
          breed?: string | null;
          age?: number;
          weight?: number | null;
          gender?: 'male' | 'female';
          photo_url?: string | null;
          owner_id?: string;
          medical_history?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clinics: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          phone: string;
          email: string | null;
          website: string | null;
          latitude: number;
          longitude: number;
          services: string[] | null;
          photos: string[] | null;
          rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          phone: string;
          email?: string | null;
          website?: string | null;
          latitude: number;
          longitude: number;
          services?: string[] | null;
          photos?: string[] | null;
          rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          phone?: string;
          email?: string | null;
          website?: string | null;
          latitude?: number;
          longitude?: number;
          services?: string[] | null;
          photos?: string[] | null;
          rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      veterinarians: {
        Row: {
          id: string;
          specialties: string[] | null;
          experience: number;
          rating: number;
          review_count: number;
          clinic_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          specialties?: string[] | null;
          experience: number;
          rating?: number;
          review_count?: number;
          clinic_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          specialties?: string[] | null;
          experience?: number;
          rating?: number;
          review_count?: number;
          clinic_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          pet_id: string;
          veterinarian_id: string;
          clinic_id: string;
          owner_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          reason: string;
          status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
          notes: string | null;
          prescription: string[] | null;
          cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pet_id: string;
          veterinarian_id: string;
          clinic_id: string;
          owner_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          reason: string;
          status?: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
          notes?: string | null;
          prescription?: string[] | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pet_id?: string;
          veterinarian_id?: string;
          clinic_id?: string;
          owner_id?: string;
          appointment_date?: string;
          start_time?: string;
          end_time?: string;
          reason?: string;
          status?: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
          notes?: string | null;
          prescription?: string[] | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          veterinarian_id: string;
          clinic_id: string;
          appointment_id: string;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          veterinarian_id: string;
          clinic_id: string;
          appointment_id: string;
          rating: number;
          comment: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          veterinarian_id?: string;
          clinic_id?: string;
          appointment_id?: string;
          rating?: number;
          comment?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}