const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (read from env)
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
// IMPORTANT: set SUPABASE_SERVICE_ROLE_KEY in your shell or .env (never commit this key)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Get this from Supabase Dashboard > Settings > API

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mock customer login credentials
const mockCustomers = [
  {
    email: 'john@example.com',
    password: 'password123',
    name: 'John Smith',
    phone: '+1-555-0101',
    user_type: 'pet-owner'
  },
  {
    email: 'sarah@example.com',
    password: 'password123',
    name: 'Sarah Johnson',
    phone: '+1-555-0102',
    user_type: 'pet-owner'
  },
  {
    email: 'mike@example.com',
    password: 'password123',
    name: 'Mike Wilson',
    phone: '+1-555-0103',
    user_type: 'pet-owner'
  },
  {
    email: 'dr.smith@happypaws.com',
    password: 'vetpass123',
    name: 'Dr. Sarah Johnson',
    phone: '+1-555-0201',
    user_type: 'veterinarian'
  },
  {
    email: 'dr.chen@petcare.com',
    password: 'vetpass123',
    name: 'Dr. Michael Chen',
    phone: '+1-555-0202',
    user_type: 'veterinarian'
  }
];

// Mock clinics data
const mockClinics = [
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
      monday: { is_open: true, open_time: '08:00', close_time: '18:00' },
      tuesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
      wednesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
      thursday: { is_open: true, open_time: '08:00', close_time: '18:00' },
      friday: { is_open: true, open_time: '08:00', close_time: '18:00' },
      saturday: { is_open: true, open_time: '09:00', close_time: '17:00' },
      sunday: { is_open: false }
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
      monday: { is_open: true, open_time: '00:00', close_time: '23:59' },
      tuesday: { is_open: true, open_time: '00:00', close_time: '23:59' },
      wednesday: { is_open: true, open_time: '00:00', close_time: '23:59' },
      thursday: { is_open: true, open_time: '00:00', close_time: '23:59' },
      friday: { is_open: true, open_time: '00:00', close_time: '23:59' },
      saturday: { is_open: true, open_time: '00:00', close_time: '23:59' },
      sunday: { is_open: true, open_time: '00:00', close_time: '23:59' }
    },
    rating: 4.9,
    review_count: 89
  }
];

// Mock pets data (will be assigned to customers after user creation)
const mockPets = [
  {
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 30.5,
    gender: 'male',
    photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face',
    medical_history: ['Vaccinated', 'Neutered', 'Regular checkups'],
    owner_email: 'john@example.com'
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
    owner_email: 'sarah@example.com'
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
    owner_email: 'mike@example.com'
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
    owner_email: 'john@example.com'
  }
];

// Mock veterinarians data
const mockVeterinarians = [
  {
    clinic_id: 'clinic-1',
    specialties: ['General Practice', 'Internal Medicine', 'Preventive Care'],
    experience: 8,
    rating: 4.8,
    review_count: 127,
    doctor_email: 'dr.smith@happypaws.com'
  },
  {
    clinic_id: 'clinic-2',
    specialties: ['Emergency Medicine', 'Critical Care', 'Trauma Surgery'],
    experience: 12,
    rating: 4.9,
    review_count: 89,
    doctor_email: 'dr.chen@petcare.com'
  }
];

async function migrateData() {
  console.log('🚀 Starting data migration to Supabase...');
  console.log('🔑 Using Supabase URL:', supabaseUrl);
  console.log('🔑 Service key length:', supabaseServiceKey.length, 'characters');

  try {
    // Step 1: Test connection and create clinics first
    console.log('🧪 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('clinics')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Step 2: Create clinics
    console.log('🏥 Creating clinics...');
    for (const clinic of mockClinics) {
      const { error } = await supabase
        .from('clinics')
        .insert({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          city: clinic.city,
          state: clinic.state,
          zip_code: clinic.zip_code,
          phone: clinic.phone,
          email: clinic.email,
          website: clinic.website,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
          services: clinic.services,
          hours: clinic.hours,
          rating: clinic.rating,
          review_count: clinic.review_count
        });

      if (error) {
        console.error(`Error creating clinic ${clinic.name}:`, error.message);
      } else {
        console.log(`✅ Created clinic: ${clinic.name}`);
      }
    }

    console.log('🎉 Clinics migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('1. Create user accounts manually in Supabase Auth dashboard:');
    console.log('\nPet Owners:');
    mockCustomers.filter(c => c.user_type === 'pet-owner').forEach(customer => {
      console.log(`  📧 ${customer.email} / 🔑 ${customer.password}`);
    });
    console.log('\nVeterinarians:');
    mockCustomers.filter(c => c.user_type === 'veterinarian').forEach(customer => {
      console.log(`  📧 ${customer.email} / 🔑 ${customer.password}`);
    });
    console.log('\n2. After creating users, use the SQL scripts in MIGRATION_GUIDE.md to add profiles, veterinarians, and pets.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateData();