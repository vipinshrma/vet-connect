import Constants from 'expo-constants';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MAPBOX_TOKEN =
  Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface LocationResult {
    id: string;
    place_name: string;
    geometry: {
        coordinates: [number, number];
    };
}

interface LocationSearchProps {
    onSelect: (location: LocationResult) => void;
    value:string
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onSelect,value }) => {
    const [query, setQuery] = useState<string>(value);
    const [results, setResults] = useState<LocationResult[]>([]);

    const searchLocation = async (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setResults([]);
            return;
        }

        if (!MAPBOX_TOKEN) {
            console.warn('Mapbox token missing; unable to search for locations.');
            return;
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                    text
                )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
            );
            const data = await response.json();
            setResults(data.features);
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

    return (
        <View className='my-2'>
            <TextInput
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Search location"
                value={query}
                onChangeText={searchLocation}
            />

            <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => {
                            onSelect(item);
                            setQuery(item.place_name);
                            setResults([]);
                        }}
                    >
                        <Text>{item.place_name}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
   
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginBottom: 5,
    },
    item: {
        padding: 10,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
    },
});

export default LocationSearch;
