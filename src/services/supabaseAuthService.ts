import { supabase } from '../config/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserType } from '../types';
import { validateEmailWithMessage } from '../utils/emailValidation';

// Helper function to create user profile
const createUserProfile = async (userId: string, email: string, name: string, phone: string, userType: UserType) => {
  const profileData = {
    id: userId,
    email: email,
    name: name,
    phone: phone,
    user_type: userType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  console.log("🔧 [DEBUG] Creating profile with data:", profileData);
  
  const { error, data } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('🔧 [DEBUG] Profile creation failed:', error);
    throw new Error(`Profile creation failed: ${error.message}`);
  }
  
  console.log("🔧 [DEBUG] Profile created successfully:", data);
  return data;
};

// Helper function to create veterinarian profile
export const createVeterinarianProfile = async (userId: string) => {
  const veterinarianData = {
    id: userId,
    specialties: [], // Empty initially, to be filled during onboarding or profile setup
    experience: 0, // Default value, to be updated by the veterinarian
    rating: 0, // Will be calculated based on reviews
    review_count: 0, // Will be updated as reviews come in
    clinic_id: null, // No clinic initially, can be assigned later
  };
  
  console.log("🔧 [DEBUG] Creating veterinarian profile with data:", veterinarianData);
  
  const { error, data } = await supabase
    .from('veterinarians')
    .insert(veterinarianData)
    .select()
    .single();

  if (error) {
    console.error('🔧 [DEBUG] Veterinarian profile creation failed:', error);
    throw new Error(`Veterinarian profile creation failed: ${error.message}`);
  }
  
  console.log("🔧 [DEBUG] Veterinarian profile created successfully:", data);
  return data;
};

// Helper function to ensure user profile exists
export const ensureUserProfile = async (userId: string, email: string, name: string, phone: string, userType: UserType) => {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking for existing profile:', checkError);
      throw checkError;
    }

    if (existingProfile) {
      console.log("🔧 [DEBUG] Profile already exists for user:", userId);
      
      // If user is a veterinarian, also ensure veterinarian profile exists
      if (userType === 'veterinarian') {
        const { data: existingVetProfile, error: vetCheckError } = await supabase
          .from('veterinarians')
          .select('id')
          .eq('id', userId)
          .single();

        if (vetCheckError && vetCheckError.code === 'PGRST116') {
          // Veterinarian profile doesn't exist, create it
          console.log("🔧 [DEBUG] Veterinarian profile doesn't exist, creating it");
          try {
            await createVeterinarianProfile(userId);
          } catch (vetError) {
            console.warn('Failed to create veterinarian profile during profile ensure:', vetError);
          }
        }
      }
      
      return existingProfile;
    }

    // Profile doesn't exist, create it
    console.log("🔧 [DEBUG] Profile doesn't exist, creating new profile for user:", userId);
    const profile = await createUserProfile(userId, email, name, phone, userType);
    
    // If user is a veterinarian, also create veterinarian profile
    if (userType === 'veterinarian') {
      try {
        await createVeterinarianProfile(userId);
      } catch (vetError) {
        console.warn('Failed to create veterinarian profile during profile creation:', vetError);
      }
    }
    
    return profile;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
};

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone: string;
  userType: UserType;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Convert Supabase user to app User type
const convertSupabaseUserToUser = (supabaseUser: SupabaseUser, userMetadata?: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  name: userMetadata?.name || supabaseUser.user_metadata?.name || '',
  phone: userMetadata?.phone || supabaseUser.user_metadata?.phone || '',
  userType: userMetadata?.userType || supabaseUser.user_metadata?.userType || 'pet-owner',
  createdAt: supabaseUser.created_at || new Date().toISOString(),
  updatedAt: supabaseUser.updated_at || new Date().toISOString(),
});

// Sign up with email and password
export const signUpWithEmail = async (data: SignUpData): Promise<AuthResult> => {
  console.log("🔧 [DEBUG] Original signup data:", data);
  
  // Validate email before making API call
  const emailValidation = validateEmailWithMessage(data.email);
  console.log("🔧 [DEBUG] Email validation result:", emailValidation);
  
  if (!emailValidation.valid) {
    console.log("🔧 [DEBUG] Email validation failed:", emailValidation.error);
    return {
      success: false,
      error: emailValidation.error || 'Invalid email address',
    };
  }

  const normalizedEmail = data.email.trim().toLowerCase();
  console.log("🔧 [DEBUG] Normalized email:", { original: data.email, normalized: normalizedEmail });

  try {
    console.log("🔧 [DEBUG] Calling Supabase auth.signUp with:", {
      email: normalizedEmail,
      password: "[HIDDEN]",
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          userType: data.userType,
        },
      },
    });

    const { data: authData, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          userType: data.userType,
        },
      },
    });

    console.log("🔧 [DEBUG] Supabase response:", { authData, error });

    if (error) {
      console.log("🔧 [DEBUG] Supabase error details:", {
        message: error.message,
        status: error.status,
        fullError: error
      });

      // Provide better error messages for common issues
      if (error.message.includes('invalid') && error.message.includes('email')) {
        console.log("🔧 [DEBUG] Invalid email error detected");
        return {
          success: false,
          error: 'Please enter a valid email address. Make sure it follows the format: example@domain.com',
        };
      }
      
      if (error.message.includes('User already registered')) {
        console.log("🔧 [DEBUG] User already registered error detected");
        return {
          success: false,
          error: 'An account with this email already exists. Please try signing in instead.',
        };
      }

      console.log("🔧 [DEBUG] Returning original error message:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }

    // Create user profile in profiles table
    console.log("🔧 [DEBUG] Creating profile for user:", authData.user.id);
    
    try {
      await createUserProfile(authData.user.id, normalizedEmail, data.name, data.phone, data.userType);
      console.log("🔧 [DEBUG] Profile creation completed successfully");
      
      // If user is a veterinarian, create veterinarian-specific profile
      if (data.userType === 'veterinarian') {
        console.log("🔧 [DEBUG] User is veterinarian, creating veterinarian profile");
        try {
          await createVeterinarianProfile(authData.user.id);
          console.log("🔧 [DEBUG] Veterinarian profile creation completed successfully");
        } catch (vetError: any) {
          console.error('🔧 [DEBUG] Veterinarian profile creation failed:', vetError.message);
          // Don't fail the entire signup if veterinarian profile creation fails
          // The basic profile is created, veterinarian profile can be created later
          console.warn('Veterinarian profile creation failed but basic profile succeeded. User may need to complete veterinarian profile later.');
        }
      }
    } catch (profileError: any) {
      console.error('🔧 [DEBUG] Profile creation failed:', profileError.message);
      // Don't fail the entire signup if profile creation fails
      // The user is already created in auth, we can create profile later
      console.warn('Profile creation failed but auth succeeded. User may need to complete profile later.');
    }

    const user = convertSupabaseUserToUser(authData.user, {
      name: data.name,
      phone: data.phone,
      userType: data.userType,
    });

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during sign up',
    };
  }
};

// Sign in with email and password
export const signInWithEmail = async (data: SignInData): Promise<AuthResult> => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(), // Normalize email
      password: data.password,
    });

    if (error) {
      // Provide better error messages
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.',
        };
      }
      
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please check your email and click the confirmation link before signing in.',
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to sign in',
      };
    }

    // Fetch user profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    let userMetadata = {
      name: authData.user.user_metadata?.name || '',
      phone: authData.user.user_metadata?.phone || '',
      userType: authData.user.user_metadata?.userType || 'pet-owner',
    };

    // Use profile data if available
    if (profileData && !profileError) {
      userMetadata = {
        name: profileData.name || userMetadata.name,
        phone: profileData.phone || userMetadata.phone,
        userType: profileData.user_type || userMetadata.userType,
      };
    }

    const user = convertSupabaseUserToUser(authData.user, userMetadata);

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during sign in',
    };
  }
};

// Sign out
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during sign out',
    };
  }
};

// Get current user session
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch user profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    let userMetadata = {
      name: user.user_metadata?.name || '',
      phone: user.user_metadata?.phone || '',
      userType: user.user_metadata?.userType || 'pet-owner',
    };

    // Use profile data if available
    if (profileData && !profileError) {
      userMetadata = {
        name: profileData.name || userMetadata.name,
        phone: profileData.phone || userMetadata.phone,
        userType: profileData.user_type || userMetadata.userType,
      };
    }

    return convertSupabaseUserToUser(user, userMetadata);
  } catch (error: any) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (_, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
};

// Reset password
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'vetconnect://reset-password',
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during password reset',
    };
  }
};

// Update veterinarian professional profile
export const updateVeterinarianProfile = async (
  userId: string,
  updates: {
    specialties?: string[];
    experience?: number;
    clinicId?: string | null;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {};
    
    if (updates.specialties !== undefined) {
      updateData.specialties = updates.specialties;
    }
    
    if (updates.experience !== undefined) {
      updateData.experience = updates.experience;
    }
    
    if (updates.clinicId !== undefined) {
      updateData.clinic_id = updates.clinicId;
    }
    
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('veterinarians')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Veterinarian profile update error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Update veterinarian profile error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during veterinarian profile update',
    };
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<User, 'name' | 'phone'>>
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: updates.name,
        phone: updates.phone,
      },
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    // Update profile table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.warn('Profile update error:', profileError.message);
    }

    // Get updated user
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: 'Failed to get updated user data',
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during profile update',
    };
  }
};