import Constants from 'expo-constants';
import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, findNodeHandle, UIManager } from 'react-native';

const MAPBOX_TOKEN =
  Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface LocationResult {
    id: string;
    place_name: string;
    geometry: {
        coordinates: [number, number];
    };
    context?: Array<{
        id: string;
        text: string;
        short_code?: string;
    }>;
}

interface LocationSearchProps {
    onSelect: (location: LocationResult) => void;
    value: string;
    onFocus?: () => void;
    scrollToInput?: () => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onSelect, value, onFocus, scrollToInput }) => {
    const [query, setQuery] = useState<string>(value);
    const [results, setResults] = useState<LocationResult[]>([]);
    const inputRef = useRef<TextInput>(null);
    const containerRef = useRef<View>(null);

    const scrollInputIntoView = () => {
        if (containerRef.current && UIManager) {
            try {
                const node = findNodeHandle(containerRef.current);
                if (node) {
                    UIManager.measureInWindow(node, (x, y, width, height) => {
                        // Scroll input into view by calling parent's scroll function
                        if (scrollToInput) {
                            scrollToInput();
                        } else {
                            // Default behavior: scroll after a short delay to ensure keyboard is shown
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
    };

    const handleFocus = () => {
        if (onFocus) {
            onFocus();
        }
        // Scroll into view when focused
        setTimeout(() => {
            scrollInputIntoView();
        }, 300); // Delay to allow keyboard to show
    };

    const searchLocation = async (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setResults([]);
            return;
        }
        
        // When results appear, ensure input is visible
        if (text.length >= 2) {
            setTimeout(() => {
                scrollInputIntoView();
            }, 100);
        }

        if (!MAPBOX_TOKEN) {
            console.warn('Mapbox token missing; unable to search for locations.');
            return;
        }

        try {
            // Build query parameters for better address search
            const params = new URLSearchParams({
                access_token: MAPBOX_TOKEN,
                autocomplete: 'true',
                limit: '8', // Increased limit for better results
                // Prioritize addresses first, then POIs, then places
                types: 'address,poi,place,locality,neighborhood,postcode',
                // Enable proximity bias for more relevant results
                // bbox: optional bounding box can be added here
            });

            // Check if query looks like a specific address (contains numbers)
            const hasNumber = /\d/.test(text);
            const hasStreetKeyword = /\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|circle|ct|plaza|pl)\b/i.test(text);
            
            // If it looks like a specific address, prioritize address type
            if (hasNumber || hasStreetKeyword) {
                params.set('types', 'address,poi');
            }

            const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?${params.toString()}`;
            console.log('🔍 [DEBUG] LocationSearch API URL:', apiUrl.replace(MAPBOX_TOKEN, 'TOKEN_HIDDEN'));

            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Mapbox API error: ${response.status}`);
            }

            const data = await response.json();
            const features = data.features || [];
            
            // Sort results: addresses first, then POIs, then places
            const sortedFeatures = features.sort((a: any, b: any) => {
                const aIsAddress = a.place_type?.includes('address') || false;
                const bIsAddress = b.place_type?.includes('address') || false;
                if (aIsAddress && !bIsAddress) return -1;
                if (!aIsAddress && bIsAddress) return 1;
                return 0;
            });

            console.log('📍 [DEBUG] LocationSearch results:', sortedFeatures.length, 'found');
            setResults(sortedFeatures);
            
            // Scroll input into view when results appear
            if (sortedFeatures.length > 0) {
                setTimeout(() => {
                    scrollInputIntoView();
                }, 200);
            }
        } catch (error) {
            console.error('❌ [ERROR] Error fetching locations:', error);
            setResults([]);
        }
    };

    return (
        <View ref={containerRef} className='my-2' style={styles.container}>
            <TextInput
                ref={inputRef}
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Search location"
                value={query}
                onChangeText={searchLocation}
                onFocus={handleFocus}
                style={styles.input}
            />

            {results.length > 0 && (
                <View style={styles.resultsWrapper}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            // Determine if this is an address type
                            const isAddress = (item as any).place_type?.includes('address') || false;
                            const addressNumber = (item as any).properties?.address || '';
                            
                            return (
                                <TouchableOpacity
                                    style={[styles.item, isAddress && styles.addressItem]}
                                    onPress={() => {
                                        onSelect(item);
                                        setQuery(item.place_name);
                                        setResults([]);
                                    }}
                                >
                                    <Text style={[styles.itemText, isAddress && styles.addressText]}>
                                        {addressNumber && `${addressNumber}, `}
                                        {item.place_name}
                                    </Text>
                                    {isAddress && (
                                        <Text style={styles.addressLabel}>Address</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        style={styles.resultsList}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    input: {
        height: 48,
        borderColor: '#d1d5db',
        borderWidth: 1,
        paddingHorizontal: 16,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    resultsWrapper: {
        marginTop: 8,
        zIndex: 1000,
        elevation: 5,
    },
    resultsList: {
        maxHeight: 300,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    item: {
        padding: 12,
        borderBottomColor: '#f3f4f6',
        borderBottomWidth: 1,
    },
    addressItem: {
        backgroundColor: '#f0f9ff',
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
    },
    itemText: {
        fontSize: 14,
        color: '#111827',
    },
    addressText: {
        fontWeight: '600',
        color: '#1e40af',
    },
    addressLabel: {
        fontSize: 11,
        color: '#3b82f6',
        marginTop: 2,
        fontWeight: '500',
    },
});

export default LocationSearch;
