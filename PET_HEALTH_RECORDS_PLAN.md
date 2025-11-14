# 🐾 Pet Health Records – Planning Document

_Last updated: February 2025_

This document captures the product/technical plan for delivering the Pet Health Records feature (pet-owner facing medical history view). It complements `PATIENT_RECORDS_MODULE_PLAN.md`, which focuses on veterinarian tooling, and ensures both initiatives share the same data model and service contracts.

---

## 1. Purpose & Scope

**Goal:** Give pet owners a trusted place inside VetConnect to review each pet’s medical history (treatments, vaccinations, prescriptions, vitals, documents) and to stay on top of upcoming care.

**In scope**
- Read-only surfaces for pet owners covering historical records created by veterinarians.
- Lightweight owner-authored notes (e.g., home observations) that can be shared with vets during appointments.
- Reminder surfacing (due vaccinations, expiring prescriptions) built on top of shared notification infrastructure.

**Out of scope (handled by other initiatives)**
- Veterinarian record authoring (already planned in Patient Records module).
- Push/email notification delivery engine (Notifications System plan).
- Payment, messaging, or social feed work.

---

## 2. Current State Summary

| Area | Status | Notes |
| --- | --- | --- |
| Data | `pets`, `appointments`, basic `vaccinations` types exist but lack structured history | `medical_records`/`prescriptions` tables from Patient Records plan not yet created |
| API/Services | `supabasePetService` only handles CRUD for pets; no endpoints for medical history | No caching/normalization for records |
| UI | `PetProfileScreen` allows editing basic pet info but no history tabs | No navigation entry point for medical data |
| Notifications | Not implemented | Needed for due reminders |

---

## 3. Target Outcomes

1. **Transparency:** Owners can see every vet-authored record (treatment notes, prescriptions, lab results, vaccinations) in chronological order.
2. **Actionability:** App surfaces upcoming care requirements (vaccination due, follow-up visit, expiring meds).
3. **Data Parity:** Same data used by veterinarians in their Patient Records dashboard powers the owner view (single source of truth).
4. **Shareability:** Owners can export/print/share a record bundle for external vets.

KPIs: % of active owners who view health records monthly, reminder engagement rate, reduction in “information request” support tickets.

---

## 4. User Personas & Stories

| Persona | Needs | Key Stories |
| --- | --- | --- |
| **Pet Parent (primary)** | Understand pet’s medical timeline, stay compliant with care | - “As a pet parent I want to see all treatments a vet has recorded for my pet.”<br>- “I need to know when the next vaccination is due.”<br>- “I want to track medications I administer at home.” |
| **Veterinarian (secondary)** | Reduce repetitive questions, ensure owners follow instructions | - “Owners should access accurate instructions without emailing me.”<br>- “I want reminders to match what I scheduled during appointments.” |

---

## 5. Experience Architecture

### 5.1 Entry Points
- `ProfileScreen` → “My Pets” → select pet → new **Health Records** tab.
- Appointment confirmation/reschedule screens → CTA “View Health Plan”.
- Push reminder → deep link to specific pet + section.

### 5.2 Screen Structure (per pet)
1. **Overview tab**
   - Status chips: “Vaccinations up to date”, “Follow-up due in 5 days”.
   - Quick metrics: weight trend, last visit, primary veterinarian.
   - CTA buttons: `Share Records`, `Add Home Note`.
2. **Timeline tab**
   - Reverse chronological cards grouped by month.
   - Card types: Appointment/Treatment, Vaccination, Prescription, Lab Result, Owner Note.
   - Each card expandable to view structured data + attachments.
3. **Vaccinations tab**
   - Table/list with vaccine name, administered date, next due, status (Completed / Overdue / Scheduled).
   - Link to request appointment for overdue vaccines.
4. **Medications tab**
   - Active prescriptions, instructions, dosage schedule, refill info.
   - Owner can mark dosage compliance (optional stretch).
5. **Documents tab** (Phase 2)
   - Upload & view PDFs/images (lab reports, adoption papers).

Accessibility: follow patterns defined in `accessibilityUtils.ts` (e.g., announce section headers, ensure dynamic statuses have `accessibilityRole`).

---

## 6. Data & Backend Requirements

### 6.1 Tables (reused / to be created)
| Table | Status | Notes |
| --- | --- | --- |
| `medical_records` | Planned in patient module | Must include owner-readable fields (`diagnosis`, `treatment_notes`, `attachments`, `follow_up_date`). |
| `prescriptions` | Planned | Need `can_owner_view` flag and `refill_info`. |
| `vaccinations` | Planned enrichment | Add `is_owner_acknowledged BOOLEAN` for reminder state. |
| `owner_notes` | **New** (optional) | Simple table for owner-authored logs. |
| `documents` | Future | For uploads (phase 2). |

`owner_notes` proposal:
```sql
CREATE TABLE owner_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'observation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 API surface (Supabase)
| Purpose | Method |
| --- | --- |
| Fetch health overview for pet | `rpc:get_pet_health_overview(p_pet_id UUID)` – returns aggregated counts, next_due info |
| Fetch timeline | `supabase.from('medical_records').select(...).eq('pet_id', ...)` joined with `vaccinations`, `prescriptions` via union + sorting |
| Fetch vaccinations | direct select ordered by `next_due_date` |
| Fetch prescriptions | select filtered by `status` |
| Owner note mutation | insert/update/delete in `owner_notes` with RLS enforcing ownership |

Indexes required on `medical_records.pet_id`, `vaccinations.pet_id + next_due_date`, `prescriptions.pet_id + status`.

### 6.3 Security
- RLS policies must ensure **only** the pet’s owner(s) can read data; vets can read/write per patient modules.
- Shared policy snippet:
```sql
CREATE POLICY pet_owner_read_medical_records
ON medical_records
FOR SELECT
USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));
```
- For multi-owner cases (future), use `pet_caregivers` join table.

---

## 7. Client Architecture

### 7.1 State Management
- New Redux slice `petHealthSlice` storing per-pet:
  ```ts
  interface PetHealthState {
    byPetId: {
      [petId: string]: {
        overview?: HealthOverview;
        timeline: TimelineEntry[];
        vaccinations: Vaccination[];
        prescriptions: Prescription[];
        ownerNotes: OwnerNote[];
        status: 'idle' | 'loading' | 'succeeded' | 'failed';
        error?: string;
        lastFetchedAt?: string;
      };
    };
  }
  ```
- Supports caching + optimistic updates for owner notes.

### 7.2 Services
- `supabasePetHealthService.ts` (new) encapsulates:
  - `getPetHealthOverview(petId)`
  - `getPetTimeline(petId, { cursor, limit })`
  - `getVaccinations(petId)`
  - `getPrescriptions(petId)`
  - `createOwnerNote(petId, data)` etc.
- Reuse `supabase` client; add typed DTO converters.

### 7.3 UI Components
- `PetHealthScreen` (stack screen) with nested tabs or `TopTabNavigator`.
- Reusable cards: `TreatmentCard`, `VaccinationCard`, `PrescriptionCard`, `OwnerNoteCard`.
- Data visualizations: weight trend chart (reuse `VictoryNative` or light custom chart), adherence progress bars.
- Empty/error states consistent with existing design language (gradient backgrounds, friendly copy).

### 7.4 Offline Considerations
- Cache last fetched data in Redux (persist via existing store persistence if enabled).
- Owner notes typed while offline stay queued until connectivity returns (future enhancement).

---

## 8. Dependencies & Touchpoints

1. **Patient Records Module** – must deliver `medical_records`, `prescriptions`, `vaccinations` schema + APIs first (or in parallel with shared backlog coordination).
2. **Notifications System** – for reminder delivery; Pet Health Records will publish “next due” events but does not send notifications itself.
3. **Authentication** – relies on current `authSlice` (pet-owner context); ensure screen is gated if user is veterinarian.
4. **File Storage** – optional document uploads rely on existing Supabase storage buckets (`pet-documents`).

---

## 9. Implementation Phases

| Phase | Description | Deliverables |
| --- | --- | --- |
| **0. Data Foundations** | Create/alter DB tables, RLS policies, Supabase types. | SQL migrations (aligned with patient module). |
| **1. Core Read Experience** | Overview + Timeline tabs, service layer, Redux slice, nav integration. | `PetHealthScreen`, `petHealthSlice`, Supabase service. |
| **2. Vaccinations & Medication deep dives** | Dedicated tabs, due-state chips, CTA to book appointment. | `VaccinationTab`, `MedicationTab`, linking to booking flow. |
| **3. Owner Notes & Sharing** | Owner note CRUD, PDF export/share sheet using `expo-sharing`. | Owner note form, share modal. |
| **4. Documents & Media (optional)** | Upload + view attachments. | Document list, download/open with `expo-file-system`. |
| **5. Reminders Integration** | Hook into notification system once available. | In-app reminder settings, handshake with notifications service. |

Each phase should ship independently behind a feature flag (e.g., remote config or environment var) to allow staged rollout.

---

## 10. Acceptance Criteria

- Owners can open any pet profile and view at least one populated timeline entry sourced from Supabase.
- Vaccination tab clearly indicates overdue vs. completed vs. scheduled states.
- All supabase queries respect RLS policies; QA verifies unauthorized access is blocked.
- Screen meets accessibility minimums (navigable via VoiceOver/TalkBack, proper semantic labels).
- Unit tests cover Redux slice reducers/selectors; integration tests for service conversions.
- Analytics events emitted (`pet_health_opened`, `pet_health_timeline_entry_tapped`, etc.) for future insights.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Backend tables delayed (dependency on vet module) | Allow mock data provider for frontend development; feature flag until API ready. |
| Large history datasets degrade performance | Implement pagination/infinite scroll on timeline, limit initial fetch to 20 entries. |
| Sensitive data exposure | Enforce RLS, hide veterinarian private notes via column-level security/flag (`is_owner_visible`). |
| Design debt / inconsistent UI | Partner with design to reuse established card components; add design review checkpoint. |
| Reminder duplication with future Notifications project | Document handshake contract now (Pet Health publishes due items to notification queue). |

---

## 12. Next Actions

1. Align with backend team to prioritize `medical_records`, `prescriptions`, `vaccinations` schema deployment (shared with vet module).
2. Finalize UX mocks for Overview + Timeline tabs.
3. Create `supabasePetHealthService` skeleton + Redux slice scaffolding.
4. Implement Phase 1 (read-only) behind feature flag for internal testing.

Once these steps are completed, we can proceed to tickets covering Phase 1 tasks (service layer, slice, UI) and schedule Phase 2+.

