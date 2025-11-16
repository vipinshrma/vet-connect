# Veterinarian Appointment Management Flow

## Overview
This document outlines the complete flow for veterinarians to manage appointments from acceptance to completion, including all status transitions, UI screens, and features.

---

## 📋 Appointment Status Lifecycle

### Status Flow Diagram
```
[scheduled] → [confirmed] → [in-progress] → [completed]
     ↓             ↓
[cancelled]  [cancelled]
```

### Status Definitions

1. **`scheduled`** (Blue)
   - Initial status when pet owner books appointment
   - Vet has not yet reviewed/accepted
   - Can be accepted, rejected, or cancelled by vet

2. **`confirmed`** (Green)
   - Vet has accepted the appointment
   - Appointment is confirmed for both parties
   - Can be started, rescheduled, or cancelled

3. **`in-progress`** (Yellow)
   - Vet has started the appointment consultation
   - Appointment is currently happening
   - Can be completed or cancelled (emergency only)

4. **`completed`** (Gray)
   - Appointment consultation is finished
   - All notes, diagnosis, prescriptions added
   - Final state (read-only)

5. **`cancelled`** (Red)
   - Appointment was cancelled by vet or owner
   - Can have cancellation reason
   - Final state (read-only)

---

## 🎯 Complete Flow Breakdown

### Phase 1: Appointment Notification & Acceptance ✅ **COMPLETE** (Notifications Pending)

#### 1.1 New Appointment Notification ✅ **IMPLEMENTED**
**Trigger:** Pet owner books appointment

**Location:** AppointmentsScreen (Vet View) and AppointmentDetailsScreen

**Features:**
- ⏳ Real-time notification when new appointment is created (Notifications - To be implemented)
- ✅ Badge count on appointments tab (shows count of `scheduled` appointments)
- Visual indicator for "New" appointments with date threshold
  - Shows "NEW" badge only for appointments within 7 days from today
  - Badge appears on appointment cards and details screen
  - Only visible to veterinarians viewing their own appointments
- Filter: "Pending Acceptance" (status = `scheduled`)
  - Displays only scheduled appointments for logged-in veterinarian
  - Shows badge count with red indicator for pending appointments

**UI Elements:**
- Appointment card shows:
  - Pet name, species, breed
  - Owner name and contact information
  - Date, time slot
  - Reason for visit
  - Pet photo (if available)
  - Status badge (color-coded by status)
  - "NEW" badge (red, only for appointments within 7 days)
  - **Action buttons (for scheduled appointments):**
    - ✅ "Accept Appointment" (green button with icon)
    - ❌ "Decline Appointment" (red button with icon)
    - 👁️ "View Details" (navigates to AppointmentDetailsScreen)

**AppointmentDetailsScreen Enhancements:**
- Displays owner information section (for veterinarians)
  - Owner name, email, phone
  - Quick action buttons: "Call" and "Message" owner
- Shows "NEW" badge in header (within 7 days threshold)
- Accept/Decline buttons in action bar (replaces Cancel/Reschedule for pending)
- Auto-refreshes when screen comes into focus
- Loading states during API operations

**Implementation Details:**
- Date threshold: 7 days (configurable via `isNewAppointment` utility function)
- Badge calculation: `isNewAppointment(appointment.date, 7)`
- Accept action: Updates status to `confirmed`, marks time slot as booked
- Decline action: Updates status to `cancelled`, frees up time slot
- Both actions update `time_slots` table accordingly

#### 1.2 Accept Appointment ✅ **IMPLEMENTED**
**Action:** Vet taps "Accept Appointment"

**Locations:**
- AppointmentsScreen: Accept button on appointment card
- AppointmentDetailsScreen: Accept button in action bar

**Flow:**
1. Show confirmation dialog ("Are you sure you want to accept this appointment?")
2. Update appointment status: `scheduled` → `confirmed`
3. Update `time_slots` table: Set `is_booked = true`, `is_available = false`
4. Send notification to pet owner (to be implemented)
5. Show success message: "Appointment accepted successfully!"
6. Refresh appointment list/details automatically

**Implementation Status:**
- ✅ Accept action implemented in `supabaseAppointmentService.acceptAppointment()`
- ✅ Redux thunk created: `acceptAppointment`
- ✅ Status update working
- ✅ Time slot management working
- ⏳ Notification to pet owner (Notifications - Separate Phase)
- ⏳ Calendar/schedule integration (pending)

**Validation:**
- ✅ Verifies vet ownership of appointment
- ✅ Checks appointment status is `scheduled`
- ⏳ Check if vet has availability at that time (pending)
- ⏳ Verify slot is not double-booked (pending)
- ⏳ Check if appointment is too far in future (> 3 months) (pending)

#### 1.3 Decline Appointment ✅ **IMPLEMENTED**
**Action:** Vet taps "Decline Appointment"

**Locations:**
- AppointmentsScreen: Decline button on appointment card
- AppointmentDetailsScreen: Decline button in action bar

**Flow:**
1. Show confirmation dialog ("Are you sure you want to decline this appointment?")
2. Update appointment status: `scheduled` → `cancelled`
3. Update `time_slots` table: Set `is_booked = false`, `is_available = true`, `appointment_id = null`
4. Show success message: "Appointment declined. The pet owner has been notified."
5. Refresh appointment list/details automatically

**Implementation Status:**
- ✅ Decline action implemented in `supabaseAppointmentService.declineAppointment()`
- ✅ Redux thunk created: `declineAppointment`
- ✅ Status update working
- ✅ Time slot management working (frees up slot)
- ⏳ Decline reason dialog (optional - currently simplified for cross-platform compatibility)
- ⏳ Add cancellation reason to notes (pending)
- ⏳ Notification to pet owner (Notifications - Separate Phase)
- ⏳ Suggest alternative vets (pending)

**Note:** Decline reason collection can be added later as an enhancement. Currently uses simplified `Alert.alert` for cross-platform compatibility (iOS/Android).

#### 1.4 Suggest Alternative Time
**Action:** Vet taps "Suggest Alternative Time"

**Flow:**
1. Open date/time picker
2. Show vet's available slots
3. Vet selects preferred alternative time
4. Send proposal to pet owner (status remains `scheduled`)
5. Owner can accept/reject alternative time
6. If accepted: Update appointment date/time, status → `confirmed`

---

### Phase 2: Pre-Appointment Preparation

#### 2.1 Appointment Details View (Confirmed Status)
**Location:** AppointmentDetailsScreen

**Display Information:**
- Pet details (name, species, breed, age, weight, photo)
- Pet medical history (previous visits, vaccinations, medications)
- Owner information (name, phone, email, address)
- Appointment details (date, time, reason)
- Appointment notes (if any from owner)

**Actions Available:**
- 📞 "Call Owner"
- 💬 "Message Owner"
- 🗺️ "View Location" (clinic address)
- 📝 "Add Pre-Appointment Notes"
- ⏰ "Start Appointment"
- 📅 "Reschedule"
- ❌ "Cancel Appointment"
- 📄 "View Pet Health Records"

#### 2.2 Add Pre-Appointment Notes
**Feature:** Vet can add private notes before appointment

**UI:**
- Modal/Sheet with text input
- Notes saved to `appointment.notes` field
- Visible only to vet
- Can be edited until appointment is completed

---

### Phase 3: During Appointment (In-Progress)

#### 3.1 Start Appointment
**Action:** Vet taps "Start Appointment" (30 min before to 2 hours after scheduled time)

**Flow:**
1. Update status: `confirmed` → `in-progress`
2. Show "Appointment In Progress" screen
3. Record start time
4. Notify owner that appointment has started

**Validation:**
- Can only start if current time is within acceptable window
- Cannot start if appointment is more than 30 min early
- Cannot start if appointment was more than 2 hours ago (mark as missed)

#### 3.2 Appointment In-Progress Screen
**Location:** New screen: `AppointmentInProgressScreen`

**Sections:**

**A. Pet & Owner Info (Read-only)**
- Pet details card
- Owner contact card
- Quick actions: Call, Message

**B. Consultation Notes (Editable)**
- Reason for visit (pre-filled)
- Chief complaint
- Physical examination findings
- Vital signs (temp, heart rate, respiration, weight)
- Observations
- Assessment/Diagnosis
- Treatment plan
- Prescriptions (to be added)

**C. Actions**
- 📸 "Add Photos" (pet condition, test results)
- 💊 "Add Prescriptions"
- 💰 "Set Cost/Payment"
- ✅ "Complete Appointment"
- ❌ "Cancel Appointment" (emergency only)

**D. Quick Templates**
- Common diagnoses
- Common treatments
- Prescription templates
- Medical history templates

#### 3.3 Add Prescriptions
**Feature:** Add medications during consultation

**Flow:**
1. Tap "Add Prescriptions"
2. Search/select medication
3. Fill prescription details:
   - Medication name
   - Dosage
   - Frequency
   - Duration
   - Instructions
   - Quantity
   - Refills (if applicable)
4. Save to appointment
5. Prescription automatically added to pet's medication list
6. Generate prescription document (PDF)

#### 3.4 Set Cost/Payment
**Feature:** Record appointment cost and payment

**Flow:**
1. Tap "Set Cost/Payment"
2. Enter cost breakdown:
   - Consultation fee
   - Examination fee
   - Medication costs
   - Test/procedure costs
   - Total cost
3. Payment status:
   - Paid (cash/card)
   - Pending
   - Insurance claim
4. Save cost to `appointment.cost`
5. Generate invoice (optional)

---

### Phase 4: Complete Appointment

#### 4.1 Complete Appointment
**Action:** Vet taps "Complete Appointment"

**Validation:**
- Check if consultation notes are filled
- Check if diagnosis is provided
- Warn if cost is not set (optional)

**Flow:**
1. Show completion confirmation dialog
2. Verify all required fields are filled
3. Update status: `in-progress` → `completed`
4. Record completion time
5. Update appointment cost
6. Add completion notes
7. Update pet's health records
8. Send summary to pet owner
9. Generate appointment summary PDF
10. Update time slot in `time_slots` table (mark as completed)

#### 4.2 Post-Appointment Actions
**After completion, vet can:**

- ✅ View completed appointment (read-only)
- 📄 Generate/Download appointment summary
- 📋 Add follow-up notes
- 📅 Schedule follow-up appointment
- 💬 Send message to owner
- 📊 View pet's complete medical history

#### 4.3 Appointment Summary/Report
**Content:**
- Pet information
- Owner information
- Date and time
- Chief complaint
- Examination findings
- Diagnosis
- Treatment provided
- Prescriptions
- Follow-up recommendations
- Cost/payment information
- Vet signature/credentials

---

## 📱 UI Screens Required

### New Screens to Create:

1. **AppointmentInProgressScreen**
   - Main screen for active consultation
   - Form for notes, diagnosis, treatment
   - Prescription management
   - Cost entry
   - Complete appointment action

2. **VetAppointmentActionSheet** (Optional)
   - Quick actions modal
   - Accept/Decline/Suggest alternative
   - For appointment cards

3. **AddPrescriptionScreen** (Optional)
   - Medication selection
   - Prescription form
   - Could be modal instead

4. **AppointmentCostScreen** (Optional)
   - Cost breakdown form
   - Payment status
   - Could be modal instead

### Screens to Modify:

1. **AppointmentsScreen** ✅ Phase 1.1 Complete
   - ✅ Add filter: "Pending Acceptance" (status = `scheduled`)
   - ✅ Badge count indicator for pending appointments
   - ✅ Add "Accept/Decline" buttons to appointment cards
   - ✅ Show "NEW" badge for appointments within 7 days
   - ✅ Display owner information on appointment cards
   - ✅ Different actions based on status
   - ✅ Sort appointments by date/time (latest first)
   - ✅ Filter appointments to show only vet's appointments

2. **AppointmentDetailsScreen** ✅ Phase 1.1 Complete
   - ✅ Add "Accept/Decline" buttons for scheduled appointments (vets only)
   - ✅ Display owner information section with contact details
   - ✅ Add Call/Message owner quick actions
   - ✅ Show "NEW" badge for appointments within 7 days
   - ✅ Conditional action buttons based on appointment status
   - ✅ Auto-refresh on screen focus
   - [ ] Add "Start Appointment" button (when status = `confirmed`) - Phase 2
   - [ ] Show pre-appointment notes section - Phase 2
   - [ ] Show in-progress form (when status = `in-progress`) - Phase 3
   - [ ] Show completed appointment summary (when status = `completed`) - Phase 4

---

## 🗄️ Database Schema Changes

### Appointments Table - Add Fields:

```sql
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS
  -- Status management
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled')),
  
  -- Appointment timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE, -- Calculated from date + timeSlot
  
  -- Veterinary notes
  vet_notes TEXT, -- Pre-appointment and during appointment notes
  consultation_notes TEXT, -- Detailed consultation notes
  diagnosis TEXT, -- Final diagnosis
  treatment_plan TEXT, -- Treatment provided
  
  -- Medical data
  vital_signs JSONB, -- {temperature, heart_rate, respiration, weight, etc.}
  examination_findings TEXT, -- Physical examination results
  
  -- Financial
  cost DECIMAL(10, 2), -- Total appointment cost
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'insurance')),
  payment_method TEXT, -- cash, card, insurance, etc.
  
  -- Cancellation
  cancellation_reason TEXT, -- Reason if cancelled
  cancelled_by UUID REFERENCES auth.users(id), -- Who cancelled (vet or owner)
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Metadata
  vet_accepted_at TIMESTAMP WITH TIME ZONE, -- When vet accepted
  owner_notified BOOLEAN DEFAULT false, -- Notification sent flag
  appointment_rating INTEGER CHECK (appointment_rating >= 1 AND appointment_rating <= 5), -- Rating from owner
  appointment_review TEXT -- Review from owner
;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_veterinarian_status ON appointments(veterinarian_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_for ON appointments(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_appointments_vet_accepted ON appointments(veterinarian_id, vet_accepted_at) WHERE vet_accepted_at IS NULL;
```

### Prescriptions Table (New):

```sql
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL, -- e.g., "50mg"
  frequency TEXT NOT NULL, -- e.g., "twice daily"
  duration TEXT NOT NULL, -- e.g., "7 days"
  instructions TEXT, -- Additional instructions
  quantity INTEGER, -- Number of units
  refills INTEGER DEFAULT 0, -- Number of refills allowed
  
  prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pet ON prescriptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
```

### Appointment Photos Table (New):

```sql
CREATE TABLE IF NOT EXISTS appointment_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('condition', 'test_result', 'xray', 'other')),
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_photos_appointment ON appointment_photos(appointment_id);
```

---

## 🔔 Notifications Required

### Push Notifications:

1. **New Appointment Created**
   - To: Veterinarian
   - Message: "New appointment request from [Owner Name] for [Pet Name] on [Date] at [Time]"
   - Action: Navigate to AppointmentsScreen

2. **Appointment Accepted**
   - To: Pet Owner
   - Message: "Your appointment with Dr. [Vet Name] on [Date] has been confirmed"

3. **Appointment Declined**
   - To: Pet Owner
   - Message: "Dr. [Vet Name] has declined your appointment. [Reason if provided]"

4. **Appointment Started**
   - To: Pet Owner
   - Message: "Your appointment with Dr. [Vet Name] has started"

5. **Appointment Completed**
   - To: Pet Owner
   - Message: "Your appointment with Dr. [Vet Name] has been completed. View summary in app."

---

## 🔐 Permissions & Access Control

### RLS Policies Needed:

```sql
-- Vets can update appointments assigned to them
CREATE POLICY "Vets can update their appointments" ON appointments
  FOR UPDATE USING (
    auth.uid() = veterinarian_id
    AND status IN ('scheduled', 'confirmed', 'in-progress')
  );

-- Vets can accept appointments (update to confirmed)
CREATE POLICY "Vets can accept appointments" ON appointments
  FOR UPDATE USING (
    auth.uid() = veterinarian_id
    AND status = 'scheduled'
  );

-- Vets can view all their appointments
CREATE POLICY "Vets can view their appointments" ON appointments
  FOR SELECT USING (auth.uid() = veterinarian_id);

-- Vets can add notes to their appointments
CREATE POLICY "Vets can add notes" ON appointments
  FOR UPDATE USING (
    auth.uid() = veterinarian_id
    AND status IN ('confirmed', 'in-progress')
  );
```

---

## 📊 Status Transition Matrix

| Current Status | Action | New Status | Who Can Do It |
|---------------|--------|------------|---------------|
| `scheduled` | Accept | `confirmed` | Vet only |
| `scheduled` | Decline | `cancelled` | Vet only |
| `scheduled` | Cancel | `cancelled` | Vet or Owner |
| `confirmed` | Start | `in-progress` | Vet only |
| `confirmed` | Cancel | `cancelled` | Vet or Owner |
| `in-progress` | Complete | `completed` | Vet only |
| `in-progress` | Cancel | `cancelled` | Vet only (emergency) |

---

## ✅ Implementation Checklist

### Phase 1: Acceptance Flow ✅ **COMPLETE** (Core Features)
- [x] Add "Accept/Decline" buttons to appointment cards
- [x] Create appointment acceptance API endpoint (`acceptAppointment`)
- [x] Create appointment decline API endpoint (`declineAppointment`)
- [x] Update appointment status to `confirmed` on accept
- [x] Update appointment status to `cancelled` on decline
- [x] Add filter for "Pending Acceptance" appointments (status = `scheduled`)
- [x] Add "New" badge indicator with 7-day date threshold
- [x] Display owner information for veterinarians
- [x] Add Call/Message owner quick actions
- [x] Integrate Redux thunks for accept/decline actions
- [x] Update `time_slots` table on accept/decline
- [x] Auto-refresh appointment details on screen focus
- [x] Add loading states and error handling
- [ ] Suggest alternative vets on decline (optional enhancement)
- [ ] Add decline reason collection (optional enhancement)

**🔔 Notifications - Separate Phase (To be implemented after all core features):**
- [ ] Send notification to owner when appointment is accepted
- [ ] Send notification to owner when appointment is declined
- [ ] Send notification to vet when new appointment is created
- [ ] Push notification integration
- [ ] Email notification integration

### Phase 2: In-Progress Flow
- [ ] Create `AppointmentInProgressScreen`
- [ ] Add "Start Appointment" button to AppointmentDetailsScreen
- [ ] Update appointment status to `in-progress`
- [ ] Add consultation notes form
- [ ] Add vital signs entry
- [ ] Add examination findings form
- [ ] Add diagnosis entry
- [ ] Add treatment plan entry
- [ ] Test in-progress flow

### Phase 3: Completion Flow
- [ ] Add "Complete Appointment" action
- [ ] Add validation for required fields
- [ ] Update appointment status to `completed`
- [ ] Generate appointment summary
- [ ] Update pet health records
- [ ] Send completion notification
- [ ] Test completion flow

### Phase 4: Prescriptions
- [ ] Create prescription form/modal
- [ ] Add prescriptions table to database
- [ ] Link prescriptions to appointments
- [ ] Generate prescription PDF
- [ ] Add to pet's medication list
- [ ] Test prescription flow

### Phase 5: Cost & Payment
- [ ] Create cost entry form/modal
- [ ] Add cost fields to appointments table
- [ ] Calculate total cost
- [ ] Record payment status
- [ ] Generate invoice (optional)
- [ ] Test cost/payment flow

### Phase 6: Enhancements
- [ ] Add appointment photos functionality
- [ ] Add follow-up scheduling
- [ ] Add appointment templates
- [ ] Add PDF generation for summaries
- [ ] Add appointment analytics
- [ ] Add bulk actions for appointments

---

## 🎨 UI/UX Considerations

### Visual Indicators:
- **Status Colors:**
  - `scheduled`: Blue (#3b82f6)
  - `confirmed`: Green (#10b981)
  - `in-progress`: Yellow (#f59e0b)
  - `completed`: Gray (#6b7280)
  - `cancelled`: Red (#ef4444)

### Accessibility:
- Clear button labels
- Color + text for status indicators
- Keyboard navigation support
- Screen reader support

### Mobile Optimization:
- Large tap targets (min 44x44px)
- Swipe gestures for quick actions
- Pull-to-refresh on appointment list
- Bottom sheet modals for forms

---

## 📝 Notes

- All status changes should be logged for audit trail
- Notifications should respect user preferences
- Consider offline mode for appointment notes
- Prescription data should integrate with pharmacy systems (future)
- Cost tracking can integrate with billing/accounting systems (future)
- Appointment templates can save time for common consultations
- AI suggestions for diagnosis based on symptoms (future enhancement)

---

## 🔄 Future Enhancements

1. **Video Consultations**
   - Start video call from in-progress screen
   - Record consultation (with consent)

2. **Appointment Templates**
   - Pre-filled forms for common conditions
   - Quick diagnosis codes

3. **Integration with Lab Systems**
   - Link test results to appointments
   - Auto-populate findings

4. **Billing Integration**
   - Direct integration with payment processors
   - Insurance claim submission

5. **Analytics Dashboard**
   - Appointment completion rates
   - Average consultation time
   - Common diagnoses
   - Revenue tracking

---

---

## 📝 Implementation Progress

### ✅ Completed (Phase 1.1 - New Appointment Notification & Acceptance)

**AppointmentsScreen:**
- ✅ Filter: "Pending Acceptance" (status = `scheduled`)
- ✅ Badge count indicator for pending appointments (red badge with count)
- ✅ "NEW" badge with 7-day date threshold (`isNewAppointment` utility)
- ✅ Accept/Decline buttons on appointment cards
- ✅ Display owner information on appointment cards
- ✅ Sort appointments by date/time (latest first)
- ✅ Filter appointments to show only vet's appointments

**AppointmentDetailsScreen:**
- ✅ Accept/Decline buttons for scheduled appointments (vets only)
- ✅ Owner information section with contact details (name, email, phone)
- ✅ Call/Message owner quick actions (opens phone/SMS/email)
- ✅ "NEW" badge for appointments within 7 days
- ✅ Conditional action buttons based on appointment status
- ✅ Auto-refresh on screen focus (`useFocusEffect`)
- ✅ Loading states during API operations
- ✅ Error handling with user-friendly messages

**Backend Integration:**
- ✅ `acceptAppointment()` service method (`supabaseAppointmentService`)
- ✅ `declineAppointment()` service method (`supabaseAppointmentService`)
- ✅ Redux thunks: `acceptAppointment`, `declineAppointment`
- ✅ Redux reducers for status updates
- ✅ Time slot management (`time_slots` table updates)
- ✅ Status transitions: `scheduled` → `confirmed` (accept)
- ✅ Status transitions: `scheduled` → `cancelled` (decline)

**Utilities:**
- ✅ `isNewAppointment()` date threshold utility (7 days)
- ✅ Date serialization/deserialization for Redux

### 🔔 Notifications - Separate Phase (To be implemented after all core features)
- ⏳ Push notifications to pet owner on accept/decline
- ⏳ Push notification to vet when new appointment is created
- ⏳ Email notification integration
- ⏳ In-app notification system

### 🚧 Optional Enhancements (Phase 1.1+)
- ⏳ Decline reason collection dialog
- ⏳ Suggest alternative vets on decline
- ⏳ Additional validation (availability check, double-booking prevention)
- ⏳ Calendar/schedule integration

### 📋 Planned (Phase 1.2+)
- 📅 Suggest Alternative Time feature
- 📝 Pre-appointment notes
- ▶️ Start Appointment functionality
- 🏥 In-progress appointment screen
- ✅ Complete appointment flow
- 💊 Prescription management
- 💰 Cost/Payment tracking
- 📸 Appointment photos
- 📄 PDF generation for summaries

---

**Document Version:** 1.1  
**Last Updated:** January 2025  
**Author:** VetConnect Development Team

