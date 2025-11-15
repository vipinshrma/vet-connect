/**
 * Maps quick filter keys to actual database specialty names
 * This ensures quick filters can find veterinarians in Supabase
 */
export const QUICK_FILTER_TO_SPECIALTIES: Record<string, string[]> = {
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
    'Emergency Surgery',
    'Sports Medicine'
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
  ],
  'general': [
    'General Practice',
    'Preventive Care',
    'Wellness Programs'
  ]
};

/**
 * Get database specialty names for a quick filter key
 */
export function getSpecialtyNamesForQuickFilter(quickFilterKey: string): string[] {
  const normalizedKey = quickFilterKey.toLowerCase().trim();
  return QUICK_FILTER_TO_SPECIALTIES[normalizedKey] || [quickFilterKey];
}

/**
 * Check if a specialty matches a quick filter (case-insensitive, partial match)
 */
export function specialtyMatchesQuickFilter(
  specialty: string,
  quickFilterKey: string
): boolean {
  const specialtyLower = specialty.toLowerCase();
  const filterLower = quickFilterKey.toLowerCase();
  
  // Direct match
  if (specialtyLower === filterLower) return true;
  
  // Partial match (e.g., "Emergency" matches "Emergency Medicine")
  if (specialtyLower.includes(filterLower) || filterLower.includes(specialtyLower)) {
    return true;
  }
  
  // Check against mapped specialties
  const mappedSpecialties = getSpecialtyNamesForQuickFilter(quickFilterKey);
  return mappedSpecialties.some(mapped => 
    specialtyLower.includes(mapped.toLowerCase()) || 
    mapped.toLowerCase().includes(specialtyLower)
  );
}

