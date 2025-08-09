import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { supabase } from '../config/supabase';
import { getCurrentUser } from '../services/supabaseAuthService';

// Storage keys
const AUTH_USER_KEY = '@VetConnect:auth_user';
const AUTH_TOKEN_KEY = '@VetConnect:auth_token';
const ONBOARDING_KEY = '@VetConnect:onboarding_completed';

export interface StoredAuthData {
  user: User;
  token?: string;
  timestamp: number;
}

/**
 * Store user authentication data in AsyncStorage
 */
export const storeAuthData = async (user: User, token?: string): Promise<void> => {
  try {
    // Get Supabase session token if not provided
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }

    const authData: StoredAuthData = {
      user,
      token,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData));
    
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    
    console.log('Auth data stored successfully');
  } catch (error) {
    console.error('Failed to store auth data:', error);
    throw new Error('Failed to save login session');
  }
};

/**
 * Retrieve stored user authentication data with Supabase sync
 */
export const getStoredAuthData = async (): Promise<StoredAuthData | null> => {
  try {
    // First check if Supabase session exists and is valid
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // If Supabase session exists, sync with current user data
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const syncedData: StoredAuthData = {
          user: currentUser,
          token: session.access_token,
          timestamp: Date.now(),
        };
        
        // Update local storage with fresh data
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(syncedData));
        return syncedData;
      }
    }

    // Fall back to local storage
    const authDataString = await AsyncStorage.getItem(AUTH_USER_KEY);
    
    if (!authDataString) {
      return null;
    }
    
    const authData: StoredAuthData = JSON.parse(authDataString);
    
    // Check if data is not too old (optional: expire after 30 days)
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - authData.timestamp > thirtyDaysInMs;
    
    if (isExpired) {
      console.log('Stored auth data has expired');
      await clearAuthData();
      return null;
    }
    
    return authData;
  } catch (error) {
    console.error('Failed to retrieve auth data:', error);
    return null;
  }
};

/**
 * Get stored authentication token
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Failed to retrieve auth token:', error);
    return null;
  }
};

/**
 * Clear all stored authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([AUTH_USER_KEY, AUTH_TOKEN_KEY]);
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
    throw new Error('Failed to clear login session');
  }
};

/**
 * Update stored user data (for profile updates)
 */
export const updateStoredUser = async (user: User): Promise<void> => {
  try {
    const existingData = await getStoredAuthData();
    
    if (existingData) {
      const updatedData: StoredAuthData = {
        ...existingData,
        user,
        timestamp: Date.now(), // Update timestamp
      };
      
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedData));
      console.log('User data updated successfully');
    }
  } catch (error) {
    console.error('Failed to update user data:', error);
    throw new Error('Failed to update user session');
  }
};

/**
 * Check if user session exists and is valid (with Supabase session check)
 */
export const hasValidSession = async (): Promise<boolean> => {
  try {
    // First check Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return true;
    }

    // Fall back to stored data check
    const authData = await getStoredAuthData();
    return authData !== null && authData.user !== null;
  } catch (error) {
    console.error('Failed to check session validity:', error);
    return false;
  }
};

/**
 * Store onboarding completion status
 */
export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('Onboarding completion status stored');
  } catch (error) {
    console.error('Failed to store onboarding status:', error);
  }
};

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    return false;
  }
};

/**
 * Clear onboarding status (for testing purposes)
 */
export const clearOnboardingStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('Onboarding status cleared');
  } catch (error) {
    console.error('Failed to clear onboarding status:', error);
  }
};

/**
 * Get all storage info for debugging
 */
export const getStorageInfo = async (): Promise<{
  hasUser: boolean;
  hasToken: boolean;
  userEmail?: string;
  timestamp?: number;
  hasCompletedOnboarding: boolean;
}> => {
  try {
    const authData = await getStoredAuthData();
    const token = await getStoredToken();
    const completedOnboarding = await hasCompletedOnboarding();
    
    return {
      hasUser: authData !== null,
      hasToken: token !== null,
      userEmail: authData?.user?.email,
      timestamp: authData?.timestamp,
      hasCompletedOnboarding: completedOnboarding,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      hasUser: false,
      hasToken: false,
      hasCompletedOnboarding: false,
    };
  }
};