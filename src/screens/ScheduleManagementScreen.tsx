import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
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
import { RootStackParamList, WeeklySchedule, DaySchedule, ScheduleException } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ScheduleManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'exceptions' | 'preview'>('schedule');

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
      const today = new Date();
      const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const exceptionsList = await supabaseScheduleService.getScheduleExceptions(
        user.id,
        today.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0]
      );
      setExceptions(exceptionsList);
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

  const updateDaySchedule = (dayOfWeek: number, field: keyof DaySchedule, value: any) => {
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
    }
  };

  const renderTabButton = (tab: typeof activeTab, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      onPress={() => setActiveTab(tab)}
      className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg mx-1 ${
        activeTab === tab ? 'bg-blue-500' : 'bg-gray-100'
      }`}
    >
      <Ionicons 
        name={icon as any} 
        size={18} 
        color={activeTab === tab ? '#fff' : '#6b7280'} 
      />
      <Text className={`ml-2 font-medium ${
        activeTab === tab ? 'text-white' : 'text-gray-600'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderScheduleTab = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="space-y-4">
        {dayNames.map((dayName, dayOfWeek) => {
          const daySchedule = weeklySchedule[dayOfWeek];
          if (!daySchedule) return null;

          return (
            <View key={dayOfWeek} className="bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-inter-semibold text-gray-900">
                  {dayName}
                </Text>
                <Switch
                  value={daySchedule.isWorking}
                  onValueChange={(value) => updateDaySchedule(dayOfWeek, 'isWorking', value)}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={daySchedule.isWorking ? '#ffffff' : '#f3f4f6'}
                />
              </View>

              {daySchedule.isWorking && (
                <View className="space-y-4">
                  {/* Working Hours */}
                  <View>
                    <Text className="text-sm font-inter-medium text-gray-700 mb-2">
                      Working Hours
                    </Text>
                    <View className="flex-row items-center space-x-3">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Start Time</Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center"
                          value={daySchedule.startTime}
                          onChangeText={(value) => updateDaySchedule(dayOfWeek, 'startTime', value)}
                          placeholder="08:00"
                        />
                      </View>
                      <Text className="text-gray-500 pt-4">to</Text>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">End Time</Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center"
                          value={daySchedule.endTime}
                          onChangeText={(value) => updateDaySchedule(dayOfWeek, 'endTime', value)}
                          placeholder="17:00"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Break Hours */}
                  <View>
                    <Text className="text-sm font-inter-medium text-gray-700 mb-2">
                      Break Hours (Optional)
                    </Text>
                    <View className="flex-row items-center space-x-3">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Break Start</Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center"
                          value={daySchedule.breakStartTime || ''}
                          onChangeText={(value) => updateDaySchedule(dayOfWeek, 'breakStartTime', value || undefined)}
                          placeholder="12:00"
                        />
                      </View>
                      <Text className="text-gray-500 pt-4">to</Text>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Break End</Text>
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center"
                          value={daySchedule.breakEndTime || ''}
                          onChangeText={(value) => updateDaySchedule(dayOfWeek, 'breakEndTime', value || undefined)}
                          placeholder="13:00"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Slot Duration */}
                  <View>
                    <Text className="text-sm font-inter-medium text-gray-700 mb-2">
                      Appointment Slot Duration
                    </Text>
                    <View className="flex-row flex-wrap">
                      {slotDurationOptions.map((duration) => (
                        <TouchableOpacity
                          key={duration}
                          onPress={() => updateDaySchedule(dayOfWeek, 'slotDuration', duration)}
                          className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                            daySchedule.slotDuration === duration
                              ? 'bg-blue-500'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text className={`text-sm ${
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
                    <Text className="text-sm font-inter-medium text-gray-700 mb-2">
                      Copy to Other Days
                    </Text>
                    <View className="flex-row flex-wrap">
                      {dayNames.map((targetDayName, targetDayOfWeek) => {
                        if (targetDayOfWeek === dayOfWeek) return null;
                        
                        return (
                          <TouchableOpacity
                            key={targetDayOfWeek}
                            onPress={() => copyDaySchedule(dayOfWeek, targetDayOfWeek)}
                            className="px-3 py-2 rounded-full mr-2 mb-2 bg-green-100 border border-green-200"
                          >
                            <Text className="text-sm text-green-700">
                              Copy to {targetDayName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {!daySchedule.isWorking && (
                <View className="py-8 items-center">
                  <Ionicons name="moon" size={32} color="#9ca3af" />
                  <Text className="text-gray-500 mt-2">Not working on {dayName}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderExceptionsTab = () => (
    <View className="flex-1">
      <Text className="text-lg font-inter-semibold text-gray-900 mb-4">
        Schedule Exceptions
      </Text>
      <Text className="text-gray-600 mb-4">
        Coming soon: Add one-time schedule changes, time off, and custom hours for specific dates.
      </Text>
      <View className="bg-blue-50 p-4 rounded-xl">
        <Text className="text-blue-700 font-inter-medium">
          Future Features:
        </Text>
        <Text className="text-blue-600 mt-2">
          • Mark days as unavailable{'\n'}
          • Set custom hours for specific dates{'\n'}
          • Add vacation periods{'\n'}
          • Emergency schedule changes
        </Text>
      </View>
    </View>
  );

  const renderPreviewTab = () => {
    const workingDays = Object.values(weeklySchedule).filter(day => day.isWorking);
    
    return (
      <View className="flex-1">
        <Text className="text-lg font-inter-semibold text-gray-900 mb-4">
          Schedule Preview
        </Text>
        
        <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <Text className="text-base font-inter-medium text-gray-800 mb-3">
            Weekly Summary
          </Text>
          <Text className="text-gray-600 mb-2">
            Working Days: {workingDays.length} of 7
          </Text>
          <Text className="text-gray-600">
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

        <View className="space-y-2">
          {dayNames.map((dayName, dayOfWeek) => {
            const daySchedule = weeklySchedule[dayOfWeek];
            if (!daySchedule) return null;

            return (
              <View key={dayOfWeek} className="bg-white rounded-lg p-3 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <Text className="font-inter-medium text-gray-800">
                    {dayName}
                  </Text>
                  {daySchedule.isWorking ? (
                    <View>
                      <Text className="text-green-600 text-sm">
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
      </View>
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
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row">
          {renderTabButton('schedule', 'Schedule', 'calendar')}
          {renderTabButton('exceptions', 'Exceptions', 'alert-circle')}
          {renderTabButton('preview', 'Preview', 'eye')}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 p-4">
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'exceptions' && renderExceptionsTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </View>
    </SafeAreaView>
  );
};

export default ScheduleManagementScreen;