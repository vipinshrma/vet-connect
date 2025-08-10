import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VetCard from '../components/VetCard';
import { mockVeterinarians } from '../data';
import { locationService } from '../services/locationService';
import { supabaseClinicService } from '../services/supabaseClinicService';
import { supabaseVetService } from '../services/supabaseVetService';
import { Clinic, SearchFilters, UserLocation, Veterinarian } from '../types';

interface VetListScreenProps {
  navigation: any;
}

const VetListScreen: React.FC<VetListScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [filteredVets, setFilteredVets] = useState<Veterinarian[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    radius: 25,
    specialties: [],
    services: [],
    rating: 0,
    availableToday: false,
    openNow: false,
  });

  const specialties = [
    'General Practice',
    'Emergency Medicine',
    'Surgery',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Oncology',
    'Ophthalmology',
    'Behavioral Medicine',
    'Exotic Animals',
  ];

  const services = [
    'Vaccinations',
    'Dental Care',
    'Preventive Care',
    'Wellness Programs',
    'Emergency Care',
    'Surgery',
    'Diagnostics',
    'Grooming',
  ];

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        await loadVeterinarians();
        await loadClinics();
        // Don't block screen loading on location permission
        requestLocationPermission().catch(err => {
        });
      } catch (error) {
        console.error('Error initializing VetListScreen:', error);
      }
    };
    
    initializeScreen();
  }, []);

  useEffect(() => {
    if(!userLocation?.address) return;
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      applyFilters();
    }
  }, [searchQuery, filters, veterinarians,userLocation]);

  // Separate effect for when userLocation changes - only re-sort if filters are active
  useEffect(() => {
    if(!userLocation?.address) return;
    if (userLocation && (filters.radius < 25 || getActiveFilterCount() > 0)) {
      // Only re-apply filters if user has active location-based filters
      applyFilters();
    }
  }, [userLocation]);

  const loadVeterinarians = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Get current location coordinates if available
      const locationParams = userLocation?.latitude && userLocation?.longitude
        ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
        : null;

      const allVets = await supabaseVetService.getAllVeterinarians(locationParams);
      
      // If database is empty, use mock data as fallback
      if (allVets.length === 0) {
        console.log('Database is empty, using mock data as fallback');
        setVeterinarians([]);
      } else {
        console.log(`Loaded ${allVets.length} veterinarians from Supabase database`);
        setVeterinarians(allVets);
      }
    } catch (error) {
      console.error('Error loading veterinarians from Supabase:', error);
      setVeterinarians(mockVeterinarians);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      // console.log('🗺️ Starting location permission request...');
      setLoading(true);
      
      // Check if permission already granted
      const hasPermission = await locationService.hasLocationPermission();
      // console.log('📍 Has location permission:', hasPermission);
      
      if (hasPermission) {
        // console.log('✅ Permission already granted, getting location...');
        const location = await locationService.getCurrentLocation();
        setUserLocation(location);
        setLocationPermissionGranted(true);
        // console.log('📍 Location obtained successfully:', location);
        return;
      }

      // Request permission
      const result = await locationService.requestLocationPermission();
      if (result.granted) {
        const location = await locationService.getCurrentLocation();
        setUserLocation(location);
        setLocationPermissionGranted(true);
        // console.log('Location permission granted and location obtained:', location);
      } else {
        setLocationPermissionGranted(false);
        Alert.alert(
          'Location Permission Required', 
          result.error?.message || 'Location access is needed to find nearby veterinarians. You can still search without location-based results.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // In a real app, you might want to open device settings
              console.log('Open device settings for location permission');
            }}
          ]
        );
      }
    } catch (error: any) {
      console.error('Error requesting location permission:', error);
      setLocationPermissionGranted(false);
      
      // Provide user-friendly error message
      const errorMessage = error.message || 'Unable to access location. Please try again or continue without location-based results.';
      Alert.alert('Location Error', errorMessage, [
        { text: 'Continue Without Location', style: 'cancel' },
        { text: 'Try Again', onPress: requestLocationPermission }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (clinic: Clinic): number => {
    if (!userLocation || !clinic?.coordinates) {
      return 0;
    }
    try {
      return locationService.calculateDistanceInMiles(
        userLocation.coordinates, 
        clinic.coordinates
      );
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 0;
    }
  };

  const applyFilters = async () => {
    let filtered = veterinarians;

    // If we have specialty filters, use Supabase service for better performance
    if (filters.specialties.length > 0) {
      try {
        setSearchLoading(true);
        const specialtyResults = await Promise.all(
          filters.specialties.map(specialty => 
            supabaseVetService.getVeterinariansBySpecialty(specialty)
          )
        );
        
        // Combine results and remove duplicates
        const combinedResults = specialtyResults.flat();
        const uniqueResults = combinedResults.filter((vet, index, self) => 
          self.findIndex(v => v.id === vet.id) === index
        );
        
        filtered = uniqueResults;
      } catch (error) {
        console.error('Error filtering by specialty:', error);
        // Fallback to local filtering
        filtered = filtered.filter(vet =>
          vet.specialties.some(specialty =>
            filters.specialties.includes(specialty)
          )
        );
      } finally {
        setSearchLoading(false);
      }
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(vet => vet.rating >= filters.rating);
    }

    // Available today filter
    if (filters.availableToday) {
      filtered = filtered.filter(vet =>
        vet.availableSlots.some(slot => slot.isAvailable)
      );
    }

    // Apply proximity filtering if location is available and radius filter is set
    if (userLocation && filters.radius > 0) {
      const vetsWithClinics = filtered
        .map(vet => ({
          vet,
          clinic: clinics[vet.clinic_id]
        }))
        .filter(item => item.clinic?.coordinates);

      const nearbyVets = vetsWithClinics
        .map(item => ({
          ...item.vet,
          distance: calculateDistance(item.clinic!)
        }))
        .filter(vet => vet.distance <= filters.radius)
        .map(vet => {
          const { distance, ...vetData } = vet;
          return vetData;
        });

      filtered = nearbyVets;
    }

    // Sort by distance if location available, otherwise by rating
    filtered.sort((a, b) => {
      if (userLocation) {
        const clinicA = clinics[a.clinic_id];
        const clinicB = clinics[b.clinic_id];
        
        if (clinicA?.coordinates && clinicB?.coordinates) {
          const distanceA = calculateDistance(clinicA);
          const distanceB = calculateDistance(clinicB);
          
          // Primary sort by distance
          if (Math.abs(distanceA - distanceB) > 0.1) { // Only if distance difference is significant
            return distanceA - distanceB;
          }
        }
      }
      
      // Secondary sort by rating
      return b.rating - a.rating;
    });

    setFilteredVets(filtered);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVeterinarians();
    setRefreshing(false);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setFilteredVets(veterinarians);
      return;
    }

    setSearchLoading(true);
    try {
      const searchResults = await supabaseVetService.searchVeterinarians(query);
      setFilteredVets(searchResults);
    } catch (error) {
      console.error('Error searching veterinarians:', error);
      // Fallback to local filtering
      const filtered = veterinarians.filter(vet =>
        vet.name.toLowerCase().includes(query.toLowerCase()) ||
        vet.specialties.some(specialty =>
          specialty.toLowerCase().includes(query.toLowerCase())
        )
      );
      setFilteredVets(filtered);
    } finally {
      setSearchLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      radius: 25,
      specialties: [],
      services: [],
      rating: 0,
      availableToday: false,
      openNow: false,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.specialties.length > 0) count++;
    if (filters.rating > 0) count++;
    if (filters.availableToday) count++;
    if (filters.openNow) count++;
    if (userLocation && filters.radius < 25) count++; // Count radius as active filter if changed from default
    return count;
  };

  const toggleSpecialty = (specialty: string) => {
    setFilters(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const [clinics, setClinics] = useState<{[id: string]: Clinic}>({});


  // Load clinics data
  const loadClinics = async () => {
    try {
      const allClinics = await supabaseClinicService.getAllClinics();
      const clinicsMap = allClinics.reduce((acc, clinic) => {
        acc[clinic.id] = clinic;
        return acc;
      }, {} as {[id: string]: Clinic});
      setClinics(clinicsMap);
    } catch (error) {
      console.error('Error loading clinics:', error);
    }
  };

  const renderVetCard = ({ item }: { item: Veterinarian }) => {
    const clinic = clinics[item.clinic_id];
    const distance = userLocation && clinic ? calculateDistance(clinic) : undefined;

    return (
      <VetCard
        veterinarian={item}
        clinic={clinic}
        distance={distance}
        onPress={() => navigation.navigate('VetProfile', { veterinarianId: item.id })}
        onBookAppointment={() => navigation.navigate('BookAppointment', {
          veterinarianId: item.id,
          clinicId: item.clinic_id
        })}
      />
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center py-20">
      <Ionicons name="search" size={64} color="#d1d5db" />
      <Text className="text-xl font-semibold text-gray-900 mt-4">
        No veterinarians found
      </Text>
      <Text className="text-gray-600 mt-2 text-center px-8">
        Try adjusting your search criteria or filters to find more results.
      </Text>
      <TouchableOpacity
        onPress={resetFilters}
        className="bg-blue-600 px-6 py-3 rounded-lg mt-4"
      >
        <Text className="text-white font-medium">Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!loading && !searchLoading) return null;
    
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-center text-gray-600 mt-2">
          {searchLoading ? 'Searching...' : 'Loading...'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">Find Veterinarians</Text>
            {locationPermissionGranted && userLocation && (
              <Text className="text-sm text-green-600 mt-1">
                📍 {userLocation.city ? `${userLocation.city}, ${userLocation.state}` : 'Location enabled'}
              </Text>
            )}
          </View>
          
          {!locationPermissionGranted ? (
            <TouchableOpacity
              onPress={requestLocationPermission}
              className="bg-blue-50 px-3 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="location" size={16} color="#3b82f6" />
              <Text className="text-blue-600 ml-1 text-sm font-medium">Enable</Text>
            </TouchableOpacity>
          ) : userLocation && (
            <TouchableOpacity
              onPress={() => locationService.clearLocationCache()}
              className="bg-green-50 px-3 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-green-600 ml-1 text-sm font-medium">Located</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center">
          <View className="flex-1 bg-gray-100 rounded-lg px-4 py-3 flex-row items-center">
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900"
              accessibilityLabel="Search veterinarians"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="bg-blue-600 p-3 rounded-lg relative ml-3"
          >
            <Ionicons name="filter" size={20} color="white" />
            {getActiveFilterCount() > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {getActiveFilterCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        {(filters.specialties.length > 0 || filters.rating > 0 || filters.availableToday || (userLocation && filters.radius < 25)) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            <View className="flex-row">
              {userLocation && filters.radius < 25 && (
                <View className="bg-purple-100 px-3 py-1 rounded-full mr-2">
                  <Text className="text-purple-800 text-sm">Within {filters.radius} mi</Text>
                </View>
              )}
              {filters.specialties.map(specialty => (
                <View key={specialty} className="bg-blue-100 px-3 py-1 rounded-full mr-2">
                  <Text className="text-blue-800 text-sm">{specialty}</Text>
                </View>
              ))}
              {filters.rating > 0 && (
                <View className="bg-yellow-100 px-3 py-1 rounded-full mr-2">
                  <Text className="text-yellow-800 text-sm">{filters.rating}+ stars</Text>
                </View>
              )}
              {filters.availableToday && (
                <View className="bg-green-100 px-3 py-1 rounded-full mr-2">
                  <Text className="text-green-800 text-sm">Available Today</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Vet List */}
      <FlatList
        data={filteredVets}
        renderItem={renderVetCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
          />
        }
        onEndReached={undefined}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ListFooterComponent={renderLoadingFooter}
        contentContainerStyle={filteredVets.length === 0 ? { flex: 1 } : { paddingVertical: 8 }}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Filters</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text className="text-blue-600 font-medium">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Specialties */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Specialties</Text>
              <View className="flex-row flex-wrap">
                {specialties.map(specialty => (
                  <TouchableOpacity
                    key={specialty}
                    onPress={() => toggleSpecialty(specialty)}
                    className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                      filters.specialties.includes(specialty)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text className={`${
                      filters.specialties.includes(specialty)
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}>
                      {specialty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rating */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Minimum Rating</Text>
              <View className="flex-row">
                {[4.0, 4.5, 4.8].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      rating: prev.rating === rating ? 0 : rating 
                    }))}
                    className={`px-4 py-2 rounded-lg border flex-row items-center mr-3 ${
                      filters.rating === rating
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Ionicons name="star" size={16} color="#fbbf24" />
                    <Text className="ml-1 text-gray-700">{rating}+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance/Radius Filter */}
            {userLocation && locationPermissionGranted && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Distance Range
                </Text>
                <Text className="text-sm text-gray-600 mb-3">
                  Show vets within {filters.radius} miles
                </Text>
                <View className="flex-row flex-wrap">
                  {[5, 10, 15, 25, 50].map(radius => (
                    <TouchableOpacity
                      key={radius}
                      onPress={() => setFilters(prev => ({ 
                        ...prev, 
                        radius 
                      }))}
                      className={`mr-3 mb-3 px-4 py-2 rounded-lg border flex-row items-center ${
                        filters.radius === radius
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Ionicons 
                        name="location" 
                        size={16} 
                        color={filters.radius === radius ? 'white' : '#6b7280'} 
                      />
                      <Text className={`ml-2 ${
                        filters.radius === radius
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}>
                        {radius} mi
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Availability */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Availability</Text>
              <TouchableOpacity
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  availableToday: !prev.availableToday 
                }))}
                className={`p-4 rounded-lg border flex-row items-center justify-between ${
                  filters.availableToday
                    ? 'bg-green-50 border-green-300'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text className="text-gray-700">Available Today</Text>
                <View className={`w-6 h-6 rounded-full border-2 ${
                  filters.availableToday
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-300'
                }`}>
                  {filters.availableToday && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="p-4 border-t border-gray-100">
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              className="bg-blue-600 py-4 rounded-lg"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Apply Filters ({filteredVets.length} results)
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default VetListScreen;