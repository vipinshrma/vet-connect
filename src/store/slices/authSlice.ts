import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState, LoginForm, RegisterForm } from '../../types';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  getCurrentUser,
  updateUserProfile as updateSupabaseProfile 
} from '../../services/supabaseAuthService';
import { 
  storeAuthData, 
  getStoredAuthData, 
  clearAuthData, 
  updateStoredUser,
  hasCompletedOnboarding,
  setOnboardingCompleted as storeOnboardingCompleted
} from '../../utils/authStorage';

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  hasSeenOnboarding: false,
};


// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await signInWithEmail(credentials);
      if (response.success && response.user) {
        // Store user data in AsyncStorage for persistence
        await storeAuthData(response.user);
        
        return response.user;
      } else {
        return rejectWithValue(response.error || 'Login failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unexpected error occurred');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: Omit<RegisterForm, 'confirmPassword'>, { rejectWithValue }) => {
    try {
      const response = await signUpWithEmail(userData);
      if (response.success && response.user) {
        // Store user data in AsyncStorage for persistence
        await storeAuthData(response.user);
        
        return response.user;
      } else {
        return rejectWithValue(response.error || 'Registration failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'An unexpected error occurred');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await signOut();
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Logout failed');
      }
      
      // Clear stored auth data
      await clearAuthData();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // First check Supabase session
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        // Store/update user data in AsyncStorage
        await storeAuthData(currentUser);
        return currentUser;
      }
      
      // Fall back to stored auth data
      const storedAuthData = await getStoredAuthData();
      
      if (storedAuthData && storedAuthData.user) {
        return storedAuthData.user;
      }
      
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check auth status');
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // First check Supabase session
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        console.log('Restored user session from Supabase:', currentUser.email);
        // Store/update user data in AsyncStorage
        await storeAuthData(currentUser);
        return currentUser;
      }
      
      // Fall back to stored auth data
      const storedAuthData = await getStoredAuthData();
      
      if (storedAuthData && storedAuthData.user) {
        console.log('Restored user session from storage:', storedAuthData.user.email);
        return storedAuthData.user;
      }
      
      console.log('No auth session found');
      return null;
    } catch (error: any) {
      console.error('Failed to initialize auth:', error);
      return rejectWithValue(error.message || 'Failed to initialize auth');
    }
  }
);

export const checkOnboardingStatus = createAsyncThunk(
  'auth/checkOnboardingStatus',
  async (_, { rejectWithValue }) => {
    try {
      const hasCompleted = await hasCompletedOnboarding();
      return hasCompleted;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check onboarding status');
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  'auth/completeOnboarding',
  async (_, { rejectWithValue }) => {
    try {
      await storeOnboardingCompleted();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete onboarding');
    }
  }
);

// Add a new thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    { userId, updates }: { userId: string; updates: Partial<Pick<User, 'name' | 'phone'>> },
    { rejectWithValue }
  ) => {
    try {
      const response = await updateSupabaseProfile(userId, updates);
      
      if (!response.success || !response.user) {
        return rejectWithValue(response.error || 'Failed to update profile');
      }
      
      // Update stored user data
      await updateStoredUser(response.user);
      
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setOnboardingCompleted: (state) => {
      state.hasSeenOnboarding = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Check Onboarding Status
      .addCase(checkOnboardingStatus.fulfilled, (state, action) => {
        state.hasSeenOnboarding = action.payload;
      })
      // Complete Onboarding
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.hasSeenOnboarding = true;
      });
  },
});

export const { clearError, setUser, clearUser, setOnboardingCompleted } = authSlice.actions;
export default authSlice.reducer;