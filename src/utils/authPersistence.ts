import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { User } from '../types';
import { getCurrentUser, onAuthStateChange } from '../services/supabaseAuthService';

const AUTH_STORAGE_KEY = '@VetConnect:auth';

interface StoredAuthData {
  user: User;
  timestamp: number;
}

// Store auth data with timestamp
export const storeAuthData = async (user: User): Promise<void> => {
  try {
    const authData: StoredAuthData = {
      user,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  } catch (error) {
    console.error('Failed to store auth data:', error);
  }
};

// Get stored auth data
export const getStoredAuthData = async (): Promise<StoredAuthData | null> => {
  try {
    const authDataString = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!authDataString) {
      return null;
    }

    const authData: StoredAuthData = JSON.parse(authDataString);
    
    // Check if stored data is older than 30 days
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - authData.timestamp > thirtyDaysInMs) {
      await clearStoredAuthData();
      return null;
    }

    return authData;
  } catch (error) {
    console.error('Failed to get stored auth data:', error);
    return null;
  }
};

// Clear stored auth data
export const clearStoredAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear stored auth data:', error);
  }
};

// Update stored user data
export const updateStoredUser = async (user: User): Promise<void> => {
  try {
    const existingData = await getStoredAuthData();
    if (existingData) {
      const updatedData: StoredAuthData = {
        user,
        timestamp: existingData.timestamp, // Keep original timestamp
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedData));
    } else {
      // If no existing data, store new data
      await storeAuthData(user);
    }
  } catch (error) {
    console.error('Failed to update stored user data:', error);
  }
};

// Initialize auth persistence
export const initializeAuthPersistence = (
  onUserChange: (user: User | null) => void
): (() => void) => {
  // Set up Supabase auth state listener
  const { data: { subscription } } = onAuthStateChange((user) => {
    if (user) {
      // Store user data when authenticated
      storeAuthData(user);
      onUserChange(user);
    } else {
      // Clear stored data when logged out
      clearStoredAuthData();
      onUserChange(null);
    }
  });

  // Return cleanup function
  return () => {
    subscription?.unsubscribe();
  };
};

// Sync auth state between Supabase and local storage
export const syncAuthState = async (): Promise<User | null> => {
  try {
    // First check Supabase session
    const currentUser = await getCurrentUser();
    
    if (currentUser) {
      // Update local storage with fresh data
      await storeAuthData(currentUser);
      return currentUser;
    }

    // If no Supabase session, check local storage
    const storedData = await getStoredAuthData();
    if (storedData?.user) {
      return storedData.user;
    }

    return null;
  } catch (error) {
    console.error('Failed to sync auth state:', error);
    return null;
  }
};

// Force refresh auth state from Supabase
export const refreshAuthState = async (): Promise<User | null> => {
  try {
    // Force refresh Supabase session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error || !session) {
      await clearStoredAuthData();
      return null;
    }

    const currentUser = await getCurrentUser();
    if (currentUser) {
      await storeAuthData(currentUser);
      return currentUser;
    }

    return null;
  } catch (error) {
    console.error('Failed to refresh auth state:', error);
    return null;
  }
};

// Check if user session is valid
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Failed to check session validity:', error);
    return false;
  }
};