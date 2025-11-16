import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Appointment, TimeSlot } from '../types';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { supabaseVetService } from '../services/supabaseVetService';

type RescheduleAppointmentScreenRouteProp = RouteProp<RootStackParamList, 'RescheduleAppointment'>;
type RescheduleAppointmentNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  route: RescheduleAppointmentScreenRouteProp;
}

type RescheduleStep = 'date' | 'time' | 'confirm';

const RescheduleAppointmentScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<RescheduleAppointmentNavigationProp>();
  const { appointmentId } = route.params;

  // Data
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  // Rescheduling flow state
  const [currentStep, setCurrentStep] = useState<RescheduleStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    loadAppointmentData();
  }, []);

  const loadAppointmentData = async () => {
    try {
      setLoading(true);
      const appointmentData = await supabaseAppointmentService.getAppointmentById(appointmentId);
      
      if (!appointmentData) {
        Alert.alert('Error', 'Appointment not found');
        navigation.goBack();
        return;
      }

      if (!['scheduled', 'confirmed'].includes(appointmentData.status)) {
        Alert.alert('Cannot Reschedule', 'This appointment cannot be rescheduled');
        navigation.goBack();
        return;
      }

      setAppointment(appointmentData);
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'Failed to load appointment information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDates = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    
    // Generate next 14 days, excluding the current appointment date
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip current appointment date
      if (appointment) {
        // Handle both Date objects and ISO strings
        const appointmentDate = appointment.date instanceof Date 
          ? appointment.date 
          : new Date(appointment.date as any);
        if (date.toDateString() === appointmentDate.toDateString()) {
          continue;
        }
      }
      
      // Skip Sundays for non-emergency appointments
      if (date.getDay() === 0) {
        continue;
      }
      
      dates.push(date);
    }
    
    return dates;
  };

  const loadAvailableTimeSlots = async (date: Date) => {
    if (!appointment) return;
    
    try {
      setSlotsLoading(true);
      
      // Get veterinarian data to get available slots
      const vet = await supabaseVetService.getVeterinarianById(appointment.veterinarianId);
      if (!vet) {
        Alert.alert('Error', 'Unable to load veterinarian information');
        return;
      }

      // Filter available slots and exclude conflicting appointments
      const dateString = date.toISOString().split('T')[0];
      const allSlots = vet.availableSlots;
      
      // Check each slot for availability
      const availableSlotsPromises = allSlots.map(async (slot) => {
        const isAvailable = await supabaseAppointmentService.isTimeSlotAvailable(
          appointment.veterinarianId,
          dateString,
          slot.startTime,
          slot.endTime
        );
        
        return isAvailable ? slot : null;
      });
      
      const checkedSlots = await Promise.all(availableSlotsPromises);
      const filteredSlots = checkedSlots.filter(slot => slot !== null) as TimeSlot[];
      
      setAvailableSlots(filteredSlots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'date':
        if (!selectedDate) {
          Alert.alert('Please select a date', 'Choose your new preferred appointment date');
          return;
        }
        loadAvailableTimeSlots(selectedDate);
        setCurrentStep('time');
        break;
      case 'time':
        if (!selectedTimeSlot) {
          Alert.alert('Please select a time', 'Choose your new preferred appointment time');
          return;
        }
        setCurrentStep('confirm');
        break;
      case 'confirm':
        handleRescheduleAppointment();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'date':
        navigation.goBack();
        break;
      case 'time':
        setCurrentStep('date');
        break;
      case 'confirm':
        setCurrentStep('time');
        break;
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!appointment || !selectedDate || !selectedTimeSlot) {
      Alert.alert('Missing Information', 'Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Check if time slot is still available
      const isAvailable = await supabaseAppointmentService.isTimeSlotAvailable(
        appointment.veterinarianId,
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

      // Update the appointment with new date and time
      const updateData = {
        appointment_date: selectedDate.toISOString().split('T')[0],
        start_time: selectedTimeSlot.startTime,
        end_time: selectedTimeSlot.endTime,
        notes: rescheduleReason ? `${appointment.notes || ''}\n\nRescheduled: ${rescheduleReason}`.trim() : appointment.notes,
        status: 'scheduled' as const, // Reset to scheduled status
      };

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      
      Alert.alert(
        'Appointment Rescheduled!',
        `Your appointment has been moved to ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot.startTime}.`,
        [
          {
            text: 'OK',
            onPress: () => {
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
        ]
      );
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert(
        'Rescheduling Failed', 
        error.message || 'Unable to reschedule your appointment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProgressIndicator = () => {
    const steps: { key: RescheduleStep; label: string }[] = [
      { key: 'date', label: 'New Date' },
      { key: 'time', label: 'New Time' },
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

  const renderDateSelection = () => {
    const availableDates = getAvailableDates();

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select New Date</Text>
        <Text style={styles.stepSubtitle}>Choose your new preferred appointment date</Text>
        
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
      </View>
    );
  };

  const renderTimeSelection = () => {
    if (!selectedDate) return null;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select New Time</Text>
        <Text style={styles.stepSubtitle}>
          Available times for {selectedDate.toLocaleDateString()}
        </Text>
        
        {slotsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading available times...</Text>
          </View>
        ) : availableSlots.length === 0 ? (
          <View style={styles.noSlotsContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.noSlotsText}>No available times</Text>
            <Text style={styles.noSlotsSubtext}>Please select a different date</Text>
          </View>
        ) : (
          <View style={styles.timeGrid}>
            {availableSlots.map((slot) => (
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

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Reschedule</Text>
      <Text style={styles.stepSubtitle}>Please review your changes</Text>
      
      {/* Current Appointment */}
      <View style={styles.comparisonCard}>
        <Text style={styles.comparisonTitle}>Current Appointment</Text>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentDate}>
            {appointment?.date.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <Text style={styles.appointmentTime}>
            {appointment?.timeSlot.startTime} - {appointment?.timeSlot.endTime}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <View style={styles.arrowContainer}>
        <Ionicons name="arrow-down" size={24} color="#3b82f6" />
      </View>

      {/* New Appointment */}
      <View style={[styles.comparisonCard, styles.newAppointmentCard]}>
        <Text style={[styles.comparisonTitle, styles.newAppointmentTitle]}>New Appointment</Text>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentDate}>
            {selectedDate?.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <Text style={styles.appointmentTime}>
            {selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}
          </Text>
        </View>
      </View>

      <View style={styles.reasonSection}>
        <Text style={styles.fieldLabel}>Reason for Rescheduling (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Schedule conflict, emergency..."
          value={rescheduleReason}
          onChangeText={setRescheduleReason}
          multiline
        />
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'date':
        return renderDateSelection();
      case 'time':
        return renderTimeSelection();
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reschedule Appointment</Text>
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
              {currentStep === 'confirm' ? 'Reschedule Appointment' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Import supabase for direct database access
import { supabase } from '../config/supabase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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
  noSlotsContainer: {
    alignItems: 'center',
    padding: 48,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  comparisonCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  newAppointmentCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  newAppointmentTitle: {
    color: '#3b82f6',
  },
  appointmentInfo: {
    marginLeft: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  reasonSection: {
    marginTop: 24,
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
    height: 80,
    textAlignVertical: 'top',
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

export default RescheduleAppointmentScreen;