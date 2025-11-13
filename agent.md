## Project Summary
VetConnect is an Expo-powered React Native app that connects pet owners and veterinarians through location-aware discovery, appointment management, and clinic tooling backed by Supabase. Screens render through React Navigation stacks/tabs under `src/navigation`, with Redux slices orchestrating data flow between UI components, Supabase services, AsyncStorage persistence, and fallback mock datasets when remote data is missing.

## Tech Stack
- React Native 0.79.5 + Expo SDK 53 with Expo Router entry but React Navigation (`@react-navigation/*` 7.x) driving stacks/tabs.
- State via Redux Toolkit 2.8 with AsyncThunk-based slices; AsyncStorage persistence for auth/session.
- UI: NativeWind 4.x utility classes, React Native Paper, Expo vector icons, React Native Maps, Expo Location/Image/Image Picker/Haptics.
- Backend: Supabase JS 2.53 (auth, Postgres CRUD, storage) plus Firebase (present but unused), Mapbox Geocoding for address search, Node seeding scripts.
- Tooling: TypeScript ~5.8 (strict), ESLint 9.25 with `eslint-config-expo`, metro/babel configs from Expo.

## Folder Structure
- `app/`: Expo entry (_layout plus legacy `(tabs)` routes) that mounts `src/navigation/AppNavigator`.
- `components/`: Expo starter UI primitives (`ui/IconSymbol`, themed views) referenced by HomeScreen and others.
- `src/components/`: Domain widgets (VetCard, MapView, forms, LoadingScreen).
- `src/screens/`: Feature screens grouped by domain (`main`, `auth`, `vet`) plus standalone flows (VetList, EmergencyCare, Clinic/Schedule management).
- `src/navigation/`: Stack/tab navigators, onboarding routing, linking to feature screens.
- `src/services/`: Supabase client wrappers (`supabase*Service.ts`), mock service bridges, and Expo Location utilities.
- `src/store/`: Redux store setup and slices for auth, vets, appointments, pets, location.
- `src/utils/`: Persistence helpers, accessibility utilities, validation, and manual test scripts.
- `src/data/`: Mock veterinarians/clinics/pets/reviews used as offline/fallback data.
- `scripts/` & `supabase-*.sql`: Node + SQL tooling for seeding, migrations, clinic hours extensions, schedule schemas, and verification.
- Docs (`PENDING_FEATURES.md`, `PHASE4_*.md`, etc.) capture roadmap, architecture plans, and pending modules.

## Core Features
- ✅ Authentication & onboarding: Email/password Supabase auth with profile provisioning, AsyncStorage session caching, onboarding gating, and Redux-driven state (`authSlice`).
- ✅ Vet discovery & search: Vet list/search screens combine Supabase-backed `supabaseVetService` data with mock fallbacks, advanced filters, and VetCard UI; includes Mapbox-powered location lookup and Mapbox GL visualization.
- ✅ Appointment lifecycle: Users/vets fetch appointments from Supabase, create bookings via `supabaseAppointmentService`, cancel appointments, and view details; reschedule UI exists but service stub still throws “not implemented”.
- ✅ Clinic management: `MyClinicProfileScreen` lets vets edit clinic profiles/services/hours via `supabaseClinicService`, including snake_case⇄camelCase conversion and permission scaffolding (manager checks still TODO).
- ✅ Pet management: `petService` fronts Supabase CRUD for pets plus storage uploads; vaccination helpers exist but underlying Supabase tables remain unimplemented.
- ✅ Emergency care: Dedicated screen highlighting emergency contacts, clinics, and location-based assistance.
- 🟡 Schedule management: Screen + Supabase schema for schedules/time slots exist, but feature is marked “Coming Soon” and disabled in navigation logic for actions that require backend data.
- 🟡 Veterinarian patient tools: Tabs expose placeholder cards (e.g., patient records) pending backend (`PATIENT_RECORDS_MODULE_PLAN.md` details requirements).
- 🟡 Notifications/payments/social features: Planned across multiple docs but no runtime implementation yet.

## Domain Rules
- End-to-end data flow: Screens dispatch Redux thunks → slices call Supabase services or mock fallbacks → responses normalize into state → components render; AsyncStorage persists auth + onboarding flags for bootstrap (`authStorage` helper).
- Always prefer Supabase as source of truth; fall back to `src/data` mocks (e.g., Vet search/list) only when Supabase queries return empty or error.
- Supabase profile/vet creation ensures mirrored entries in `profiles`/`veterinarians`; vet signup calls `ensureUserProfile` + `createVeterinarianProfile`.
- Clinic hours stored in Postgres snake_case JSON (`hours` column) and converted to `OpeningHours` objects before hitting UI; any new clinic editor features should reuse `convertDatabaseToAppHours/convertAppToDatabaseHours`.
- Location flows must go through `locationService` to inherit permission checks, caching, error normalization, and distance math; direct Expo Location calls are reserved for Map components.
- UI uses NativeWind tailwind-style class strings; prefer `className` props over inline styles except where dynamic styling is needed.
- Path resolver `@/*` is configured in `tsconfig`; shared UI primitives live under root `components/`.
- Accessibility is emphasized (screen reader labels/hints) via `src/utils/accessibilityUtils`—new components should follow the same patterns.

## API / Backend Actions
- `supabaseAuthService`: email signup/login/logout, current-user lookup, profile creation, onboarding status helpers, and Supabase auth state change subscriptions.
- `supabaseVetService` & `supabaseClinicService`: query veterinarians/clinics with joined profile data, specialty filters, emergency filters, clinic speciality aggregation, and clinic manager permissions.
- `supabaseAppointmentService`: CRUD + mapping for appointments with relational fetches (`pets`, `profiles`, `veterinarians`), plus booking helpers used in Redux thunks.
- `supabasePetService`: Pet CRUD, storage uploads to `vet-connect-media`, and (future) vaccination management; wraps Expo Image Picker for interactive uploads.
- `supabaseSearchService`: Advanced vet search, suggestions, and emergency filters using Supabase filters followed by client-side refinements.
- `supabaseScheduleService`: Handles veterinarian schedule templates, exceptions, slot generation, and availability toggles aligned with `supabase-schedule-management-schema.sql`.
- `locationService` & `MapView`: wrap Expo Location for permissions/reverse geocoding and feed React Native Maps markers; `LocationSearch` hits Mapbox Geocoding (token sourced via `.env` but also hard-coded).
- `scripts/*.js|sql`: Node CLIs for resetting Expo template, migrating/seeding Supabase tables (`seed-veterinarians`, `check-database`, `migrateData`), and SQL snippets for quick inserts.

## Database Schema
- Core tables (`supabase-setup.sql`): `profiles` (auth-linked users), `pets`, `clinics`, `veterinarians`, `appointments`, `reviews` with RLS ensuring users/vets only touch their data; `handle_updated_at` trigger standardizes timestamps.
- Clinic extensions (`supabase-clinic-hours-extension.sql`): Adds `hours`, emergency/contact/licensing metadata, payment/insurance arrays, and `clinic_managers` table with permission JSON + triggers for ownership.
- Schedule stack (`supabase-schedule-management-schema.sql`): `veterinarian_schedules`, `schedule_exceptions`, `time_slots`, slot-generation PL/pgSQL, and booking triggers aligning slots with appointments.
- Additional schema files cover patient roadmap modules (`PATIENT_RECORDS_MODULE_PLAN.md` references future tables), pet schema variants, and Supabase SQL dumps for clinics/vets seeding (`supabase-veterinarians-data.sql`, `sample-data.sql`).
- Storage: Supabase bucket (`vet-connect-media`) handled in pet/vet services for photo uploads.

## Code Style & Naming Conventions
- TypeScript everywhere with strict mode; domain models centralized in `src/types/index.ts`.
- Component files use PascalCase, hooks/services/utilities use camelCase; Redux slices live in `src/store/slices/<domain>Slice.ts`.
- Async workflows rely on `createAsyncThunk`; slice state always exposes `{data[], isLoading, error}` patterns for predictable UI handling.
- UI strings leverage NativeWind utility classes plus occasional StyleSheet definitions when unsupported; shared spacing/typography tokens rely on custom font families defined in Tailwind config.
- Environment secrets pulled from `app.config.js` via `expo-constants.extra`; Mapbox token also duplicated in `.env` and `LocationSearch` (should be centralized).

## Current To-Do / Known Gaps
- Vaccination management (`supabasePetService.ts:375-404`) is stubbed with TODOs—tables + CRUD endpoints need implementation.
- Appointment rescheduling (`appointmentSlice.ts` / `supabaseAppointmentService`) currently throws “Reschedule not implemented yet”; schedule syncing not wired despite schema/scripts existing.
- `appointmentService.ts` retains Firestore TODO comments and appears unused; confirm removal or finish implementation to avoid confusion.
- `MyClinicProfileScreen.tsx:152` still has TODO for permission enforcement before edits occur; backend `clinic_managers` policies expect this.
- `LocationSearch.tsx` embeds a Mapbox public token string; consolidate with `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` and avoid hard-coding secrets.
- Notification/payment/messaging/social modules outlined in `PENDING_FEATURES.md`, `FUTURE_FEATURES.md`, `PATIENT_RECORDS_MODULE_PLAN.md`, etc., remain unbuilt (marked “Planning Needed”).
- Schedule Management UI is shipped but marked “Coming Soon,” and `supabaseScheduleService` integration is paused—re-enable once backend readiness is verified.
- Supabase data seeding scripts assume specific IDs (e.g., `clinic-1`)—rerun `scripts/check-database.js` after migrations to ensure parity before testing new flows.
