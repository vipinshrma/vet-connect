import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { supabase } from '../../config/supabase';
import { supabaseVetService } from '../../services/supabaseVetService';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasVetProfile, setHasVetProfile] = useState(false);
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        handleLogout();
        return;
      }
      setUser(user);

      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        setUserProfile(profile);

        // Check if user is a veterinarian and has a vet profile
        if (profile.user_type === 'veterinarian') {
          try {
            const vetProfile = await supabaseVetService.getVeterinarianById(user.id);
            setHasVetProfile(!!vetProfile);
          } catch (vetError) {
            console.log('No vet profile found');
            setHasVetProfile(false);
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await dispatch(logoutUser()).unwrap();
    } catch (error: any) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', error.message || 'An error occurred during logout');
    }
  };

  const handleVetProfileSetup = () => {
    if (user?.id) {
      navigation.navigate('VetProfileSetup', { userId: user.id });
    }
  };

  const handleVetProfileEdit = () => {
    if (user?.id) {
      navigation.navigate('VetProfileEdit', { veterinarianId: user.id });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading...</Text>
      </View>
    );
  }

  const isVeterinarian = userProfile?.user_type === 'veterinarian';

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
        <View className="items-center">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="person" size={32} color="#3b82f6" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-1">
            {userProfile?.name || 'User'}
          </Text>
          <Text className="text-gray-600 mb-2">{user?.email}</Text>
          <View className={`px-3 py-1 rounded-full ${
            isVeterinarian ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            <Text className={`text-sm font-medium ${
              isVeterinarian ? 'text-green-800' : 'text-blue-800'
            }`}>
              {isVeterinarian ? 'Veterinarian' : 'Pet Owner'}
            </Text>
          </View>
        </View>
      </View>

      {/* My Practice Section - Only for veterinarians */}
      {isVeterinarian && (
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <Ionicons name="business" size={20} color="#10b981" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">My Practice</Text>
          </View>

          <View className="space-y-3">
            {/* <TouchableOpacity
              className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name="storefront" size={18} color="#6b7280" />
                <Text className="text-gray-800 ml-3 font-medium">Practice Information</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </TouchableOpacity> */}

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name="list" size={18} color="#6b7280" />
                <Text className="text-gray-800 ml-3 font-medium">Services & Pricing</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={18} color="#6b7280" />
                <Text className="text-gray-800 ml-3 font-medium">Schedule & Availability</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </TouchableOpacity>

            {/* <TouchableOpacity
              className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name="analytics" size={18} color="#6b7280" />
                <Text className="text-gray-800 ml-3 font-medium">Practice Analytics</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </TouchableOpacity> */}
          </View>
        </View>
      )}

      {/* Professional Profile Section - Only for veterinarians */}
      {isVeterinarian && (
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-4">
            <Ionicons name="medical" size={20} color="#3b82f6" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Professional Profile</Text>
          </View>

          {hasVetProfile ? (
            <TouchableOpacity
              onPress={handleVetProfileEdit}
              className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name="create" size={18} color="#6b7280" />
                <Text className="text-gray-800 ml-3 font-medium">Edit Professional Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleVetProfileSetup}
              className="flex-row items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <View className="flex-row items-center">
                <Ionicons name="add-circle" size={18} color="#3b82f6" />
                <Text className="text-blue-800 ml-3 font-medium">Setup Professional Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
            </TouchableOpacity>
          )}

          {!hasVetProfile && (
            <View className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Text className="text-orange-700 text-sm">
                Complete your professional profile to start receiving appointment requests from pet owners.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Account Settings */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
        <View className="flex-row items-center mb-4">
          <Ionicons name="settings" size={20} color="#3b82f6" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">Account Settings</Text>
        </View>

        <View className="space-y-2">
          <TouchableOpacity className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="person-circle" size={18} color="#6b7280" />
              <Text className="text-gray-800 ml-3 font-medium">Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={18} color="#6b7280" />
              <Text className="text-gray-800 ml-3 font-medium">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={18} color="#6b7280" />
              <Text className="text-gray-800 ml-3 font-medium">Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Support */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
        <View className="flex-row items-center mb-4">
          <Ionicons name="help-circle" size={20} color="#3b82f6" />
          <Text className="text-lg font-semibold text-gray-900 ml-2">Support</Text>
        </View>

        <View className="space-y-2">
          <TouchableOpacity className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="chatbubble" size={18} color="#6b7280" />
              <Text className="text-gray-800 ml-3 font-medium">Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="mail" size={18} color="#6b7280" />
              <Text className="text-gray-800 ml-3 font-medium">Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View className="mx-4 mt-6 mb-8">
        <TouchableOpacity
          className="bg-red-500 py-4 rounded-lg flex-row items-center justify-center"
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;