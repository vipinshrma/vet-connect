import { Veterinarian, TimeSlot } from '../types';

// Common time slots for veterinarians
const generateTimeSlots = (start: number, end: number, prefix: string, interval: number = 30): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  let slotId = 1;

  for (let hour = start; hour < end; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + interval;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const adjustedEndMinute = endMinute >= 60 ? 0 : endMinute;
      const endTime = `${endHour.toString().padStart(2, '0')}:${adjustedEndMinute.toString().padStart(2, '0')}`;
      
      slots.push({
        id: `${prefix}-${startTime.replace(':', '')}-${endTime.replace(':', '')}`,
        startTime,
        endTime,
        isAvailable: Math.random() > 0.3 // 70% chance of being available
      });
    }
  }

  return slots;
};

const morningSlots = generateTimeSlots(8, 12, 'morning');
const afternoonSlots = generateTimeSlots(13, 18, 'afternoon');
const extendedSlots = generateTimeSlots(7, 20, 'extended');
const emergencySlots = generateTimeSlots(0, 24, 'emergency', 60); // Hourly slots for emergency

export const mockVeterinarians: Veterinarian[] = [
  {
    id: 'vet-1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@happypaws.com',
    phone: '(415) 555-0123',
    photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    specialties: ['General Practice', 'Internal Medicine', 'Preventive Care'],
    experience: 8,
    rating: 4.8,
    reviewCount: 127,
    clinic_id: 'clinic-1',
    availableSlots: [...morningSlots, ...afternoonSlots],
    createdAt: new Date('2020-03-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'vet-2',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@petcare.com',
    phone: '(415) 555-0456',
    photoURL: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    specialties: ['Emergency Medicine', 'Critical Care', 'Trauma Surgery'],
    experience: 12,
    rating: 4.9,
    reviewCount: 89,
    clinic_id: 'clinic-2',
    availableSlots: emergencySlots,
    createdAt: new Date('2019-08-22'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'vet-3',
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@gganimalhospital.com',
    phone: '(415) 555-0789',
    photoURL: 'https://images.unsplash.com/photo-1594824389199-e48b8b40b2d4?w=400&h=400&fit=crop&crop=face',
    specialties: ['Cardiology', 'Internal Medicine', 'Geriatric Care'],
    experience: 15,
    rating: 4.9,
    reviewCount: 203,
    clinic_id: 'clinic-3',
    availableSlots: extendedSlots,
    createdAt: new Date('2018-11-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'vet-4',
    name: 'Dr. James Park',
    email: 'james.park@missionvet.com',
    phone: '(415) 555-0345',
    photoURL: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
    specialties: ['Surgery', 'Orthopedics', 'Sports Medicine'],
    experience: 10,
    rating: 4.7,
    reviewCount: 142,
    clinic_id: 'clinic-4',
    availableSlots: [...morningSlots, ...afternoonSlots],
    createdAt: new Date('2021-01-20'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'vet-5',
    name: 'Dr. Lisa Thompson',
    email: 'lisa.thompson@richmondvet.com',
    phone: '(415) 555-0987',
    photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    specialties: ['Dermatology', 'Allergology', 'Exotic Animals'],
    experience: 9,
    rating: 4.8,
    reviewCount: 76,
    clinic_id: 'clinic-5',
    availableSlots: morningSlots,
    createdAt: new Date('2017-05-30'),
    updatedAt: new Date('2024-01-22')
  },
  {
    id: 'vet-6',
    name: 'Dr. Robert Kim',
    email: 'robert.kim@sunsetanimal.com',
    phone: '(415) 555-0654',
    photoURL: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    specialties: ['General Practice', 'Dental Care', 'Wellness Programs'],
    experience: 6,
    rating: 4.5,
    reviewCount: 98,
    clinic_id: 'clinic-6',
    availableSlots: [...morningSlots, ...afternoonSlots],
    createdAt: new Date('2020-09-12'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: 'vet-7',
    name: 'Dr. Amanda Foster',
    email: 'amanda.foster@somapet.com',
    phone: '(415) 555-0234',
    photoURL: 'https://images.unsplash.com/photo-1594824389199-e48b8b40b2d4?w=400&h=400&fit=crop&crop=face',
    specialties: ['Emergency Medicine', 'Urgent Care', 'Toxicology'],
    experience: 11,
    rating: 4.7,
    reviewCount: 134,
    clinic_id: 'clinic-7',
    availableSlots: emergencySlots,
    createdAt: new Date('2019-12-03'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: 'vet-8',
    name: 'Dr. David Martinez',
    email: 'david.martinez@presidiovet.com',
    phone: '(415) 555-0876',
    photoURL: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
    specialties: ['Behavioral Medicine', 'Alternative Medicine', 'Holistic Care'],
    experience: 13,
    rating: 4.8,
    reviewCount: 167,
    clinic_id: 'clinic-8',
    availableSlots: extendedSlots,
    createdAt: new Date('2016-07-18'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: 'vet-9',
    name: 'Dr. Jennifer Lee',
    email: 'jennifer.lee@happypaws.com',
    phone: '(415) 555-0135',
    photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    specialties: ['Pediatric Care', 'Vaccinations', 'Nutrition'],
    experience: 7,
    rating: 4.6,
    reviewCount: 92,
    clinic_id: 'clinic-1',
    availableSlots: afternoonSlots,
    createdAt: new Date('2021-06-10'),
    updatedAt: new Date('2024-01-08')
  },
  {
    id: 'vet-10',
    name: 'Dr. Christopher Brown',
    email: 'chris.brown@gganimalhospital.com',
    phone: '(415) 555-0791',
    photoURL: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    specialties: ['Oncology', 'Chemotherapy', 'Pain Management'],
    experience: 16,
    rating: 4.9,
    reviewCount: 145,
    clinic_id: 'clinic-3',
    availableSlots: morningSlots,
    createdAt: new Date('2017-02-14'),
    updatedAt: new Date('2024-01-28')
  },
  {
    id: 'vet-11',
    name: 'Dr. Maria Gonzalez',
    email: 'maria.gonzalez@richmondvet.com',
    phone: '(415) 555-0988',
    photoURL: 'https://images.unsplash.com/photo-1594824389199-e48b8b40b2d4?w=400&h=400&fit=crop&crop=face',
    specialties: ['Ophthalmology', 'Vision Care', 'Eye Surgery'],
    experience: 14,
    rating: 4.8,
    reviewCount: 118,
    clinic_id: 'clinic-5',
    availableSlots: afternoonSlots,
    createdAt: new Date('2018-09-20'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'vet-12',
    name: 'Dr. Kevin Zhang',
    email: 'kevin.zhang@petcare.com',
    phone: '(415) 555-0457',
    photoURL: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
    specialties: ['Emergency Surgery', 'Trauma Care', 'Intensive Care'],
    experience: 9,
    rating: 4.7,
    reviewCount: 156,
    clinic_id: 'clinic-2',
    availableSlots: emergencySlots,
    createdAt: new Date('2020-11-05'),
    updatedAt: new Date('2024-01-30')
  },
  {
    id: 'vet-13',
    name: 'Dr. Rachel White',
    email: 'rachel.white@missionvet.com',
    phone: '(415) 555-0346',
    photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    specialties: ['Reproductive Medicine', 'Breeding Consulting', 'Neonatal Care'],
    experience: 8,
    rating: 4.6,
    reviewCount: 87,
    clinic_id: 'clinic-4',
    availableSlots: morningSlots,
    createdAt: new Date('2022-03-12'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: 'vet-14',
    name: 'Dr. Thomas Wilson',
    email: 'thomas.wilson@sunsetanimal.com',
    phone: '(415) 555-0655',
    photoURL: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    specialties: ['Exotic Animals', 'Avian Medicine', 'Reptile Care'],
    experience: 12,
    rating: 4.9,
    reviewCount: 94,
    clinic_id: 'clinic-6',
    availableSlots: [...morningSlots, ...afternoonSlots],
    createdAt: new Date('2019-07-08'),
    updatedAt: new Date('2024-01-19')
  },
  {
    id: 'vet-15',
    name: 'Dr. Nicole Davis',
    email: 'nicole.davis@presidiovet.com',
    phone: '(415) 555-0877',
    photoURL: 'https://images.unsplash.com/photo-1594824389199-e48b8b40b2d4?w=400&h=400&fit=crop&crop=face',
    specialties: ['Physical Therapy', 'Rehabilitation', 'Sports Medicine'],
    experience: 10,
    rating: 4.7,
    reviewCount: 123,
    clinic_id: 'clinic-8',
    availableSlots: extendedSlots,
    createdAt: new Date('2020-04-25'),
    updatedAt: new Date('2024-01-21')
  }
];

// Helper functions for veterinarian data
export const getVeterinarianById = (vetId: string): Veterinarian | undefined => {
  return mockVeterinarians.find(vet => vet.id === vetId);
};

export const getVeterinariansByClinic = (clinicId: string): Veterinarian[] => {
  return mockVeterinarians.filter(vet => vet.clinicId === clinicId);
};

export const getVeterinariansBySpecialty = (specialty: string): Veterinarian[] => {
  return mockVeterinarians.filter(vet => 
    vet.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
  );
};

export const getEmergencyVeterinarians = (): Veterinarian[] => {
  return mockVeterinarians.filter(vet => 
    vet.specialties.some(specialty => 
      specialty.toLowerCase().includes('emergency') || 
      specialty.toLowerCase().includes('urgent') ||
      specialty.toLowerCase().includes('critical') ||
      specialty.toLowerCase().includes('trauma')
    )
  );
};

export const getTopRatedVeterinarians = (limit: number = 5): Veterinarian[] => {
  return [...mockVeterinarians]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

export const getAvailableVeterinarians = (timeSlot?: string): Veterinarian[] => {
  if (!timeSlot) {
    return mockVeterinarians.filter(vet => 
      vet.availableSlots.some(slot => slot.isAvailable)
    );
  }

  return mockVeterinarians.filter(vet => 
    vet.availableSlots.some(slot => 
      slot.isAvailable && 
      (slot.startTime === timeSlot || slot.startTime <= timeSlot)
    )
  );
};