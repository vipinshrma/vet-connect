import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import vetSlice from './slices/vetSlice';
import appointmentSlice from './slices/appointmentSlice';
import petSlice from './slices/petSlice';
import locationSlice from './slices/locationSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    vets: vetSlice,
    appointments: appointmentSlice,
    pets: petSlice,
    location: locationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;