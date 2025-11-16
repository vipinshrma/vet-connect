import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import { supabaseVetService } from '../services/supabaseVetService';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EditUserProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Failed to load user data');
        navigation.goBack();
        return;
      }

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        Alert.alert('Error', 'Failed to load profile');
        return;
      }

      setName(profile.name || '');
      setEmail(profile.email || user.email || '');
      setPhone(profile.phone || '');
      setPhotoUrl(profile.photo_url || null);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not available');
      return;
    }

    try {
      setUploadingPhoto(true);
      // Use the vet service method which works for all users (it updates profiles table)
      const url = await supabaseVetService.selectAndUploadVetPhoto(userId, {
        onImageSelected: () => setUploadingPhoto(true),
      });
      
      if (url) {
        setPhotoUrl(url);
        Alert.alert('Success', 'Profile photo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Edit Profile</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          {/* Photo Section */}
          <View className="items-center mb-6">
            <View className="relative">
              <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center overflow-hidden">
                {uploadingPhoto ? (
                  <View className="w-24 h-24 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                  </View>
                ) : photoUrl ? (
                  <Image source={{ uri: photoUrl }} className="w-24 h-24 rounded-full" />
                ) : (
                  <Ionicons name="person" size={48} color="#3b82f6" />
                )}
              </View>
              {uploadingPhoto && (
                <View className="absolute inset-0 bg-black/30 rounded-full items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handlePhotoUpload}
              disabled={uploadingPhoto}
              className={`bg-blue-500 px-4 py-2 rounded-lg mt-3 ${
                uploadingPhoto ? 'opacity-50' : ''
              }`}
            >
              {uploadingPhoto ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-medium ml-2">Uploading...</Text>
                </View>
              ) : (
                <Text className="text-white font-medium">
                  {photoUrl ? 'Change Photo' : 'Add Photo'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
              className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500"
              placeholderTextColor="#9ca3af"
            />
            <Text className="text-xs text-gray-500 mt-1">Email cannot be changed</Text>
          </View>

          {/* Phone */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Save Button */}
        <View className="mx-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`bg-blue-500 py-4 rounded-lg flex-row items-center justify-center ${
              saving ? 'opacity-50' : ''
            }`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditUserProfileScreen;

