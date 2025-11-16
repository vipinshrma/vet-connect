import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import VetCard from '../../components/VetCard';
import { supabase } from '../../config/supabase';
import { mockClinics } from '../../data/mockClinics';
import { supabaseVetService } from '../../services/supabaseVetService';
import { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { RootStackParamList, Veterinarian } from '../../types';

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
  const [topRatedVets, setTopRatedVets] = useState<Veterinarian[]>([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadTopRatedVets();
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

  const loadTopRatedVets = async () => {
    setTopRatedLoading(true);
    try {
      console.log('Loading top-rated veterinarians from Supabase...');
      // Load top 3 vets with minimum 4.0 rating and at least 3 reviews for quality
      let vets = await supabaseVetService.getTopRatedVeterinarians(3, 4.0, 3);
      
      // If no results with strict filters, try with less strict filters
      if (vets.length === 0) {
        console.log('No vets found with strict filters, trying with relaxed filters...');
        vets = await supabaseVetService.getTopRatedVeterinarians(3, 3.5, 1);
      }
      
      // If still no results, try without any filters (just top rated)
      if (vets.length === 0) {
        console.log('No vets found with relaxed filters, trying without filters...');
        vets = await supabaseVetService.getTopRatedVeterinarians(3);
      }
      
      console.log(`Loaded ${vets.length} top-rated veterinarians from Supabase database`);
      setTopRatedVets(vets);
    } catch (error) {
      console.error('Error loading top-rated veterinarians from Supabase:', error);
      // Show empty array - fallback UI will be displayed
      setTopRatedVets([]);
    } finally {
      setTopRatedLoading(false);
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
      console.log('Searching veterinarians for query:', searchQuery);
      
      // Use Supabase search (uses client-side filtering for case-insensitive matching)
      const results = await supabaseVetService.searchVeterinarians(searchQuery);
      
      console.log(`Found ${results.length} veterinarians from Supabase database`);

      setSearchResults(results);
      setShowResults(true);

      // Add to recent searches if not already present
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Error searching veterinarians:', error);
      setSearchResults([]);
      setShowResults(true);
      Alert.alert('Search Error', 'Unable to search veterinarians. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = async (specialty: string) => {
    setLoading(true);
    try {
      console.log('Filtering by specialty:', specialty);
      
      let results: Veterinarian[] = [];

      if (specialty === 'emergency') {
        // Use Supabase emergency vets method (service handles fallbacks internally)
        results = await supabaseVetService.getEmergencyVeterinarians();
      } else {
        // Use Supabase specialty search (service handles mapping and fallbacks internally)
        results = await supabaseVetService.getVeterinariansBySpecialty(specialty);
      }

      console.log(`Found ${results.length} veterinarians for ${specialty} from Supabase`);
      
      setSearchResults(results);
      setShowResults(true);
      setSearchQuery(specialty.charAt(0).toUpperCase() + specialty.slice(1));
    } catch (error) {
      console.error('Error filtering by specialty:', error);
      // Service methods handle fallbacks, but show empty results if everything fails
      setSearchResults([]);
      setShowResults(true);
      setSearchQuery(specialty.charAt(0).toUpperCase() + specialty.slice(1));
      Alert.alert('Search Error', 'Unable to load veterinarians. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyPress = async (specialty: string) => {
    setLoading(true);
    try {
      console.log('Searching by specialty:', specialty);
      
      // Use Supabase specialty search (service handles mapping and fallbacks internally)
      const results = await supabaseVetService.getVeterinariansBySpecialty(specialty);

      console.log(`Found ${results.length} veterinarians for ${specialty} specialty from Supabase`);
      
      setSearchResults(results);
      setShowResults(true);
      setSearchQuery(specialty);
    } catch (error) {
      console.error('Error searching by specialty:', error);
      // Service methods handle fallbacks, but show empty results if everything fails
      setSearchResults([]);
      setShowResults(true);
      setSearchQuery(specialty);
      Alert.alert('Search Error', 'Unable to load veterinarians. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
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
              contentContainerStyle={{ paddingVertical: 12, paddingBottom: 24 }}
              ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
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
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-gray-900">
            Find the Perfect Vet
          </Text>
          <TouchableOpacity 
            onPress={() => navigation?.navigate('AdvancedSearch')}
            className="bg-blue-50 px-3 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="options" size={16} color="#3b82f6" />
            <Text className="text-blue-600 font-medium ml-1">Advanced</Text>
          </TouchableOpacity>
        </View>
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
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <View className="flex-row">
              {quickFilters.map((filter, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuickFilter(filter.specialty)}
                  className="bg-blue-50 px-4 py-3 rounded-lg flex-row items-center min-w-24"
                  style={{ marginRight: index < quickFilters.length - 1 ? 12 : 0 }}
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
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -4, marginVertical: -4 }}>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleRecentSearch(search)}
                  className="bg-gray-100 px-3 py-2 rounded-full flex-row items-center"
                  style={{ marginHorizontal: 4, marginVertical: 4 }}
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
          <View>
            {featuredSpecialties.map((specialty, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSpecialtyPress(specialty.specialty)}
                className="bg-white border border-gray-100 rounded-xl p-4 flex-row items-center shadow-sm"
                style={{ marginBottom: index < featuredSpecialties.length - 1 ? 12 : 0 }}
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
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-semibold text-gray-900">
              Top Rated Vets
            </Text>
            <TouchableOpacity onPress={() => navigation?.navigate('VetList')}>
              <Text className="text-blue-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          
          {topRatedLoading ? (
            <View className="flex items-center justify-center py-8">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-600 mt-2">Loading top-rated vets...</Text>
            </View>
          ) : topRatedVets.length > 0 ? (
            <View>
              {topRatedVets.map((vet) => {
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
          ) : (
            <View className="bg-gray-50 rounded-xl p-6 items-center justify-center border border-gray-200">
              <Ionicons name="star-outline" size={48} color="#d1d5db" />
              <Text className="text-lg font-semibold text-gray-900 mt-4">
                No Top-Rated Vets Yet
              </Text>
              <Text className="text-gray-600 text-center mt-2 px-4">
                We're working on finding the best veterinarians for you. Check back soon!
              </Text>
              <TouchableOpacity
                onPress={() => navigation?.navigate('VetList')}
                className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Browse All Vets</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;