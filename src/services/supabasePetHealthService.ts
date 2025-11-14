import { supabase } from '../config/supabase';
import {
  OwnerNote,
  PetHealthOverview,
  PetTimelineEntry,
  PetPrescription,
  Vaccination,
} from '../types';

interface MockPetHealthData {
  overview: PetHealthOverview;
  timeline: PetTimelineEntry[];
  vaccinations: Vaccination[];
  prescriptions: PetPrescription[];
  ownerNotes: OwnerNote[];
}

const buildMockData = (petId: string): MockPetHealthData => {
  const today = new Date();
  const iso = (date: Date) => date.toISOString();

  return {
    overview: {
      lastVisit: iso(new Date(today.getFullYear(), today.getMonth() - 1, 12)),
      primaryVeterinarian: 'Dr. Maya Thompson',
      nextAppointment: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14)),
      reminders: [
        {
          id: `${petId}-reminder-1`,
          label: 'Rabies booster due soon',
          dueDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)),
          type: 'vaccination',
          status: 'upcoming',
        },
        {
          id: `${petId}-reminder-2`,
          label: 'Weight check follow-up',
          dueDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3)),
          type: 'follow-up',
          status: 'overdue',
        },
      ],
      vitals: {
        weight: 12.4,
        weightUnit: 'kg',
        bodyCondition: 'normal',
      },
      notes: 'Overall healthy. Maintain daily walks and balanced diet.',
    },
    timeline: [
      {
        id: `${petId}-timeline-1`,
        entryType: 'treatment',
        title: 'Annual wellness exam',
        description: 'General checkup with blood work. All metrics within normal range.',
        date: iso(new Date(today.getFullYear(), today.getMonth() - 1, 12)),
        veterinarianName: 'Dr. Maya Thompson',
        tags: ['checkup', 'labs'],
        status: 'completed',
      },
      {
        id: `${petId}-timeline-2`,
        entryType: 'vaccination',
        title: 'Rabies (3-year)',
        description: 'Administered booster. Next due in 2026.',
        date: iso(new Date(today.getFullYear(), today.getMonth() - 4, 4)),
        veterinarianName: 'Dr. Sara Lee',
        tags: ['vaccination'],
        status: 'completed',
      },
      {
        id: `${petId}-timeline-3`,
        entryType: 'prescription',
        title: 'Metacam 5mg',
        description: 'Pain management after minor injury. 7-day course.',
        date: iso(new Date(today.getFullYear(), today.getMonth() - 2, 21)),
        veterinarianName: 'Dr. Sara Lee',
        tags: ['medication'],
        status: 'completed',
        metadata: {
          dosage: '5mg',
          frequency: 'Once daily',
        },
      },
    ],
    vaccinations: [
      {
        id: `${petId}-vacc-1`,
        name: 'Rabies',
        date: iso(new Date(today.getFullYear(), today.getMonth() - 4, 4)),
        nextDue: iso(new Date(today.getFullYear() + 1, today.getMonth() - 4, 4)),
        veterinarianId: 'mock-vet-1',
      },
      {
        id: `${petId}-vacc-2`,
        name: 'Distemper',
        date: iso(new Date(today.getFullYear() - 1, today.getMonth(), 15)),
        nextDue: iso(new Date(today.getFullYear(), today.getMonth(), 15)),
        veterinarianId: 'mock-vet-2',
      },
    ],
    prescriptions: [
      {
        id: `${petId}-rx-1`,
        medicationName: 'Metacam',
        dosage: '5mg',
        frequency: 'Once daily',
        durationDays: 7,
        instructions: 'Administer with food.',
        status: 'completed',
        prescribedDate: iso(new Date(today.getFullYear(), today.getMonth() - 2, 21)),
        veterinarianId: 'mock-vet-2',
      },
      {
        id: `${petId}-rx-2`,
        medicationName: 'Heartgard',
        dosage: 'Chew',
        frequency: 'Monthly',
        instructions: 'Give on the 1st of each month.',
        status: 'active',
        prescribedDate: iso(new Date(today.getFullYear(), today.getMonth() - 5, 1)),
        veterinarianId: 'mock-vet-1',
        followUpDate: iso(new Date(today.getFullYear(), today.getMonth() + 1, 1)),
      },
    ],
    ownerNotes: [
      {
        id: `${petId}-note-1`,
        petId,
        ownerId: 'mock-owner',
        note: 'Noticed slight limp after long runs. Monitoring.',
        noteType: 'observation',
        createdAt: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
        updatedAt: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)),
      },
    ],
  };
};

class SupabasePetHealthService {
  private mockCache: Record<string, MockPetHealthData> = {};

  private getMockData(petId: string): MockPetHealthData {
    if (!this.mockCache[petId]) {
      this.mockCache[petId] = buildMockData(petId);
    }
    return this.mockCache[petId];
  }

  async fetchOverview(petId: string): Promise<PetHealthOverview> {
    try {
      const { data, error } = await supabase.rpc('get_pet_health_overview', { pet_id: petId });
      if (error) {
        throw error;
      }
      if (data) {
        return data as PetHealthOverview;
      }
    } catch (error) {
      console.warn('[PetHealthService] Overview RPC unavailable, using mock data.', error);
    }
    return this.getMockData(petId).overview;
  }

  async fetchTimeline(petId: string): Promise<PetTimelineEntry[]> {
    try {
      const { data, error } = await supabase.rpc('get_pet_health_timeline', { pet_id: petId });
      if (error) {
        throw error;
      }
      if (Array.isArray(data)) {
        return data as PetTimelineEntry[];
      }
    } catch (error) {
      console.warn('[PetHealthService] Timeline RPC unavailable, using mock data.', error);
    }
    return this.getMockData(petId).timeline;
  }

  async fetchVaccinations(petId: string): Promise<Vaccination[]> {
    try {
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('pet_id', petId)
        .order('administered_date', { ascending: false });

      if (error) {
        throw error;
      }

      if (Array.isArray(data)) {
        return data.map((record) => ({
          id: record.id,
          name: record.vaccine_name,
          date: record.administered_date,
          nextDue: record.next_due_date,
          veterinarianId: record.veterinarian_id,
        }));
      }
    } catch (error) {
      console.warn('[PetHealthService] Vaccinations table unavailable, using mock data.', error);
    }
    return this.getMockData(petId).vaccinations;
  }

  async fetchPrescriptions(petId: string): Promise<PetPrescription[]> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('pet_id', petId)
        .order('prescribed_date', { ascending: false });

      if (error) {
        throw error;
      }

      if (Array.isArray(data)) {
        return data.map((record) => ({
          id: record.id,
          medicationName: record.medication_name,
          dosage: record.dosage,
          frequency: record.frequency,
          durationDays: record.duration_days,
          instructions: record.instructions,
          status: record.status,
          prescribedDate: record.prescribed_date,
          veterinarianId: record.veterinarian_id,
          followUpDate: record.end_date,
        }));
      }
    } catch (error) {
      console.warn('[PetHealthService] Prescriptions table unavailable, using mock data.', error);
    }
    return this.getMockData(petId).prescriptions;
  }

  async fetchOwnerNotes(petId: string): Promise<OwnerNote[]> {
    try {
      const { data, error } = await supabase
        .from('owner_notes')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (Array.isArray(data)) {
        return data.map((record) => ({
          id: record.id,
          petId: record.pet_id,
          ownerId: record.owner_id,
          note: record.note,
          noteType: record.note_type ?? undefined,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        }));
      }
    } catch (error) {
      console.warn('[PetHealthService] Owner notes table unavailable, using mock data.', error);
    }
    return this.getMockData(petId).ownerNotes;
  }
}

export const petHealthService = new SupabasePetHealthService();
