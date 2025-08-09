import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Appointment, AppointmentForm, TimeSlot } from '../../types';
import { supabaseAppointmentService } from '../../services/supabaseAppointmentService';

interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  availableSlots: TimeSlot[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  availableSlots: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserAppointments = createAsyncThunk(
  'appointments/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const appointments = await supabaseAppointmentService.getUserAppointments(userId);
      return appointments;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchVeterinarianAppointments = createAsyncThunk(
  'appointments/fetchVeterinarian',
  async (vetId: string, { rejectWithValue }) => {
    try {
      const appointments = await supabaseAppointmentService.getVetAppointments(vetId);
      return appointments;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'appointments/fetchAvailableSlots',
  async (params: { veterinarianId: string; date: Date }, { rejectWithValue }) => {
    try {
      // This would need to be implemented in supabaseAppointmentService
      // For now, return empty array or implement the method
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const bookAppointment = createAsyncThunk(
  'appointments/book',
  async (appointmentData: AppointmentForm & { veterinarianId: string; clinicId: string; userId: string }, { rejectWithValue }) => {
    try {
      const appointment = await supabaseAppointmentService.createAppointment({
        ...appointmentData,
        ownerId: appointmentData.userId,
        startTime: appointmentData.timeSlotId.split('-')[0] || '09:00',
        endTime: appointmentData.timeSlotId.split('-')[1] || '09:30',
      });
      return appointment;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancel',
  async (params: { appointmentId: string; userId: string }, { rejectWithValue }) => {
    try {
      await supabaseAppointmentService.cancelAppointment(params.appointmentId, params.userId);
      return params.appointmentId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'appointments/reschedule',
  async (params: { appointmentId: string; newDate: Date; newTimeSlotId: string }, { rejectWithValue }) => {
    try {
      // This would need to be implemented in supabaseAppointmentService
      // For now, throw an error or implement the method
      throw new Error('Reschedule not implemented yet');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedAppointment: (state, action: PayloadAction<Appointment>) => {
      state.selectedAppointment = action.payload;
    },
    clearSelectedAppointment: (state) => {
      state.selectedAppointment = null;
    },
    clearAvailableSlots: (state) => {
      state.availableSlots = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user appointments
      .addCase(fetchUserAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchUserAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch veterinarian appointments
      .addCase(fetchVeterinarianAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVeterinarianAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchVeterinarianAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch available slots
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableSlots = action.payload;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Book appointment
      .addCase(bookAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments.push(action.payload);
        state.availableSlots = [];
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Cancel appointment
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const appointmentId = action.payload;
        state.appointments = state.appointments.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        );
        if (state.selectedAppointment?.id === appointmentId) {
          state.selectedAppointment = { ...state.selectedAppointment, status: 'cancelled' };
        }
      })
      // Reschedule appointment
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.selectedAppointment?.id === action.payload.id) {
          state.selectedAppointment = action.payload;
        }
      });
  },
});

export const {
  clearError,
  setSelectedAppointment,
  clearSelectedAppointment,
  clearAvailableSlots,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;