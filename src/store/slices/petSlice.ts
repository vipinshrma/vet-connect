import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Pet, PetForm } from '../../types';
import { petService } from '../../services/petService';

interface PetState {
  pets: Pet[];
  selectedPet: Pet | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PetState = {
  pets: [],
  selectedPet: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserPets = createAsyncThunk(
  'pets/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const pets = await petService.getUserPets(userId);
      return pets;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addPet = createAsyncThunk(
  'pets/add',
  async (petData: PetForm & { ownerId: string }, { rejectWithValue }) => {
    try {
      const pet = await petService.addPet(petData);
      return pet;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePet = createAsyncThunk(
  'pets/update',
  async (params: { petId: string; updates: Partial<PetForm> }, { rejectWithValue }) => {
    try {
      const pet = await petService.updatePet(params.petId, params.updates);
      return pet;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePet = createAsyncThunk(
  'pets/delete',
  async (petId: string, { rejectWithValue }) => {
    try {
      await petService.deletePet(petId);
      return petId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadPetPhoto = createAsyncThunk(
  'pets/uploadPhoto',
  async (params: { petId: string; photoUri: string }, { rejectWithValue }) => {
    try {
      const photoURL = await petService.uploadPetPhoto(params.petId, params.photoUri);
      return { petId: params.petId, photoURL };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const petSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedPet: (state, action: PayloadAction<Pet>) => {
      state.selectedPet = action.payload;
    },
    clearSelectedPet: (state) => {
      state.selectedPet = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user pets
      .addCase(fetchUserPets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pets = action.payload;
      })
      .addCase(fetchUserPets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add pet
      .addCase(addPet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pets.push(action.payload);
      })
      .addCase(addPet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update pet
      .addCase(updatePet.fulfilled, (state, action) => {
        const index = state.pets.findIndex(pet => pet.id === action.payload.id);
        if (index !== -1) {
          state.pets[index] = action.payload;
        }
        if (state.selectedPet?.id === action.payload.id) {
          state.selectedPet = action.payload;
        }
      })
      // Delete pet
      .addCase(deletePet.fulfilled, (state, action) => {
        state.pets = state.pets.filter(pet => pet.id !== action.payload);
        if (state.selectedPet?.id === action.payload) {
          state.selectedPet = null;
        }
      })
      // Upload pet photo
      .addCase(uploadPetPhoto.fulfilled, (state, action) => {
        const { petId, photoURL } = action.payload;
        const pet = state.pets.find(p => p.id === petId);
        if (pet) {
          pet.photoURL = photoURL;
        }
        if (state.selectedPet?.id === petId) {
          state.selectedPet.photoURL = photoURL;
        }
      });
  },
});

export const {
  clearError,
  setSelectedPet,
  clearSelectedPet,
} = petSlice.actions;

export default petSlice.reducer;