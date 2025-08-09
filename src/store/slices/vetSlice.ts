import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Veterinarian, Clinic, SearchFilters, SearchResult } from '../../types';
import { vetService } from '../../services/vetService';

interface VetState {
  nearbyVets: Veterinarian[];
  selectedVet: Veterinarian | null;
  selectedClinic: Clinic | null;
  searchResults: SearchResult | null;
  favorites: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: VetState = {
  nearbyVets: [],
  selectedVet: null,
  selectedClinic: null,
  searchResults: null,
  favorites: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchNearbyVets = createAsyncThunk(
  'vets/fetchNearby',
  async (params: { latitude: number; longitude: number; radius?: number }, { rejectWithValue }) => {
    try {
      const vets = await vetService.getNearbyVets(params);
      return vets;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchVets = createAsyncThunk(
  'vets/search',
  async (params: { query: string; filters: SearchFilters; location: { latitude: number; longitude: number } }, { rejectWithValue }) => {
    try {
      const results = await vetService.searchVets(params);
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchVetDetails = createAsyncThunk(
  'vets/fetchDetails',
  async (vetId: string, { rejectWithValue }) => {
    try {
      const vet = await vetService.getVetDetails(vetId);
      return vet;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchClinicDetails = createAsyncThunk(
  'vets/fetchClinicDetails',
  async (clinicId: string, { rejectWithValue }) => {
    try {
      const clinic = await vetService.getClinicDetails(clinicId);
      return clinic;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const vetSlice = createSlice({
  name: 'vets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedVet: (state, action: PayloadAction<Veterinarian>) => {
      state.selectedVet = action.payload;
    },
    setSelectedClinic: (state, action: PayloadAction<Clinic>) => {
      state.selectedClinic = action.payload;
    },
    addToFavorites: (state, action: PayloadAction<string>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(id => id !== action.payload);
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch nearby vets
      .addCase(fetchNearbyVets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyVets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nearbyVets = action.payload;
      })
      .addCase(fetchNearbyVets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search vets
      .addCase(searchVets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchVets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchVets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch vet details
      .addCase(fetchVetDetails.fulfilled, (state, action) => {
        state.selectedVet = action.payload;
      })
      // Fetch clinic details
      .addCase(fetchClinicDetails.fulfilled, (state, action) => {
        state.selectedClinic = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedVet,
  setSelectedClinic,
  addToFavorites,
  removeFromFavorites,
  clearSearchResults,
} = vetSlice.actions;

export default vetSlice.reducer;