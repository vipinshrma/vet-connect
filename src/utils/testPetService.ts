/**
 * Test utilities for Pet Service with Supabase integration
 */

import { supabasePetService } from '../services/supabasePetService';
import { petService } from '../services/petService';
import { PetForm } from '../types';

// Test data for pets
export const testPetData: PetForm & { ownerId: string } = {
  name: 'Test Pet',
  species: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  weight: 25.5,
  gender: 'male',
  medicalHistory: 'Vaccinated and healthy',
  ownerId: '', // Will be set when testing
};

export const testPetUpdate: Partial<PetForm> = {
  name: 'Updated Pet Name',
  age: 4,
  weight: 27.0,
  medicalHistory: 'Updated medical history',
};

// Test functions
export const testPetOperations = async (userId: string) => {
  console.log('🧪 Testing Pet Service Operations');
  console.log('==================================');

  try {
    // Test 1: Get user pets (should start empty)
    console.log('1. Testing getUserPets...');
    const initialPets = await petService.getUserPets(userId);
    console.log(`✅ Initial pets count: ${initialPets.length}`);

    // Test 2: Add a pet
    console.log('2. Testing addPet...');
    const newPetData = { ...testPetData, ownerId: userId };
    const addedPet = await petService.addPet(newPetData);
    console.log(`✅ Pet added with ID: ${addedPet.id}`);
    console.log(`   Name: ${addedPet.name}, Species: ${addedPet.species}`);

    // Test 3: Get pet details
    console.log('3. Testing getPetDetails...');
    const petDetails = await petService.getPetDetails(addedPet.id);
    console.log(`✅ Pet details: ${petDetails.name} (${petDetails.species})`);

    // Test 4: Update pet
    console.log('4. Testing updatePet...');
    const updatedPet = await petService.updatePet(addedPet.id, testPetUpdate);
    console.log(`✅ Pet updated: ${updatedPet.name}, Age: ${updatedPet.age}`);

    // Test 5: Get user pets again (should have 1 pet)
    console.log('5. Testing getUserPets after adding...');
    const petsAfterAdd = await petService.getUserPets(userId);
    console.log(`✅ Pets count after add: ${petsAfterAdd.length}`);

    // Test 6: Delete pet
    console.log('6. Testing deletePet...');
    await petService.deletePet(addedPet.id);
    console.log(`✅ Pet deleted successfully`);

    // Test 7: Get user pets after deletion (should be empty again)
    console.log('7. Testing getUserPets after deletion...');
    const petsAfterDelete = await petService.getUserPets(userId);
    console.log(`✅ Pets count after delete: ${petsAfterDelete.length}`);

    console.log('🎉 All pet operations tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Pet operations test failed:', error);
    return false;
  }
};

// Test photo upload (requires actual image picker)
export const testPhotoUpload = async (petId: string) => {
  console.log('🧪 Testing Photo Upload');
  console.log('======================');

  try {
    // This will prompt user to select a photo
    const photoUrl = await petService.selectAndUploadPhoto(petId);
    
    if (photoUrl) {
      console.log(`✅ Photo uploaded successfully: ${photoUrl}`);
      return photoUrl;
    } else {
      console.log('ℹ️ No photo selected');
      return null;
    }
  } catch (error) {
    console.error('❌ Photo upload failed:', error);
    return null;
  }
};

// Debug function to check pets table structure
export const debugPetsTable = async () => {
  console.log('🔍 Debugging Pets Table');
  console.log('========================');

  try {
    // Try to query pets table directly
    const { data, error } = await supabasePetService['supabase']
      .from('pets')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error querying pets table:', error);
      console.log('💡 Make sure the pets table exists in Supabase');
      console.log('💡 Run the SQL schema file: supabase-pets-schema.sql');
      return false;
    }

    console.log('✅ Pets table is accessible');
    console.log(`   Found ${data?.length || 0} pets in table`);
    
    if (data && data.length > 0) {
      console.log('   Sample pet:', data[0]);
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to debug pets table:', error);
    return false;
  }
};

// Function to create sample pets for testing
export const createSamplePets = async (userId: string, count: number = 3) => {
  console.log(`🧪 Creating ${count} Sample Pets`);
  console.log('===============================');

  const samplePets = [
    {
      name: 'Buddy',
      species: 'dog' as const,
      breed: 'Golden Retriever',
      age: 3,
      weight: 30,
      gender: 'male' as const,
      medicalHistory: 'Vaccinated, neutered',
      ownerId: userId,
    },
    {
      name: 'Whiskers',
      species: 'cat' as const,
      breed: 'Persian',
      age: 2,
      weight: 4.5,
      gender: 'female' as const,
      medicalHistory: 'Spayed, up to date on shots',
      ownerId: userId,
    },
    {
      name: 'Tweety',
      species: 'bird' as const,
      breed: 'Canary',
      age: 1,
      weight: 0.02,
      gender: 'male' as const,
      medicalHistory: 'Healthy',
      ownerId: userId,
    },
  ];

  try {
    const createdPets = [];
    
    for (let i = 0; i < Math.min(count, samplePets.length); i++) {
      const pet = await petService.addPet(samplePets[i]);
      createdPets.push(pet);
      console.log(`✅ Created pet: ${pet.name} (${pet.species})`);
    }

    console.log(`🎉 Created ${createdPets.length} sample pets!`);
    return createdPets;

  } catch (error) {
    console.error('❌ Failed to create sample pets:', error);
    return [];
  }
};