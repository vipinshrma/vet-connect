import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserLocation, LocationCoordinates } from '../../types';
import { locationService } from '../../services/locationService';

interface LocationState {
  currentLocation: UserLocation | null;
  hasLocationPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  currentLocation: null,
  hasLocationPermission: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const requestLocationPermission = createAsyncThunk(
  'location/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const hasPermission = await locationService.requestLocationPermission();
      return hasPermission;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'location/getCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const location = await locationService.getCurrentLocation();
      return location;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const reverseGeocode = createAsyncThunk(
  'location/reverseGeocode',
  async (coordinates: LocationCoordinates, { rejectWithValue }) => {
    try {
      const address = await locationService.reverseGeocode(coordinates);
      return { coordinates, ...address };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLocation: (state, action: PayloadAction<UserLocation>) => {
      state.currentLocation = action.payload;
    },
    clearLocation: (state) => {
      state.currentLocation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Request permission
      .addCase(requestLocationPermission.fulfilled, (state, action) => {
        state.hasLocationPermission = action.payload;
      })
      // Get current location
      .addCase(getCurrentLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLocation = action.payload;
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Reverse geocode
      .addCase(reverseGeocode.fulfilled, (state, action) => {
        state.currentLocation = action.payload;
      });
  },
});

export const {
  clearError,
  setLocation,
  clearLocation,
} = locationSlice.actions;

export default locationSlice.reducer;