const { createClient } = require('@supabase/supabase-js');

// Using anon key to check if data exists (read-only)
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('🔍 Checking database contents...');

  try {
    // Check each table
    const tables = ['clinics', 'profiles', 'veterinarians', 'pets'];
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`📊 ${table}: ${count || 0} records`);
        if (data && data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(data[0], null, 2).substring(0, 100)}...`);
        }
      }
    }

    // Check if specific clinic exists
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('name, id')
      .eq('id', 'clinic-1')
      .single();

    if (clinicError) {
      console.log('❌ Sample clinic check failed:', clinicError.message);
    } else if (clinicData) {
      console.log('✅ Sample clinic found:', clinicData.name);
    } else {
      console.log('⚠️  No sample clinic found - database appears empty');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabase();