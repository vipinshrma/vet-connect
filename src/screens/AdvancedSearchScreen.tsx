import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
// import Slider from '@react-native-community/slider';

import VetCard from '../components/VetCard';
import { Veterinarian, RootStackParamList } from '../types';
import { supabaseSearchService, SearchFilters } from '../services/supabaseSearchService';
import { mockClinics } from '../data/mockClinics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AdvancedSearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // Search filters state
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    specialties: [],
    minRating: 0,
    maxDistance: 25,
    minExperience: 0,
    emergencyOnly: false,
    availableToday: false,
  });

  // UI state
  const [searchResults, setSearchResults] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Available specialties for selection
  const availableSpecialties = [
    'General Practice',
    'Emergency Medicine',
    'Surgery',
    'Cardiology',
    'Dermatology',
    'Dental Care',
    'Orthopedics',
    'Ophthalmology',
    'Neurology',
    'Oncology',
    'Critical Care',
    'Trauma Surgery',
    'Exotic Animals',
    'Behavioral Medicine',
    'Internal Medicine',
  ];

  // Search suggestions when typing
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (filters.query && filters.query.length > 1) {
        try {
          const searchSuggestions = await supabaseSearchService.getSearchSuggestions(filters.query);
          setSuggestions(searchSuggestions);
          setShowSuggestions(searchSuggestions.length > 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters.query]);

  const handleSearch = async () => {
    if (!filters.query?.trim() && filters.specialties?.length === 0) {
      Alert.alert('Search Required', 'Please enter a search term or select at least one specialty.');
      return;
    }

    setLoading(true);
    setShowSuggestions(false);
    
    try {
      console.log('Executing advanced search with filters:', filters);
      const result = await supabaseSearchService.searchVeterinarians(filters, 50, 0);
      
      console.log(`Found ${result.veterinarians.length} veterinarians`);
      setSearchResults(result.veterinarians);
      setShowResults(true);
    } catch (error) {
      console.error('Error in advanced search:', error);
      Alert.alert('Search Error', 'Failed to search veterinarians. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      specialties: [],
      minRating: 0,
      maxDistance: 25,
      minExperience: 0,
      emergencyOnly: false,
      availableToday: false,
    });
    setSearchResults([]);
    setShowResults(false);
    setShowSuggestions(false);
  };

  const toggleSpecialty = (specialty: string) => {
    setFilters(prev => ({
      ...prev,
      specialties: prev.specialties?.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...(prev.specialties || []), specialty]
    }));
  };

  const selectSuggestion = (suggestion: string) => {
    setFilters(prev => ({ ...prev, query: suggestion }));
    setShowSuggestions(false);
  };

  const calculateDistance = (vetId: string): number => {
    // Mock distance calculation
    return Math.random() * 20 + 0.5;
  };

  const renderSearchResult = ({ item }: { item: Veterinarian }) => {
    const clinic = mockClinics.find(c => c.id === item.clinic_id);
    const distance = calculateDistance(item.id);

    return (
      <VetCard
        veterinarian={item}
        clinic={clinic}
        distance={distance}
        onPress={() => navigation?.navigate('VetProfile', { veterinarianId: item.id })}
        onBookAppointment={() => navigation?.navigate('BookAppointment', {
          veterinarianId: item.id,
          clinicId: item.clinic_id
        })}
      />
    );
  };

  if (showResults) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Results Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              onPress={() => setShowResults(false)}
              className="flex-row items-center"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
              <Text className="ml-2 text-lg font-semibold text-gray-900">
                Search Results
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-blue-600 font-medium">New Search</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-600 mt-1">
            {searchResults.length} veterinarians found
          </Text>
        </View>

        {/* Results List */}
        {searchResults.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="search" size={64} color="#d1d5db" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              No results found
            </Text>
            <Text className="text-gray-600 mt-2 text-center px-8">
              Try adjusting your search filters or search terms.
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="ml-3 text-lg font-semibold text-gray-900">
            Advanced Search
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Search Query */}
        <View className="p-4 bg-white border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Search Term
          </Text>
          <View className="relative">
            <View className="bg-gray-100 rounded-lg px-4 py-3 flex-row items-center">
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                placeholder="Search veterinarians, specialties..."
                value={filters.query}
                onChangeText={(text) => setFilters(prev => ({ ...prev, query: text }))}
                className="flex-1 ml-3 text-gray-900"
              />
            </View>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 z-10 shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => selectSuggestion(suggestion)}
                    className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <Text className="text-gray-900">{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Specialties */}
        <View className="p-4 bg-white border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Specialties ({filters.specialties?.length || 0} selected)
          </Text>
          <View className="flex-row flex-wrap">
            {availableSpecialties.map((specialty) => (
              <TouchableOpacity
                key={specialty}
                onPress={() => toggleSpecialty(specialty)}
                className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                  filters.specialties?.includes(specialty)
                    ? 'bg-blue-500'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm ${
                    filters.specialties?.includes(specialty)
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rating Filter */}
        <View className="p-4 bg-white border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Minimum Rating: {filters.minRating || 0} stars
          </Text>
          <View className="flex-row justify-between">
            {[0, 1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                onPress={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                className={`px-3 py-2 rounded-lg ${
                  (filters.minRating || 0) === rating ? 'bg-blue-500' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm ${
                  (filters.minRating || 0) === rating ? 'text-white' : 'text-gray-700'
                }`}>
                  {rating}★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience Filter */}
        <View className="p-4 bg-white border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Minimum Experience: {filters.minExperience || 0} years
          </Text>
          <View className="flex-row flex-wrap">
            {[0, 1, 3, 5, 10, 15, 20].map((years) => (
              <TouchableOpacity
                key={years}
                onPress={() => setFilters(prev => ({ ...prev, minExperience: years }))}
                className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                  (filters.minExperience || 0) === years ? 'bg-blue-500' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm ${
                  (filters.minExperience || 0) === years ? 'text-white' : 'text-gray-700'
                }`}>
                  {years === 0 ? 'Any' : `${years}+ yrs`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Filters */}
        <View className="p-4 bg-white border-b border-gray-100">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Additional Filters
          </Text>
          
          <View className="flex-row items-center justify-between py-3">
            <View>
              <Text className="text-gray-900 font-medium">Emergency Specialists Only</Text>
              <Text className="text-sm text-gray-500">Show only emergency veterinarians</Text>
            </View>
            <Switch
              value={filters.emergencyOnly}
              onValueChange={(value) => setFilters(prev => ({ ...prev, emergencyOnly: value }))}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={filters.emergencyOnly ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View>
              <Text className="text-gray-900 font-medium">Available Today</Text>
              <Text className="text-sm text-gray-500">Show only vets available today</Text>
            </View>
            <Switch
              value={filters.availableToday}
              onValueChange={(value) => setFilters(prev => ({ ...prev, availableToday: value }))}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={filters.availableToday ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white px-4 py-3 border-t border-gray-100">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={clearFilters}
            className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
          >
            <Text className="text-gray-700 font-semibold">Clear Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSearch}
            disabled={loading}
            className="flex-2 bg-blue-500 rounded-lg py-3 items-center flex-row justify-center"
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Search</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AdvancedSearchScreen;