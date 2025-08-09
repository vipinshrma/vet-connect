import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { Pet, PetForm, Vaccination } from '../types';

export interface PetInsertData {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age: number;
  weight?: number;
  gender: 'male' | 'female';
  photo_url?: string;
  owner_id: string;
  medical_history?: string[];
  created_at: string;
  updated_at: string;
}

export interface PetUpdateData {
  name?: string;
  species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age?: number;
  weight?: number;
  gender?: 'male' | 'female';
  photo_url?: string;
  medical_history?: string[];
  updated_at: string;
}

// Convert Supabase pet data to app Pet type
const convertSupabasePetToPet = (supabasePet: any): Pet => ({
  id: supabasePet.id,
  name: supabasePet.name,
  species: supabasePet.species,
  breed: supabasePet.breed,
  age: supabasePet.age,
  weight: supabasePet.weight,
  gender: supabasePet.gender,
  photoURL: supabasePet.photo_url,
  ownerId: supabasePet.owner_id,
  medicalHistory: supabasePet.medical_history || [],
  vaccinations: [], // Will be loaded separately
  createdAt: supabasePet.created_at,
  updatedAt: supabasePet.updated_at,
});

class SupabasePetService {
  async getUserPets(userId: string): Promise<Pet[]> {
    console.log('🔧 [DEBUG] Fetching pets for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🔧 [DEBUG] Error fetching pets:', error);
        throw new Error(`Failed to fetch pets: ${error.message}`);
      }

      console.log('🔧 [DEBUG] Fetched pets:', data);

      if (!data) {
        return [];
      }

      return data.map(convertSupabasePetToPet);
    } catch (error: any) {
      console.error('Error fetching user pets:', error);
      throw error;
    }
  }

  async addPet(petData: PetForm & { ownerId: string }): Promise<Pet> {
    console.log('🔧 [DEBUG] Adding pet:', petData);
    
    try {
      const insertData: PetInsertData = {
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        age: petData.age,
        weight: petData.weight,
        gender: petData.gender,
        owner_id: petData.ownerId,
        medical_history: petData.medicalHistory ? [petData.medicalHistory] : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('🔧 [DEBUG] Insert data:', insertData);

      const { data, error } = await supabase
        .from('pets')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('🔧 [DEBUG] Error adding pet:', error);
        throw new Error(`Failed to add pet: ${error.message}`);
      }

      console.log('🔧 [DEBUG] Pet added successfully:', data);

      return convertSupabasePetToPet(data);
    } catch (error: any) {
      console.error('Error adding pet:', error);
      throw error;
    }
  }

  async updatePet(petId: string, updates: Partial<PetForm>): Promise<Pet> {
    console.log('🔧 [DEBUG] Updating pet:', petId, updates);
    
    try {
      // Get current user to ensure ownership
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const updateData: PetUpdateData = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are being updated
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.species !== undefined) updateData.species = updates.species;
      if (updates.breed !== undefined) updateData.breed = updates.breed;
      if (updates.age !== undefined) updateData.age = updates.age;
      if (updates.weight !== undefined) updateData.weight = updates.weight;
      if (updates.gender !== undefined) updateData.gender = updates.gender;
      if (updates.medicalHistory !== undefined) {
        updateData.medical_history = updates.medicalHistory ? [updates.medicalHistory] : [];
      }

      console.log('🔧 [DEBUG] Update data:', updateData);

      const { data, error } = await supabase
        .from('pets')
        .update(updateData)
        .eq('id', petId)
        .eq('owner_id', user.id) // Ensure user owns the pet
        .select()
        .single();

      if (error) {
        console.error('🔧 [DEBUG] Error updating pet:', error);
        throw new Error(`Failed to update pet: ${error.message}`);
      }

      if (!data) {
        throw new Error('Pet not found');
      }

      console.log('🔧 [DEBUG] Pet updated successfully:', data);

      return convertSupabasePetToPet(data);
    } catch (error: any) {
      console.error('Error updating pet:', error);
      throw error;
    }
  }

  async deletePet(petId: string): Promise<void> {
    console.log('🔧 [DEBUG] Deleting pet:', petId);
    
    try {
      // Get current user to ensure ownership
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId)
        .eq('owner_id', user.id); // Ensure user owns the pet

      if (error) {
        console.error('🔧 [DEBUG] Error deleting pet:', error);
        throw new Error(`Failed to delete pet: ${error.message}`);
      }

      console.log('🔧 [DEBUG] Pet deleted successfully');
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  }

  async uploadPetPhoto(petId: string, photoUri: string): Promise<string> {
    console.log('🔧 [DEBUG] Uploading photo for pet:', petId, 'URI:', photoUri);
    
    try {
      // Create a unique filename
      const fileExt = photoUri.split('.').pop() || 'jpg';
      const fileName = `pet-${petId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      console.log('🔧 [DEBUG] File details:', { fileName, filePath, fileExt });

      // Read the file as ArrayBuffer for React Native
      const response = await fetch(photoUri);
      console.log('🔧 [DEBUG] Fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('🔧 [DEBUG] File size in bytes:', arrayBuffer.byteLength);

      if (arrayBuffer.byteLength === 0) {
        throw new Error('Image file is empty or corrupted');
      }

      console.log('🔧 [DEBUG] Uploading to Supabase Storage...');

      // Upload to Supabase Storage using ArrayBuffer
      const bucket = (Constants.expoConfig?.extra as any)?.SUPABASE_STORAGE_BUCKET || 'vet-connect-media';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('🔧 [DEBUG] Error uploading photo:', uploadError);
        throw new Error(`Failed to upload photo: ${uploadError.message}`);
      }

      console.log('🔧 [DEBUG] Photo uploaded:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('🔧 [DEBUG] Public URL:', publicUrl);

      // Get current user to ensure ownership
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Update pet record with photo URL, ensuring ownership
      const { error: updateError } = await supabase
        .from('pets')
        .update({ 
          photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', petId)
        .eq('owner_id', user.id); // Ensure user owns the pet

      if (updateError) {
        console.error('🔧 [DEBUG] Error updating pet with photo URL:', updateError);
        // Clean up uploaded file if pet update failed
        await supabase.storage
          .from(bucket)
          .remove([filePath]);
        
        throw new Error(`Failed to update pet record: ${updateError.message}`);
      }

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading pet photo:', error);
      throw error;
    }
  }

  async selectAndUploadPhoto(petId: string): Promise<string | null> {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        throw new Error('Permission to access camera roll is required!');
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUrl = await this.uploadPetPhoto(petId, result.assets[0].uri);
        return photoUrl;
      }

      return null;
    } catch (error) {
      console.error('Error selecting/uploading photo:', error);
      throw error;
    }
  }

  async selectAndUploadPhotoWithCallback(petId: string, callbacks: { onImageSelected: () => void }): Promise<string | null> {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        throw new Error('Permission to access camera roll is required!');
      }

      // Pick image (no loading state yet)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // User selected an image - now trigger the loading state
        console.log('🔧 [DEBUG] Image selected, triggering callback');
        callbacks.onImageSelected();
        
        // Now upload the photo
        const photoUrl = await this.uploadPetPhoto(petId, result.assets[0].uri);
        return photoUrl;
      }

      return null;
    } catch (error) {
      console.error('Error selecting/uploading photo:', error);
      throw error;
    }
  }

  async getPetDetails(petId: string): Promise<Pet> {
    console.log('🔧 [DEBUG] Fetching pet details:', petId);
    
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (error) {
        console.error('🔧 [DEBUG] Error fetching pet details:', error);
        throw new Error(`Failed to fetch pet details: ${error.message}`);
      }

      if (!data) {
        throw new Error('Pet not found');
      }

      console.log('🔧 [DEBUG] Pet details fetched:', data);

      return convertSupabasePetToPet(data);
    } catch (error: any) {
      console.error('Error fetching pet details:', error);
      throw error;
    }
  }

  // Vaccination methods (if you want to implement them)
  async addVaccination(petId: string, vaccination: Omit<Vaccination, 'id'>): Promise<Vaccination> {
    // TODO: Implement vaccination tracking in separate table
    console.log('🔧 [DEBUG] Adding vaccination for pet:', petId, vaccination);
    
    // For now, return mock data
    return {
      id: Date.now().toString(),
      ...vaccination,
    };
  }

  async updateVaccination(vaccinationId: string, updates: Partial<Vaccination>): Promise<Vaccination> {
    // TODO: Implement vaccination updates
    console.log('🔧 [DEBUG] Updating vaccination:', vaccinationId, updates);
    
    return {
      id: vaccinationId,
      name: updates.name || 'Updated Vaccination',
      date: updates.date || new Date().toISOString(),
      nextDue: updates.nextDue,
      veterinarianId: updates.veterinarianId || '1',
    };
  }

  async deleteVaccination(vaccinationId: string): Promise<void> {
    // TODO: Implement vaccination deletion
    console.log('🔧 [DEBUG] Deleting vaccination:', vaccinationId);
  }

  async getVaccinationSchedule(petId: string): Promise<Vaccination[]> {
    // TODO: Implement vaccination schedule fetching
    console.log('🔧 [DEBUG] Fetching vaccination schedule for pet:', petId);
    
    return [];
  }
}

export const supabasePetService = new SupabasePetService();