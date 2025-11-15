# Emergency Care Flow Analysis

## Current Emergency Care Flow

### 1. EmergencyCareScreen Flow (Current Implementation)

**Location**: `src/screens/EmergencyCareScreen.tsx`

**Current Flow**:
1. **Screen Loads** → `loadEmergencyServices()` called
2. **Get User Location** → `locationService.getCurrentLocation()`
3. **Fetch Emergency Services** (Parallel):
   - Emergency Vets: `vetService.getEmergencyVets(location, 25km)`
   - Emergency Clinics: `vetService.getEmergencyClinics(location, 25km)`
4. **Display Results**:
   - Quick Actions (Call Hotline, Poison Control, Find Nearest)
   - Emergency Clinics List (sorted by distance)
   - Emergency Veterinarians List
   - Emergency Tips

**Issues with Current Flow**:
- ❌ Uses mock data service (`vetService`) instead of Supabase
- ❌ No proper distance calculation and sorting
- ❌ "Find Nearest Emergency Clinic" just opens first clinic (not actually nearest)
- ❌ No real-time availability checking
- ❌ No 24/7 status verification
- ❌ No integration with Supabase clinic service

## Recommended Flow: Find Nearest Emergency Clinic

### Flow Diagram

```
User Opens Emergency Care Screen
         ↓
Request Location Permission
         ↓
Get User Current Location
         ↓
Query Supabase for Emergency Clinics
  - Filter by emergency services
  - Filter by location (within radius)
         ↓
Calculate Distance for Each Clinic
         ↓
Sort by Distance (Nearest First)
         ↓
Filter by Availability (24/7 or Currently Open)
         ↓
Display Results:
  1. Nearest Emergency Clinic (Highlighted)
  2. Other Nearby Clinics (Sorted by Distance)
         ↓
User Actions:
  - Call Clinic
  - Get Directions (Maps Integration)
  - View Clinic Details
```

### Detailed Step-by-Step Flow

#### Step 1: Location Acquisition
```typescript
1. Check location permission
2. Request permission if not granted
3. Get current GPS coordinates
4. Handle errors gracefully (show all clinics if location fails)
```

#### Step 2: Query Emergency Clinics from Supabase
```typescript
1. Query clinics with emergency services:
   - services contains "Emergency Care"
   - services contains "24/7 Emergency Care"
   - services contains "Urgent Care"
   - services contains "Emergency Medicine"

2. Filter by location (if available):
   - Use getClinicsNearLocation(lat, lng, radius)
   - Default radius: 25km (expandable to 50km if no results)

3. Order by rating (initial sort)
```

#### Step 3: Distance Calculation & Sorting
```typescript
1. For each clinic, calculate distance from user location
2. Sort clinics by distance (nearest first)
3. Prioritize 24/7 clinics over regular emergency clinics
4. Within same distance, prefer higher-rated clinics
```

#### Step 4: Availability Check
```typescript
1. Check if clinic is 24/7 (services contains "24/7")
2. If not 24/7, check current time vs opening hours
3. Mark clinics as:
   - "Open Now" (green badge)
   - "24/7 Available" (green badge)
   - "Closed" (gray badge with next opening time)
```

#### Step 5: Display Results
```typescript
1. Show nearest clinic prominently at top
2. Display distance, phone, address
3. Show availability status
4. Provide quick actions:
   - Call button (red, prominent)
   - Directions button (blue)
   - View Details button
```

## Recommended Implementation

### 1. Enhanced Supabase Service Method

**File**: `src/services/supabaseClinicService.ts`

```typescript
// Get nearest emergency clinics with distance calculation
async getNearestEmergencyClinics(
  latitude: number,
  longitude: number,
  radiusKm: number = 25
): Promise<Array<Clinic & { distance: number; isOpen24Hours: boolean; isCurrentlyOpen: boolean }>> {
  try {
    // Step 1: Get emergency clinics
    const emergencyClinics = await this.getEmergencyClinics();
    
    // Step 2: Calculate distance for each clinic
    const clinicsWithDistance = emergencyClinics.map(clinic => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        clinic.latitude,
        clinic.longitude
      );
      
      const isOpen24Hours = clinic.services.some(service =>
        service.toLowerCase().includes('24/7') ||
        service.toLowerCase().includes('24 hour')
      );
      
      // Check if currently open (simplified - would need hours data)
      const isCurrentlyOpen = this.isClinicCurrentlyOpen(clinic);
      
      return {
        ...clinic,
        distance,
        isOpen24Hours,
        isCurrentlyOpen
      };
    });
    
    // Step 3: Filter by radius
    const nearbyClinics = clinicsWithDistance.filter(c => c.distance <= radiusKm);
    
    // Step 4: Sort by priority
    return nearbyClinics.sort((a, b) => {
      // Priority 1: 24/7 clinics first
      if (a.isOpen24Hours !== b.isOpen24Hours) {
        return a.isOpen24Hours ? -1 : 1;
      }
      
      // Priority 2: Currently open
      if (a.isCurrentlyOpen !== b.isCurrentlyOpen) {
        return a.isCurrentlyOpen ? -1 : 1;
      }
      
      // Priority 3: Distance (nearest first)
      if (Math.abs(a.distance - b.distance) > 0.1) {
        return a.distance - b.distance;
      }
      
      // Priority 4: Rating (higher first)
      return b.rating - a.rating;
    });
  } catch (error) {
    console.error('Error getting nearest emergency clinics:', error);
    throw error;
  }
}

// Haversine distance calculation
private calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Check if clinic is currently open
private isClinicCurrentlyOpen(clinic: Clinic): boolean {
  // Check if 24/7
  const is24Hours = clinic.services.some(service =>
    service.toLowerCase().includes('24/7') ||
    service.toLowerCase().includes('24 hour')
  );
  
  if (is24Hours) return true;
  
  // Check opening hours (would need hours data from clinic)
  // For now, return true as fallback
  // TODO: Implement proper hours checking
  return true;
}
```

### 2. Updated EmergencyCareScreen Flow

**File**: `src/screens/EmergencyCareScreen.tsx`

```typescript
const loadEmergencyServices = async () => {
  try {
    setLoading(true);
    
    // Step 1: Get user location
    let userLocation: LocationCoordinates | null = null;
    try {
      const location = await locationService.getCurrentLocation();
      userLocation = location.coordinates;
      setUserLocation(location);
    } catch (locationError) {
      console.warn('Location not available, showing all emergency clinics');
      // Continue without location
    }
    
    // Step 2: Get emergency clinics from Supabase
    if (userLocation) {
      // Get nearest emergency clinics with distance
      const clinics = await supabaseClinicService.getNearestEmergencyClinics(
        userLocation.latitude,
        userLocation.longitude,
        25 // 25km radius
      );
      
      setEmergencyClinics(clinics);
      
      // If no results, try expanding radius
      if (clinics.length === 0) {
        const expandedClinics = await supabaseClinicService.getNearestEmergencyClinics(
          userLocation.latitude,
          userLocation.longitude,
          50 // 50km radius
        );
        setEmergencyClinics(expandedClinics);
      }
    } else {
      // Fallback: Get all emergency clinics (no location)
      const clinics = await supabaseClinicService.getEmergencyClinics();
      setEmergencyClinics(clinics);
    }
    
    // Step 3: Get emergency veterinarians
    const vets = await supabaseVetService.getEmergencyVeterinarians();
    setEmergencyVets(vets);
    
  } catch (error) {
    console.error('Error loading emergency services:', error);
    Alert.alert(
      'Error',
      'Unable to load emergency services. Please check your connection and try again.'
    );
  } finally {
    setLoading(false);
  }
};

// Find nearest clinic handler
const handleFindNearestClinic = () => {
  if (emergencyClinics.length === 0) {
    Alert.alert(
      'No Clinics Found',
      'No emergency clinics found nearby. Please try calling emergency hotlines or expanding your search radius.'
    );
    return;
  }
  
  // Get the nearest clinic (first in sorted array)
  const nearestClinic = emergencyClinics[0];
  
  // Show clinic details and options
  Alert.alert(
    `Nearest Emergency Clinic: ${nearestClinic.name}`,
    `${nearestClinic.address}\n${nearestClinic.city}, ${nearestClinic.state}\n\nDistance: ${nearestClinic.distance.toFixed(1)} km\nPhone: ${nearestClinic.phone}`,
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Call', 
        onPress: () => handleEmergencyCall(nearestClinic.phone),
        style: 'destructive'
      },
      { 
        text: 'Directions', 
        onPress: () => handleDirections(nearestClinic)
      }
  ]
  );
};
```

### 3. Enhanced Clinic Card Display

**Priority Display Order**:
1. **Nearest Clinic** (Highlighted with "Nearest" badge)
2. **24/7 Clinics** (Green "24/7" badge)
3. **Currently Open** (Green "Open Now" badge)
4. **Closed Clinics** (Gray "Closed" badge with next opening time)

**Information Displayed**:
- Clinic name
- Distance (km)
- Address
- Phone number
- Availability status
- Services (first 3)
- Rating (if available)

**Actions Available**:
- **Call** (Red button - most prominent)
- **Directions** (Blue button - opens Maps app)
- **View Details** (Navigate to clinic details screen)

## Key Improvements Needed

### 1. Replace Mock Data with Supabase
- ✅ Use `supabaseClinicService.getEmergencyClinics()`
- ✅ Use `supabaseClinicService.getNearestEmergencyClinics()`
- ✅ Remove dependency on `vetService` mock data

### 2. Proper Distance Calculation
- ✅ Implement Haversine formula for accurate distance
- ✅ Sort by distance (nearest first)
- ✅ Display distance prominently

### 3. Availability Checking
- ✅ Check 24/7 status from services array
- ✅ Check current opening hours (when hours data available)
- ✅ Show availability badges

### 4. Enhanced "Find Nearest" Feature
- ✅ Actually find and highlight nearest clinic
- ✅ Show distance and quick actions
- ✅ Provide one-tap calling and directions

### 5. Progressive Search Radius
- ✅ Start with 25km radius
- ✅ Expand to 50km if no results
- ✅ Show "No clinics found" message if still empty

## User Experience Flow

### Scenario 1: User with Location Permission
```
1. Open Emergency Care Screen
2. Location detected automatically
3. Shows "Finding nearest emergency clinics..."
4. Displays nearest clinic at top with:
   - "Nearest" badge
   - Distance (e.g., "2.3 km away")
   - "Open Now" or "24/7" badge
   - Call and Directions buttons
5. Shows other nearby clinics below
```

### Scenario 2: User without Location Permission
```
1. Open Emergency Care Screen
2. Request location permission
3. If denied:
   - Show all emergency clinics
   - Sort by rating
   - Show message: "Enable location to find nearest clinic"
4. If granted: Follow Scenario 1
```

### Scenario 3: No Clinics Found
```
1. Try 25km radius → No results
2. Try 50km radius → No results
3. Show empty state:
   - "No emergency clinics found nearby"
   - "Try expanding search radius"
   - "Call emergency hotline: 1-800-VET-HELP"
   - Button: "View All Emergency Clinics"
```

## Database Query Optimization

### Current Query (Needs Improvement)
```typescript
// Current: Gets all emergency clinics, then filters client-side
.or('services.cs.{"Emergency Care"}, services.cs.{"24/7 Emergency Care"}, services.cs.{"Urgent Care"}')
```

### Recommended Query (Better Performance)
```typescript
// Option 1: Use array overlap operator (if Postgres supports)
.contains('services', ['Emergency Care', '24/7 Emergency Care', 'Urgent Care'])

// Option 2: Use text search (if services stored as text)
.ilike('services', '%Emergency%')

// Option 3: Client-side filtering (current approach, but with better distance calculation)
```

## Summary

### Current Flow Issues:
1. ❌ Uses mock data instead of Supabase
2. ❌ No proper distance calculation
3. ❌ "Find Nearest" doesn't actually find nearest
4. ❌ No availability checking
5. ❌ No 24/7 status verification

### Recommended Flow:
1. ✅ Get user location
2. ✅ Query Supabase for emergency clinics
3. ✅ Calculate distance for each clinic
4. ✅ Sort by distance (nearest first)
5. ✅ Check availability (24/7 or currently open)
6. ✅ Display nearest clinic prominently
7. ✅ Provide quick actions (Call, Directions)

### Priority Implementation:
1. **High**: Replace mock data with Supabase queries
2. **High**: Implement proper distance calculation
3. **High**: Sort clinics by distance
4. **Medium**: Add availability checking
5. **Medium**: Enhance "Find Nearest" feature
6. **Low**: Add progressive radius expansion

