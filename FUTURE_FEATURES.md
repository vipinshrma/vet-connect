# VetConnect - Future Features Implementation

This document tracks planned features for future development phases.

## 🏥 My Practice Section Features

### 🛍️ Services & Pricing Management
**Status:** Pending Implementation  
**Priority:** Low  
**Location:** My Practice → Services & Pricing

#### Features to Implement:
- **Service Categories**
  - General Consultations
  - Vaccinations & Preventive Care
  - Surgical Procedures
  - Emergency Services
  - Diagnostic Services (X-ray, Blood work, etc.)
  - Dental Care
  - Grooming Services

- **Pricing Configuration**
  - Set prices for each service
  - Different pricing tiers (basic, standard, premium)
  - Insurance coverage information
  - Package deals and discounts
  - Seasonal pricing adjustments

- **Service Management**
  - Enable/disable services
  - Service descriptions and duration
  - Required equipment/facilities
  - Staff requirements per service

#### Database Schema Needed:
```sql
-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veterinarian_id UUID REFERENCES veterinarians(id),
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  base_price DECIMAL(10,2),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service pricing tiers
CREATE TABLE service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  tier_name VARCHAR NOT NULL, -- basic, standard, premium
  price DECIMAL(10,2) NOT NULL,
  description TEXT
);
```

#### UI Components Needed:
- ServicesManagementScreen.tsx
- ServiceCard component
- PricingTierSelector component
- ServiceCategoryFilter component

---

### 📅 Schedule & Availability Management
**Status:** Pending Implementation  
**Priority:** Low  
**Location:** My Practice → Schedule & Availability

#### Features to Implement:
- **Working Hours Configuration**
  - Set daily working hours for each day of the week
  - Different schedules for different days
  - Holiday and vacation scheduling
  - Emergency availability settings

- **Appointment Slot Management**
  - Configure appointment duration (15min, 30min, 1hour slots)
  - Buffer time between appointments
  - Block specific time slots
  - Recurring availability patterns

- **Advanced Scheduling**
  - Break times and lunch hours
  - Different availability for different services
  - Seasonal schedule changes
  - Integration with existing appointment system

#### Database Schema Needed:
```sql
-- Veterinarian schedules
CREATE TABLE vet_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veterinarian_id UUID REFERENCES veterinarians(id),
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start_time TIME,
  break_end_time TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Special availability (holidays, vacations, etc.)
CREATE TABLE vet_special_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veterinarian_id UUID REFERENCES veterinarians(id),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT false,
  reason VARCHAR, -- vacation, holiday, emergency_only, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointment slot configurations
CREATE TABLE appointment_slot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veterinarian_id UUID REFERENCES veterinarians(id),
  service_type VARCHAR,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 5,
  max_advance_booking_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### UI Components Needed:
- ScheduleManagementScreen.tsx
- WeeklyScheduleSelector component
- TimeSlotPicker component
- SpecialAvailabilityManager component
- AppointmentSlotConfigurator component

---

## 📱 UI Navigation Updates Needed

### ProfileScreen.tsx
Currently has placeholder buttons that need to be connected:

```tsx
// These buttons need onPress handlers:
<TouchableOpacity
  onPress={() => navigation.navigate('ServicesManagement')} // To implement
  className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
>
  <View className="flex-row items-center">
    <Ionicons name="list" size={18} color="#6b7280" />
    <Text className="text-gray-800 ml-3 font-medium">Services & Pricing</Text>
  </View>
  <Ionicons name="chevron-forward" size={18} color="#6b7280" />
</TouchableOpacity>

<TouchableOpacity
  onPress={() => navigation.navigate('ScheduleManagement')} // To implement
  className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
>
  <View className="flex-row items-center">
    <Ionicons name="calendar" size={18} color="#6b7280" />
    <Text className="text-gray-800 ml-3 font-medium">Schedule & Availability</Text>
  </View>
  <Ionicons name="chevron-forward" size={18} color="#6b7280" />
</TouchableOpacity>
```

### Navigation Routes to Add
```tsx
// In RootStackParamList (src/types/index.ts)
export type RootStackParamList = {
  // ... existing routes
  ServicesManagement: { veterinarianId: string };
  ScheduleManagement: { veterinarianId: string };
};

// In AppNavigator.tsx
<Stack.Screen 
  name="ServicesManagement" 
  component={ServicesManagementScreen}
  options={{ title: 'Services & Pricing' }}
/>
<Stack.Screen 
  name="ScheduleManagement" 
  component={ScheduleManagementScreen}
  options={{ title: 'Schedule & Availability' }}
/>
```

---

## 🔄 Integration Points

### With Existing Systems:
- **Appointment Booking**: Schedule availability affects appointment slots
- **Veterinarian Profiles**: Services link to vet specialties
- **Payment Processing**: Service pricing integration
- **Search/Filter**: Services appear in search results

### API Services to Create:
- `supabaseServicesService.ts` - Manage veterinarian services
- `supabaseScheduleService.ts` - Manage availability and schedules
- Integration with existing `supabaseVetService.ts`

---

## ⏱️ Implementation Timeline

### Phase 1: Services & Pricing (Estimated: 2-3 weeks)
1. Database schema setup
2. Basic services management screen
3. Pricing configuration
4. Integration with vet profiles

### Phase 2: Schedule & Availability (Estimated: 2-3 weeks)
1. Database schema setup
2. Weekly schedule configuration
3. Special availability management
4. Integration with appointment system

### Phase 3: Advanced Features (Estimated: 1-2 weeks)
1. Service-specific scheduling
2. Advanced pricing tiers
3. Analytics and reporting
4. Mobile notifications

---

## 📝 Notes

- These features are currently **commented out** in ProfileScreen.tsx
- Database schemas above are suggestions and may need refinement
- UI/UX designs should follow the existing VetConnect design system
- Consider user testing before full implementation
- Ensure mobile responsiveness for all new screens

---

## 🔄 Feature Addition Process

**Going forward, any feature that gets held for future implementation will be documented here.**

### How to Add New Future Features:
1. **Feature Identification** - When a feature is discussed but deferred
2. **Documentation** - Add detailed specs to appropriate section below
3. **Database Design** - Include schema if database changes needed
4. **UI Planning** - Specify components and screens required
5. **Integration Points** - Note how it connects to existing features
6. **Priority Assignment** - Set implementation priority (high/medium/low)

### Future Feature Categories:
- **My Practice Features** (Services, Scheduling, Analytics)
- **User Experience Enhancements** (UI/UX improvements)
- **Advanced Functionality** (AI features, integrations)
- **Business Features** (Payments, reporting, notifications)
- **Platform Features** (Admin panel, multi-clinic support)

---

*Last Updated: January 2025*
*Status: Living Document - Updated as new features are identified*