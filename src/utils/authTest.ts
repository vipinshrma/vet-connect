/**
 * Test utilities for Supabase authentication
 * This file can be used for testing the auth flow in development
 */

import { signUpWithEmail, signInWithEmail, signOut, getCurrentUser } from '../services/supabaseAuthService';

export const testAuthFlow = async () => {
  console.log('🔄 Testing Supabase Auth Flow...');

  try {
    // Test Sign Up
    console.log('📝 Testing Sign Up...');
    const signUpResult = await signUpWithEmail({
      email: 'test@vetconnect.com',
      password: 'testpassword123',
      name: 'Test User',
      phone: '+1234567890',
      userType: 'pet-owner'
    });

    if (signUpResult.success) {
      console.log('✅ Sign Up successful:', signUpResult.user?.email);
    } else {
      console.log('❌ Sign Up failed:', signUpResult.error);
    }

    // Test Sign Out
    console.log('🚪 Testing Sign Out...');
    const signOutResult = await signOut();
    if (signOutResult.success) {
      console.log('✅ Sign Out successful');
    } else {
      console.log('❌ Sign Out failed:', signOutResult.error);
    }

    // Test Sign In
    console.log('🔑 Testing Sign In...');
    const signInResult = await signInWithEmail({
      email: 'test@vetconnect.com',
      password: 'testpassword123'
    });

    if (signInResult.success) {
      console.log('✅ Sign In successful:', signInResult.user?.email);
    } else {
      console.log('❌ Sign In failed:', signInResult.error);
    }

    // Test Get Current User
    console.log('👤 Testing Get Current User...');
    const currentUser = await getCurrentUser();
    if (currentUser) {
      console.log('✅ Got current user:', currentUser.email);
    } else {
      console.log('❌ No current user found');
    }

    console.log('🎉 Auth flow test completed!');

  } catch (error) {
    console.error('❌ Auth flow test failed:', error);
  }
};

export const testConnection = async () => {
  console.log('🔄 Testing Supabase Connection...');
  
  try {
    const user = await getCurrentUser();
    console.log('✅ Supabase connection successful');
    
    if (user) {
      console.log('👤 Current user:', user.email);
    } else {
      console.log('🔓 No authenticated user');
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
};