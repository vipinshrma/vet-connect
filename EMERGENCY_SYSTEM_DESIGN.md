# 🚨 **EMERGENCY VET AVAILABILITY SYSTEM DESIGN**

## **System Overview**
A comprehensive emergency veterinary care network where veterinarians can opt-in to emergency availability and pet owners can request immediate assistance with intelligent vet-matching based on location, specialty, and availability.

## **Database Schema Extension**

### **Emergency Availability Table**
```sql
-- Emergency Vet Availability Table
CREATE TABLE emergency_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  is_available_for_emergency BOOLEAN DEFAULT false,
  emergency_contact_phone TEXT,
  max_emergency_cases_per_day INTEGER DEFAULT 5,
  current_emergency_cases INTEGER DEFAULT 0,
  emergency_fee_multiplier DECIMAL DEFAULT 1.5, -- 1.5x normal fee
  available_from TIME DEFAULT '00:00:00',
  available_until TIME DEFAULT '23:59:59',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique constraint per vet
  UNIQUE(veterinarian_id)
);
```

### **Emergency Requests Table**
```sql
-- Emergency Cases/Requests Table
CREATE TABLE emergency_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  emergency_type TEXT NOT NULL CHECK (emergency_type IN (
    'trauma', 'poisoning', 'breathing_difficulty', 'seizure', 
    'unconscious', 'bleeding', 'fracture', 'heatstroke', 'other'
  )),
  severity_level TEXT NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  pet_location_lat DECIMAL,
  pet_location_lng DECIMAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'assigned', 'en_route', 'treating', 'completed', 'cancelled'
  )),
  estimated_arrival_time TIMESTAMP WITH TIME ZONE,
  actual_arrival_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  emergency_fee DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## **🩺 Veterinarian Flow**

### **1. Emergency Availability Settings**
**Screen: `VetEmergencySettingsScreen.tsx`**
- Toggle emergency availability on/off
- Set emergency contact phone
- Configure max emergency cases per day
- Set availability hours (e.g., 8:00 AM - 10:00 PM)
- Set emergency fee multiplier (e.g., 1.5x normal rate)

### **2. Emergency Dashboard**
**Screen: `VetEmergencyDashboardScreen.tsx`**
- View active emergency requests in real-time
- Accept/decline emergency cases
- Track current emergency cases count
- View daily emergency statistics
- Navigate to emergency request details

### **3. Emergency Case Management**
- Real-time notifications for new emergency requests
- GPS navigation to pet location
- Status updates (en_route → treating → completed)
- Emergency consultation notes
- Emergency billing with multiplier fee

## **🐾 Pet Owner Flow**

### **1. Emergency Request Process**
**Screen: `EmergencyRequestScreen.tsx` (Enhanced)**

**Step 1: Emergency Type Selection**
```typescript
const emergencyTypes = [
  { type: 'trauma', label: 'Trauma/Injury', severity: 'high', icon: '🩹' },
  { type: 'poisoning', label: 'Poisoning', severity: 'critical', icon: '☠️' },
  { type: 'breathing_difficulty', label: 'Breathing Problems', severity: 'critical', icon: '🫁' },
  { type: 'seizure', label: 'Seizure', severity: 'high', icon: '⚡' },
  { type: 'unconscious', label: 'Unconscious', severity: 'critical', icon: '😵' },
  { type: 'bleeding', label: 'Heavy Bleeding', severity: 'high', icon: '🩸' },
  { type: 'fracture', label: 'Bone Fracture', severity: 'medium', icon: '🦴' },
  { type: 'heatstroke', label: 'Heatstroke', severity: 'high', icon: '🌡️' },
  { type: 'other', label: 'Other Emergency', severity: 'medium', icon: '🚨' }
];
```

**Step 2: Pet Selection & Current Location**
- Select which pet needs emergency care
- Auto-detect current GPS location
- Option to manually enter address

**Step 3: Emergency Description**
- Text description of the emergency
- Optional photo upload
- Severity assessment questions

**Step 4: Find Available Emergency Vets**
- Intelligent matching algorithm
- Show nearby available emergency vets
- Display estimated arrival time and emergency fees

**Step 5: Request Emergency Assistance**
- Send emergency request to selected vet
- Real-time status tracking
- Emergency vet contact information

### **2. Emergency Tracking**
**Screen: `EmergencyTrackingScreen.tsx`**
- Real-time vet location tracking
- Estimated arrival countdown
- Direct communication with emergency vet
- Status updates (assigned → en_route → arrived → treating)

## **🔄 Emergency Matching Algorithm**

### **Vet Selection Criteria (Priority Order):**
1. **Availability Status**: Currently accepting emergency cases
2. **Capacity**: Below max daily emergency case limit
3. **Distance**: Within 25km radius
4. **Specialty Match**: Emergency Medicine, Critical Care, Trauma Surgery
5. **Rating**: Higher-rated vets preferred
6. **Response Time**: Historical average response time

### **Service: `EmergencyMatchingService.ts`**
```typescript
export class EmergencyMatchingService {
  async findBestEmergencyVet(request: EmergencyRequestInput): Promise<Veterinarian[]> {
    const availableVets = await supabaseEmergencyService.getAvailableEmergencyVets();
    
    return availableVets
      .filter(vet => {
        // Availability & capacity checks
        if (!vet.emergency_availability?.is_available_for_emergency) return false;
        if (vet.emergency_availability.current_emergency_cases >= 
            vet.emergency_availability.max_emergency_cases_per_day) return false;
        
        // Distance check (within 25km)
        const distance = calculateDistance(request.location, vet.clinic.location);
        if (distance > 25) return false;
        
        // Specialty matching for specific emergencies
        if (request.emergencyType === 'trauma' && 
            !vet.specialties.includes('Emergency Medicine')) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Multi-criteria sorting
        const aSpecialtyMatch = this.getSpecialtyMatch(a, request.emergencyType);
        const bSpecialtyMatch = this.getSpecialtyMatch(b, request.emergencyType);
        
        if (aSpecialtyMatch !== bSpecialtyMatch) {
          return bSpecialtyMatch - aSpecialtyMatch;
        }
        
        const aDistance = calculateDistance(request.location, a.clinic.location);
        const bDistance = calculateDistance(request.location, b.clinic.location);
        
        return aDistance - bDistance;
      });
  }

  private getSpecialtyMatch(vet: Veterinarian, emergencyType: string): number {
    const specialtyMap = {
      'trauma': ['Emergency Medicine', 'Trauma Surgery', 'Critical Care'],
      'poisoning': ['Emergency Medicine', 'Toxicology', 'Critical Care'],
      'breathing_difficulty': ['Emergency Medicine', 'Critical Care', 'Cardiology'],
      'seizure': ['Neurology', 'Emergency Medicine', 'Critical Care'],
      'unconscious': ['Emergency Medicine', 'Critical Care', 'Neurology'],
      'bleeding': ['Emergency Medicine', 'Surgery', 'Critical Care'],
      'fracture': ['Orthopedics', 'Surgery', 'Emergency Medicine'],
      'heatstroke': ['Emergency Medicine', 'Critical Care'],
      'other': ['Emergency Medicine']
    };

    const relevantSpecialties = specialtyMap[emergencyType] || ['Emergency Medicine'];
    let matchScore = 0;

    relevantSpecialties.forEach((specialty, index) => {
      if (vet.specialties.includes(specialty)) {
        matchScore += (relevantSpecialties.length - index); // Higher score for more specific matches
      }
    });

    return matchScore;
  }
}
```

## **💾 Key Database Fields**

### **Emergency Availability Fields:**
- `is_available_for_emergency: boolean` - Main toggle
- `emergency_contact_phone: string` - Direct emergency contact
- `max_emergency_cases_per_day: integer` - Daily capacity limit
- `current_emergency_cases: integer` - Current active cases
- `emergency_fee_multiplier: decimal` - Fee multiplier (e.g., 1.5x)
- `available_from/until: time` - Emergency availability hours

### **Emergency Request Tracking:**
- `emergency_type: enum` - Type of emergency
- `severity_level: enum` - Critical, high, medium, low
- `status: enum` - pending → assigned → en_route → treating → completed
- `pet_location_lat/lng: decimal` - GPS coordinates
- `estimated_arrival_time: timestamp` - ETA
- `emergency_fee: decimal` - Final emergency fee

## **🔔 Real-time Features**

### **For Veterinarians:**
- WebSocket subscriptions for new emergency requests
- Push notifications with emergency details
- Real-time case status updates
- GPS navigation integration

### **For Pet Owners:**
- Live vet location tracking
- Status update notifications
- Direct messaging with emergency vet
- Arrival time estimates

## **📱 Integration Points**

### **Existing Screen Enhancements:**
1. **EmergencyCareScreen.tsx** - Add "Request Emergency Vet" button
2. **HomeScreen.tsx** - Emergency availability toggle for vets
3. **VetListScreen.tsx** - Show emergency availability status

### **New Screens Required:**
1. `VetEmergencySettingsScreen.tsx` - Vet emergency configuration
2. `VetEmergencyDashboardScreen.tsx` - Active emergency cases
3. `EmergencyRequestScreen.tsx` - Pet owner emergency request flow
4. `EmergencyTrackingScreen.tsx` - Real-time emergency tracking
5. `EmergencyCaseDetailsScreen.tsx` - Emergency case management

### **Backend Services:**
1. `supabaseEmergencyService.ts` - Emergency data operations
2. `emergencyMatchingService.ts` - Vet matching algorithm
3. `emergencyNotificationService.ts` - Real-time notifications
4. `emergencyTrackingService.ts` - GPS tracking features

## **🎯 Implementation Priority**

### **Phase 1: Core Emergency System**
1. Database schema creation
2. Emergency availability settings for vets
3. Basic emergency request flow for pet owners
4. Emergency vet matching algorithm

### **Phase 2: Real-time Features**
1. WebSocket integration for live updates
2. Push notification system
3. GPS tracking and navigation
4. Real-time status updates

### **Phase 3: Advanced Features**
1. Emergency analytics and reporting
2. Emergency case history
3. Payment processing for emergency fees
4. Emergency follow-up and feedback

## **🔧 Technical Implementation Details**

### **Database Triggers & Functions**
```sql
-- Function to automatically update current_emergency_cases count
CREATE OR REPLACE FUNCTION update_emergency_case_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'assigned' THEN
    UPDATE emergency_availability 
    SET current_emergency_cases = current_emergency_cases + 1
    WHERE veterinarian_id = NEW.veterinarian_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IN ('assigned', 'en_route', 'treating') 
    AND NEW.status IN ('completed', 'cancelled') THEN
    UPDATE emergency_availability 
    SET current_emergency_cases = current_emergency_cases - 1
    WHERE veterinarian_id = NEW.veterinarian_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain emergency case counts
CREATE TRIGGER emergency_case_count_trigger
  AFTER INSERT OR UPDATE ON emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_case_count();
```

### **Real-time Subscriptions**
```typescript
// Real-time emergency request updates
const subscribeToEmergencyRequests = (veterinarianId: string) => {
  return supabase
    .channel('emergency_requests')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'emergency_requests',
      filter: `status=eq.pending`
    }, (payload) => {
      // Handle new emergency request
      handleNewEmergencyRequest(payload.new);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'emergency_requests',
      filter: `veterinarian_id=eq.${veterinarianId}`
    }, (payload) => {
      // Handle status updates for assigned cases
      handleEmergencyStatusUpdate(payload.new);
    })
    .subscribe();
};
```

### **Distance Calculation Utility**
```typescript
// Haversine distance calculation for emergency vet matching
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};
```

---

*Created: January 2025*  
*VetConnect Emergency Veterinary Care Network Specification*  
*Comprehensive system design for real-time emergency vet matching and response*