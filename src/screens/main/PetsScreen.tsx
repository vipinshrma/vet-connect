import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LoadingScreen from '../../components/LoadingScreen';
import PetCard from '../../components/PetCard';
import { supabase } from '../../config/supabase';
import { AppDispatch, RootState } from '../../store';
import { fetchUserPets } from '../../store/slices/petSlice';
import { Pet, RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PetsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { pets, isLoading, error } = useSelector((state: RootState) => state.pets);
  
  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isHealthPickerVisible, setHealthPickerVisible] = useState(false);

  // Check auth and load pets on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error || !currentUser) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
        return;
      }
      
      // Load pets if user is authenticated
      if (currentUser.id) {
        dispatch(fetchUserPets(currentUser.id));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } finally {
      setAuthChecked(true);
    }
  };

  // Automatically refetch pets when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id && authChecked) {
        dispatch(fetchUserPets(user.id));
      }
    }, [user?.id, authChecked, dispatch])
  );

  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchUserPets(user.id)).unwrap();
    } catch (error) {
      console.error('Error refreshing pets:', error);
      Alert.alert('Error', 'Failed to refresh pets. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id, dispatch]);

  const handleAddPet = useCallback(() => {
    navigation.navigate('PetProfile' as any);
  }, [navigation]);

  const handleBookAppointment = useCallback(() => {
    navigation.navigate('VetList', { bookingMode: true });
  }, [navigation]);

  const handlePetPress = useCallback((pet: Pet) => {
    navigation.navigate('PetProfile' as any, { petId: pet.id });
  }, [navigation]);

  const handleEditPet = useCallback((pet: Pet) => {
    navigation.navigate('PetProfile' as any, { petId: pet.id });
  }, [navigation]);

  const handleHealthRecords = useCallback(() => {
    if (pets.length === 0) {
      Alert.alert('Add a pet first', 'Once you register a pet, you can view their health records here.');
      return;
    }

    if (pets.length === 1) {
      navigation.navigate('PetHealth' as any, { petId: pets[0].id });
      return;
    }

    setHealthPickerVisible(true);
  }, [navigation, pets]);

  const handleSelectHealthPet = useCallback((petId: string) => {
    setHealthPickerVisible(false);
    navigation.navigate('PetHealth' as any, { petId });
  }, [navigation]);

  // Show error alert when there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', 'Failed to load pets. Please try again.');
    }
  }, [error]);

  if (!authChecked || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">My Pets</Text>
            <Text className="text-gray-600 mt-1">
              {pets.length} {pets.length === 1 ? 'pet' : 'pets'} registered
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAddPet}
            className="bg-blue-600 rounded-full p-3"
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {pets.length === 0 ? (
          // Empty State
          <View className="flex-1 items-center justify-center px-6 py-20">
            <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6">
              <Ionicons name="paw-outline" size={40} color="#3B82F6" />
            </View>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              No Pets Added Yet
            </Text>
            <Text className="text-gray-600 text-center mb-8 leading-6">
              Add your first pet to start managing their health records and booking appointments.
            </Text>
            <TouchableOpacity
              onPress={handleAddPet}
              className="bg-blue-600 px-8 py-4 rounded-xl flex-row items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Add Your First Pet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Pet List
          <View className="px-6 py-6">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onPress={() => handlePetPress(pet)}
                onEdit={() => handleEditPet(pet)}
              />
            ))}
            
            {/* Add Another Pet Button */}
            {/* <TouchableOpacity
              onPress={handleAddPet}
              className="bg-white rounded-xl p-6 mb-4 border-2 border-dashed border-gray-200 items-center"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-3">
                <Ionicons name="add" size={20} color="#3B82F6" />
              </View>
              <Text className="text-blue-600 font-medium">Add Another Pet</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Manage multiple pets in one place
              </Text>
            </TouchableOpacity> */}
          </View>
        )}
      </ScrollView>

      {/* Quick Actions Footer (if pets exist) */}
      {pets.length > 0 && (
        <View className="bg-white px-6 py-4 border-t border-gray-100">
          <View className="flex-row space-x-4">
            <TouchableOpacity
              className="flex-1 bg-blue-50 py-3 rounded-lg flex-row items-center justify-center"
              activeOpacity={0.7}
              onPress={handleBookAppointment}
            >
              <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
              <Text className="text-blue-600 font-medium ml-2">Book Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-green-50 py-3 rounded-lg flex-row items-center justify-center ml-2"
              activeOpacity={0.7}
              onPress={handleHealthRecords}
            >
              <Ionicons name="medical-outline" size={18} color="#10B981" />
              <Text className="text-green-600 font-medium ml-2">Health Records</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={isHealthPickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setHealthPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => setHealthPickerVisible(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <Text className="text-lg font-semibold text-gray-900">View health records</Text>
            <Text className="text-sm text-gray-500 mt-1">Select a pet to open their health timeline</Text>
            <View className="mt-5">
              {pets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  className="py-4 border-b border-gray-100 flex-row items-center justify-between"
                  onPress={() => handleSelectHealthPet(pet.id)}
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-medium text-gray-900">{pet.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              className="mt-4 w-full py-3 rounded-2xl bg-gray-100"
              onPress={() => setHealthPickerVisible(false)}
              activeOpacity={0.7}
            >
              <Text className="text-center font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PetsScreen;
