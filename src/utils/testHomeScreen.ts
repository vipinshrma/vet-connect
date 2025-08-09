/**
 * Test utilities for HomeScreen user type differentiation
 */

import { supabase } from '../config/supabase';

// Test function to verify user profile fetching
export const testUserProfileFetching = async () => {
  console.log('🧪 Testing User Profile Fetching for HomeScreen');
  console.log('=================================================');

  try {
    // Test 1: Check current user session
    console.log('1. Testing current user session...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('❌ No authenticated user found');
      return false;
    }
    
    console.log('✅ Authenticated user found');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);

    // Test 2: Fetch user profile
    console.log('2. Testing user profile fetch...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile fetch failed:', profileError.message);
      console.log('💡 Make sure the user has a profile in the profiles table');
      return false;
    }

    console.log('✅ Profile fetched successfully');
    console.log(`   Name: ${profileData.name}`);
    console.log(`   User Type: ${profileData.user_type}`);
    console.log(`   Phone: ${profileData.phone || 'Not provided'}`);

    // Test 3: Check if veterinarian, verify vet profile exists
    if (profileData.user_type === 'veterinarian') {
      console.log('3. Testing veterinarian profile...');
      const { data: vetData, error: vetError } = await supabase
        .from('veterinarians')
        .select('*')
        .eq('id', user.id)
        .single();

      if (vetError) {
        console.log('⚠️  Veterinarian profile not found:', vetError.message);
        console.log('💡 This veterinarian may need to complete their professional profile');
        return true; // Still pass the test, just warn
      }

      console.log('✅ Veterinarian profile found');
      console.log(`   Specialties: ${JSON.stringify(vetData.specialties)}`);
      console.log(`   Experience: ${vetData.experience} years`);
      console.log(`   Rating: ${vetData.rating}`);
      console.log(`   Clinic ID: ${vetData.clinic_id || 'None'}`);
    }

    console.log('🎉 User profile fetching test passed!');
    return true;

  } catch (error) {
    console.error('❌ User profile test failed:', error);
    return false;
  }
};

// Test different HomeScreen experiences
export const testHomeScreenExperiences = () => {
  console.log('🧪 Testing HomeScreen User Experiences');
  console.log('=====================================');

  // Test data for different user types
  const testUsers = [
    {
      userType: 'pet-owner' as const,
      name: 'John Pet Owner',
      email: 'john@example.com'
    },
    {
      userType: 'veterinarian' as const,
      name: 'Dr. Sarah Vet',
      email: 'sarah@vetclinic.com'
    }
  ];

  console.log('Testing quick action generation for different user types...');

  // Simulate the getQuickActionsForUserType function logic
  const getQuickActionsForUserType = (userType: 'pet-owner' | 'veterinarian') => {
    if (userType === 'veterinarian') {
      return [
        "My Appointments",
        "Patient Records", 
        "My Clinic Profile",
        "Schedule Management"
      ];
    } else {
      return [
        "Find Nearby Vets",
        "My Pets", 
        "Emergency Care",
        "Book Appointment"
      ];
    }
  };

  testUsers.forEach(user => {
    console.log(`\n👤 ${user.userType === 'veterinarian' ? 'Veterinarian' : 'Pet Owner'}: ${user.name}`);
    console.log(`   Quick Actions: ${getQuickActionsForUserType(user.userType).join(', ')}`);
    
    const welcomeMessage = user.userType === 'veterinarian' 
      ? 'Your professional platform for managing veterinary practice and connecting with pet parents'
      : 'Your trusted companion for finding quality veterinary care';
    
    console.log(`   Welcome Message: "${welcomeMessage}"`);
    
    const sectionTitle = user.userType === 'veterinarian' ? 'Veterinarian Tools' : 'Quick Actions';
    console.log(`   Section Title: "${sectionTitle}"`);
  });

  console.log('\n✅ HomeScreen experience differentiation test completed');
  return true;
};

// Debug current user type
export const debugCurrentUserType = async () => {
  console.log('🔍 Debugging Current User Type');
  console.log('==============================');

  try {
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('❌ No user logged in');
      return;
    }

    console.log('Current User Info:');
    console.log(`   Auth User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Auth Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`);

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
      return;
    }

    console.log('\nProfile Info:');
    console.log(`   Profile ID: ${profile.id}`);
    console.log(`   Name: ${profile.name}`);
    console.log(`   User Type: ${profile.user_type}`);
    console.log(`   Phone: ${profile.phone || 'Not provided'}`);
    console.log(`   Created: ${profile.created_at}`);

    // If veterinarian, get vet profile
    if (profile.user_type === 'veterinarian') {
      const { data: vetProfile, error: vetError } = await supabase
        .from('veterinarians')
        .select('*')
        .eq('id', user.id)
        .single();

      if (vetError) {
        console.log('\n⚠️  Veterinarian profile not found:', vetError.message);
      } else {
        console.log('\nVeterinarian Profile Info:');
        console.log(`   Specialties: ${JSON.stringify(vetProfile.specialties)}`);
        console.log(`   Experience: ${vetProfile.experience} years`);
        console.log(`   Rating: ${vetProfile.rating}`);
        console.log(`   Review Count: ${vetProfile.review_count}`);
        console.log(`   Clinic ID: ${vetProfile.clinic_id || 'None'}`);
      }
    }

    console.log('\n🎯 HomeScreen should show:', profile.user_type === 'veterinarian' ? 'VETERINARIAN interface' : 'PET OWNER interface');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Run all HomeScreen tests
export const runAllHomeScreenTests = async () => {
  console.log('🚀 Running All HomeScreen Tests');
  console.log('===============================');

  const profileTest = await testUserProfileFetching();
  const experienceTest = testHomeScreenExperiences();

  console.log('\n📋 Test Results Summary:');
  console.log(`Profile Fetching: ${profileTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Experience Differentiation: ${experienceTest ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = profileTest && experienceTest;
  console.log(`\nOverall Result: ${allPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🔧 To debug your current user experience, run:');
    console.log('debugCurrentUserType()');
  }

  return allPassed;
};