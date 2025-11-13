import 'dotenv/config';
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample veterinarian data
const sampleVeterinarians = [
  {
    id: 'vet-001',
    specialties: ['General Practice', 'Surgery'],
    experience: 8,
    clinic_id: null,
    rating: 4.8,
    review_count: 124
  },
  {
    id: 'vet-002', 
    specialties: ['Internal Medicine', 'Cardiology'],
    experience: 12,
    clinic_id: null,
    rating: 4.9,
    review_count: 89
  },
  {
    id: 'vet-003',
    specialties: ['Emergency Medicine', 'Critical Care'],
    experience: 6,
    clinic_id: null,
    rating: 4.7,
    review_count: 156
  },
  {
    id: 'vet-004',
    specialties: ['Dermatology', 'General Practice'],
    experience: 10,
    clinic_id: null,
    rating: 4.6,
    review_count: 78
  },
  {
    id: 'vet-005',
    specialties: ['Orthopedics', 'Surgery'],
    experience: 15,
    clinic_id: null,
    rating: 4.9,
    review_count: 203
  },
  {
    id: 'vet-006',
    specialties: ['Exotic Animals', 'General Practice'],
    experience: 7,
    clinic_id: null,
    rating: 4.5,
    review_count: 42
  },
  {
    id: 'vet-007',
    specialties: ['Oncology', 'Internal Medicine'],
    experience: 14,
    clinic_id: null,
    rating: 4.8,
    review_count: 167
  },
  {
    id: 'vet-008',
    specialties: ['Dentistry', 'General Practice'],
    experience: 9,
    clinic_id: null,
    rating: 4.4,
    review_count: 95
  }
];

// Sample profiles data to match the veterinarians
const sampleProfiles = [
  {
    id: 'vet-001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@vetconnect.com',
    phone: '+1-555-0101',
    photo_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400',
    user_type: 'veterinarian'
  },
  {
    id: 'vet-002',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@vetconnect.com', 
    phone: '+1-555-0102',
    photo_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
    user_type: 'veterinarian'
  },
  {
    id: 'vet-003',
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@vetconnect.com',
    phone: '+1-555-0103', 
    photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    user_type: 'veterinarian'
  },
  {
    id: 'vet-004',
    name: 'Dr. David Thompson',
    email: 'david.thompson@vetconnect.com',
    phone: '+1-555-0104',
    photo_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400',
    user_type: 'veterinarian'
  },
  {
    id: 'vet-005',
    name: 'Dr. Lisa Anderson',
    email: 'lisa.anderson@vetconnect.com',
    phone: '+1-555-0105',
    photo_url: 'https://images.unsplash.com/photo-1594824475562-d3e47ad0e4f8?w=400',
    user_type: 'veterinarian'
  },
  {
    id: 'vet-006',
    name: 'Dr. James Wilson',
    email: 'james.wilson@vetconnect.com',
    phone: '+1-555-0106',
    photo_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
    user_type: 'veterinarian'
  },
  {
    id: 'vet-007',
    name: 'Dr. Maria Garcia',
    email: 'maria.garcia@vetconnect.com',
    phone: '+1-555-0107',
    photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    user_type: 'veterinarian'
  },
  {
    id: 'vet-008',
    name: 'Dr. Robert Brown',
    email: 'robert.brown@vetconnect.com',
    phone: '+1-555-0108',
    photo_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400',
    user_type: 'veterinarian'
  }
];

async function seedData() {
  console.log('🌱 Starting to seed veterinarian data...');

  try {
    // First, insert profiles (since veterinarians table references profiles)
    console.log('📝 Inserting profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .upsert(sampleProfiles, { onConflict: 'id' });

    if (profilesError) {
      console.error('❌ Error inserting profiles:', profilesError);
      return;
    }

    console.log('✅ Profiles inserted successfully');

    // Then insert veterinarians
    console.log('👩‍⚕️ Inserting veterinarians...');
    const { data: vetsData, error: vetsError } = await supabase
      .from('veterinarians')
      .upsert(sampleVeterinarians, { onConflict: 'id' });

    if (vetsError) {
      console.error('❌ Error inserting veterinarians:', vetsError);
      return;
    }

    console.log('✅ Veterinarians inserted successfully');

    // Verify the data
    console.log('🔍 Verifying inserted data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('veterinarians')
      .select(`
        *,
        profiles!inner(name, email, phone, photo_url)
      `);

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return;
    }

    console.log(`✅ Successfully seeded ${verifyData.length} veterinarians:`);
    verifyData.forEach(vet => {
      console.log(`   • ${vet.profiles.name} - ${vet.specialties.join(', ')}`);
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the seeding function
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };