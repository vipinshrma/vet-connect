/**
 * Test utilities for Veterinarian Service with Supabase integration
 */

import { supabaseVetService } from '../services/supabaseVetService';
import { supabaseClinicService } from '../services/supabaseClinicService';

// Test functions for veterinarian operations
export const testVetOperations = async () => {
  console.log('🧪 Testing Veterinarian Service Operations');
  console.log('=========================================');

  try {
    // Test 1: Get all veterinarians
    console.log('1. Testing getAllVeterinarians...');
    const allVets = await supabaseVetService.getAllVeterinarians();
    console.log(`✅ Found ${allVets.length} veterinarians`);
    
    if (allVets.length > 0) {
      console.log(`   Sample: ${allVets[0].name} - ${allVets[0].specialties.join(', ')}`);
    }

    // Test 2: Get veterinarian by ID
    if (allVets.length > 0) {
      console.log('2. Testing getVeterinarianById...');
      const firstVet = allVets[0];
      const vetById = await supabaseVetService.getVeterinarianById(firstVet.id);
      console.log(`✅ Retrieved vet by ID: ${vetById?.name || 'Not found'}`);
    }

    // Test 3: Get veterinarians by specialty
    console.log('3. Testing getVeterinariansBySpecialty...');
    const emergencyVets = await supabaseVetService.getVeterinariansBySpecialty('Emergency Medicine');
    console.log(`✅ Emergency Medicine specialists: ${emergencyVets.length}`);

    // Test 4: Get emergency veterinarians
    console.log('4. Testing getEmergencyVeterinarians...');
    const allEmergencyVets = await supabaseVetService.getEmergencyVeterinarians();
    console.log(`✅ All emergency veterinarians: ${allEmergencyVets.length}`);

    // Test 5: Get top-rated veterinarians
    console.log('5. Testing getTopRatedVeterinarians...');
    const topVets = await supabaseVetService.getTopRatedVeterinarians(5);
    console.log(`✅ Top 5 rated veterinarians:`);
    topVets.forEach((vet, index) => {
      console.log(`   ${index + 1}. ${vet.name} - Rating: ${vet.rating}`);
    });

    // Test 6: Search veterinarians
    console.log('6. Testing searchVeterinarians...');
    const searchResults = await supabaseVetService.searchVeterinarians('Sarah');
    console.log(`✅ Search results for 'Sarah': ${searchResults.length}`);

    // Test 7: Get veterinarians by clinic
    if (allVets.length > 0) {
      console.log('7. Testing getVeterinariansByClinic...');
      const firstVetClinicId = allVets[0].clinicId;
      const clinicVets = await supabaseVetService.getVeterinariansByClinic(firstVetClinicId);
      console.log(`✅ Veterinarians in clinic ${firstVetClinicId}: ${clinicVets.length}`);
    }

    console.log('🎉 All veterinarian operations tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Veterinarian operations test failed:', error);
    return false;
  }
};

// Test clinic operations
export const testClinicOperations = async () => {
  console.log('🧪 Testing Clinic Service Operations');
  console.log('===================================');

  try {
    // Test 1: Get all clinics
    console.log('1. Testing getAllClinics...');
    const allClinics = await supabaseClinicService.getAllClinics();
    console.log(`✅ Found ${allClinics.length} clinics`);
    
    if (allClinics.length > 0) {
      console.log(`   Sample: ${allClinics[0].name} - ${allClinics[0].city}, ${allClinics[0].state}`);
    }

    // Test 2: Get clinic by ID
    if (allClinics.length > 0) {
      console.log('2. Testing getClinicById...');
      const firstClinic = allClinics[0];
      const clinicById = await supabaseClinicService.getClinicById(firstClinic.id);
      console.log(`✅ Retrieved clinic by ID: ${clinicById?.name || 'Not found'}`);
    }

    console.log('🎉 All clinic operations tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Clinic operations test failed:', error);
    return false;
  }
};

// Test data integration
export const testDataIntegration = async () => {
  console.log('🧪 Testing Data Integration');
  console.log('===========================');

  try {
    // Get vets and clinics
    const vets = await supabaseVetService.getAllVeterinarians();
    const clinics = await supabaseClinicService.getAllClinics();

    console.log(`Found ${vets.length} veterinarians and ${clinics.length} clinics`);

    // Check if all vets have valid clinic IDs
    let validClinicIds = 0;
    const clinicIds = new Set(clinics.map(c => c.id));

    for (const vet of vets) {
      if (clinicIds.has(vet.clinicId)) {
        validClinicIds++;
      } else {
        console.log(`⚠️ Vet ${vet.name} has invalid clinic ID: ${vet.clinicId}`);
      }
    }

    console.log(`✅ ${validClinicIds}/${vets.length} veterinarians have valid clinic IDs`);

    // Test specialty distribution
    const specialties = new Map<string, number>();
    vets.forEach(vet => {
      vet.specialties.forEach(specialty => {
        specialties.set(specialty, (specialties.get(specialty) || 0) + 1);
      });
    });

    console.log('📊 Specialty distribution:');
    [...specialties.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([specialty, count]) => {
        console.log(`   ${specialty}: ${count} vets`);
      });

    // Test rating distribution
    const ratingRanges = {
      '4.8-5.0': 0,
      '4.5-4.7': 0,
      '4.0-4.4': 0,
      '< 4.0': 0
    };

    vets.forEach(vet => {
      if (vet.rating >= 4.8) ratingRanges['4.8-5.0']++;
      else if (vet.rating >= 4.5) ratingRanges['4.5-4.7']++;
      else if (vet.rating >= 4.0) ratingRanges['4.0-4.4']++;
      else ratingRanges['< 4.0']++;
    });

    console.log('📊 Rating distribution:');
    Object.entries(ratingRanges).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} vets`);
    });

    console.log('🎉 Data integration test passed!');
    return true;

  } catch (error) {
    console.error('❌ Data integration test failed:', error);
    return false;
  }
};

// Run all tests
export const runAllVetTests = async () => {
  console.log('🚀 Running All Veterinarian Service Tests');
  console.log('==========================================');

  const vetTestResult = await testVetOperations();
  const clinicTestResult = await testClinicOperations();
  const integrationTestResult = await testDataIntegration();

  console.log('\n📋 Test Results Summary:');
  console.log(`Veterinarian Operations: ${vetTestResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Clinic Operations: ${clinicTestResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Data Integration: ${integrationTestResult ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = vetTestResult && clinicTestResult && integrationTestResult;
  console.log(`\nOverall Result: ${allPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);

  return allPassed;
};

// Debug function to check database connectivity
export const debugVetDatabase = async () => {
  console.log('🔍 Debugging Veterinarian Database');
  console.log('===================================');

  try {
    console.log('Testing database connection...');
    const vets = await supabaseVetService.getAllVeterinarians();
    console.log(`✅ Database connected successfully`);
    console.log(`   Found ${vets.length} veterinarians`);
    
    if (vets.length === 0) {
      console.log('💡 No veterinarians found. Run the SQL scripts:');
      console.log('   1. supabase-setup.sql');
      console.log('   2. supabase-veterinarians-data.sql');
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('💡 Check your Supabase configuration in src/config/supabase.ts');
    console.log('💡 Make sure the veterinarians table exists in Supabase');
    return false;
  }
};