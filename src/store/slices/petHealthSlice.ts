import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  OwnerNote,
  PetHealthOverview,
  PetPrescription,
  PetTimelineEntry,
  Vaccination,
} from '../../types';
import { petHealthService } from '../../services/supabasePetHealthService';

interface PetHealthEntryState {
  overview?: PetHealthOverview;
  timeline: PetTimelineEntry[];
  vaccinations: Vaccination[];
  prescriptions: PetPrescription[];
  ownerNotes: OwnerNote[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
  lastFetchedAt?: string;
}

interface PetHealthState {
  byPetId: Record<string, PetHealthEntryState>;
}

const createInitialEntryState = (): PetHealthEntryState => ({
  timeline: [],
  vaccinations: [],
  prescriptions: [],
  ownerNotes: [],
  status: 'idle',
});

const initialState: PetHealthState = {
  byPetId: {},
};

export const fetchPetHealthData = createAsyncThunk(
  'petHealth/fetchPetHealthData',
  async (petId: string, { rejectWithValue }) => {
    try {
      const [overview, timeline, vaccinations, prescriptions, ownerNotes] = await Promise.all([
        petHealthService.fetchOverview(petId),
        petHealthService.fetchTimeline(petId),
        petHealthService.fetchVaccinations(petId),
        petHealthService.fetchPrescriptions(petId),
        petHealthService.fetchOwnerNotes(petId),
      ]);

      return {
        petId,
        overview,
        timeline,
        vaccinations,
        prescriptions,
        ownerNotes,
      };
    } catch (error: any) {
      return rejectWithValue(error.message ?? 'Unable to load health data');
    }
  }
);

const petHealthSlice = createSlice({
  name: 'petHealth',
  initialState,
  reducers: {
    clearPetHealthError: (state, action: PayloadAction<string>) => {
      if (!state.byPetId[action.payload]) {
        return;
      }
      state.byPetId[action.payload].error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPetHealthData.pending, (state, action) => {
        const petId = action.meta.arg;
        if (!state.byPetId[petId]) {
          state.byPetId[petId] = createInitialEntryState();
        }
        state.byPetId[petId].status = 'loading';
        state.byPetId[petId].error = undefined;
      })
      .addCase(fetchPetHealthData.fulfilled, (state, action) => {
        const { petId, overview, timeline, vaccinations, prescriptions, ownerNotes } = action.payload;
        if (!state.byPetId[petId]) {
          state.byPetId[petId] = createInitialEntryState();
        }
        state.byPetId[petId].overview = overview;
        state.byPetId[petId].timeline = timeline;
        state.byPetId[petId].vaccinations = vaccinations;
        state.byPetId[petId].prescriptions = prescriptions;
        state.byPetId[petId].ownerNotes = ownerNotes;
        state.byPetId[petId].status = 'succeeded';
        state.byPetId[petId].lastFetchedAt = new Date().toISOString();
      })
      .addCase(fetchPetHealthData.rejected, (state, action) => {
        const petId = action.meta.arg;
        if (!state.byPetId[petId]) {
          state.byPetId[petId] = createInitialEntryState();
        }
        state.byPetId[petId].status = 'failed';
        state.byPetId[petId].error = action.payload as string;
      });
  },
});

export const { clearPetHealthError } = petHealthSlice.actions;

export default petHealthSlice.reducer;
