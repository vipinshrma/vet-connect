# Quick Filters Analysis

## Overview
This document analyzes how quick filters work in the VetConnect app and identifies where mock data is being used.

## Quick Filters Implementation

### Location
**File**: `src/screens/main/SearchScreen.tsx`

### Quick Filter Definitions
```typescript
const quickFilters = [
  { label: 'Emergency', icon: 'medical', specialty: 'emergency' },
  { label: 'Surgery', icon: 'cut', specialty: 'surgery' },
  { label: 'Cardiology', icon: 'heart', specialty: 'cardiology' },
  { label: 'Dermatology', icon: 'leaf', specialty: 'dermatology' },
  { label: 'Dental', icon: 'tooth', specialty: 'dental' },
  { label: 'Exotic Pets', icon: 'paw', specialty: 'exotic' },
];
```

## Data Flow

### 1. Quick Filter Handler (`handleQuickFilter`)
**Location**: `src/screens/main/SearchScreen.tsx:224-276`

**Flow**:
1. User taps a quick filter button
2. `handleQuickFilter(specialty)` is called with lowercase specialty name
3. **Primary**: Attempts to fetch from Supabase database
4. **Fallback**: Uses mock data if:
   - Supabase returns empty results
   - Supabase query fails (error handling)

### 2. Data Sources

#### A. Supabase Database (Primary Source)
**Service**: `src/services/supabaseVetService.ts`

**Methods Used**:
- `getEmergencyVeterinarians()` - For 'emergency' specialty
- `getVeterinariansBySpecialty(specialty)` - For other specialties

**Issues Identified**:
1. **Case Sensitivity Problem**: 
   - Quick filters use lowercase: `'surgery'`, `'cardiology'`, `'dental'`
   - Supabase query uses: `.contains('specialties', [specialty])`
   - This requires exact match, which may fail if database stores "Surgery" vs "surgery"
   - **Result**: Often returns empty array, triggering mock data fallback

2. **Specialty Name Mismatch**:
   - Quick filter: `'exotic'` 
   - Database likely stores: `'Exotic Animals'` or similar
   - **Result**: Query fails, uses mock data

#### B. Mock Data (Fallback Source)
**Location**: `src/data/mockVeterinarians.ts`

**Functions Used**:
- `getEmergencyVeterinarians()` - Lines 276-285
- `getVeterinariansBySpecialty(specialty)` - Lines 270-274

**Mock Data Behavior**:
- Uses case-insensitive matching: `specialty.toLowerCase().includes(specialty.toLowerCase())`
- More flexible than Supabase query
- Always returns results (if mock data contains matching vets)

## Mock Data Usage Patterns

### 1. Emergency Filter
```typescript
// Supabase attempt
results = await supabaseVetService.getEmergencyVeterinarians();

// Fallback to mock if empty
if (results.length === 0) {
  results = getEmergencyVeterinarians(); // Mock data
}
```

### 2. Specialty Filters (Surgery, Cardiology, etc.)
```typescript
// Supabase attempt
results = await supabaseVetService.getVeterinariansBySpecialty(specialty);

// Fallback to mock if empty
if (results.length === 0) {
  results = getVeterinariansBySpecialty(specialty); // Mock data
}
```

### 3. Error Handling
```typescript
catch (error) {
  // Always falls back to mock data on error
  results = getEmergencyVeterinarians(); // or getVeterinariansBySpecialty()
}
```

## Issues Found

### 1. **Case Sensitivity Mismatch**
- **Problem**: Quick filters use lowercase specialty names, but Supabase query may need exact matches
- **Impact**: Supabase queries often return empty, causing mock data to be used
- **Location**: `src/services/supabaseVetService.ts:167`

### 2. **Specialty Name Mapping**
- **Problem**: Quick filter uses `'exotic'` but database may store `'Exotic Animals'`
- **Impact**: Query fails, uses mock data
- **Solution Needed**: Map quick filter names to actual database specialty names

### 3. **Mock Data Always Available**
- **Problem**: Mock data functions always return results, masking database issues
- **Impact**: Users may see mock data instead of real database results without knowing
- **Recommendation**: Add logging/indicators when mock data is used

## Other Mock Data Usage

### 1. Top Rated Vets
**Location**: `src/screens/main/SearchScreen.tsx:80-99`
- Loads from Supabase first
- Falls back to `getTopRatedVeterinarians(3)` if empty or on error

### 2. Clinic Data
**Location**: `src/screens/main/SearchScreen.tsx:326, 539`
- Uses `mockClinics` array directly
- No Supabase fallback for clinic data in search results

### 3. Distance Calculation
**Location**: `src/screens/main/SearchScreen.tsx:320-323`
- Uses mock/random distance: `Math.random() * 20 + 0.5`
- Not calculated from actual coordinates

## Recommendations

### 1. Fix Specialty Name Mapping
Create a mapping between quick filter names and database specialty names:
```typescript
const specialtyMapping = {
  'emergency': ['Emergency Medicine', 'Critical Care', 'Trauma Surgery', 'Urgent Care'],
  'surgery': ['Surgery', 'Surgical Procedures'],
  'cardiology': ['Cardiology', 'Cardiovascular'],
  'dermatology': ['Dermatology'],
  'dental': ['Dental Care', 'Dentistry'],
  'exotic': ['Exotic Animals', 'Exotic Pet Care']
};
```

### 2. Improve Supabase Query
Make specialty matching case-insensitive or use client-side filtering:
```typescript
// Get all vets, filter client-side (like searchVeterinarians does)
const allVets = await this.getAllVeterinarians();
return allVets.filter(vet => 
  vet.specialties.some(s => 
    s.toLowerCase().includes(specialty.toLowerCase())
  )
);
```

### 3. Add Mock Data Indicators
Show users when mock data is being used:
```typescript
if (results.length === 0) {
  console.log('Using mock data - no database results');
  // Show indicator in UI
  setUsingMockData(true);
  results = getEmergencyVeterinarians();
}
```

### 4. Fix Clinic Data Loading
Load clinic data from Supabase instead of using mock data:
```typescript
// Instead of: mockClinics.find(c => c.id === item.clinic_id)
const clinic = await supabaseClinicService.getClinicById(item.clinic_id);
```

### 5. Implement Real Distance Calculation
Replace mock distance with actual coordinate-based calculation:
```typescript
const calculateDistance = (vetId: string, userLocation: LocationCoordinates): number => {
  const clinic = clinics[vetId];
  if (!clinic?.coordinates || !userLocation) return 0;
  // Use haversine formula or similar
  return haversineDistance(userLocation, clinic.coordinates);
};
```

## Summary

**Current State**:
- Quick filters attempt to use Supabase database first
- Mock data is used as fallback when:
  - Supabase returns empty results (likely due to case sensitivity issues)
  - Supabase query fails
- Mock data is also used for:
  - Clinic information in search results
  - Distance calculations (random values)

**Main Issue**: 
The case sensitivity mismatch between quick filter specialty names and database specialty names causes most queries to return empty, resulting in mock data being used frequently.

**Priority Fix**: 
Implement proper specialty name mapping or use client-side filtering (like `searchVeterinarians` does) to ensure database results are returned instead of falling back to mock data.

