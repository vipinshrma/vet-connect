# Top-Rated Veterinarians - Identifiers and Keys

## Available Identifiers in Supabase Schema

### Primary Identifier: `rating` (DECIMAL)

**Location**: `veterinarians` table
```sql
CREATE TABLE veterinarians (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialties TEXT[],
  experience INTEGER NOT NULL,
  rating DECIMAL DEFAULT 0,        -- ✅ PRIMARY KEY FOR TOP-RATED VETS
  review_count INTEGER DEFAULT 0,  -- ✅ SECONDARY KEY (minimum reviews filter)
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Secondary Identifier: `review_count` (INTEGER)

**Purpose**: Can be used to filter veterinarians with minimum number of reviews
- Ensures quality by requiring minimum reviews (e.g., at least 5 reviews)
- Helps avoid showing vets with high ratings but few reviews

### Database Index

**Index on Rating**: `idx_veterinarians_rating`
```sql
CREATE INDEX IF NOT EXISTS idx_veterinarians_rating ON veterinarians(rating DESC);
```
- **Optimized for**: Descending order queries (highest rating first)
- **Performance**: Fast queries when ordering by rating

## Current Implementation

### Method: `getTopRatedVeterinarians(limit: number)`

**Location**: `src/services/supabaseVetService.ts:278-299`

```typescript
async getTopRatedVeterinarians(limit: number = 5): Promise<Veterinarian[]> {
  const { data, error } = await supabase
    .from('veterinarians')
    .select('*, profiles!inner(*)')
    .order('rating', { ascending: false })  // ✅ Uses 'rating' key
    .limit(limit);                           // ✅ Limits results
    
  return (data || []).map(row => this.mapToVeterinarian(row));
}
```

**How it works**:
1. Queries `veterinarians` table
2. Orders by `rating` in descending order (highest first)
3. Limits results to specified number
4. Uses the indexed `rating` column for fast performance

## Keys to Use for Top-Rated Vets

### 1. **`rating` (DECIMAL)** - Primary Key ✅

**Usage**:
```typescript
// Order by rating descending
.order('rating', { ascending: false })

// Filter by minimum rating
.gte('rating', 4.5)  // Only vets with 4.5+ stars
```

**Value Range**: 0.0 to 5.0 (typically)
- Higher values = better rating
- Can filter with `.gte()`, `.lte()`, `.eq()`

### 2. **`review_count` (INTEGER)** - Secondary Key ✅

**Usage**:
```typescript
// Filter by minimum reviews
.gte('review_count', 5)  // Only vets with at least 5 reviews
```

**Purpose**: 
- Ensures quality (avoids showing vets with 5.0 rating but only 1 review)
- Can combine with rating for better filtering

### 3. **Combined Filtering** - Best Practice ✅

**Example**:
```typescript
// Get top-rated vets with minimum reviews
async getTopRatedVeterinarians(
  limit: number = 5,
  minRating: number = 4.0,
  minReviews: number = 3
): Promise<Veterinarian[]> {
  const { data, error } = await supabase
    .from('veterinarians')
    .select('*, profiles!inner(*)')
    .gte('rating', minRating)           // ✅ Minimum rating filter
    .gte('review_count', minReviews)    // ✅ Minimum reviews filter
    .order('rating', { ascending: false })
    .limit(limit);
    
  return (data || []).map(row => this.mapToVeterinarian(row));
}
```

## Recommended Query Patterns

### Pattern 1: Simple Top-Rated (Current Implementation)
```typescript
.order('rating', { ascending: false })
.limit(limit)
```
**Use Case**: Show top N veterinarians by rating

### Pattern 2: Top-Rated with Minimum Rating
```typescript
.gte('rating', 4.5)
.order('rating', { ascending: false })
.limit(limit)
```
**Use Case**: Only show highly-rated vets (4.5+ stars)

### Pattern 3: Top-Rated with Minimum Reviews
```typescript
.gte('review_count', 5)
.order('rating', { ascending: false })
.limit(limit)
```
**Use Case**: Only show vets with sufficient reviews for credibility

### Pattern 4: Top-Rated with Both Filters (Recommended)
```typescript
.gte('rating', 4.0)
.gte('review_count', 3)
.order('rating', { ascending: false })
.limit(limit)
```
**Use Case**: Quality top-rated vets with both high rating and sufficient reviews

### Pattern 5: Top-Rated by Specialty
```typescript
.contains('specialties', ['Cardiology'])
.gte('rating', 4.0)
.order('rating', { ascending: false })
.limit(limit)
```
**Use Case**: Top-rated vets in a specific specialty

## How Rating is Calculated

The `rating` field in the `veterinarians` table is likely:
1. **Calculated from reviews**: Aggregated from the `reviews` table
2. **Updated via trigger**: When new reviews are added
3. **Stored for performance**: Pre-calculated to avoid expensive aggregations

**Reviews Table**:
```sql
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  veterinarian_id UUID REFERENCES veterinarians(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Summary

### ✅ Primary Key for Top-Rated Vets:
**`rating` (DECIMAL)** - Use this to:
- Order veterinarians by rating (descending)
- Filter by minimum rating threshold
- Already indexed for fast queries

### ✅ Secondary Key for Quality:
**`review_count` (INTEGER)** - Use this to:
- Filter by minimum number of reviews
- Ensure credibility of ratings
- Combine with rating for better results

### ✅ Current Implementation:
The `getTopRatedVeterinarians()` method already uses:
- `rating` column for ordering
- Indexed query for performance
- Limit parameter for pagination

### ✅ Recommended Enhancement:
Add optional filters for minimum rating and review count:
```typescript
async getTopRatedVeterinarians(
  limit: number = 5,
  minRating?: number,
  minReviews?: number
): Promise<Veterinarian[]>
```

This would allow filtering like:
- "Show top 5 vets with at least 4.5 stars and 10+ reviews"
- "Show top 10 vets with at least 4.0 stars"

