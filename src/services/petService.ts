import { Pet, PetForm, Vaccination } from '../types';
import * as ImagePicker from 'expo-image-picker';
import { supabasePetService } from './supabasePetService';

class PetService {
  async getUserPets(userId: string): Promise<Pet[]> {
    return await supabasePetService.getUserPets(userId);
  }

  async addPet(petData: PetForm & { ownerId: string }): Promise<Pet> {
    return await supabasePetService.addPet(petData);
  }

  async updatePet(petId: string, updates: Partial<PetForm>): Promise<Pet> {
    return await supabasePetService.updatePet(petId, updates);
  }

  async deletePet(petId: string): Promise<void> {
    return await supabasePetService.deletePet(petId);
  }

  async uploadPetPhoto(petId: string, photoUri: string): Promise<string> {
    return await supabasePetService.uploadPetPhoto(petId, photoUri);
  }

  async selectAndUploadPhoto(petId: string): Promise<string | null> {
    return await supabasePetService.selectAndUploadPhoto(petId);
  }

  async selectAndUploadPhotoWithCallback(petId: string, callbacks: { onImageSelected: () => void }): Promise<string | null> {
    return await supabasePetService.selectAndUploadPhotoWithCallback(petId, callbacks);
  }

  async addVaccination(petId: string, vaccination: Omit<Vaccination, 'id'>): Promise<Vaccination> {
    return await supabasePetService.addVaccination(petId, vaccination);
  }

  async updateVaccination(vaccinationId: string, updates: Partial<Vaccination>): Promise<Vaccination> {
    return await supabasePetService.updateVaccination(vaccinationId, updates);
  }

  async deleteVaccination(vaccinationId: string): Promise<void> {
    return await supabasePetService.deleteVaccination(vaccinationId);
  }

  async getVaccinationSchedule(petId: string): Promise<Vaccination[]> {
    return await supabasePetService.getVaccinationSchedule(petId);
  }

  async getPetDetails(petId: string): Promise<Pet> {
    return await supabasePetService.getPetDetails(petId);
  }
}

export const petService = new PetService();