# Supabase Schema Analysis for Quick Filters

## Database Schema Overview

### Veterinarians Table Structure
```sql
CREATE TABLE veterinarians (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialties TEXT[],                    -- Array of specialty strings
  experience INTEGER NOT NULL,
  rating DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Identifiers Available for Filtering

1. **`specialties` (TEXT[])**
   - **Type**: Array of text values
   - **Index**: GIN index exists (`idx_veterinarians_specialties`)
   - **Current Usage**: Used for filtering, but with case-sensitive exact matching
   - **Values in Database**: 
     - "Emergency Medicine", "Critical Care", "Trauma Surgery", "Urgent Care"
     - "Surgery", "Orthopedics", "Sports Medicine"
     - "Cardiology", "Internal Medicine", "Geriatric Care"
     - "Dermatology", "Allergology", "Exotic Animals"
     - "Dental Care"
     - "Exotic Animals", "Avian Medicine", "Reptile Care"

2. **`rating` (DECIMAL)**
   - **Type**: Decimal number (0-5)
   - **Index**: Indexed for sorting (`idx_veterinarians_rating`)
   - **Usage**: Can filter by minimum rating

3. **`experience` (INTEGER)**
   - **Type**: Years of experience
   - **Usage**: Can filter by minimum experience

4. **`clinic_id` (UUID)**
   - **Type**: Foreign key to clinics table
   - **Index**: Indexed (`idx_veterinarians_clinic_id`)
   - **Usage**: Can filter by clinic

## Current Quick Filter Implementation Issues

### Problem 1: Case Sensitivity Mismatch
- **Quick Filter Values**: `'emergency'`, `'surgery'`, `'cardiology'`, `'dermatology'`, `'dental'`, `'exotic'`
- **Database Values**: `"Emergency Medicine"`, `"Surgery"`, `"Cardiology"`, `"Dermatology"`, `"Dental Care"`, `"Exotic Animals"`
- **Current Query**: `.contains('specialties', [specialty])` - requires exact match
- **Result**: Queries return empty, triggering mock data fallback

### Problem 2: Specialty Name Mismatch
- Quick filter: `'exotic'` → Database: `"Exotic Animals"`
- Quick filter: `'dental'` → Database: `"Dental Care"`
- Quick filter: `'emergency'` → Database: `"Emergency Medicine"`, `"Critical Care"`, `"Trauma Surgery"`, `"Urgent Care"`

## Available Supabase Array Operators

### 1. `.contains()` - Exact Array Contains
```typescript
.contains('specialties', ['Surgery'])  // Exact match required
```
- **Issue**: Case-sensitive, exact match only
- **Current Usage**: Used in `getVeterinariansBySpecialty()`

### 2. `.cs.` - Contains (Array Operator)
```typescript
.or('specialties.cs.{"Emergency Medicine"}, specialties.cs.{"Critical Care"}')
```
- **Usage**: Used in `getEmergencyVeterinarians()`
- **Issue**: Still requires exact match, case-sensitive

### 3. Client-Side Filtering (Current Best Practice)
```typescript
// Used in searchVeterinarians() - works well
const filteredVeterinarians = allVeterinarians.filter(vet => {
  const specialtyMatch = vet.specialties.some(specialty => 
    specialty.toLowerCase().includes(searchQuery)
  );
  return specialtyMatch;
});
```
- **Advantage**: Case-insensitive, partial matching
- **Disadvantage**: Requires fetching all records first

## Recommended Solutions

### Solution 1: Specialty Name Mapping (Recommended)
Create a mapping between quick filter keys and actual database specialty values:

```typescript
const SPECIALTY_MAPPING: Record<string, string[]> = {
  'emergency': [
    'Emergency Medicine',
    'Critical Care', 
    'Trauma Surgery',
    'Urgent Care',
    'Emergency Surgery',
    'Intensive Care'
  ],
  'surgery': [
    'Surgery',
    'Surgical Procedures',
    'Orthopedics',
    'Trauma Surgery',
    'Emergency Surgery'
  ],
  'cardiology': [
    'Cardiology',
    'Cardiovascular',
    'Heart Care'
  ],
  'dermatology': [
    'Dermatology',
    'Allergology',
    'Skin Care'
  ],
  'dental': [
    'Dental Care',
    'Dentistry',
    'Oral Surgery'
  ],
  'exotic': [
    'Exotic Animals',
    'Avian Medicine',
    'Reptile Care',
    'Exotic Pet Care'
  ]
};
```

**Implementation**:
```typescript
async getVeterinariansBySpecialty(quickFilterKey: string): Promise<Veterinarian[]> {
  const specialtyNames = SPECIALTY_MAPPING[quickFilterKey.toLowerCase()] || [quickFilterKey];
  
  // Build OR query for all matching specialties
  const orConditions = specialtyNames
    .map(specialty => `specialties.cs.{${specialty}}`)
    .join(',');
  
  const { data, error } = await supabase
    .from('veterinarians')
    .select('*, profiles!inner(*)')
    .or(orConditions)
    .order('rating', { ascending: false });
  
  // ... rest of implementation
}
```

### Solution 2: Client-Side Filtering (Current Best Practice)
Use the same approach as `searchVeterinarians()` - fetch all and filter client-side:

```typescript
async getVeterinariansBySpecialty(quickFilterKey: string): Promise<Veterinarian[]> {
  // Get all veterinarians
  const allVets = await this.getAllVeterinarians();
  
  // Map quick filter to search terms
  const searchTerms = SPECIALTY_MAPPING[quickFilterKey] || [quickFilterKey];
  
  // Filter client-side (case-insensitive)
  return allVets.filter(vet =>
    vet.specialties.some(specialty => {
      const lowerSpecialty = specialty.toLowerCase();
      return searchTerms.some(term => 
        lowerSpecialty.includes(term.toLowerCase())
      );
    })
  );
}
```

**Advantages**:
- Case-insensitive matching
- Partial matching (e.g., "Emergency" matches "Emergency Medicine")
- More reliable than database queries
- Already proven to work in `searchVeterinarians()`

**Disadvantages**:
- Requires fetching all veterinarians (but there's likely not thousands)
- Slightly less efficient than database-level filtering

### Solution 3: Database Function with Case-Insensitive Matching
Create a PostgreSQL function for case-insensitive array matching:

```sql
CREATE OR REPLACE FUNCTION specialties_contains_ci(
  specialties_array TEXT[],
  search_term TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM unnest(specialties_array) AS specialty
    WHERE LOWER(specialty) LIKE '%' || LOWER(search_term) || '%'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Usage**:
```typescript
// This would require RPC call or raw SQL
const { data } = await supabase.rpc('specialties_contains_ci', {
  specialties_array: ['Emergency Medicine', 'Surgery'],
  search_term: 'emergency'
});
```

**Note**: This is more complex and may not be necessary given Solution 2 works well.

## Recommended Implementation

### Best Approach: Hybrid Solution
1. **Use Solution 1 (Mapping)** for quick filters - provides exact database matches
2. **Fallback to Solution 2 (Client-side)** if database query returns empty
3. **Keep mock data** as final fallback for offline/error scenarios

### Implementation Plan

1. **Create Specialty Mapping**:
   ```typescript
   // src/utils/specialtyMapping.ts
   export const QUICK_FILTER_TO_SPECIALTIES: Record<string, string[]> = {
     'emergency': ['Emergency Medicine', 'Critical Care', 'Trauma Surgery', 'Urgent Care'],
     'surgery': ['Surgery', 'Surgical Procedures', 'Orthopedics'],
     'cardiology': ['Cardiology', 'Cardiovascular'],
     'dermatology': ['Dermatology', 'Allergology'],
     'dental': ['Dental Care', 'Dentistry'],
     'exotic': ['Exotic Animals', 'Avian Medicine', 'Reptile Care']
   };
   ```

2. **Update `getVeterinariansBySpecialty()`**:
   ```typescript
   async getVeterinariansBySpecialty(quickFilterKey: string): Promise<Veterinarian[]> {
     const specialtyNames = QUICK_FILTER_TO_SPECIALTIES[quickFilterKey.toLowerCase()];
     
     if (!specialtyNames) {
       // Fallback: use client-side filtering
       return this.getVeterinariansBySpecialtyClientSide(quickFilterKey);
     }
     
     // Build OR query
     const orConditions = specialtyNames
       .map(s => `specialties.cs.{${s}}`)
       .join(',');
     
     const { data, error } = await supabase
       .from('veterinarians')
       .select('*, profiles!inner(*)')
       .or(orConditions)
       .order('rating', { ascending: false });
     
     if (error || !data || data.length === 0) {
       // Fallback to client-side filtering
       return this.getVeterinariansBySpecialtyClientSide(quickFilterKey);
     }
     
     return data.map(row => this.mapToVeterinarian(row));
   }
   
   private async getVeterinariansBySpecialtyClientSide(quickFilterKey: string): Promise<Veterinarian[]> {
     const allVets = await this.getAllVeterinarians();
     const searchTerms = QUICK_FILTER_TO_SPECIALTIES[quickFilterKey.toLowerCase()] || [quickFilterKey];
     
     return allVets.filter(vet =>
       vet.specialties.some(specialty => {
         const lowerSpecialty = specialty.toLowerCase();
         return searchTerms.some(term => 
           lowerSpecialty.includes(term.toLowerCase())
         );
       })
     );
   }
   ```

## Database Indexes Available

1. **GIN Index on Specialties**: `idx_veterinarians_specialties`
   - Supports array containment queries
   - Efficient for `.contains()` and `.cs.` operations

2. **Rating Index**: `idx_veterinarians_rating`
   - Supports sorting by rating
   - Can be used for filtering with `.gte()`

3. **Clinic ID Index**: `idx_veterinarians_clinic_id`
   - Supports joining with clinics table

## Summary

### Available Identifiers for Filtering:
✅ **`specialties` (TEXT[])** - Primary identifier for quick filters
✅ **`rating` (DECIMAL)** - Can filter by minimum rating
✅ **`experience` (INTEGER)** - Can filter by minimum experience
✅ **`clinic_id` (UUID)** - Can filter by clinic

### Best Solution:
**Use specialty name mapping + client-side filtering fallback** to handle:
- Case-insensitive matching
- Partial matching
- Multiple specialty names per quick filter
- Reliable results even if database query fails

### Next Steps:
1. Create `specialtyMapping.ts` utility
2. Update `getVeterinariansBySpecialty()` method
3. Update `getEmergencyVeterinarians()` to use same pattern
4. Test with actual database data
5. Remove or reduce mock data fallback usage

