import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, Linking, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../config/supabase';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { supabaseClinicService } from '../services/supabaseClinicService';
import { AppDispatch, RootState } from '../store';
import { acceptAppointment, cancelAppointment, declineAppointment } from '../store/slices/appointmentSlice';
import { Appointment, Clinic, RootStackParamList } from '../types';
import { isNewAppointment } from '../utils/dateSerialization';
import { openLocationInMaps } from '../utils/mapsUtils';

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
  const [owner, setOwner] = useState<{ id: string; name: string; email: string; phone?: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [petImageError, setPetImageError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadAppointmentData = React.useCallback(async () => {
      try {
        setLoading(true);
      setError(null);
        const data = await supabaseAppointmentService.getAppointmentById(appointmentId, user?.id);
      if (!data) {
        setError('Appointment not found');
        return;
      }
      
        setAppointment(data);
      
      // Load owner info if viewer is vet
      if (data && user?.id === data.veterinarianId && data.ownerId) {
        try {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('id, name, email, phone')
            .eq('id', data.ownerId)
            .single();
          
          if (ownerProfile) {
            const profile = ownerProfile as any;
            setOwner({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone || undefined,
            });
          }
        } catch (error) {
          console.error('Failed to load owner profile:', error);
        }
      }

      // Load clinic data if available
      if (data && data.clinicId) {
        try {
          const clinicData = await supabaseClinicService.getClinicById(data.clinicId);
          if (clinicData) {
            setClinic(clinicData);
          }
        } catch (error) {
          console.error('Failed to load clinic data:', error);
        }
      }

      // Set notes text for editing
      if (data && data.notes) {
        setNotesText(data.notes);
      } else {
        setNotesText('');
      }

      // Reset image error when appointment changes
      setPetImageError(false);
      } catch (e: any) {
        setError(e?.message || 'Failed to load appointment');
      } finally {
      setLoading(false);
      }
  }, [appointmentId, user?.id]);

  useEffect(() => {
    loadAppointmentData();
  }, [loadAppointmentData]);

  // Refresh when screen comes into focus (e.g., after accepting/declining from list)
  useFocusEffect(
    React.useCallback(() => {
      loadAppointmentData();
    }, [loadAppointmentData])
  );

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

  // Handle both Date objects and ISO strings from Redux
  const appointmentDate = appointment.date instanceof Date 
    ? appointment.date 
    : new Date(appointment.date as any);
  const dateStr = appointmentDate.toLocaleDateString('en-US', {
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
  const isPending = appointment.status === 'scheduled' && viewerIsVet;
  const isConfirmed = appointment.status === 'confirmed' && viewerIsVet;
  const isNew = isPending && isNewAppointment(appointment.date, 7);
  const canAccept = isPending && user?.id;
  const canDecline = isPending && user?.id;
  const canStart = isConfirmed && user?.id;
  const canAddNotes = viewerIsVet && ['scheduled', 'confirmed'].includes(appointment.status);

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
              setProcessing(true);
              await dispatch(cancelAppointment({ appointmentId: appointment.id, userId: user.id })).unwrap();
              setAppointment(prev => (prev ? { ...prev, status: 'cancelled' } as Appointment : prev));
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const onAcceptPress = async () => {
    if (!user?.id || !appointment) return;
    Alert.alert(
      'Accept Appointment',
      'Are you sure you want to accept this appointment? The pet owner will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setProcessing(true);
              const updated = await dispatch(acceptAppointment({ appointmentId: appointment.id, vetId: user.id })).unwrap();
              setAppointment(updated);
              Alert.alert('Success', 'Appointment accepted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to accept appointment. Please try again.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const onDeclinePress = async () => {
    if (!user?.id || !appointment) return;
    Alert.alert(
      'Decline Appointment',
      'Are you sure you want to decline this appointment? The pet owner will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const updated = await dispatch(declineAppointment({ appointmentId: appointment.id, vetId: user.id })).unwrap();
              setAppointment(updated);
              Alert.alert('Success', 'Appointment declined. The pet owner has been notified.');
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to decline appointment. Please try again.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleCallOwner = () => {
    if (owner?.phone) {
      Linking.openURL(`tel:${owner.phone}`);
    } else {
      Alert.alert('No Phone Number', 'Phone number is not available for this owner.');
    }
  };

  const handleMessageOwner = () => {
    if (owner?.phone) {
      Linking.openURL(`sms:${owner.phone}`);
    } else if (owner?.email) {
      Linking.openURL(`mailto:${owner.email}`);
    } else {
      Alert.alert('No Contact', 'Contact information is not available for this owner.');
    }
  };

  const handleStartAppointment = async () => {
    if (!user?.id || !appointment) return;
    
    Alert.alert(
      'Start Appointment',
      'Are you sure you want to start this appointment? The status will change to "in-progress".',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              setProcessing(true);
              const updated = await supabaseAppointmentService.startAppointment(appointment.id, user.id);
              setAppointment(updated);
              Alert.alert('Success', 'Appointment started successfully!');
              // Navigate to in-progress screen (Phase 3)
              // navigation.navigate('AppointmentInProgress', { appointmentId: appointment.id });
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to start appointment. Please try again.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleViewPetHealth = () => {
    if (appointment?.petId) {
      navigation.navigate('PetHealth', { petId: appointment.petId });
    }
  };

  const handleViewLocation = () => {
    if (clinic && clinic.latitude && clinic.longitude) {
      openLocationInMaps(
        clinic.latitude,
        clinic.longitude,
        clinic.name,
        `${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.zip_code}`
      );
    } else {
      Alert.alert('Location Unavailable', 'Clinic location information is not available.');
    }
  };

  const handleOpenNotesModal = () => {
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!user?.id || !appointment) return;
    
    try {
      setSavingNotes(true);
      const updated = await supabaseAppointmentService.updateAppointmentNotes(
        appointment.id,
        notesText,
        user.id
      );
      setAppointment(updated);
      setShowNotesModal(false);
      Alert.alert('Success', 'Pre-appointment notes saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCloseNotesModal = () => {
    // Reset notes text to current appointment notes
    if (appointment?.notes) {
      setNotesText(appointment.notes);
    } else {
      setNotesText('');
    }
    setShowNotesModal(false);
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
          {/* Pet Photo or Placeholder in Header */}
          <View className="w-24 h-24 rounded-2xl mr-4 bg-blue-50 items-center justify-center overflow-hidden">
            {appointment.pet?.photoURL && !petImageError ? (
              <Image
                source={{ uri: appointment.pet.photoURL }}
                className="w-24 h-24 rounded-2xl"
                resizeMode="cover"
                onError={() => setPetImageError(true)}
                accessibilityLabel={appointment.pet?.name ? `${appointment.pet.name} photo` : 'Pet photo'}
              />
            ) : (
              <Ionicons name="paw" size={40} color="#3B82F6" />
            )}
          </View>
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
                {appointmentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })},
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text className="text-gray-700 ml-1 leading-6">
                  {appointmentDate.getFullYear()} • {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
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
        {/* Status pill and NEW badge absolute to avoid shifting layout */}
        <View className="absolute right-4 top-4 flex-row items-center gap-2">
          {isNew && (
            <View className="bg-red-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">NEW</Text>
            </View>
          )}
          <View className={`px-2 py-1 rounded-full ${statusStyles.container}`}> 
          <Text className={`text-xs font-medium capitalize ${statusStyles.text}`}>{appointment.status}</Text>
          </View>
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

      {/* Pre-Appointment Notes (for veterinarians) */}
      {viewerIsVet && (appointment.notes || canAddNotes) ? (
        <View className="bg-gray-50 rounded-2xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <Ionicons name="document-text-outline" size={18} color="#334155" />
              <Text className="text-base text-gray-800 font-medium ml-2">Pre-Appointment Notes</Text>
            </View>
            {canAddNotes && (
              <TouchableOpacity
                onPress={handleOpenNotesModal}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Edit pre-appointment notes"
              >
                <Ionicons name={appointment.notes ? "create-outline" : "add-circle-outline"} size={18} color="#3b82f6" />
                <Text className="text-blue-600 text-sm font-medium ml-1">
                  {appointment.notes ? 'Edit' : 'Add Notes'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
      {appointment.notes ? (
            <Text className="text-gray-700 mt-1 leading-7">{appointment.notes}</Text>
          ) : (
            <Text className="text-gray-500 mt-1 italic">No notes added yet</Text>
          )}
        </View>
      ) : appointment.notes ? (
        // Show notes for owners (if any)
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
        <View className="flex-row items-center mb-3">
          <Ionicons name="paw-outline" size={18} color="#334155" />
          <Text className="text-base text-gray-800 font-medium ml-2">Pet Information</Text>
        </View>
        {appointment.pet ? (
          <View>
            <View className="flex-row items-start mb-4">
              {/* Pet Photo or Placeholder */}
              <View className="w-20 h-20 rounded-xl mr-4 bg-blue-50 items-center justify-center overflow-hidden">
                {appointment.pet.photoURL && !petImageError ? (
          <Image
                    source={{ uri: appointment.pet.photoURL }}
                    className="w-20 h-20 rounded-xl"
                    resizeMode="cover"
                    onError={() => setPetImageError(true)}
                    accessibilityLabel={`${appointment.pet.name} photo`}
                  />
                ) : (
                  <Ionicons name="paw" size={32} color="#3B82F6" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900 mb-1">
                  {appointment.pet.name}
                </Text>
                <View className="flex-row items-center flex-wrap gap-2 mb-2">
                  <View className="bg-white px-2.5 py-1 rounded-lg">
                    <Text className="text-sm text-gray-700 capitalize">
                      {appointment.pet.species}
                    </Text>
                  </View>
                  {appointment.pet.breed && (
                    <View className="bg-white px-2.5 py-1 rounded-lg">
                      <Text className="text-sm text-gray-700 capitalize">
                        {appointment.pet.breed}
                      </Text>
                    </View>
                  )}
                  {appointment.pet.gender && (
                    <View className="bg-white px-2.5 py-1 rounded-lg">
                      <Text className="text-sm text-gray-700 capitalize">
                        {appointment.pet.gender}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            {/* Detailed Information Grid */}
            <View className="border-t border-gray-200 pt-3">
              <View className="flex-row flex-wrap gap-4">
                {appointment.pet.age !== undefined && (
                  <View className="flex-1 min-w-[45%]">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-500 ml-1">Age</Text>
                    </View>
                    <Text className="text-base text-gray-900 font-medium">
                      {appointment.pet.age} {appointment.pet.age === 1 ? 'year' : 'years'} old
                    </Text>
                  </View>
                )}
                {appointment.pet.weight !== undefined && (
                  <View className="flex-1 min-w-[45%]">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="scale-outline" size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-500 ml-1">Weight</Text>
                    </View>
                    <Text className="text-base text-gray-900 font-medium">
                      {appointment.pet.weight} lbs
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="paw-outline" size={24} color="#9ca3af" />
            <Text className="text-gray-500 ml-3">Pet ID: {appointment.petId}</Text>
          </View>
        )}
      </View>

      {/* Owner Information (for veterinarians) */}
      {viewerIsVet && owner && (
        <View className="bg-gray-50 rounded-2xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={18} color="#334155" />
              <Text className="text-base text-gray-800 font-medium ml-2">Pet Owner</Text>
            </View>
            <View className="flex-row gap-2">
              {owner.phone && (
                <TouchableOpacity
                  onPress={handleCallOwner}
                  className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Call owner"
                >
                  <Ionicons name="call" size={14} color="white" />
                  <Text className="text-white text-xs font-medium ml-1">Call</Text>
                </TouchableOpacity>
              )}
              {(owner.phone || owner.email) && (
                <TouchableOpacity
                  onPress={handleMessageOwner}
                  className="bg-green-600 px-3 py-1.5 rounded-lg flex-row items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Message owner"
                >
                  <Ionicons name="chatbubble" size={14} color="white" />
                  <Text className="text-white text-xs font-medium ml-1">Message</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View>
            <Text className="text-gray-900 font-medium">{owner.name}</Text>
            {owner.email && (
              <Text className="text-gray-600 text-sm mt-1">{owner.email}</Text>
            )}
            {owner.phone && (
              <Text className="text-gray-600 text-sm mt-1">{owner.phone}</Text>
            )}
          </View>
        </View>
      )}

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
            {clinic ? (
              <>
                <Text className="text-gray-900 font-medium">{clinic.name}</Text>
                <Text className="text-gray-600 leading-7">{clinic.address}, {clinic.city}, {clinic.state}</Text>
              </>
            ) : (
            <Text className="text-gray-600 mt-2 leading-7">Clinic: {appointment.clinicId}</Text>
            )}
          </View>
        </View>
        {/* Action buttons for confirmed appointments (Phase 2) */}
        {isConfirmed && (
          <View className="flex-row gap-2 mt-4">
            {clinic && clinic.latitude && clinic.longitude && (
              <TouchableOpacity
                onPress={handleViewLocation}
                className="flex-1 bg-blue-600 px-4 py-2.5 rounded-lg flex-row items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="View clinic location"
              >
                <Ionicons name="location" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-1">View Location</Text>
              </TouchableOpacity>
            )}
            {appointment.petId && (
              <TouchableOpacity
                onPress={handleViewPetHealth}
                className="flex-1 bg-purple-600 px-4 py-2.5 rounded-lg flex-row items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="View pet health records"
              >
                <Ionicons name="medical" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-1">Health Records</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
        </ScrollView>
      </Animated.View>

      {/* Action Buttons */}
      {(canAccept || canDecline || canStart || canCancel) ? (
        <View
          className="bg-white border-t border-gray-200 px-5"
          style={{ paddingBottom: Math.max(insets.bottom, 12), paddingTop: 12 }}
          accessibilityRole="toolbar"
          accessibilityLabel="Appointment actions"
        >
          {isPending && (canAccept || canDecline) ? (
            // Accept/Decline buttons for pending appointments (vets only)
            <View className="flex-row gap-3">
              {canAccept && (
                <TouchableOpacity
                  onPress={onAcceptPress}
                  disabled={processing}
                  className="flex-1 bg-green-600 rounded-xl py-3 flex-row items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Accept appointment"
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text className="text-white text-base font-semibold ml-2">Accept</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              {canDecline && (
                <TouchableOpacity
                  onPress={onDeclinePress}
                  disabled={processing}
                  className="flex-1 bg-red-600 rounded-xl py-3 flex-row items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Decline appointment"
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="white" />
                      <Text className="text-white text-base font-semibold ml-2">Decline</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : isConfirmed && canStart ? (
            // Start Appointment button for confirmed appointments (Phase 2)
            <TouchableOpacity
              onPress={handleStartAppointment}
              disabled={processing}
              className="bg-yellow-600 rounded-xl py-3 flex-row items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Start appointment"
            >
              {processing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={20} color="white" />
                  <Text className="text-white text-base font-semibold ml-2">Start Appointment</Text>
                </>
              )}
            </TouchableOpacity>
          ) : canCancel ? (
            // Cancel/Reschedule buttons for other statuses
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onCancelPress}
                disabled={processing}
                className="flex-1 bg-red-600 rounded-xl py-3"
                accessibilityRole="button"
                accessibilityLabel="Cancel appointment"
              >
                {processing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center text-white text-base font-medium">Cancel Appointment</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                  onPress={() => navigation.navigate('RescheduleAppointment', { appointmentId: appointment.id })}
                className="flex-1 bg-blue-600 rounded-xl py-3"
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule appointment"
              >
                <Text className="text-center text-white text-base font-medium">Reschedule</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Pre-Appointment Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseNotesModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-900">Pre-Appointment Notes</Text>
              <TouchableOpacity
                onPress={handleCloseNotesModal}
                accessibilityRole="button"
                accessibilityLabel="Close notes modal"
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-600 mb-3">
              Add private notes about this appointment. These notes are only visible to you.
                </Text>
            <TextInput
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Enter your notes here..."
              multiline
              numberOfLines={8}
              className="border border-gray-300 rounded-xl p-4 text-gray-900"
              style={{ 
                minHeight: 150, 
                textAlignVertical: 'top',
                fontSize: 16,
                lineHeight: 24
              }}
              accessibilityLabel="Pre-appointment notes input"
            />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={handleCloseNotesModal}
                className="flex-1 bg-gray-200 rounded-xl py-3"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text className="text-center text-gray-700 text-base font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNotes}
                disabled={savingNotes}
                className="flex-1 bg-blue-600 rounded-xl py-3 flex-row items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Save notes"
              >
                {savingNotes ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center text-white text-base font-semibold">Save Notes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AppointmentDetailsScreen;