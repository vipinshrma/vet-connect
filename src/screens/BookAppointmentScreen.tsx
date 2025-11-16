import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { supabaseClinicService } from '../services/supabaseClinicService';
import { supabasePetService } from '../services/supabasePetService';
import { supabaseScheduleService } from '../services/supabaseScheduleService';
import { supabaseVetService } from '../services/supabaseVetService';
import { Clinic, Pet, RootStackParamList, TimeSlot, Veterinarian, WeeklySchedule } from '../types';

type BookAppointmentScreenRouteProp = RouteProp<RootStackParamList, 'BookAppointment'>;
type BookAppointmentNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  route: BookAppointmentScreenRouteProp;
}

type BookingStep = 'pet' | 'date' | 'time' | 'details' | 'confirm';

const BookAppointmentScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<BookAppointmentNavigationProp>();
  const { veterinarianId, clinicId } = route.params;

  // Data
  const [veterinarian, setVeterinarian] = useState<Veterinarian | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Booking flow state
  const [currentStep, setCurrentStep] = useState<BookingStep>('pet');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  
  // Time slots state
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  console.log("veterinarian",veterinarian)

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Error', 'Please log in to book an appointment');
        navigation.goBack();
        return;
      }

      // Load veterinarian, clinic, and pets data
      const [vetData, clinicData, pets] = await Promise.all([
        supabaseVetService.getVeterinarianById(veterinarianId),
        supabaseClinicService.getClinicById(clinicId),
        supabasePetService.getUserPets(user.id), // Use Supabase pet service
      ]);



      setVeterinarian(vetData);
      setClinic(clinicData);
      setUserPets(pets);

      if (!vetData || !clinicData) {
        Alert.alert('Error', 'Unable to find veterinarian or clinic information');
        navigation.goBack();
        return;
      }

      // Load available dates based on vet's schedule (will be done after state is set)
    } catch (error) {
      console.error('Error loading appointment data:', error);
      Alert.alert('Error', 'Failed to load appointment information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Load available dates based on veterinarian's schedule
  const loadAvailableDates = async (vetId: string) => {
    try {
      setLoadingDates(true);
      const today = new Date();
      const dates: Date[] = [];

      // Get veterinarian's schedule to check working days
      let vetSchedule: WeeklySchedule | null = null;
      try {
        vetSchedule = await supabaseScheduleService.getVeterinarianSchedule(vetId);
      } catch (error) {
        console.error('Error fetching vet schedule:', error);
        // Continue without schedule check if it fails
      }
      
      // Generate next 14 days and filter by working schedule
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Skip Sundays for non-emergency clinics (if no schedule data)
        if (dayOfWeek === 0 && !clinic?.services.some(s => s.toLowerCase().includes('emergency'))) {
          if (!vetSchedule) {
            continue; // Skip if no schedule and non-emergency clinic
          }
        }
        
        // Check if vet is working on this day of week
        if (vetSchedule && vetSchedule[dayOfWeek]) {
          const daySchedule = vetSchedule[dayOfWeek];
          if (!daySchedule.isWorking) {
            // Vet is not working on this day - skip it (HIDE from appointment screen)
            continue;
          }
        }
        
        dates.push(date);
      }
      
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error loading available dates:', error);
      // Fallback to showing all dates if schedule check fails
      const fallbackDates: Date[] = [];
      const today = new Date();
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (date.getDay() !== 0 || clinic?.services.some(s => s.toLowerCase().includes('emergency'))) {
          fallbackDates.push(date);
        }
      }
      setAvailableDates(fallbackDates);
    } finally {
      setLoadingDates(false);
    }
  };

  useEffect(() => {
    if (veterinarian && !loading) {
      loadAvailableDates(veterinarian.id);
    }
  }, [veterinarian, clinic, loading]);

  // Load available time slots from time_slots table when date is selected
  const loadAvailableTimeSlots = async (date: Date) => {
    if (!veterinarian) return;
    
    try {
      setLoadingSlots(true);
      const dateString = date.toISOString().split('T')[0];
      const slots = await supabaseScheduleService.getAvailableTimeSlots(veterinarian.id, dateString);
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      Alert.alert('Error', 'Failed to load available time slots');
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Load slots when date is selected
  useEffect(() => {
    if (selectedDate && veterinarian) {
      loadAvailableTimeSlots(selectedDate);
      setSelectedTimeSlot(null); // Reset selected time slot when date changes
    }
  }, [selectedDate, veterinarian]);

  const handleStepNavigation = (step: BookingStep) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'pet':
        if (!selectedPet) {
          Alert.alert('Please select a pet', 'Choose which pet needs an appointment');
          return;
        }
        setCurrentStep('date');
        break;
      case 'date':
        if (!selectedDate) {
          Alert.alert('Please select a date', 'Choose your preferred appointment date');
          return;
        }
        setCurrentStep('time');
        break;
      case 'time':
        if (!selectedTimeSlot) {
          Alert.alert('Please select a time', 'Choose your preferred appointment time');
          return;
        }
        setCurrentStep('details');
        break;
      case 'details':
        if (!appointmentReason.trim()) {
          Alert.alert('Please provide a reason', 'Tell us why you need this appointment');
          return;
        }
        setCurrentStep('confirm');
        break;
      case 'confirm':
        handleBookAppointment();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'pet':
        navigation.goBack();
        break;
      case 'date':
        setCurrentStep('pet');
        break;
      case 'time':
        setCurrentStep('date');
        break;
      case 'details':
        setCurrentStep('time');
        break;
      case 'confirm':
        setCurrentStep('details');
        break;
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedPet || !selectedDate || !selectedTimeSlot || !appointmentReason.trim()) {
      Alert.alert('Missing Information', 'Please complete all required fields');
      return;
    }

    if (!veterinarian || !clinic) {
      Alert.alert('Error', 'Missing veterinarian or clinic information');
      return;
    }

    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Error', 'Please log in to book an appointment');
        return;
      }

      // Check if time slot is still available
      const isAvailable = await supabaseAppointmentService.isTimeSlotAvailable(
        veterinarianId,
        selectedDate.toISOString().split('T')[0],
        selectedTimeSlot.startTime,
        selectedTimeSlot.endTime
      );

      if (!isAvailable) {
        Alert.alert(
          'Time Slot Unavailable', 
          'This time slot has been booked by another user. Please select a different time.',
          [{ text: 'OK', onPress: () => setCurrentStep('time') }]
        );
        return;
      }

      

      // Create the appointment
      const appointmentData = {
        pet_id: selectedPet.id,
        appointment_date: selectedDate.toISOString().split('T')[0], // Convert Date to string
        reason: appointmentReason,
        notes: appointmentNotes || undefined,
        veterinarian_id: veterinarianId,
        clinic_id: clinicId,
        owner_id: user.id,
        start_time: selectedTimeSlot.startTime,
        end_time: selectedTimeSlot.endTime,
      };
      console.log("appointmentData",appointmentData)

      const newAppointment = await supabaseAppointmentService.createAppointment(appointmentData);
      
      Alert.alert(
        'Appointment Booked!',
        `Your appointment has been confirmed for ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot.startTime} with Dr. ${veterinarian.name}.\n\nAppointment ID: ${newAppointment.id}`,
        [
          {
            text: 'View Appointments',
            onPress: () => {
              // Navigate back to main tab navigator and then to Appointments tab
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Main',
                    state: {
                      routes: [{ name: 'Appointments' }],
                      index: 0,
                    },
                  },
                ],
              });
            },
          },
          {
            text: 'Go Home',
            onPress: () => {
              // Navigate back to main tab navigator and then to Home tab
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Main',
                    state: {
                      routes: [{ name: 'Home' }],
                      index: 0,
                    },
                  },
                ],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      Alert.alert(
        'Booking Failed', 
        error.message || 'Unable to book your appointment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProgressIndicator = () => {
    const steps: { key: BookingStep; label: string }[] = [
      { key: 'pet', label: 'Pet' },
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time' },
      { key: 'details', label: 'Details' },
      { key: 'confirm', label: 'Confirm' },
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.progressStep}>
            <View
              style={[
                styles.progressCircle,
                index <= currentIndex && styles.progressCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.progressNumber,
                  index <= currentIndex && styles.progressNumberActive,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.progressLabel,
                index === currentIndex && styles.progressLabelActive,
              ]}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  index < currentIndex && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPetSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Your Pet</Text>
      <Text style={styles.stepSubtitle}>Which pet needs an appointment?</Text>
      
      <ScrollView style={styles.petList}>
        {userPets.map((pet) => (
          <TouchableOpacity
            key={pet.id}
            style={[
              styles.petCard,
              selectedPet?.id === pet.id && styles.petCardSelected,
            ]}
            onPress={() => setSelectedPet(pet)}
          >
            <Image source={{ uri: pet.photoURL }} style={styles.petImage} />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petDetails}>
                {pet.breed} • {pet.age} year{pet.age !== 1 ? 's' : ''} old
              </Text>
              <Text style={styles.petSpecies}>{pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}</Text>
            </View>
            {selectedPet?.id === pet.id && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDateSelection = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Date</Text>
        <Text style={styles.stepSubtitle}>Choose your preferred appointment date</Text>
        
        {loadingDates ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 10, color: '#6b7280' }}>Loading available dates...</Text>
          </View>
        ) : availableDates.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={{ marginTop: 10, color: '#6b7280', fontSize: 16 }}>
              No available dates
            </Text>
            <Text style={{ marginTop: 4, color: '#9ca3af', fontSize: 14 }}>
              Please check back later or contact the clinic
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.dateList}>
            {availableDates.map((date, index) => {
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dateString = date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayName, isSelected && styles.dateTextSelected]}>
                  {dayName}
                </Text>
                <Text style={[styles.dateString, isSelected && styles.dateTextSelected]}>
                  {dateString}
                </Text>
              </TouchableOpacity>
            );
          })}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderTimeSelection = () => {
    if (!selectedDate) return null;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Time</Text>
        <Text style={styles.stepSubtitle}>
          Available times for {selectedDate.toLocaleDateString()}
        </Text>
        
        {loadingSlots ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 10, color: '#6b7280' }}>Loading available times...</Text>
          </View>
        ) : availableTimeSlots.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={{ marginTop: 10, color: '#6b7280', fontSize: 16 }}>No available times</Text>
            <Text style={{ marginTop: 4, color: '#9ca3af', fontSize: 14 }}>Please select a different date</Text>
          </View>
        ) : (
          <View style={styles.timeGrid}>
            {availableTimeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  selectedTimeSlot?.id === slot.id && styles.timeSlotSelected,
                ]}
                onPress={() => setSelectedTimeSlot(slot)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTimeSlot?.id === slot.id && styles.timeTextSelected,
                  ]}
                >
                  {slot.startTime}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDetailsForm = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Appointment Details</Text>
      <Text style={styles.stepSubtitle}>Tell us about your visit</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.fieldLabel}>Reason for Visit *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Annual checkup, vaccination, sick visit..."
          value={appointmentReason}
          onChangeText={setAppointmentReason}
          multiline
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.fieldLabel}>Additional Notes</Text>
        <TextInput
          style={[styles.textInput, styles.textAreaInput]}
          placeholder="Any additional information or concerns..."
          value={appointmentNotes}
          onChangeText={setAppointmentNotes}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Appointment</Text>
      <Text style={styles.stepSubtitle}>Please review your appointment details</Text>
      
      <View style={styles.confirmationCard}>
        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>Pet</Text>
          <View style={styles.confirmPetInfo}>
            <Image source={{ uri: selectedPet?.photoURL }} style={styles.confirmPetImage} />
            <Text style={styles.confirmValue}>{selectedPet?.name}</Text>
          </View>
        </View>

        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>Veterinarian</Text>
          <Text style={styles.confirmValue}>Dr. {veterinarian?.name}</Text>
        </View>

        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>Clinic</Text>
          <Text style={styles.confirmValue}>{clinic?.name}</Text>
          <Text style={styles.confirmSubValue}>{clinic?.address}</Text>
        </View>

        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>Date & Time</Text>
          <Text style={styles.confirmValue}>
            {selectedDate?.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.confirmSubValue}>{selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}</Text>
        </View>

        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>Reason</Text>
          <Text style={styles.confirmValue}>{appointmentReason}</Text>
          {appointmentNotes && (
            <Text style={styles.confirmSubValue}>{appointmentNotes}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'pet':
        return renderPetSelection();
      case 'date':
        return renderDateSelection();
      case 'time':
        return renderTimeSelection();
      case 'details':
        return renderDetailsForm();
      case 'confirm':
        return renderConfirmation();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading appointment information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!veterinarian || !clinic) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load appointment information</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            loading && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 'confirm' ? 'Book Appointment' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#f9fafb',
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: '#3b82f6',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressNumberActive: {
    color: '#ffffff',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  progressLine: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: '#e5e7eb',
  },
  progressLineActive: {
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  petList: {
    maxHeight: 400,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  petCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  petSpecies: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  dateList: {
    maxHeight: 400,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dateString: {
    fontSize: 14,
    color: '#6b7280',
  },
  dateTextSelected: {
    color: '#3b82f6',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  timeSlot: {
    width: '31%',
    margin: '1%',
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  timeSlotSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timeTextSelected: {
    color: '#3b82f6',
  },
  formSection: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  confirmationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
  },
  confirmSection: {
    marginBottom: 20,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  confirmSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  confirmPetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmPetImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookAppointmentScreen;