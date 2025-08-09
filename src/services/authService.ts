import { User, LoginForm, RegisterForm } from '../types';
import { supabase } from '../config/supabase';

class AuthService {
  async login(credentials: LoginForm): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login failed');
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      name: profile.name,
      phone: profile.phone,
      userType: profile.user_type,
      createdAt: new Date(data.user.created_at!),
      updatedAt: new Date(),
    };
  }

  async register(userData: Omit<RegisterForm, 'confirmPassword'>): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed');
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        name: userData.name,
        phone: userData.phone,
        user_type: userData.userType,
        email: userData.email,
      });

    if (profileError) {
      throw new Error('Failed to create user profile');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      name: userData.name,
      phone: userData.phone,
      userType: userData.userType,
      createdAt: new Date(data.user.created_at!),
      updatedAt: new Date(),
    };
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: profile.name,
      phone: profile.phone,
      userType: profile.user_type,
      createdAt: new Date(user.created_at!),
      updatedAt: new Date(),
    };
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(error.message);
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        user_type: updates.userType,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: user.id,
      email: user.email!,
      name: data.name,
      phone: data.phone,
      userType: data.user_type,
      createdAt: new Date(user.created_at!),
      updatedAt: new Date(),
    };
  }
}

export const authService = new AuthService();