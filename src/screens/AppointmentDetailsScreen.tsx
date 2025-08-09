import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { AppDispatch, RootState } from '../store';
import { cancelAppointment } from '../store/slices/appointmentSlice';
import { Appointment, RootStackParamList } from '../types';

type AppointmentDetailsScreenRouteProp = RouteProp<RootStackParamList, 'AppointmentDetails'>;
type AppointmentDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  route: AppointmentDetailsScreenRouteProp;
}

const AppointmentDetailsScreen: React.FC<Props> = ({ route }) => {
  const { appointmentId } = route.params;
  const navigation = useNavigation<AppointmentDetailsNavigationProp>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await supabaseAppointmentService.getAppointmentById(appointmentId, user?.id);
        if (!isMounted) return;
        setAppointment(data);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load appointment');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [appointmentId, user?.id]);

  useEffect(() => {
    if (!loading && appointment) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [loading, appointment, fadeAnim]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading appointment...</Text>
      </View>
    );
  }

  if (error || !appointment) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg font-semibold">Unable to load appointment</Text>
        <Text className="text-gray-600 mt-2">{error || 'Appointment not found'}</Text>
      </View>
    );
  }

  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const getStatusStyles = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return { container: 'bg-blue-50', text: 'text-blue-700' };
      case 'confirmed':
        return { container: 'bg-green-50', text: 'text-green-700' };
      case 'in-progress':
        return { container: 'bg-yellow-50', text: 'text-yellow-700' };
      case 'completed':
        return { container: 'bg-gray-100', text: 'text-gray-700' };
      case 'cancelled':
        return { container: 'bg-red-50', text: 'text-red-700' };
      default:
        return { container: 'bg-gray-100', text: 'text-gray-700' };
    }
  };
  const statusStyles = getStatusStyles(appointment.status);

  const viewerIsOwner = user?.id && appointment.ownerId === user.id;
  const viewerIsVet = user?.id && appointment.veterinarianId === user.id;
  const canCancel = ['scheduled', 'confirmed'].includes(appointment.status) && (viewerIsOwner || viewerIsVet);

  const onCancelPress = () => {
    if (!user?.id || !appointment) return;
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelAppointment({ appointmentId: appointment.id, userId: user.id })).unwrap();
              setAppointment(prev => (prev ? { ...prev, status: 'cancelled' } as Appointment : prev));
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 28 + Math.max(insets.bottom, 16) + (canCancel ? 56 : 0) }}
          accessibilityLabel="Appointment details"
        >
      {/* Header Card with Pet and Vet */}
      <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm relative">
        <View className="flex-row items-start">
          <Image
            source={{
              uri:
                appointment.pet?.photoURL ||
                'https://via.placeholder.com/96x96?text=Pet',
            }}
            className="w-24 h-24 rounded-2xl mr-4"
            accessibilityLabel={appointment.pet?.name ? `${appointment.pet.name} photo` : 'Pet photo'}
          />
          <View className="flex-1 min-w-0">
            <Text className="text-2xl font-semibold text-gray-900" numberOfLines={2}>
              {appointment.pet?.name || 'Pet'}
            </Text>
            <Text className="text-gray-600 mt-1 capitalize leading-6" numberOfLines={1}>
              {appointment.pet?.species || 'pet'}{appointment.pet?.breed ? ` • ${appointment.pet.breed}` : ''}
            </Text>

            {/* Time block split into two lines for better readability */}
            <View className="mt-3">
              <Text className="text-gray-700 leading-6">
                {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })},
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text className="text-gray-700 ml-1 leading-6">
                  {new Date(appointment.date).getFullYear()} • {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
                </Text>
              </View>
            </View>

            {/* Vet inline */}
            <View className="flex-row items-center mt-4">
              <Image
                source={{
                  uri:
                    appointment.veterinarian?.photoURL ||
                    'https://via.placeholder.com/40x40?text=Dr',
                }}
                className="w-10 h-10 rounded-full mr-3"
                accessibilityLabel={appointment.veterinarian?.name ? `Dr. ${appointment.veterinarian.name} photo` : 'Veterinarian photo'}
              />
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">
                  {appointment.veterinarian ? `Dr. ${appointment.veterinarian.name}` : 'Veterinarian'}
                </Text>
                <Text className="text-gray-600 text-sm leading-6">
                  {appointment.veterinarian?.specialties?.[0] || 'General Practice'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Status pill absolute to avoid shifting layout */}
        <View className={`px-2 py-1 rounded-full absolute right-4 top-4 ${statusStyles.container}`}> 
          <Text className={`text-xs font-medium capitalize ${statusStyles.text}`}>{appointment.status}</Text>
        </View>
      </View>

      {/* Reason */}
      <View className="bg-gray-50 rounded-2xl p-5 mb-5">
        <View className="flex-row items-center mb-1">
          <Ionicons name="medical-outline" size={18} color="#334155" />
          <Text className="text-base text-gray-800 font-medium ml-2">Reason</Text>
        </View>
        <Text className="text-gray-700 mt-1 leading-7">{appointment.reason}</Text>
      </View>

      {appointment.notes ? (
        <View className="bg-gray-50 rounded-2xl p-5 mb-5">
          <View className="flex-row items-center mb-1">
            <Ionicons name="document-text-outline" size={18} color="#334155" />
            <Text className="text-base text-gray-800 font-medium ml-2">Notes</Text>
          </View>
          <Text className="text-gray-700 mt-1 leading-7">{appointment.notes}</Text>
        </View>
      ) : null}

      {appointment.cost !== undefined ? (
        <View className="bg-gray-50 rounded-2xl p-5 mb-5">
          <View className="flex-row items-center mb-1">
            <Ionicons name="cash-outline" size={18} color="#334155" />
            <Text className="text-base text-gray-800 font-medium ml-2">Cost</Text>
          </View>
          <Text className="text-gray-700 mt-1 leading-7">${appointment.cost.toFixed(2)}</Text>
        </View>
      ) : null}

      <View className="bg-gray-50 rounded-2xl p-5 mb-5">
        <View className="flex-row items-center mb-1">
          <Ionicons name="paw-outline" size={18} color="#334155" />
          <Text className="text-base text-gray-800 font-medium ml-2">Pet</Text>
        </View>
        <View className="flex-row items-center mt-3">
          <Image
            source={{
              uri:
                appointment.pet?.photoURL ||
                'https://via.placeholder.com/48x48?text=Pet',
            }}
            className="w-12 h-12 rounded-lg mr-3"
          />
          <View>
            {appointment.pet ? (
              <>
                <Text className="text-gray-900 font-medium">{appointment.pet.name}</Text>
                <Text className="text-gray-600 capitalize leading-7">{appointment.pet.species}{appointment.pet.breed ? ` • ${appointment.pet.breed}` : ''}</Text>
              </>
            ) : (
              <Text className="text-gray-700">ID: {appointment.petId}</Text>
            )}
          </View>
        </View>
      </View>

      <View className="bg-gray-50 rounded-2xl p-5 mb-5">
        <View className="flex-row items-center mb-1">
          <Ionicons name="medkit-outline" size={18} color="#334155" />
          <Text className="text-base text-gray-800 font-medium ml-2">Veterinarian</Text>
        </View>
        <View className="flex-row items-center mt-3">
          <Image
            source={{
              uri:
                appointment.veterinarian?.photoURL ||
                'https://via.placeholder.com/40x40?text=Dr',
            }}
            className="w-10 h-10 rounded-full mr-3"
          />
          <View className="flex-1">
            {appointment.veterinarian ? (
              <>
                <Text className="text-gray-900 font-medium">Dr. {appointment.veterinarian.name}</Text>
                <Text className="text-gray-600 leading-7">{appointment.veterinarian.specialties?.[0] || 'General Practice'}</Text>
              </>
            ) : (
              <Text className="text-gray-700">ID: {appointment.veterinarianId}</Text>
            )}
            <Text className="text-gray-600 mt-2 leading-7">Clinic: {appointment.clinicId}</Text>
          </View>
        </View>
      </View>
        </ScrollView>
      </Animated.View>

      {canCancel ? (
        <View
          className="bg-white border-t border-gray-200 px-5"
          style={{ paddingBottom: Math.max(insets.bottom, 12), paddingTop: 12 }}
          accessibilityRole="toolbar"
          accessibilityLabel="Appointment actions"
        >
          <View className="flex-row">
            <View className="flex-1 mr-3">
              <View className="rounded-xl overflow-hidden">
                <Text
                  onPress={onCancelPress}
                  className="text-center bg-red-600 text-white py-3 text-base font-medium"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel appointment"
                  accessibilityHint="Double tap to cancel this appointment"
                >
                  Cancel Appointment
                </Text>
              </View>
            </View>
            <View className="flex-1">
              <View className="rounded-xl overflow-hidden">
                <Text
                  onPress={() => navigation.navigate('RescheduleAppointment', { appointmentId: appointment.id })}
                  className="text-center bg-blue-600 text-white py-3 text-base font-medium"
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule appointment"
                  accessibilityHint="Double tap to reschedule this appointment"
                >
                  Reschedule
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default AppointmentDetailsScreen;