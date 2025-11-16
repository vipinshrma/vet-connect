import Constants from 'expo-constants';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  findNodeHandle,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MAPBOX_TOKEN =
  Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

export interface AddressResult {
  id: string;
  place_name: string;
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  properties?: {
    accuracy?: string;
    address?: string;
  };
}

export interface ParsedAddress {
  fullAddress: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  label?: string;
  editable?: boolean;
  error?: string;
  inputStyle?: any;
  debounceMs?: number;
  limit?: number;
  countries?: string[]; // ISO country codes (e.g., ['us', 'ca'])
  onFocus?: () => void;
  scrollToInput?: () => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onSelect,
  placeholder = 'Search for an address',
  label,
  editable = true,
  error,
  inputStyle,
  debounceMs = 300,
  limit = 5,
  countries,
  onFocus,
  scrollToInput,
}) => {
  const [query, setQuery] = useState<string>(value);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);

  // Parse Mapbox context to extract address components
  const parseAddress = useCallback((result: AddressResult): ParsedAddress => {
    const [longitude, latitude] = result.geometry.coordinates;
    const context = result.context || [];
    
    console.log('🔍 [DEBUG] Parsing address:', {
      place_name: result.place_name,
      coordinates: [latitude, longitude],
      context: context,
    });
    
    // Extract components from context array
    let street = '';
    let city = '';
    let state = '';
    let zipCode = '';
    let country = '';

    context.forEach((ctx) => {
      if (ctx.id.startsWith('address')) {
        street = ctx.text;
      } else if (ctx.id.startsWith('place')) {
        city = ctx.text;
      } else if (ctx.id.startsWith('region')) {
        state = ctx.short_code || ctx.text;
      } else if (ctx.id.startsWith('district')) {
        // India uses district, state hierarchy
        if (!city) city = ctx.text;
      } else if (ctx.id.startsWith('postcode')) {
        zipCode = ctx.text;
      } else if (ctx.id.startsWith('country')) {
        country = ctx.text;
      }
    });

    // For India and some other countries, context structure might be different
    // Try to parse from place_name if context doesn't have the info
    if (!street && result.place_name) {
      const parts = result.place_name.split(',');
      if (parts.length > 0) {
        street = parts[0].trim();
      }
    }

    // Use place_name as full address if it's available
    const fullAddress = result.place_name || result.properties?.address || '';

    return {
      fullAddress: fullAddress,
      street: street || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
      country: country || undefined,
      coordinates: {
        latitude,
        longitude,
      },
    };
  }, []);

  const searchAddress = useCallback(async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token missing; unable to search for addresses.');
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      // Build query parameters for better address search
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        autocomplete: 'true',
        limit: (limit + 3).toString(), // Get more results for better sorting
        types: 'address,poi,place,locality,neighborhood,postcode', // Include more types for better results
      });

      // Check if query looks like a specific address (contains numbers or street keywords)
      const hasNumber = /\d/.test(text);
      const hasStreetKeyword = /\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|circle|ct|plaza|pl|home|house|residential)\b/i.test(text);
      
      // If it looks like a specific address, prioritize address type
      if (hasNumber || hasStreetKeyword) {
        params.set('types', 'address,poi');
        params.set('limit', (limit + 5).toString()); // Get more address results
      }

      if (countries && countries.length > 0) {
        // Mapbox expects comma-separated country codes (lowercase)
        params.set('country', countries.map(c => c.toLowerCase()).join(','));
      }

      const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?${params.toString()}`;
      console.log('Mapbox API URL:', apiUrl.replace(MAPBOX_TOKEN || '', 'TOKEN_HIDDEN'));

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      const features = data.features || [];
      
      // Sort results: addresses first, then POIs, then places
      const sortedFeatures = features.sort((a: AddressResult, b: AddressResult) => {
        const aType = (a as any).place_type || [];
        const bType = (b as any).place_type || [];
        const aIsAddress = Array.isArray(aType) ? aType.includes('address') : false;
        const bIsAddress = Array.isArray(bType) ? bType.includes('address') : false;
        
        // Prioritize addresses
        if (aIsAddress && !bIsAddress) return -1;
        if (!aIsAddress && bIsAddress) return 1;
        
        // Then prioritize results with higher relevance score
        const aRelevance = (a as any).relevance || 0;
        const bRelevance = (b as any).relevance || 0;
        return bRelevance - aRelevance;
      });

      // Take only the limit requested
      const finalResults = sortedFeatures.slice(0, limit);
      setResults(finalResults);
      
      // Scroll input into view when results appear
      if (finalResults.length > 0) {
        setTimeout(() => {
          scrollInputIntoView();
        }, 200);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [limit, countries]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      searchAddress(text);
    }, debounceMs);
  }, [searchAddress, debounceMs]);

  const handleSelect = useCallback((result: AddressResult) => {
    const parsed = parseAddress(result);
    const addressText = parsed.fullAddress || result.place_name;
    
    console.log('AddressAutocomplete: handleSelect called', {
      addressText,
      parsed,
      result: result.place_name
    });
    
    // Mark as internal update to prevent useEffect from overriding
    isInternalUpdateRef.current = true;
    
    // Update internal state first
    setQuery(addressText);
    setResults([]);
    setShowResults(false);
    
    // Call parent callback to update form data
    // This should update the value prop, which will then sync back
    onSelect(parsed);
    
    // Don't blur immediately to allow the parent to update
    setTimeout(() => {
      inputRef.current?.blur();
    }, 100);
  }, [onSelect, parseAddress]);

  const scrollInputIntoView = useCallback(() => {
    if (containerRef.current && UIManager) {
      try {
        const node = findNodeHandle(containerRef.current);
        if (node) {
          UIManager.measureInWindow(node, (x, y, width, height) => {
            // Scroll input into view by calling parent's scroll function
            if (scrollToInput) {
              scrollToInput();
            } else {
              // Default behavior: ensure input is focused
              setTimeout(() => {
                inputRef.current?.focus();
              }, 100);
            }
          });
        }
      } catch (error) {
        console.warn('Error measuring input position:', error);
      }
    }
  }, [scrollToInput]);

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus();
    }
    if (query.length >= 2) {
      setShowResults(true);
    }
    // Scroll into view when focused
    setTimeout(() => {
      scrollInputIntoView();
    }, 300); // Delay to allow keyboard to show
  }, [query, onFocus, scrollInputIntoView]);

  const handleBlur = useCallback(() => {
    // Delay hiding results to allow tap to register
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  }, []);

  // Sync value prop with internal state
  // Use a ref to track if we're updating internally to avoid loops
  const isInternalUpdateRef = useRef(false);
  
  useEffect(() => {
    // Only sync if the value prop changed externally (not from our internal state)
    if (!isInternalUpdateRef.current && value !== query) {
      setQuery(value || '');
    }
    isInternalUpdateRef.current = false;
  }, [value, query]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const renderResultItem = ({ item }: { item: AddressResult }) => {
    const placeType = (item as any).place_type || [];
    const isAddress = Array.isArray(placeType) ? placeType.includes('address') : false;
    const addressNumber = (item as any).properties?.address || '';
    
    return (
      <TouchableOpacity
        style={[styles.resultItem, isAddress && styles.addressResultItem]}
        onPress={() => handleSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={`Select address: ${item.place_name}`}
      >
        <Ionicons 
          name={isAddress ? "home" : "location-outline"} 
          size={20} 
          color={isAddress ? "#3b82f6" : "#6b7280"} 
          style={styles.resultIcon} 
        />
        <View style={styles.resultContent}>
          <Text style={[styles.resultMainText, isAddress && styles.addressResultText]} numberOfLines={2}>
            {addressNumber && `${addressNumber}, `}
            {item.place_name}
          </Text>
          {isAddress && (
            <Text style={styles.addressLabel}>Exact Address</Text>
          )}
          {!isAddress && item.properties?.accuracy && (
            <Text style={styles.resultSubText}>{item.properties.accuracy}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View ref={containerRef} style={[styles.container, { zIndex: showResults ? 1000 : 1 }]}>
      {label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      )}

      <View style={styles.inputContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#6b7280"
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={[styles.input, error && styles.inputError, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={handleQueryChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          accessibilityLabel={label || placeholder}
          accessibilityHint="Start typing to search for addresses"
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#3b82f6" style={styles.loadingIndicator} />
        )}
      </View>

      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}

      {/* Results List */}
      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderResultItem}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.resultsList}
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        </View>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No addresses found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    zIndex: 2,
    position: 'relative',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
    paddingRight: 8,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  resultsContainer: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 250,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
    position: 'relative',
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultIcon: {
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '400',
  },
  resultSubText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  noResultsContainer: {
    marginTop: 4,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default AddressAutocomplete;

