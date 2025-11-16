import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { supabasePetService } from '../../services/supabasePetService';
import { supabaseVetService } from '../../services/supabaseVetService';
import { AppDispatch, RootState } from '../../store';
import { cancelAppointment, fetchUserAppointments, fetchVeterinarianAppointments } from '../../store/slices/appointmentSlice';
import { Appointment, Pet, RootStackParamList, Veterinarian } from '../../types';

interface AppointmentWithDetails extends Appointment {
  veterinarian?: Veterinarian;
  pet?: Pet;
}

type AppointmentFilter = 'all' | 'upcoming' | 'past';

const AppointmentsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);
  const { appointments, isLoading, error } = useSelector((state: RootState) => state.appointments);
  
  const user = authState.user;
  
  const [appointmentsWithDetails, setAppointmentsWithDetails] = useState<AppointmentWithDetails[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [filter, setFilter] = useState<AppointmentFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const isVeterinarian = user?.userType === 'veterinarian';
  const screenTitle = isVeterinarian ? 'My Schedule' : 'My Appointments';

  // Filter and sort appointments - latest first
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = appointmentsWithDetails.filter(appointment => {
      // For veterinarians, ensure appointment belongs to logged-in vet
      if (isVeterinarian && user?.id) {
        if (appointment.veterinarianId !== user.id) {
          return false;
        }
      }

      // Handle both Date objects and ISO strings
      const appointmentDate = appointment.date instanceof Date 
        ? appointment.date 
        : new Date(appointment.date as any);
      const appointmentDateTime = new Date(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth(),
        appointmentDate.getDate()
      );

      switch (filter) {
        case 'upcoming':
          return (
            appointmentDateTime >= today &&
            ['scheduled', 'confirmed'].includes(appointment.status)
          );
        case 'past':
          return (
            appointmentDateTime < today ||
            ['completed', 'cancelled'].includes(appointment.status)
          );
        default:
          return true;
      }
    });

    // Sort appointments: latest first (by date and time)
    return filtered.sort((a, b) => {
      // Handle both Date objects and ISO strings
      const dateA = a.date instanceof Date ? a.date : new Date(a.date as any);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date as any);
      
      // Parse start times for comparison
      const timeA = a.timeSlot?.startTime || '00:00';
      const timeB = b.timeSlot?.startTime || '00:00';
      
      const [hoursA, minutesA] = timeA.split(':').map(Number);
      const [hoursB, minutesB] = timeB.split(':').map(Number);
      
      // Create full datetime for comparison
      const fullDateA = new Date(dateA);
      fullDateA.setHours(hoursA, minutesA, 0, 0);
      
      const fullDateB = new Date(dateB);
      fullDateB.setHours(hoursB, minutesB, 0, 0);
      
      // Sort in descending order (latest/newest first)
      return fullDateB.getTime() - fullDateA.getTime();
    });
  }, [appointmentsWithDetails, filter, isVeterinarian, user?.id]);
  

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!user?.id) return;

    try {
      if (isVeterinarian) {
        await dispatch(fetchVeterinarianAppointments(user.id)).unwrap();
      } else {
        await dispatch(fetchUserAppointments(user.id)).unwrap();
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  }, [dispatch, user?.id, isVeterinarian]);

  // Load additional details for appointments (vet info, pet info)
  const loadAppointmentDetails = useCallback(async (appointmentsList: Appointment[]) => {
    if (appointmentsList.length === 0) return;

    setIsLoadingDetails(true);
    try {
      const appointmentsWithDetailsPromises = appointmentsList.map(async (appointment) => {
        try {
          const [veterinarian, pet] = await Promise.all([
            isVeterinarian ? null : supabaseVetService.getVeterinarianById(appointment.veterinarianId),
            supabasePetService.getPetDetails(appointment.petId),
          ]);

          return {
            ...appointment,
            veterinarian: veterinarian || undefined,
            pet: pet || undefined,
          } as AppointmentWithDetails;
        } catch (error) {
          console.error('Failed to load details for appointment:', appointment.id, error);
          return appointment as AppointmentWithDetails;
        }
      });

      const appointmentsWithDetails = await Promise.all(appointmentsWithDetailsPromises);
      setAppointmentsWithDetails(appointmentsWithDetails);
    } catch (error) {
      console.error('Failed to load appointment details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [isVeterinarian]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  }, [loadAppointments]);

  // Cancel appointment handler
  const handleCancelAppointment = useCallback(async (appointmentId: string, appointmentDate: Date) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) {
              Alert.alert('Error', 'User not authenticated');
              return;
            }
            try {
              await dispatch(cancelAppointment({ appointmentId, userId: user.id })).unwrap();
              await loadAppointments();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          },
        },
      ]
    );
  }, [dispatch, loadAppointments, user?.id]);

  // Load appointments on component mount and when user changes
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Load appointment details when appointments change
  useEffect(() => {
    if (appointments.length > 0) {
      loadAppointmentDetails(appointments);
    } else {
      setAppointmentsWithDetails([]);
    }
  }, [appointments, loadAppointmentDetails]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-2">Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900" accessibilityRole="header">
          {screenTitle}
        </Text>
        
        {/* Filter Tabs */}
        <View className="flex-row mt-4">
          {(['all', 'upcoming', 'past'] as AppointmentFilter[]).map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              onPress={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg mr-2 ${
                filter === filterOption
                  ? 'bg-blue-600'
                  : 'bg-gray-100'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === filterOption }}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  filter === filterOption ? 'text-white' : 'text-gray-700'
                }`}
              >
                {filterOption === 'all' ? 'All' : filterOption}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-red-600 text-lg font-semibold mt-2 text-center">
            Failed to load appointments
          </Text>
          <Text className="text-gray-600 text-center mt-1">{error}</Text>
          <TouchableOpacity
            onPress={loadAppointments}
            className="bg-blue-600 px-6 py-3 rounded-lg mt-4"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredAppointments.length === 0 && !isLoadingDetails ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 text-lg font-medium mt-4 text-center">
            {filter === 'upcoming' ? 'No upcoming appointments' :
             filter === 'past' ? 'No past appointments' :
             'No appointments yet'}
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            {isVeterinarian
              ? 'Your schedule will appear here when patients book appointments.'
              : filter === 'upcoming'
                ? 'Book an appointment with a veterinarian to get started.'
                : 'Your appointment history will appear here.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          }
        >
          <View className="py-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isVeterinarian={isVeterinarian}
                onCancel={handleCancelAppointment}
              />
            ))}
            
            {isLoadingDetails && (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-gray-500 text-sm mt-2">Loading details...</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// AppointmentCard Component
interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  isVeterinarian: boolean;
  onCancel: (appointmentId: string, date: Date) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  isVeterinarian,
  onCancel,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const canCancel = ['scheduled', 'confirmed'].includes(appointment.status);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const statusColors = getStatusColor(appointment.status);

  const formatDateTime = (date: Date | string, timeSlot: { startTime: string; endTime: string }) => {
    // Handle both Date objects and ISO strings
    const appointmentDate = date instanceof Date ? date : new Date(date as any);
    const dateStr = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr} • ${timeSlot.startTime} - ${timeSlot.endTime}`;
  };

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('AppointmentDetails', { appointmentId: appointment.id })
      }
      accessibilityRole="button"
      accessibilityLabel="Open appointment details"
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start">
        {/* Avatar */}
        <View className="mr-3">
          {isVeterinarian && appointment.pet ? (
            <Image
              source={{
                uri: appointment.pet.photoURL || 'https://via.placeholder.com/48x48?text=Pet'
              }}
              className="w-12 h-12 rounded-xl"
              accessibilityLabel={`Photo of ${appointment.pet.name}`}
            />
          ) : (!isVeterinarian && appointment.veterinarian) ? (
            <Image
              source={{
                uri: appointment.veterinarian.photoURL || 'https://via.placeholder.com/48x48?text=Dr'
              }}
              className="w-12 h-12 rounded-xl"
              accessibilityLabel={`Photo of Dr. ${appointment.veterinarian.name}`}
            />
          ) : (
            <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center">
              <Ionicons
                name={isVeterinarian ? 'paw' : 'medical'}
                size={24}
                color="#6b7280"
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Title and Status */}
          <View className="flex-row items-start justify-between mb-1">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {isVeterinarian
                  ? appointment.pet?.name || 'Pet'
                  : appointment.veterinarian?.name || 'Dr. Veterinarian'}
              </Text>
              {isVeterinarian && appointment.pet && (
                <Text className="text-sm text-gray-600 capitalize">
                  {appointment.pet.species} • {appointment.pet.breed}
                </Text>
              )}
              {!isVeterinarian && appointment.veterinarian && (
                <Text className="text-sm text-blue-600">
                  {appointment.veterinarian.specialties?.[0] || 'General Practice'}
                </Text>
              )}
            </View>
            
            <View className={`px-2 py-1 rounded-lg ${statusColors}`}>
              <Text className={`text-xs font-medium capitalize ${statusColors.split(' ')[0]}`}>
                {appointment.status}
              </Text>
            </View>
          </View>

          {/* Date and Time */}
          <View className="flex-row items-center mb-2">
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {formatDateTime(
                appointment.date instanceof Date ? appointment.date : new Date(appointment.date as any),
                appointment.timeSlot
              )}
            </Text>
          </View>

          {/* Reason */}
          <View className="flex-row items-center mb-3">
            <Ionicons name="medical-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1 flex-1">
              {appointment.reason}
            </Text>
          </View>

          {/* Actions */}
          {canCancel && (
            <View className="flex-row">
              <TouchableOpacity
                onPress={(e: GestureResponderEvent) => {
                  e.stopPropagation();
                  const appointmentDate = appointment.date instanceof Date 
                    ? appointment.date 
                    : new Date(appointment.date as any);
                  onCancel(appointment.id, appointmentDate);
                }}
                className="bg-red-50 px-3 py-2 rounded-lg flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Cancel appointment"
              >
                <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                <Text className="text-red-600 text-sm font-medium ml-1">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        </View>
    </TouchableOpacity>
  );
};

export default AppointmentsScreen;