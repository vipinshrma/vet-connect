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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import { securityActivityService } from '../services/securityActivityService';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PrivacyScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);
  const [searchVisible, setSearchVisible] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Failed to load privacy settings');
        navigation.goBack();
        return;
      }

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('privacy_profile_visible, privacy_data_sharing, privacy_location_sharing, privacy_search_visible')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading privacy settings:', profileError);
        // Use defaults if columns don't exist yet
        return;
      }

      setProfileVisibility(profile.privacy_profile_visible ?? true);
      setDataSharing(profile.privacy_data_sharing ?? false);
      setLocationSharing(profile.privacy_location_sharing ?? true);
      setSearchVisible(profile.privacy_search_visible ?? true);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySettingChange = async (field: string, value: boolean) => {
    if (!userId) return;

    try {
      setSaving(true);
      const updateField: any = {
        [field]: value,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateField)
        .eq('id', userId);

      if (error) {
        console.error('Error updating privacy setting:', error);
        Alert.alert('Error', 'Failed to update privacy setting');
        // Revert the change on error
        loadPrivacySettings();
      } else {
        // Log security activity
        await securityActivityService.logActivity(userId, 'privacy_setting_changed', {
          field,
          value,
        });
      }
    } catch (error) {
      console.error('Error saving privacy setting:', error);
      Alert.alert('Error', 'Failed to update privacy setting');
      loadPrivacySettings();
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => navigation.navigate('DeleteAccount'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading privacy settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Privacy & Security</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Privacy Settings */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</Text>

          <View className="space-y-4">
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Profile Visibility</Text>
                <Text className="text-sm text-gray-600 mt-1">Make your profile visible to other users</Text>
              </View>
              <Switch
                value={profileVisibility}
                onValueChange={(value) => {
                  setProfileVisibility(value);
                  handlePrivacySettingChange('privacy_profile_visible', value);
                }}
                disabled={saving}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Data Sharing</Text>
                <Text className="text-sm text-gray-600 mt-1">Allow data sharing for analytics</Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={(value) => {
                  setDataSharing(value);
                  handlePrivacySettingChange('privacy_data_sharing', value);
                }}
                disabled={saving}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Location Sharing</Text>
                <Text className="text-sm text-gray-600 mt-1">Allow location sharing for nearby services</Text>
              </View>
              <Switch
                value={locationSharing}
                onValueChange={(value) => {
                  setLocationSharing(value);
                  handlePrivacySettingChange('privacy_location_sharing', value);
                }}
                disabled={saving}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Search Visibility</Text>
                <Text className="text-sm text-gray-600 mt-1">Make your profile searchable by other users</Text>
              </View>
              <Switch
                value={searchVisible}
                onValueChange={(value) => {
                  setSearchVisible(value);
                  handlePrivacySettingChange('privacy_search_visible', value);
                }}
                disabled={saving}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Security</Text>

          <TouchableOpacity
            onPress={handleChangePassword}
            className="flex-row items-center justify-between py-3 border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <Ionicons name="lock-closed" size={20} color="#6b7280" />
              <Text className="text-base font-medium text-gray-900 ml-3">Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert('Two-Factor Authentication', 'Feature coming soon')}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
              <Text className="text-base font-medium text-gray-900 ml-3">Two-Factor Authentication</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Account Actions</Text>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="flex-row items-center justify-center py-3 bg-red-50 rounded-lg"
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
            <Text className="text-red-600 font-medium ml-2">Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyScreen;

