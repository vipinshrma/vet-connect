import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Failed to load notification preferences');
        navigation.goBack();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('notification_push_enabled, notification_email_enabled, notification_appointment_reminders, notification_marketing_emails')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading notification preferences:', profileError);
        // Use defaults if profile doesn't have notification columns yet
        return;
      }

      // Set values from database, with defaults if null
      setPushNotifications(profile.notification_push_enabled ?? true);
      setEmailNotifications(profile.notification_email_enabled ?? true);
      setAppointmentReminders(profile.notification_appointment_reminders ?? true);
      setMarketingEmails(profile.notification_marketing_emails ?? false);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (field: string, value: boolean) => {
    try {
      setSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Failed to update notification preferences');
        return;
      }

      const updateField: any = {
        [field]: value,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateField)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating notification preferences:', error);
        Alert.alert('Error', 'Failed to update notification preferences');
        // Revert the change on error
        loadNotificationPreferences();
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
      loadNotificationPreferences();
    } finally {
      setSaving(false);
    }
  };

  const handlePushNotificationsChange = (value: boolean) => {
    setPushNotifications(value);
    handleSave('notification_push_enabled', value);
  };

  const handleEmailNotificationsChange = (value: boolean) => {
    setEmailNotifications(value);
    handleSave('notification_email_enabled', value);
  };

  const handleAppointmentRemindersChange = (value: boolean) => {
    setAppointmentReminders(value);
    handleSave('notification_appointment_reminders', value);
  };

  const handleMarketingEmailsChange = (value: boolean) => {
    setMarketingEmails(value);
    handleSave('notification_marketing_emails', value);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading preferences...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Notifications</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-sm text-gray-600 mb-4">
            Manage your notification preferences
          </Text>

          <View className="space-y-4">
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Push Notifications</Text>
                <Text className="text-sm text-gray-600 mt-1">Receive push notifications on your device</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={handlePushNotificationsChange}
                disabled={saving}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Email Notifications</Text>
                <Text className="text-sm text-gray-600 mt-1">Receive notifications via email</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={handleEmailNotificationsChange}
                disabled={saving}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Appointment Reminders</Text>
                <Text className="text-sm text-gray-600 mt-1">Get reminded about upcoming appointments</Text>
              </View>
              <Switch
                value={appointmentReminders}
                onValueChange={handleAppointmentRemindersChange}
                disabled={saving}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Marketing Emails</Text>
                <Text className="text-sm text-gray-600 mt-1">Receive updates and promotional emails</Text>
              </View>
              <Switch
                value={marketingEmails}
                onValueChange={handleMarketingEmailsChange}
                disabled={saving}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

