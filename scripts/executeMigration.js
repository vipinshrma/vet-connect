import 'dotenv/config';
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (read from env)
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mock data
const clinics = [
  {
    id: 'clinic-1',
    name: 'Happy Paws Veterinary Clinic',
    address: '123 Pet Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94102',
    phone: '+1-555-0301',
    email: 'info@happypaws.com',
    website: 'https://happypaws.com',
    latitude: 37.7749,
    longitude: -122.4194,
    services: ['General Practice', 'Vaccinations', 'Surgery', 'Dental Care'],
    hours: {
      "monday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
      "tuesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
      "wednesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
      "thursday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
      "friday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
      "saturday": {"is_open": true, "open_time": "09:00", "close_time": "17:00"},
      "sunday": {"is_open": false}
    },
    rating: 4.8,
    review_count: 127
  },
  {
    id: 'clinic-2',
    name: 'Emergency Pet Care Center',
    address: '456 Rescue Avenue',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    phone: '+1-555-0302',
    email: 'emergency@petcare.com',
    website: 'https://emergencypetcare.com',
    latitude: 37.7849,
    longitude: -122.4094,
    services: ['Emergency Medicine', 'Critical Care', '24/7 Service', 'Trauma Surgery'],
    hours: {
      "monday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"},
      "tuesday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"},
      "wednesday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"},
      "thursday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"},
      "friday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"},
      "saturday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"},
      "sunday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}
    },
    rating: 4.9,
    review_count: 89
  },
  {
    id: 'clinic-3',
    name: 'Golden Gate Animal Hospital',
    address: '789 Health Way',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94110',
    phone: '+1-555-0303',
    email: 'care@gganimalhospital.com',
    website: 'https://gganimalhospital.com',
    latitude: 37.7599,
    longitude: -122.4148,
    services: ['Cardiology', 'Internal Medicine', 'Geriatric Care', 'Oncology'],
    hours: {
      "monday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"},
      "tuesday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"},
      "wednesday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"},
      "thursday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"},
      "friday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"},
      "saturday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
      "sunday": {"is_open": true, "open_time": "09:00", "close_time": "17:00"}
    },
    rating: 4.9,
    review_count: 203
  }
];

const profiles = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+1-555-0101',
    user_type: 'pet-owner'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1-555-0102',
    user_type: 'pet-owner'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Mike Wilson',
    email: 'mike@example.com',
    phone: '+1-555-0103',
    user_type: 'pet-owner'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Dr. Sarah Johnson',
    email: 'dr.smith@happypaws.com',
    phone: '+1-555-0201',
    user_type: 'veterinarian'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Dr. Michael Chen',
    email: 'dr.chen@petcare.com',
    phone: '+1-555-0202',
    user_type: 'veterinarian'
  }
];

const veterinarians = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    specialties: ['General Practice', 'Internal Medicine', 'Preventive Care'],
    experience: 8,
    rating: 4.8,
    review_count: 127,
    clinic_id: 'clinic-1'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    specialties: ['Emergency Medicine', 'Critical Care', 'Trauma Surgery'],
    experience: 12,
    rating: 4.9,
    review_count: 89,
    clinic_id: 'clinic-2'
  }
];

const pets = [
  {
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 30.5,
    gender: 'male',
    photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face',
    medical_history: ['Vaccinated', 'Neutered', 'Regular checkups'],
    owner_id: '11111111-1111-1111-1111-111111111111'
  },
  {
    name: 'Whiskers',
    species: 'cat',
    breed: 'Siamese',
    age: 2,
    weight: 4.2,
    gender: 'female',
    photo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=face',
    medical_history: ['Vaccinated', 'Spayed'],
    owner_id: '22222222-2222-2222-2222-222222222222'
  },
  {
    name: 'Max',
    species: 'dog',
    breed: 'German Shepherd',
    age: 5,
    weight: 35.0,
    gender: 'male',
    photo_url: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&crop=face',
    medical_history: ['Vaccinated', 'Hip dysplasia monitoring'],
    owner_id: '33333333-3333-3333-3333-333333333333'
  },
  {
    name: 'Luna',
    species: 'cat',
    breed: 'Persian',
    age: 1,
    weight: 3.8,
    gender: 'female',
    photo_url: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=400&fit=crop&crop=face',
    medical_history: ['Vaccinated'],
    owner_id: '11111111-1111-1111-1111-111111111111'
  }
];

async function executeMigration() {
  console.log('🚀 Starting database migration...');

  try {
    // Step 1: Insert Clinics
    console.log('🏥 Inserting clinics...');
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .insert(clinics)
      .select();

    if (clinicError) {
      console.error('❌ Error inserting clinics:', clinicError.message);
    } else {
      console.log(`✅ Inserted ${clinicData.length} clinics`);
    }

    // Step 2: Insert Profiles
    console.log('👥 Inserting profiles...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert(profiles)
      .select();

    if (profileError) {
      console.error('❌ Error inserting profiles:', profileError.message);
    } else {
      console.log(`✅ Inserted ${profileData.length} profiles`);
    }

    // Step 3: Insert Veterinarians
    console.log('👨‍⚕️ Inserting veterinarians...');
    const { data: vetData, error: vetError } = await supabase
      .from('veterinarians')
      .insert(veterinarians)
      .select();

    if (vetError) {
      console.error('❌ Error inserting veterinarians:', vetError.message);
    } else {
      console.log(`✅ Inserted ${vetData.length} veterinarians`);
    }

    // Step 4: Insert Pets
    console.log('🐕 Inserting pets...');
    const { data: petData, error: petError } = await supabase
      .from('pets')
      .insert(pets)
      .select();

    if (petError) {
      console.error('❌ Error inserting pets:', petError.message);
    } else {
      console.log(`✅ Inserted ${petData.length} pets`);
    }

    // Step 5: Verify migration
    console.log('📊 Verifying migration...');
    const tables = ['clinics', 'profiles', 'veterinarians', 'pets'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error counting ${table}:`, error.message);
      } else {
        console.log(`📋 ${table}: ${data?.length || 0} records`);
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Test Login Credentials:');
    console.log('Pet Owners:');
    console.log('  📧 john@example.com / 🔑 password123');
    console.log('  📧 sarah@example.com / 🔑 password123');
    console.log('  📧 mike@example.com / 🔑 password123');
    console.log('\nVeterinarians:');
    console.log('  📧 dr.smith@happypaws.com / 🔑 vetpass123');
    console.log('  📧 dr.chen@petcare.com / 🔑 vetpass123');
    console.log('\n💡 Note: Create these user accounts in Supabase Auth Dashboard with the passwords shown above.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
executeMigration();