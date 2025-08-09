import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VeterinarianPatientsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        Alert.alert('Error', 'Please login to access this page');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-green-50 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 mt-2">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-green-50" edges={['top']}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-green-700 mb-3">
            My Patients 🩺
          </Text>
          <Text className="text-base text-green-600 leading-6">
            Manage your patient records and appointments
          </Text>
        </View>

        {/* Coming Soon Message */}
        <View className="bg-white p-6 rounded-xl border border-green-100 mb-6">
          <View className="items-center">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="people" size={32} color="#059669" />
            </View>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              Patient Management Coming Soon
            </Text>
            <Text className="text-gray-600 text-center mb-6 leading-6">
              We're building comprehensive patient management tools for veterinarians. 
              This will include patient records, appointment history, and medical notes.
            </Text>
            <View className="bg-green-50 px-4 py-2 rounded-full">
              <Text className="text-green-700 font-medium">In Development</Text>
            </View>
          </View>
        </View>

        {/* Planned Features */}
        <View className="bg-white p-6 rounded-xl border border-green-100 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Planned Features
          </Text>
          
          {[
            'View all your patient pets',
            'Access complete medical histories',
            'Track vaccination schedules',
            'Review appointment notes',
            'Manage treatment plans',
            'Direct messaging with pet parents'
          ].map((feature, index) => (
            <View key={index} className="flex-row items-center mb-3">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              <Text className="text-gray-700 flex-1">{feature}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="bg-white p-6 rounded-xl border border-green-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Available Now
          </Text>
          
          <TouchableOpacity
            className="bg-green-600 py-4 px-6 rounded-lg flex-row items-center justify-center mb-3"
            onPress={() => navigation.navigate('Appointments' as any)}
          >
            <Ionicons name="calendar" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">View My Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-green-100 py-4 px-6 rounded-lg flex-row items-center justify-center"
            onPress={() => navigation.navigate('Profile' as any)}
          >
            <Ionicons name="medical" size={20} color="#059669" />
            <Text className="text-green-700 font-semibold ml-2">Update My Practice Info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VeterinarianPatientsScreen;