# 📋 Patient Records Management Module - Planning Document

## Current State Analysis

### ✅ **What We Have:**
- `Pet` interface with basic information (name, species, breed, age, weight, medical history)
- `Appointment` interface with notes, prescription, and status
- `Vaccination` interface for vaccination tracking
- `supabasePetService.ts` for basic pet CRUD operations
- `supabaseAppointmentService.ts` for appointment management

### ❌ **What We Need:**
- Medical records system for veterinarians
- Patient history tracking
- Treatment notes and prescriptions
- Comprehensive patient dashboard for vets

---

## 🎯 Module Goals

**Primary Goal:** Enable veterinarians to access, view, and manage comprehensive medical records for all pets they've treated or are scheduled to treat.

### **Key User Stories:**
1. **As a veterinarian**, I want to see all my patients (pets) in one place
2. **As a veterinarian**, I want to view a pet's complete medical history
3. **As a veterinarian**, I want to add treatment notes after appointments
4. **As a veterinarian**, I want to update prescriptions and medical records
5. **As a veterinarian**, I want to track vaccination schedules
6. **As a veterinarian**, I want to see upcoming appointments for each patient

---

## 📱 UI/UX Flow Design

### **1. Patient List Screen (Entry Point)**
```
┌─────────────────────────────────────┐
│ 🩺 My Patients                      │
├─────────────────────────────────────┤
│ 🔍 Search patients...               │
├─────────────────────────────────────┤
│ 📊 Quick Stats                      │
│ • Total Patients: 45                │
│ • Appointments Today: 8             │
│ • Pending Notes: 3                  │
├─────────────────────────────────────┤
│ 🐕 Buddy (Golden Retriever)         │
│ Owner: John Smith                   │
│ Last Visit: Jan 15, 2025            │
│ Status: ⚠️ Follow-up needed         │
├─────────────────────────────────────┤
│ 🐱 Whiskers (Siamese Cat)          │
│ Owner: Sarah Johnson               │
│ Last Visit: Jan 10, 2025           │
│ Status: ✅ Healthy                  │
└─────────────────────────────────────┘
```

### **2. Patient Detail Screen**
```
┌─────────────────────────────────────┐
│ ← 🐕 Buddy - Patient Record         │
├─────────────────────────────────────┤
│ [Info] [History] [Appointments]     │
├─────────────────────────────────────┤
│ 📋 Basic Information                │
│ • Species: Dog (Golden Retriever)   │
│ • Age: 3 years                      │
│ • Weight: 65 lbs                    │
│ • Owner: John Smith                 │
├─────────────────────────────────────┤
│ 🩺 Recent Treatments                │
│ Jan 15: General checkup - Healthy   │
│ Dec 10: Vaccination - Rabies        │
│ Nov 5: Surgery - Spay/Neuter       │
├─────────────────────────────────────┤
│ 💊 Current Medications              │
│ • Metacam (Pain relief) - 5mg/day   │
│ • Expires: Jan 30, 2025             │
├─────────────────────────────────────┤
│ [+ Add Treatment Note]              │
│ [📅 Schedule Appointment]           │
└─────────────────────────────────────┘
```

### **3. Treatment Notes Modal**
```
┌─────────────────────────────────────┐
│ 📝 Add Treatment Note               │
├─────────────────────────────────────┤
│ Patient: Buddy                      │
│ Date: Jan 27, 2025                  │
├─────────────────────────────────────┤
│ Treatment Type:                     │
│ [Checkup] [Surgery] [Vaccination]   │
│ [Emergency] [Follow-up] [Other]     │
├─────────────────────────────────────┤
│ Notes:                              │
│ ┌─────────────────────────────────┐ │
│ │ Patient presented with...       │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Prescriptions: (Optional)           │
│ ┌─────────────────────────────────┐ │
│ │ Metacam 5mg - Once daily       │ │
│ │ Duration: 7 days                │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Next Visit: (Optional)              │
│ [📅 Schedule Follow-up]             │
├─────────────────────────────────────┤
│ [Cancel]              [Save Note]   │
└─────────────────────────────────────┘
```

---

## 🗄️ Database Schema Requirements

### **New Tables Needed:**

#### **1. `medical_records`**
```sql
CREATE TABLE medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  treatment_type TEXT NOT NULL CHECK (treatment_type IN ('checkup', 'surgery', 'vaccination', 'emergency', 'follow-up', 'other')),
  diagnosis TEXT,
  treatment_notes TEXT NOT NULL,
  prescriptions JSONB DEFAULT '[]',
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  treatment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. `prescriptions`** (Enhanced tracking)
```sql
CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  instructions TEXT,
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. Enhanced `vaccinations` table**
```sql
CREATE TABLE IF NOT EXISTS vaccinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
  vaccine_name TEXT NOT NULL,
  vaccine_type TEXT, -- Core, Non-core, etc.
  administered_date DATE NOT NULL,
  next_due_date DATE,
  batch_number TEXT,
  manufacturer TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'overdue', 'scheduled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **4. Indexes and RLS Policies**
```sql
-- Indexes for performance
CREATE INDEX idx_medical_records_pet_id ON medical_records(pet_id);
CREATE INDEX idx_medical_records_vet_id ON medical_records(veterinarian_id);
CREATE INDEX idx_medical_records_treatment_date ON medical_records(treatment_date);
CREATE INDEX idx_prescriptions_pet_id ON prescriptions(pet_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_next_due ON vaccinations(next_due_date) WHERE status = 'completed';

-- RLS Policies
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

-- Veterinarians can access records they created
CREATE POLICY medical_records_vet_access ON medical_records
  FOR ALL USING (veterinarian_id = auth.uid());

CREATE POLICY prescriptions_vet_access ON prescriptions
  FOR ALL USING (veterinarian_id = auth.uid());

CREATE POLICY vaccinations_vet_access ON vaccinations
  FOR ALL USING (veterinarian_id = auth.uid());

-- Pet owners can view their pets' records (read-only)
CREATE POLICY medical_records_owner_view ON medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND pets.owner_id = auth.uid()
    )
  );
```

---

## 🔧 Backend Services Required

### **`supabasePatientService.ts`**
```typescript
interface PatientRecord {
  pet: Pet;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  lastVisit?: Date;
  nextAppointment?: Date;
  totalVisits: number;
  medicalRecords: MedicalRecord[];
  activePrescriptions: Prescription[];
  vaccinations: Vaccination[];
  status: 'healthy' | 'follow-up-needed' | 'overdue-vaccination' | 'critical';
}

interface MedicalRecord {
  id: string;
  petId: string;
  veterinarianId: string;
  appointmentId?: string;
  treatmentType: 'checkup' | 'surgery' | 'vaccination' | 'emergency' | 'follow-up' | 'other';
  diagnosis?: string;
  treatmentNotes: string;
  prescriptions: Prescription[];
  followUpRequired: boolean;
  followUpDate?: string;
  treatmentDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Prescription {
  id: string;
  medicalRecordId: string;
  petId: string;
  veterinarianId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  instructions?: string;
  prescribedDate: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued' | 'expired';
  createdAt: string;
  updatedAt: string;
}

class SupabasePatientService {
  // Get all patients for a veterinarian
  async getVeterinarianPatients(vetId: string): Promise<PatientRecord[]>
  
  // Get patient details with full medical history
  async getPatientDetails(petId: string): Promise<PatientRecord>
  
  // Add medical record/treatment note
  async addMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord>
  
  // Update medical record
  async updateMedicalRecord(recordId: string, updates: Partial<MedicalRecord>): Promise<MedicalRecord>
  
  // Get patient's appointment history
  async getPatientAppointments(petId: string): Promise<Appointment[]>
  
  // Search patients by name/owner
  async searchPatients(vetId: string, query: string): Promise<PatientRecord[]>
  
  // Get patients with upcoming appointments
  async getPatientsWithUpcomingAppointments(vetId: string): Promise<PatientRecord[]>
  
  // Get patients needing follow-up
  async getPatientsNeedingFollowUp(vetId: string): Promise<PatientRecord[]>
  
  // Prescription management
  async addPrescription(prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prescription>
  async updatePrescriptionStatus(prescriptionId: string, status: Prescription['status']): Promise<void>
  async getActivePrescriptions(petId: string): Promise<Prescription[]>
  
  // Vaccination management
  async addVaccination(vaccination: Omit<Vaccination, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vaccination>
  async getOverdueVaccinations(vetId: string): Promise<Vaccination[]>
  async updateVaccinationStatus(vaccinationId: string, status: string): Promise<void>
  
  // Dashboard statistics
  async getVeterinarianDashboardStats(vetId: string): Promise<{
    totalPatients: number;
    appointmentsToday: number;
    pendingFollowUps: number;
    overdueVaccinations: number;
  }>
}
```

---

## 📱 Screens/Components Architecture

### **Screen Structure:**
```
src/screens/patient/
├── PatientListScreen.tsx          // Main patient list with search and stats
├── PatientDetailScreen.tsx        // Individual patient record (tabbed)
├── AddTreatmentNoteScreen.tsx     // Add/edit medical records
├── PrescriptionManagementScreen.tsx // Manage prescriptions
└── VaccinationScheduleScreen.tsx  // Vaccination tracking

src/components/patient/
├── PatientCard.tsx                // Patient list item with status indicator
├── MedicalRecordCard.tsx         // Treatment history item
├── PrescriptionCard.tsx          // Prescription item with status
├── VaccinationCard.tsx           // Vaccination history item
├── QuickStatsCard.tsx           // Dashboard stats widget
├── PatientSearchBar.tsx         // Search with filters
├── TreatmentTypeSelector.tsx    // Treatment type picker
└── PrescriptionBuilder.tsx      // Prescription form component
```

### **Navigation Integration:**
```typescript
// Add to RootStackParamList:
PatientList: undefined;
PatientDetail: { petId: string };
AddTreatmentNote: { petId: string; appointmentId?: string };
PrescriptionManagement: { petId: string };
VaccinationSchedule: { petId: string };

// Add to HomeScreen veterinarian actions:
{
  title: "Patient Records",
  description: "Access your patients' medical records",
  iconName: "heart",
  onPress: () => navigation?.navigate('PatientList'),
  isComingSoon: false
}
```

---

## 🎨 Key UI Features

### **Patient List Features:**
- **Search and Filter**: By patient name, owner name, species, status
- **Sort Options**: Last visit, name, status, upcoming appointments
- **Quick Stats Dashboard**: Total patients, appointments today, pending follow-ups
- **Status Indicators**: 
  - 🟢 Healthy (no pending issues)
  - 🟡 Follow-up needed
  - 🔴 Overdue vaccination
  - ⚪ Critical condition
- **Filter Tabs**: All, Today's Appointments, Follow-ups Needed, Overdue

### **Patient Detail Features:**
- **Tabbed Interface**:
  - **Info Tab**: Basic pet info, owner details, quick stats
  - **History Tab**: Medical records timeline
  - **Appointments Tab**: Past and upcoming appointments
- **Timeline View**: Chronological medical history
- **Quick Actions**: 
  - Add treatment note
  - Schedule appointment
  - Prescribe medication
  - Record vaccination
- **Prescription Management**: Active medications with expiry tracking
- **Vaccination Tracking**: Schedule and overdue reminders

### **Treatment Note Features:**
- **Treatment Type Selection**: Predefined categories with icons
- **Rich Text Editing**: Formatted notes with bullet points
- **Prescription Builder**: 
  - Medication search/autocomplete
  - Dosage and frequency selectors
  - Duration calculator
  - Custom instructions
- **Photo Attachments**: (Future enhancement)
- **Voice Notes**: (Future enhancement)
- **Follow-up Scheduling**: Direct appointment booking

---

## 🔄 Integration Points

### **With Existing Systems:**
1. **Appointments**: 
   - Link medical records to completed appointments
   - Auto-create treatment note templates from appointment outcomes
   - Update appointment status to "completed" when medical record added

2. **Pet Management**: 
   - Extend existing pet data with medical history
   - Update pet weight from treatment records
   - Sync vaccination records with pet profiles

3. **User System**: 
   - Ensure proper veterinarian access control
   - Link medical records to treating veterinarian
   - Respect clinic-based permissions

4. **Clinic Management**: 
   - Filter patients by clinic association
   - Share patient records between clinic veterinarians
   - Clinic-wide patient statistics

### **Data Relationships:**
```
Veterinarian (1) ←→ (M) Medical Records ←→ (1) Pet ←→ (1) Owner
Appointment (1) ←→ (0..1) Medical Record
Medical Record (1) ←→ (M) Prescriptions
Pet (1) ←→ (M) Vaccinations ←→ (1) Veterinarian
Medical Record (1) ←→ (M) Vaccinations (optional link)
```

---

## 📊 Success Metrics

### **Functional Requirements:**
- ✅ Veterinarians can see all their patients with basic info
- ✅ Complete medical history is accessible in chronological order
- ✅ Treatment notes can be added with rich formatting
- ✅ Prescriptions are tracked with status and expiry
- ✅ Vaccination schedules are maintained and monitored
- ✅ Search and filtering works across all patient data
- ✅ Patient status is automatically calculated and displayed

### **User Experience Goals:**
- **Performance**: Fast patient lookup (< 2 seconds)
- **Usability**: Intuitive medical record creation (< 30 seconds)
- **Visibility**: Clear patient status indicators
- **Integration**: Seamless appointment-to-record workflow
- **Mobile**: Optimized for clinical tablet/phone use

### **Data Quality Goals:**
- **Completeness**: >90% of appointments have associated medical records
- **Accuracy**: Prescription tracking with proper start/end dates
- **Timeliness**: Follow-up reminders sent within 24 hours
- **Consistency**: Standardized treatment type categorization

---

## 🚀 Implementation Phases

### **Phase 1: Core Patient Management (Week 1-2)**
1. **Database Schema**: Create tables and relationships
2. **Backend Service**: Basic CRUD operations for medical records
3. **Patient List Screen**: Display patients with basic search
4. **Patient Detail Screen**: Basic info and medical history tabs
5. **Add Treatment Note**: Simple form for creating medical records

**Deliverables:**
- Functional patient list and detail screens
- Basic medical record creation
- Database integration with existing appointment system

### **Phase 2: Enhanced Features (Week 3-4)**
1. **Advanced Search**: Multi-field filtering and sorting
2. **Prescription Management**: Full prescription lifecycle tracking
3. **Vaccination Tracking**: Vaccination schedules and reminders
4. **Dashboard Stats**: Quick statistics and metrics
5. **Treatment Note Enhancements**: Rich formatting and categories

**Deliverables:**
- Complete prescription management system
- Vaccination tracking and overdue alerts
- Enhanced UI with better search and filtering

### **Phase 3: Advanced UX (Week 5-6)**
1. **Patient Status System**: Automated status calculation
2. **Follow-up Management**: Automated reminders and scheduling
3. **Quick Actions**: Streamlined common workflows
4. **Export Functionality**: Medical records export for referrals
5. **Performance Optimization**: Caching and optimized queries

**Deliverables:**
- Production-ready patient records system
- Automated workflow enhancements
- Performance-optimized for clinical use

### **Phase 4: Future Enhancements (Future Releases)**
1. **Photo/Document Attachments**: Medical images and documents
2. **Voice Notes**: Audio recording for quick notes
3. **Analytics Dashboard**: Practice analytics and insights
4. **Integration APIs**: Third-party medical device integration
5. **Advanced Reporting**: Custom reports and data export

---

## 🔐 Security and Privacy Considerations

### **Data Protection:**
- **Encryption**: All medical data encrypted at rest and in transit
- **Access Control**: RLS policies ensure veterinarians only see their patients
- **Audit Trails**: Log all medical record access and modifications
- **Data Retention**: Configurable retention policies for medical records

### **HIPAA Compliance Considerations:**
- **Access Logging**: Track who accessed which patient records when
- **Data Minimization**: Only collect necessary medical information
- **User Permissions**: Role-based access to sensitive medical data
- **Secure Deletion**: Ability to securely delete patient records when required

### **Privacy Features:**
- **Owner Consent**: Pet owners can view but not edit medical records
- **Selective Sharing**: Control which medical information is shared
- **Anonymization**: Option to anonymize data for research purposes

---

## 📝 Technical Notes

### **Performance Considerations:**
- **Pagination**: Large patient lists should be paginated
- **Caching**: Cache frequently accessed patient data
- **Indexing**: Proper database indexing for search performance
- **Offline Support**: Basic offline viewing for critical patient data

### **Integration Notes:**
- **Appointment Sync**: Medical records should auto-link to appointments
- **Real-time Updates**: Use Supabase real-time subscriptions for live updates
- **Error Handling**: Graceful handling of network and database errors
- **Data Validation**: Strict validation for medical data integrity

### **Testing Requirements:**
- **Unit Tests**: All service functions and data transformations
- **Integration Tests**: Database operations and API endpoints
- **UI Tests**: Critical user workflows (add treatment note, search patients)
- **Performance Tests**: Large dataset handling and search speed

---

*This planning document serves as the comprehensive guide for implementing the Patient Records Management module. It should be updated as requirements evolve and implementation progresses.*

**Status**: Planning Complete ✅
**Next Step**: Begin Phase 1 Implementation
**Estimated Timeline**: 6 weeks for full implementation
**Dependencies**: Existing appointment and pet management systems