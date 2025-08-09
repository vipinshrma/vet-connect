import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import VetCard from '../../components/VetCard';
import { Veterinarian, Clinic, RootStackParamList } from '../../types';
import { mockVeterinarians, getVeterinariansBySpecialty, getEmergencyVeterinarians, getTopRatedVeterinarians } from '../../data/mockVeterinarians';
import { mockClinics } from '../../data/mockClinics';
import { supabase } from '../../config/supabase';
import { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchScreenProps {
  navigation?: any;
}

const SearchScreen: React.FC<SearchScreenProps> = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Emergency Vet',
    'Dog Training',
    'Cat Specialist',
    'Dental Care',
  ]);
  const [searchResults, setSearchResults] = useState<Veterinarian[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        handleLogout();
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      handleLogout();
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await dispatch(logoutUser()).unwrap();
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const quickFilters = [
    { label: 'Emergency', icon: 'medical', specialty: 'emergency' },
    { label: 'Surgery', icon: 'cut', specialty: 'surgery' },
    { label: 'Cardiology', icon: 'heart', specialty: 'cardiology' },
    { label: 'Dermatology', icon: 'leaf', specialty: 'dermatology' },
    { label: 'Dental', icon: 'tooth', specialty: 'dental' },
    { label: 'Exotic Pets', icon: 'paw', specialty: 'exotic' },
  ];

  const featuredSpecialties = [
    {
      title: 'Emergency Care',
      description: '24/7 urgent care for your pets',
      icon: 'medical',
      color: 'bg-red-500',
      specialty: 'emergency',
    },
    {
      title: 'General Practice',
      description: 'Routine checkups and preventive care',
      icon: 'clipboard',
      color: 'bg-blue-500',
      specialty: 'general',
    },
    {
      title: 'Surgery',
      description: 'Surgical procedures and post-op care',
      icon: 'cut',
      color: 'bg-purple-500',
      specialty: 'surgery',
    },
    {
      title: 'Cardiology',
      description: 'Heart and cardiovascular health',
      icon: 'heart',
      color: 'bg-pink-500',
      specialty: 'cardiology',
    },
  ];

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      handleSearch();
    } else {
      setShowResults(false);
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let results: Veterinarian[] = [];

      // Search by name
      const nameResults = mockVeterinarians.filter(vet =>
        vet.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Search by specialty
      const specialtyResults = mockVeterinarians.filter(vet =>
        vet.specialties.some(specialty =>
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

      // Combine and deduplicate results
      const combinedResults = [...nameResults, ...specialtyResults];
      results = combinedResults.filter((vet, index) =>
        combinedResults.findIndex(v => v.id === vet.id) === index
      );

      // Sort by rating
      results.sort((a, b) => b.rating - a.rating);

      setSearchResults(results);
      setShowResults(true);

      // Add to recent searches if not already present
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (specialty: string) => {
    let results: Veterinarian[] = [];

    switch (specialty) {
      case 'emergency':
        results = getEmergencyVeterinarians();
        break;
      default:
        results = getVeterinariansBySpecialty(specialty);
        break;
    }

    setSearchResults(results);
    setShowResults(true);
    setSearchQuery(specialty.charAt(0).toUpperCase() + specialty.slice(1));
  };

  const handleSpecialtyPress = (specialty: string) => {
    const results = getVeterinariansBySpecialty(specialty);
    setSearchResults(results);
    setShowResults(true);
    setSearchQuery(specialty);
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
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
        {/* Search Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1 bg-gray-100 rounded-lg px-4 py-3 flex-row items-center ml-3">
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                placeholder="Search veterinarians..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-gray-900"
                autoFocus={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Results */}
        <View className="flex-1">
          <View className="bg-white px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">
              {searchResults.length} veterinarians found
            </Text>
          </View>

          {searchResults.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="search" size={64} color="#d1d5db" />
              <Text className="text-xl font-semibold text-gray-900 mt-4">
                No results found
              </Text>
              <Text className="text-gray-600 mt-2 text-center px-8">
                Try searching for a different specialty or veterinarian name.
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
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Find the Perfect Vet
        </Text>
        <Text className="text-gray-600">
          Search by specialty, name, or browse featured services
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 mb-6">
        <View className="bg-gray-100 rounded-lg px-4 py-4 flex-row items-center">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            placeholder="Search for veterinarians, specialties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-900"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Filters */}
        <View className="px-4 mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Filters
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {quickFilters.map((filter, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuickFilter(filter.specialty)}
                  className="bg-blue-50 px-4 py-3 rounded-lg flex-row items-center min-w-24 mr-3"
                >
                  <Ionicons name={filter.icon as any} size={18} color="#3b82f6" />
                  <Text className="text-blue-700 font-medium ml-2">
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View className="px-4 mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Recent Searches
            </Text>
            <View className="flex-row flex-wrap">
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleRecentSearch(search)}
                  className="bg-gray-100 px-3 py-2 rounded-full mr-2 mb-2 flex-row items-center"
                >
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text className="text-gray-700 ml-2">{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Featured Specialties */}
        <View className="px-4 mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Featured Specialties
          </Text>
          <View className="space-y-3">
            {featuredSpecialties.map((specialty, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSpecialtyPress(specialty.specialty)}
                className="bg-white border border-gray-100 rounded-xl p-4 flex-row items-center shadow-sm"
              >
                <View className={`w-12 h-12 ${specialty.color} rounded-xl flex items-center justify-center`}>
                  <Ionicons name={specialty.icon as any} size={24} color="white" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    {specialty.title}
                  </Text>
                  <Text className="text-gray-600 mt-1">
                    {specialty.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Rated Vets */}
        <View className="px-4 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              Top Rated Vets
            </Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          
          {getTopRatedVeterinarians(3).map((vet, index) => {
            const clinic = mockClinics.find(c => c.id === vet.clinic_id);
            const distance = calculateDistance(vet.id);
            
            return (
              <VetCard
                key={vet.id}
                veterinarian={vet}
                clinic={clinic}
                distance={distance}
                onPress={() => navigation?.navigate('VetProfile', { veterinarianId: vet.id })}
                onBookAppointment={() => navigation?.navigate('BookAppointment', {
                  veterinarianId: vet.id,
                  clinicId: vet.clinic_id
                })}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;