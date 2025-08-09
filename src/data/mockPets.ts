import { Pet, Vaccination } from '../types';

// Mock vaccination data
const mockVaccinations: Vaccination[] = [
  {
    id: 'vac-1',
    name: 'Rabies',
    date: new Date('2023-06-15'),
    nextDue: new Date('2024-06-15'),
    veterinarianId: 'vet-1',
  },
  {
    id: 'vac-2',
    name: 'DHPP',
    date: new Date('2023-05-20'),
    nextDue: new Date('2024-05-20'),
    veterinarianId: 'vet-1',
  },
  {
    id: 'vac-3',
    name: 'Bordetella',
    date: new Date('2023-07-10'),
    nextDue: new Date('2024-01-10'),
    veterinarianId: 'vet-2',
  },
  {
    id: 'vac-4',
    name: 'FVRCP',
    date: new Date('2023-04-25'),
    nextDue: new Date('2024-04-25'),
    veterinarianId: 'vet-3',
  },
  {
    id: 'vac-5',
    name: 'FeLV',
    date: new Date('2023-08-12'),
    nextDue: new Date('2024-08-12'),
    veterinarianId: 'vet-3',
  },
];

export const mockPets: Pet[] = [
  {
    id: 'pet-1',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 65,
    gender: 'male',
    photoURL: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
    ownerId: 'user-1',
    medicalHistory: [
      'Regular checkup - 2023-08-15',
      'Dental cleaning - 2023-06-20',
      'Minor ear infection treated - 2023-04-10',
    ],
    vaccinations: [mockVaccinations[0], mockVaccinations[1], mockVaccinations[2]],
    createdAt: new Date('2021-03-15'),
    updatedAt: new Date('2023-08-15'),
  },
  {
    id: 'pet-2',
    name: 'Luna',
    species: 'cat',
    breed: 'Maine Coon',
    age: 2,
    weight: 12,
    gender: 'female',
    photoURL: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
    ownerId: 'user-1',
    medicalHistory: [
      'Spay surgery - 2022-09-10',
      'Annual checkup - 2023-07-22',
      'Flea treatment - 2023-05-30',
    ],
    vaccinations: [mockVaccinations[3], mockVaccinations[4]],
    createdAt: new Date('2022-01-20'),
    updatedAt: new Date('2023-07-22'),
  },
  {
    id: 'pet-3',
    name: 'Max',
    species: 'dog',
    breed: 'German Shepherd',
    age: 5,
    weight: 75,
    gender: 'male',
    photoURL: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=400&fit=crop',
    ownerId: 'user-1',
    medicalHistory: [
      'Hip dysplasia screening - 2023-03-14',
      'Allergy treatment - 2023-06-05',
      'Regular checkup - 2023-09-18',
    ],
    vaccinations: [mockVaccinations[0], mockVaccinations[1]],
    createdAt: new Date('2019-08-12'),
    updatedAt: new Date('2023-09-18'),
  },
  {
    id: 'pet-4',
    name: 'Bella',
    species: 'dog',
    breed: 'Labrador',
    age: 1,
    weight: 45,
    gender: 'female',
    photoURL: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop',
    ownerId: 'user-1',
    medicalHistory: [
      'Puppy vaccinations - 2023-02-15',
      'Spay surgery - 2023-08-20',
      'First checkup - 2023-01-10',
    ],
    vaccinations: [mockVaccinations[0], mockVaccinations[1], mockVaccinations[2]],
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-08-20'),
  },
  {
    id: 'pet-5',
    name: 'Whiskers',
    species: 'cat',
    breed: 'Siamese',
    age: 6,
    weight: 10,
    gender: 'male',
    photoURL: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&h=400&fit=crop',
    ownerId: 'user-1',
    medicalHistory: [
      'Dental cleaning - 2023-04-18',
      'Senior wellness exam - 2023-07-30',
      'Kidney health check - 2023-09-25',
    ],
    vaccinations: [mockVaccinations[3], mockVaccinations[4]],
    createdAt: new Date('2018-05-22'),
    updatedAt: new Date('2023-09-25'),
  },
  {
    id: 'pet-6',
    name: 'Rocky',
    species: 'dog',
    breed: 'Bulldog',
    age: 4,
    weight: 55,
    gender: 'male',
    photoURL: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400&h=400&fit=crop',
    ownerId: 'user-1',
    medicalHistory: [
      'Breathing assessment - 2023-01-22',
      'Weight management program - 2023-05-12',
      'Skin allergy treatment - 2023-08-08',
    ],
    vaccinations: [mockVaccinations[0], mockVaccinations[1]],
    createdAt: new Date('2020-02-14'),
    updatedAt: new Date('2023-08-08'),
  },
];

// Helper functions for pet data
export const getPetById = (petId: string): Pet | undefined => {
  return mockPets.find(pet => pet.id === petId);
};

export const getPetsByOwner = (ownerId: string): Pet[] => {
  return mockPets.filter(pet => pet.ownerId === ownerId);
};

export const getPetsBySpecies = (species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'): Pet[] => {
  return mockPets.filter(pet => pet.species === species);
};

export const getUpcomingVaccinations = (petId?: string): Vaccination[] => {
  const pets = petId ? [getPetById(petId)].filter(Boolean) : mockPets;
  const upcoming: Vaccination[] = [];
  
  pets.forEach(pet => {
    if (pet?.vaccinations) {
      pet.vaccinations.forEach(vaccination => {
        if (vaccination.nextDue && vaccination.nextDue > new Date()) {
          const daysDiff = Math.ceil((vaccination.nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 60) { // Due within 60 days
            upcoming.push(vaccination);
          }
        }
      });
    }
  });
  
  return upcoming.sort((a, b) => 
    (a.nextDue?.getTime() || 0) - (b.nextDue?.getTime() || 0)
  );
};

export const getPetAge = (pet: Pet): string => {
  if (pet.age < 1) {
    return `${Math.round(pet.age * 12)} months`;
  }
  return `${pet.age} year${pet.age !== 1 ? 's' : ''}`;
};

export const getPetWeight = (pet: Pet): string => {
  return pet.weight ? `${pet.weight} lbs` : 'Weight not recorded';
};