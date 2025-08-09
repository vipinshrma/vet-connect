import { Clinic, OpeningHours } from '../types';

// Standard opening hours templates
const standardHours: OpeningHours = {
  monday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  friday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
  sunday: { isOpen: false }
};

const emergencyHours: OpeningHours = {
  monday: { isOpen: true, openTime: '00:00', closeTime: '23:59' },
  tuesday: { isOpen: true, openTime: '00:00', closeTime: '23:59' },
  wednesday: { isOpen: true, openTime: '00:00', closeTime: '23:59' },
  thursday: { isOpen: true, openTime: '00:00', closeTime: '23:59' },
  friday: { isOpen: true, openTime: '00:00', closeTime: '23:59' },
  saturday: { isOpen: true, openTime: '00:00', closeTime: '23:59' },
  sunday: { isOpen: true, openTime: '00:00', closeTime: '23:59' }
};

const extendedHours: OpeningHours = {
  monday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
  tuesday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
  wednesday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
  thursday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
  friday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
  saturday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
  sunday: { isOpen: true, openTime: '10:00', closeTime: '16:00' }
};

export const mockClinics: Clinic[] = [
  {
    id: 'clinic-1',
    name: 'Happy Paws Veterinary Clinic',
    address: '1234 Maple Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94102',
    phone: '(415) 555-0123',
    email: 'info@happypaws.com',
    website: 'https://happypaws.com',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    services: [
      'General Wellness Exams',
      'Vaccinations',
      'Dental Care',
      'Surgery',
      'X-rays',
      'Laboratory Services',
      'Microchipping',
      'Grooming'
    ],
    openingHours: standardHours,
    photos: [
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800'
    ],
    rating: 4.8,
    reviewCount: 156,
    createdAt: new Date('2020-03-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'clinic-2',
    name: 'Pet Care Emergency Hospital',
    address: '567 Oak Avenue',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94110',
    phone: '(415) 555-0456',
    email: 'emergency@petcare.com',
    website: 'https://petcareemergency.com',
    coordinates: {
      latitude: 37.7599,
      longitude: -122.4148
    },
    services: [
      'Emergency Care',
      'Critical Care',
      'Intensive Care Unit',
      'Emergency Surgery',
      'Advanced Diagnostics',
      'Blood Transfusions',
      'Trauma Care',
      'Poison Control'
    ],
    openingHours: emergencyHours,
    photos: [
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800',
      'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=800'
    ],
    rating: 4.9,
    reviewCount: 89,
    createdAt: new Date('2019-08-22'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'clinic-3',
    name: 'Golden Gate Animal Hospital',
    address: '890 Pine Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94108',
    phone: '(415) 555-0789',
    email: 'info@gganimalhospital.com',
    website: 'https://gganimalhospital.com',
    coordinates: {
      latitude: 37.7879,
      longitude: -122.4075
    },
    services: [
      'General Practice',
      'Specialty Surgery',
      'Cardiology',
      'Oncology',
      'Dermatology',
      'Internal Medicine',
      'Behavior Consulting',
      'Rehabilitation'
    ],
    openingHours: extendedHours,
    photos: [
      'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800'
    ],
    rating: 4.7,
    reviewCount: 203,
    createdAt: new Date('2018-11-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'clinic-4',
    name: 'Mission District Veterinary Clinic',
    address: '456 Mission Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94103',
    phone: '(415) 555-0345',
    email: 'hello@missionvet.com',
    website: 'https://missionvet.com',
    coordinates: {
      latitude: 37.7644,
      longitude: -122.4194
    },
    services: [
      'Preventive Care',
      'Vaccinations',
      'Spay/Neuter',
      'Dental Cleaning',
      'Minor Surgery',
      'Wellness Plans',
      'Puppy/Kitten Care',
      'Senior Pet Care'
    ],
    openingHours: standardHours,
    photos: [
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800'
    ],
    rating: 4.6,
    reviewCount: 142,
    createdAt: new Date('2021-01-20'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'clinic-5',
    name: 'Richmond Veterinary Specialists',
    address: '321 Geary Boulevard',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94118',
    phone: '(415) 555-0987',
    email: 'specialists@richmondvet.com',
    website: 'https://richmondvet.com',
    coordinates: {
      latitude: 37.7817,
      longitude: -122.4669
    },
    services: [
      'Orthopedic Surgery',
      'Neurology',
      'Ophthalmology',
      'Advanced Imaging',
      'Cancer Treatment',
      'Physical Therapy',
      'Acupuncture',
      'Laser Therapy'
    ],
    openingHours: {
      monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
      tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
      wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
      thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
      friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
      saturday: { isOpen: false },
      sunday: { isOpen: false }
    },
    photos: [
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800'
    ],
    rating: 4.9,
    reviewCount: 76,
    createdAt: new Date('2017-05-30'),
    updatedAt: new Date('2024-01-22')
  },
  {
    id: 'clinic-6',
    name: 'Sunset Animal Clinic',
    address: '789 Judah Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94122',
    phone: '(415) 555-0654',
    email: 'care@sunsetanimal.com',
    website: 'https://sunsetanimal.com',
    coordinates: {
      latitude: 37.7633,
      longitude: -122.4644
    },
    services: [
      'Family Pet Care',
      'Wellness Exams',
      'Vaccinations',
      'Dental Care',
      'Laboratory Services',
      'Radiology',
      'Pharmacy',
      'Nutrition Counseling'
    ],
    openingHours: standardHours,
    photos: [
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800'
    ],
    rating: 4.5,
    reviewCount: 98,
    createdAt: new Date('2020-09-12'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: 'clinic-7',
    name: 'SOMA Pet Emergency Center',
    address: '234 Folsom Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    phone: '(415) 555-0234',
    email: 'emergency@somapet.com',
    website: 'https://somapet.com',
    coordinates: {
      latitude: 37.7875,
      longitude: -122.3971
    },
    services: [
      '24/7 Emergency Care',
      'Urgent Care',
      'Emergency Surgery',
      'Critical Care',
      'Toxicology',
      'Trauma Care',
      'Pain Management',
      'After-hours Care'
    ],
    openingHours: emergencyHours,
    photos: [
      'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=800'
    ],
    rating: 4.7,
    reviewCount: 134,
    createdAt: new Date('2019-12-03'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: 'clinic-8',
    name: 'Presidio Heights Veterinary Care',
    address: '567 Fillmore Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94115',
    phone: '(415) 555-0876',
    email: 'info@presidiovet.com',
    website: 'https://presidiovet.com',
    coordinates: {
      latitude: 37.7915,
      longitude: -122.4327
    },
    services: [
      'Comprehensive Care',
      'Preventive Medicine',
      'Surgical Services',
      'Dental Care',
      'Geriatric Care',
      'Behavioral Medicine',
      'Alternative Medicine',
      'House Calls'
    ],
    openingHours: extendedHours,
    photos: [
      'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800'
    ],
    rating: 4.8,
    reviewCount: 167,
    createdAt: new Date('2016-07-18'),
    updatedAt: new Date('2024-01-12')
  }
];

// Helper function to get clinic by ID
export const getClinicById = (clinicId: string): Clinic | undefined => {
  return mockClinics.find(clinic => clinic.id === clinicId);
};

// Helper function to get clinics by service
export const getClinicsByService = (service: string): Clinic[] => {
  return mockClinics.filter(clinic => 
    clinic.services.some(s => s.toLowerCase().includes(service.toLowerCase()))
  );
};

// Helper function to get emergency clinics
export const getEmergencyClinics = (): Clinic[] => {
  return mockClinics.filter(clinic => 
    clinic.services.some(service => 
      service.toLowerCase().includes('emergency') || 
      service.toLowerCase().includes('urgent')
    )
  );
};