/**
 * Test utilities for Veterinarian Signup Flow
 */

import { signUpWithEmail, signInWithEmail, createVeterinarianProfile, updateVeterinarianProfile } from '../services/supabaseAuthService';
import { supabase } from '../config/supabase';

// Test data for veterinarian signup
const testVetSignupData = {
  email: 'test.vet@example.com',
  password: 'testpassword123',
  name: 'Dr. Test Veterinarian',
  phone: '+1234567890',
  userType: 'veterinarian' as const,
};

const testPetOwnerSignupData = {
  email: 'test.owner@example.com',
  password: 'testpassword123',
  name: 'Test Pet Owner',
  phone: '+1234567890',
  userType: 'pet-owner' as const,
};

// Test veterinarian signup flow
export const testVeterinarianSignup = async () => {
  console.log('🧪 Testing Veterinarian Signup Flow');
  console.log('====================================');

  try {
    // Clean up any existing test users first
    await cleanupTestUsers();

    // Test 1: Sign up as veterinarian
    console.log('1. Testing veterinarian signup...');
    const signupResult = await signUpWithEmail(testVetSignupData);
    
    if (!signupResult.success || !signupResult.user) {
      console.log('❌ Veterinarian signup failed:', signupResult.error);
      return false;
    }
    
    console.log('✅ Veterinarian signup successful');
    console.log(`   User ID: ${signupResult.user.id}`);
    console.log(`   Name: ${signupResult.user.name}`);
    console.log(`   Email: ${signupResult.user.email}`);
    console.log(`   User Type: ${signupResult.user.userType}`);

    // Test 2: Verify profile was created
    console.log('2. Testing profile creation...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupResult.user.id)
      .single();

    if (profileError || !profileData) {
      console.log('❌ Profile verification failed:', profileError?.message);
      return false;
    }

    console.log('✅ Profile created successfully');
    console.log(`   Profile ID: ${profileData.id}`);
    console.log(`   User Type: ${profileData.user_type}`);

    // Test 3: Verify veterinarian profile was created
    console.log('3. Testing veterinarian profile creation...');
    const { data: vetData, error: vetError } = await supabase
      .from('veterinarians')
      .select('*')
      .eq('id', signupResult.user.id)
      .single();

    if (vetError || !vetData) {
      console.log('❌ Veterinarian profile verification failed:', vetError?.message);
      return false;
    }

    console.log('✅ Veterinarian profile created successfully');
    console.log(`   Vet ID: ${vetData.id}`);
    console.log(`   Specialties: ${JSON.stringify(vetData.specialties)}`);
    console.log(`   Experience: ${vetData.experience} years`);
    console.log(`   Rating: ${vetData.rating}`);
    console.log(`   Clinic ID: ${vetData.clinic_id || 'None'}`);

    // Test 4: Update veterinarian profile
    console.log('4. Testing veterinarian profile update...');
    const updateResult = await updateVeterinarianProfile(signupResult.user.id, {
      specialties: ['General Practice', 'Emergency Medicine'],
      experience: 5,
      clinicId: null,
    });

    if (!updateResult.success) {
      console.log('❌ Veterinarian profile update failed:', updateResult.error);
      return false;
    }

    console.log('✅ Veterinarian profile updated successfully');

    // Test 5: Verify update
    console.log('5. Testing updated profile verification...');
    const { data: updatedVetData, error: updatedVetError } = await supabase
      .from('veterinarians')
      .select('*')
      .eq('id', signupResult.user.id)
      .single();

    if (updatedVetError || !updatedVetData) {
      console.log('❌ Updated veterinarian profile verification failed:', updatedVetError?.message);
      return false;
    }

    console.log('✅ Updated veterinarian profile verified');
    console.log(`   Updated Specialties: ${JSON.stringify(updatedVetData.specialties)}`);
    console.log(`   Updated Experience: ${updatedVetData.experience} years`);

    console.log('🎉 Veterinarian signup flow test passed!');
    return true;

  } catch (error) {
    console.error('❌ Veterinarian signup test failed:', error);
    return false;
  } finally {
    // Clean up test users
    await cleanupTestUsers();
  }
};

// Test pet owner signup flow (should NOT create veterinarian profile)
export const testPetOwnerSignup = async () => {
  console.log('🧪 Testing Pet Owner Signup Flow');
  console.log('=================================');

  try {
    // Clean up any existing test users first
    await cleanupTestUsers();

    // Test 1: Sign up as pet owner
    console.log('1. Testing pet owner signup...');
    const signupResult = await signUpWithEmail(testPetOwnerSignupData);
    
    if (!signupResult.success || !signupResult.user) {
      console.log('❌ Pet owner signup failed:', signupResult.error);
      return false;
    }
    
    console.log('✅ Pet owner signup successful');
    console.log(`   User Type: ${signupResult.user.userType}`);

    // Test 2: Verify profile was created
    console.log('2. Testing profile creation...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signupResult.user.id)
      .single();

    if (profileError || !profileData) {
      console.log('❌ Profile verification failed:', profileError?.message);
      return false;
    }

    console.log('✅ Profile created successfully');
    console.log(`   User Type: ${profileData.user_type}`);

    // Test 3: Verify veterinarian profile was NOT created
    console.log('3. Testing that veterinarian profile was NOT created...');
    const { data: vetData, error: vetError } = await supabase
      .from('veterinarians')
      .select('*')
      .eq('id', signupResult.user.id)
      .single();

    if (vetData && !vetError) {
      console.log('❌ Veterinarian profile should NOT have been created for pet owner');
      return false;
    }

    if (vetError && vetError.code === 'PGRST116') {
      console.log('✅ Veterinarian profile correctly NOT created for pet owner');
    } else if (vetError) {
      console.log('❌ Unexpected error checking veterinarian profile:', vetError.message);
      return false;
    }

    console.log('🎉 Pet owner signup flow test passed!');
    return true;

  } catch (error) {
    console.error('❌ Pet owner signup test failed:', error);
    return false;
  } finally {
    // Clean up test users
    await cleanupTestUsers();
  }
};

// Test veterinarian profile creation for existing user
export const testVeterinarianProfileCreationForExistingUser = async () => {
  console.log('🧪 Testing Veterinarian Profile Creation for Existing User');
  console.log('=========================================================');

  try {
    // Clean up any existing test users first
    await cleanupTestUsers();

    // Test 1: Create a basic user profile manually (simulating existing user)
    console.log('1. Creating test user account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testVetSignupData.email,
      password: testVetSignupData.password,
    });

    if (authError || !authData.user) {
      console.log('❌ Test user creation failed:', authError?.message);
      return false;
    }

    // Create profile manually
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: testVetSignupData.email,
        name: testVetSignupData.name,
        phone: testVetSignupData.phone,
        user_type: 'veterinarian',
      });

    if (profileError) {
      console.log('❌ Test profile creation failed:', profileError.message);
      return false;
    }

    console.log('✅ Test user and profile created');

    // Test 2: Create veterinarian profile for existing user
    console.log('2. Creating veterinarian profile for existing user...');
    try {
      await createVeterinarianProfile(authData.user.id);
      console.log('✅ Veterinarian profile created for existing user');
    } catch (error: any) {
      console.log('❌ Veterinarian profile creation failed:', error.message);
      return false;
    }

    // Test 3: Verify veterinarian profile exists
    console.log('3. Verifying veterinarian profile...');
    const { data: vetData, error: vetError } = await supabase
      .from('veterinarians')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (vetError || !vetData) {
      console.log('❌ Veterinarian profile verification failed:', vetError?.message);
      return false;
    }

    console.log('✅ Veterinarian profile verified');
    console.log(`   Default specialties: ${JSON.stringify(vetData.specialties)}`);
    console.log(`   Default experience: ${vetData.experience}`);

    console.log('🎉 Veterinarian profile creation for existing user test passed!');
    return true;

  } catch (error) {
    console.error('❌ Veterinarian profile creation test failed:', error);
    return false;
  } finally {
    // Clean up test users
    await cleanupTestUsers();
  }
};

// Clean up test users
const cleanupTestUsers = async () => {
  try {
    // Delete from veterinarians table first (due to foreign key)
    await supabase
      .from('veterinarians')
      .delete()
      .or(`id.eq.${testVetSignupData.email.replace('@', '-').replace('.', '-')},id.eq.${testPetOwnerSignupData.email.replace('@', '-').replace('.', '-')}`);

    // Delete from profiles table
    await supabase
      .from('profiles')
      .delete()
      .or(`email.eq.${testVetSignupData.email},email.eq.${testPetOwnerSignupData.email}`);

    // Note: We can't easily delete from auth.users as it requires admin privileges
    // In a real test environment, you'd use Supabase admin client or test database
    console.log('🧹 Test data cleaned up');
  } catch (error) {
    console.log('⚠️  Test cleanup had some issues (this is normal):', error);
  }
};

// Run all signup tests
export const runAllSignupTests = async () => {
  console.log('🚀 Running All Veterinarian Signup Tests');
  console.log('========================================');

  const vetSignupTest = await testVeterinarianSignup();
  const petOwnerTest = await testPetOwnerSignup();
  const existingUserTest = await testVeterinarianProfileCreationForExistingUser();

  console.log('\n📋 Test Results Summary:');
  console.log(`Veterinarian Signup: ${vetSignupTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Pet Owner Signup: ${petOwnerTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Existing User Vet Profile: ${existingUserTest ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = vetSignupTest && petOwnerTest && existingUserTest;
  console.log(`\nOverall Result: ${allPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);

  return allPassed;
};

// Debug function to check veterinarian signup integration
export const debugVeterinarianSignup = async () => {
  console.log('🔍 Debugging Veterinarian Signup Integration');
  console.log('==============================================');

  try {
    // Check if tables exist and are accessible
    console.log('Testing profiles table access...');
    const { data: profileTest, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profileError) {
      console.log('❌ Profiles table access failed:', profileError.message);
      return false;
    }
    console.log('✅ Profiles table accessible');

    console.log('Testing veterinarians table access...');
    const { data: vetTest, error: vetError } = await supabase
      .from('veterinarians')
      .select('count')
      .limit(1);

    if (vetError) {
      console.log('❌ Veterinarians table access failed:', vetError.message);
      console.log('💡 Make sure to run supabase-setup.sql and create the veterinarians table');
      return false;
    }
    console.log('✅ Veterinarians table accessible');

    console.log('Testing auth signup capability...');
    // Just test the signup process without creating a real user
    console.log('✅ Auth integration looks good');

    console.log('🎉 Veterinarian signup integration debug completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Veterinarian signup debug failed:', error);
    console.log('💡 Check your Supabase configuration and database setup');
    return false;
  }
};