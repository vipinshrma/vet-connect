import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { supabaseScheduleService } from '../services/supabaseScheduleService';
import { RootState } from '../store';
import { RootStackParamList, TimeSlot, VeterinarianDaySchedule, WeeklySchedule } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ScheduleManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  // const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'preview' | 'slots'>('schedule');
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  
  // Slot management state
  const [selectedSlotDate, setSelectedSlotDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dailySlots, setDailySlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slotDurationOptions = [15, 20, 30, 45, 60];

  useEffect(() => {
    if (user?.id) {
      loadScheduleData();
    }
  }, [user?.id]);

  const loadScheduleData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Load weekly schedule
      const schedule = await supabaseScheduleService.getVeterinarianSchedule(user.id);
      setWeeklySchedule(schedule);

      // Load exceptions for next 30 days
      // const today = new Date();
      // const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      // const exceptionsList = await supabaseScheduleService.getScheduleExceptions(
      //   user.id,
      //   today.toISOString().split('T')[0],
      //   futureDate.toISOString().split('T')[0]
      // );
      // setExceptions(exceptionsList);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      Alert.alert('Error', 'Failed to load schedule information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      await supabaseScheduleService.updateWeeklySchedule(user.id, weeklySchedule);
      Alert.alert('Success', 'Schedule updated successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const updateDaySchedule = (dayOfWeek: number, field: keyof VeterinarianDaySchedule, value: any) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value
      }
    }));
  };

  const copyDaySchedule = (sourceDayOfWeek: number, targetDayOfWeek: number) => {
    const sourceDay = weeklySchedule[sourceDayOfWeek];
    if (sourceDay) {
      setWeeklySchedule(prev => ({
        ...prev,
        [targetDayOfWeek]: {
          ...sourceDay,
          dayOfWeek: targetDayOfWeek,
          dayName: dayNames[targetDayOfWeek]
        }
      }));
      // Expand the target day after copying
      setExpandedDays(prev => new Set(prev).add(targetDayOfWeek));
    }
  };

  const toggleDayExpansion = (dayOfWeek: number) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayOfWeek)) {
        newSet.delete(dayOfWeek);
      } else {
        newSet.add(dayOfWeek);
      }
      return newSet;
    });
  };

  const renderTabButton = (tab: typeof activeTab, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      onPress={() => setActiveTab(tab)}
      className={`flex-1 flex-row items-center justify-center rounded-lg ${
        activeTab === tab ? 'bg-blue-500' : 'bg-gray-100'
      }`}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginHorizontal: 3,
        minHeight: 36
      }}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={activeTab === tab ? '#fff' : '#6b7280'} 
      />
      <Text className={`font-medium ${
        activeTab === tab ? 'text-white' : 'text-gray-600'
      }`}
      style={{ marginLeft: 4, fontSize: 12 }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderScheduleTab = () => (
    <ScrollView 
      className="flex-1" 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View style={{ gap: 12 }}>
        {dayNames.map((dayName, dayOfWeek) => {
          const daySchedule = weeklySchedule[dayOfWeek];
          if (!daySchedule) return null;

          const isExpanded = expandedDays.has(dayOfWeek);
          const isWorking = daySchedule.isWorking;

          return (
            <View 
              key={dayOfWeek} 
              className="bg-white rounded-xl shadow-sm"
              style={{ overflow: 'hidden' }}
            >
              {/* Day Header - Always Visible */}
              <TouchableOpacity
                onPress={() => toggleDayExpansion(dayOfWeek)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between"
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center" style={{ flex: 1 }}>
                  <Ionicons 
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                    size={20} 
                    color="#6b7280"
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text className="text-lg font-inter-semibold text-gray-900">
                      {dayName}
                    </Text>
                    {isWorking && !isExpanded && (
                      <Text className="text-xs text-gray-500" style={{ marginTop: 2 }}>
                        {daySchedule.startTime} - {daySchedule.endTime}
                        {daySchedule.breakStartTime && daySchedule.breakEndTime && 
                          ` • Break: ${daySchedule.breakStartTime} - ${daySchedule.breakEndTime}`
                        }
                        {` • ${daySchedule.slotDuration}min slots`}
                      </Text>
                    )}
                    {!isWorking && !isExpanded && (
                      <Text className="text-xs text-gray-500" style={{ marginTop: 2 }}>
                        Not working
                      </Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={isWorking}
                  onValueChange={(value) => {
                    updateDaySchedule(dayOfWeek, 'isWorking', value);
                    // Auto-expand when enabling working day
                    if (value) {
                      setExpandedDays(prev => new Set(prev).add(dayOfWeek));
                    }
                  }}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={isWorking ? '#ffffff' : '#f3f4f6'}
                  onTouchEnd={(e) => e.stopPropagation()}
                />
              </TouchableOpacity>

              {/* Expandable Content */}
              {isExpanded && isWorking && (
                <View style={{ gap: 24, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 }}>
                  {/* Working Hours */}
                  <View>
                    <Text className="text-sm font-inter-medium text-gray-700" style={{ marginBottom: 10 }}>
                      Working Hours
                    </Text>
                    <View className="flex-row items-center" style={{ gap: 12 }}>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500" style={{ marginBottom: 6 }}>Start Time</Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-lg text-center"
                          style={{ 
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            fontSize: 14,
                            minHeight: 44
                          }}
                          value={daySchedule.startTime}
                          onChangeText={(value) => updateDaySchedule(dayOfWeek, 'startTime', value)}
                          placeholder="08:00"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      <Text className="text-gray-500" style={{ marginTop: 24 }}>to</Text>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500" style={{ marginBottom: 6 }}>End Time</Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-lg text-center"
                          style={{ 
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            fontSize: 14,
                            minHeight: 44
                          }}
                          value={daySchedule.endTime}
                          onChangeText={(value) => updateDaySchedule(dayOfWeek, 'endTime', value)}
                          placeholder="17:00"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Break Hours */}
                  <View>
                    <Text className="text-sm font-inter-medium text-gray-700" style={{ marginBottom: 10 }}>
                      Break Hours (Optional)
                    </Text>
                    <View className="flex-row items-center" style={{ gap: 12 }}>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500" style={{ marginBottom: 6 }}>Break Start</Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-lg text-center"
                          style={{ 
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            fontSize: 14,
                            minHeight: 44
                          }}
                          value={daySchedule.breakStartTime || ''}
                          onChangeText={(value) => updateDaySchedule(dayOfWeek, 'breakStartTime', value || undefined)}
                          placeholder="12:00"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      <Text className="text-gray-500" style={{ marginTop: 24 }}>to</Text>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500" style={{ marginBottom: 6 }}>Break End</Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-lg text-center"
                          style={{ 
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            fontSize: 14,
                            minHeight: 44
                          }}
                          value={daySchedule.breakEndTime || ''}
                          onChangeText={(value) => updateDaySchedule(dayOfWeek, 'breakEndTime', value || undefined)}
                          placeholder="13:00"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Slot Duration */}
                  <View>
                    <Text className="text-sm font-inter-medium text-gray-700" style={{ marginBottom: 10 }}>
                      Appointment Slot Duration
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {slotDurationOptions.map((duration) => (
                        <TouchableOpacity
                          key={duration}
                          onPress={() => updateDaySchedule(dayOfWeek, 'slotDuration', duration)}
                          className={`rounded-full ${
                            daySchedule.slotDuration === duration
                              ? 'bg-blue-500'
                              : 'bg-gray-100'
                          }`}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            minHeight: 40,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Text className={`text-sm font-inter-medium ${
                            daySchedule.slotDuration === duration
                              ? 'text-white'
                              : 'text-gray-700'
                          }`}>
                            {duration} min
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Copy Day Schedule */}
                  <View>
                    <Text className="text-sm font-inter-medium text-gray-700" style={{ marginBottom: 10 }}>
                      Copy to Other Days
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {dayNames.map((targetDayName, targetDayOfWeek) => {
                        if (targetDayOfWeek === dayOfWeek) return null;
                        
                        return (
                          <TouchableOpacity
                            key={targetDayOfWeek}
                            onPress={() => copyDaySchedule(dayOfWeek, targetDayOfWeek)}
                            className="rounded-full bg-green-100 border border-green-200"
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              minHeight: 40,
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <Text className="text-sm text-green-700 font-inter-medium">
                              Copy to {targetDayName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* Collapsed view for non-working days */}
              {isExpanded && !isWorking && (
                <View style={{ paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center' }}>
                  <Ionicons name="moon" size={32} color="#9ca3af" />
                  <Text className="text-gray-500" style={{ marginTop: 8 }}>
                    Not working on {dayName}
                  </Text>
                  <Text className="text-xs text-gray-400" style={{ marginTop: 4, textAlign: 'center' }}>
                    Enable the switch above to set working hours for this day
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  // const renderExceptionsTab = () => (
  //   <ScrollView showsVerticalScrollIndicator={false}>
  //     <Text className="text-lg font-inter-semibold text-gray-900" style={{ marginBottom: 16 }}>
  //       Schedule Exceptions
  //     </Text>
  //     <Text className="text-gray-600" style={{ marginBottom: 20, lineHeight: 22 }}>
  //       Coming soon: Add one-time schedule changes, time off, and custom hours for specific dates.
  //     </Text>
  //     <View className="bg-blue-50 rounded-xl" style={{ padding: 20 }}>
  //       <Text className="text-blue-700 font-inter-medium" style={{ marginBottom: 12 }}>
  //         Future Features:
  //       </Text>
  //       <Text className="text-blue-600" style={{ lineHeight: 24 }}>
  //         • Mark days as unavailable{'\n'}
  //         • Set custom hours for specific dates{'\n'}
  //         • Add vacation periods{'\n'}
  //         • Emergency schedule changes
  //       </Text>
  //     </View>
  //   </ScrollView>
  // );

  // Load slots for a specific date
  const loadDailySlots = useCallback(async (date: string) => {
    if (!user?.id) return;
    
    try {
      setLoadingSlots(true);
      const slots = await supabaseScheduleService.getAllTimeSlotsForDate(user.id, date);
      setDailySlots(slots);
    } catch (error) {
      console.error('Error loading daily slots:', error);
      Alert.alert('Error', 'Failed to load time slots');
      setDailySlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [user?.id]);

  // Load slots when slots tab is active and date changes
  useEffect(() => {
    if (activeTab === 'slots' && user?.id && selectedSlotDate) {
      loadDailySlots(selectedSlotDate);
    }
  }, [selectedSlotDate, activeTab, user?.id, loadDailySlots]);

  // Toggle slot availability
  const handleToggleSlot = async (slotId: string, currentStatus: boolean) => {
    if (!user?.id) return;
    
    try {
      const newStatus = !currentStatus;
      await supabaseScheduleService.toggleSlotAvailability(slotId, newStatus);
      
      // Update local state
      setDailySlots(prev => 
        prev.map(slot => 
          slot.id === slotId 
            ? { ...slot, isAvailable: newStatus, slotType: newStatus ? 'regular' : 'blocked' }
            : slot
        )
      );
      
      Alert.alert(
        'Success', 
        `Slot ${newStatus ? 'unblocked' : 'blocked'} successfully`
      );
    } catch (error) {
      console.error('Error toggling slot:', error);
      Alert.alert('Error', 'Failed to update slot availability');
    }
  };

  // Render slots management tab
  const renderSlotsTab = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-inter-semibold text-gray-900" style={{ marginBottom: 16 }}>
          Manage Time Slots
        </Text>
        <Text className="text-gray-600" style={{ marginBottom: 20, lineHeight: 22 }}>
          View and manage individual time slots for specific dates. Block or unblock slots manually.
        </Text>

        {/* Date Picker */}
        <View style={{ marginBottom: 20 }}>
          <Text className="text-sm font-inter-medium text-gray-700" style={{ marginBottom: 10 }}>
            Select Date
          </Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setSelectedSlotDate(today);
              }}
              className={`rounded-lg border ${
                selectedSlotDate === today ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'
              }`}
              style={{ paddingVertical: 10, paddingHorizontal: 16, flex: 1 }}
            >
              <Text className={`text-center font-medium ${
                selectedSlotDate === today ? 'text-white' : 'text-gray-700'
              }`}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedSlotDate(tomorrow);
              }}
              className={`rounded-lg border ${
                selectedSlotDate === tomorrow ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'
              }`}
              style={{ paddingVertical: 10, paddingHorizontal: 16, flex: 1 }}
            >
              <Text className={`text-center font-medium ${
                selectedSlotDate === tomorrow ? 'text-white' : 'text-gray-700'
              }`}>
                Tomorrow
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // You can add a date picker here
                Alert.prompt(
                  'Select Date',
                  'Enter date (YYYY-MM-DD)',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'OK',
                      onPress: (dateStr) => {
                        if (dateStr) setSelectedSlotDate(dateStr);
                      }
                    }
                  ],
                  'plain-text',
                  selectedSlotDate
                );
              }}
              className="rounded-lg border border-gray-200 bg-white"
              style={{ paddingVertical: 10, paddingHorizontal: 16, flex: 1 }}
            >
              <Text className="text-center font-medium text-gray-700">
                Custom
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-gray-500" style={{ marginTop: 8, textAlign: 'center' }}>
            {new Date(selectedSlotDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Slots List */}
        {loadingSlots ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-600" style={{ marginTop: 10 }}>
              Loading slots...
            </Text>
          </View>
        ) : dailySlots.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-600" style={{ marginTop: 10, fontSize: 16 }}>
              No slots found
            </Text>
            <Text className="text-gray-500" style={{ marginTop: 4, fontSize: 14 }}>
              Slots will be generated based on your schedule
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {dailySlots.map((slot) => (
              <View
                key={slot.id}
                className="bg-white rounded-xl shadow-sm"
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <View style={{ flex: 1 }}>
                    <Text className="text-base font-inter-semibold text-gray-900">
                      {slot.startTime} - {slot.endTime}
                    </Text>
                    <View className="flex-row items-center" style={{ marginTop: 4, gap: 8 }}>
                      {slot.isBooked ? (
                        <View className="bg-red-100 rounded-full px-3 py-1">
                          <Text className="text-xs font-medium text-red-700">Booked</Text>
                        </View>
                      ) : slot.isAvailable ? (
                        <View className="bg-green-100 rounded-full px-3 py-1">
                          <Text className="text-xs font-medium text-green-700">Available</Text>
                        </View>
                      ) : (
                        <View className="bg-orange-100 rounded-full px-3 py-1">
                          <Text className="text-xs font-medium text-orange-700">Blocked</Text>
                        </View>
                      )}
                      {slot.slotType && slot.slotType !== 'regular' && (
                        <Text className="text-xs text-gray-500">
                          {slot.slotType.charAt(0).toUpperCase() + slot.slotType.slice(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {!slot.isBooked && (
                    <TouchableOpacity
                      onPress={() => handleToggleSlot(slot.id, slot.isAvailable)}
                      className={`rounded-lg border ${
                        slot.isAvailable 
                          ? 'bg-orange-50 border-orange-200' 
                          : 'bg-green-50 border-green-200'
                      }`}
                      style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                    >
                      <Text className={`font-medium text-sm ${
                        slot.isAvailable ? 'text-orange-700' : 'text-green-700'
                      }`}>
                        {slot.isAvailable ? 'Block' : 'Unblock'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {slot.isBooked && (
                  <View className="bg-gray-50 rounded-lg" style={{ marginTop: 12, padding: 12 }}>
                    <Text className="text-xs text-gray-500">
                      This slot is booked and cannot be modified
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderPreviewTab = () => {
    const workingDays = Object.values(weeklySchedule).filter(day => day.isWorking);
    
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-inter-semibold text-gray-900" style={{ marginBottom: 16 }}>
          Schedule Preview
        </Text>
        
        <View className="bg-white rounded-xl shadow-sm" style={{ padding: 20, marginBottom: 20 }}>
          <Text className="text-base font-inter-medium text-gray-800" style={{ marginBottom: 12 }}>
            Weekly Summary
          </Text>
          <Text className="text-gray-600" style={{ marginBottom: 8, lineHeight: 22 }}>
            Working Days: {workingDays.length} of 7
          </Text>
          <Text className="text-gray-600" style={{ lineHeight: 22 }}>
            Total Weekly Hours: ~{workingDays.reduce((total, day) => {
              const start = day.startTime.split(':');
              const end = day.endTime.split(':');
              const startHours = parseInt(start[0]) + parseInt(start[1]) / 60;
              const endHours = parseInt(end[0]) + parseInt(end[1]) / 60;
              let dayHours = endHours - startHours;
              
              // Subtract break time if exists
              if (day.breakStartTime && day.breakEndTime) {
                const breakStart = day.breakStartTime.split(':');
                const breakEnd = day.breakEndTime.split(':');
                const breakStartHours = parseInt(breakStart[0]) + parseInt(breakStart[1]) / 60;
                const breakEndHours = parseInt(breakEnd[0]) + parseInt(breakEnd[1]) / 60;
                dayHours -= (breakEndHours - breakStartHours);
              }
              
              return total + dayHours;
            }, 0).toFixed(1)} hours
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {dayNames.map((dayName, dayOfWeek) => {
            const daySchedule = weeklySchedule[dayOfWeek];
            if (!daySchedule) return null;

            return (
              <View 
                key={dayOfWeek} 
                className="bg-white rounded-lg shadow-sm"
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-inter-medium text-gray-800" style={{ fontSize: 15 }}>
                    {dayName}
                  </Text>
                  {daySchedule.isWorking ? (
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text className="text-green-600 text-sm font-inter-medium">
                        {daySchedule.startTime} - {daySchedule.endTime}
                      </Text>
                      {daySchedule.breakStartTime && daySchedule.breakEndTime && (
                        <Text className="text-orange-600 text-xs">
                          Break: {daySchedule.breakStartTime} - {daySchedule.breakEndTime}
                        </Text>
                      )}
                      <Text className="text-blue-600 text-xs">
                        {daySchedule.slotDuration}min slots
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-gray-500 text-sm">Off</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading schedule...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="ml-3 text-lg font-inter-semibold text-gray-900">
              Schedule Management
            </Text>
          </View>
          
          {activeTab === 'schedule' && (
            <TouchableOpacity
              onPress={handleSaveSchedule}
              disabled={saving}
              className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="white" />
                  <Text className="text-white font-inter-semibold ml-1">Save</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white px-3 py-2 border-b border-gray-100">
        <View className="flex-row" style={{ gap: 4 }}>
          {renderTabButton('schedule', 'Schedule', 'calendar')}
          {/* {renderTabButton('exceptions', 'Exceptions', 'alert-circle')} */}
          {renderTabButton('slots', 'Slots', 'time')}
          {renderTabButton('preview', 'Preview', 'eye')}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1" style={{ padding: 16 }}>
        {activeTab === 'schedule' && renderScheduleTab()}
        {/* {activeTab === 'exceptions' && renderExceptionsTab()} */}
        {activeTab === 'slots' && renderSlotsTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </View>
    </SafeAreaView>
  );
};

export default ScheduleManagementScreen;