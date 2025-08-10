import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { supabase } from '../../config/supabase';
import { RootStackParamList, User, UserType } from '../../types';
import { IconSymbol } from '@/components/ui/IconSymbol';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeScreenProps {
  navigation?: any;
}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Get user from Redux if available
  const reduxUser = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    checkAuth();
  }, [reduxUser]);

  const checkAuth = async () => {
    try {
      // First try to use Redux user if available
      if (reduxUser) {
        setUser(reduxUser);
        setIsLoading(false);
        return;
      }

      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        handleLogout();
        return;
      }

      // Fetch user profile to get userType and other details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Profile fetch failed:', profileError);
        // Use basic auth user info as fallback
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || '',
          phone: authUser.user_metadata?.phone || '',
          userType: (authUser.user_metadata?.userType as UserType) || 'pet-owner',
          createdAt: authUser.created_at,
          updatedAt: authUser.updated_at || authUser.created_at,
        });
      } else {
        // Use profile data
        setUser({
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          phone: profileData.phone,
          userType: profileData.user_type as UserType,
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
        });
        setUserProfile(profileData);
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

  // Get quick actions based on user type
  const getQuickActionsForUserType = (userType: UserType) => {
    if (userType === 'veterinarian') {
      return [
        {
          title: "My Appointments",
          description: "View and manage your upcoming appointments",
          iconName: "calendar",
          onPress: () => navigation?.navigate('Appointments'),
          isComingSoon: false
        },
        {
          title: "Patient Records",
          description: "Access your patients' medical records",
          iconName: "heart",
          onPress: undefined,
          isComingSoon: true
        },
        {
          title: "My Clinic Profile",
          description: "Update your professional information",
          iconName: "person",
          onPress: () => navigation?.navigate('MyClinicProfile'),
          isComingSoon: false
        },
        {
          title: "Schedule Management",
          description: "Manage your availability and time slots",
          iconName: "clock",
          onPress: undefined,
          isComingSoon: true
        }
      ];
    } else {
      // Pet owner actions
      return [
        {
          title: "Find Nearby Vets",
          description: "Discover veterinarians in your area",
          iconName: "location",
          onPress: () => navigation?.navigate('VetList'),
          isComingSoon: false
        },
        {
          title: "My Pets",
          description: "Manage your pets' profiles and records",
          iconName: "paw",
          onPress: () => navigation?.navigate('Pets'),
          isComingSoon: false
        },
        {
          title: "Emergency Care",
          description: "24/7 emergency veterinary services",
          iconName: "phone",
          onPress: () => navigation?.navigate('EmergencyCare'),
          isComingSoon: false
        },
        {
          title: "Book Appointment",
          description: "Schedule your pet's next visit",
          iconName: "calendar",
          onPress: () => navigation?.navigate('VetList', { bookingMode: true }),
          isComingSoon: false
        }
      ];
    }
  };

  const QuickActionCard = ({ 
    title, 
    description, 
    iconName,
    onPress,
    isComingSoon = true 
  }: { 
    title: string; 
    description: string; 
    iconName: string;
    onPress?: () => void;
    isComingSoon?: boolean;
  }) => (
    <TouchableOpacity
      className={`bg-white p-6 rounded-xl border border-secondary-100 mb-4 ${
        isComingSoon ? 'opacity-60' : ''
      }`}
      onPress={onPress}
      disabled={isComingSoon}
      accessibilityRole="button"
      accessibilityLabel={`${title} ${isComingSoon ? 'coming soon' : ''}`}
      accessibilityHint={isComingSoon ? 'This feature is not yet available' : description}
      style={{ minHeight: 44 }}
    >
      <View className="flex-row items-center">
        <View className="bg-primary-50 p-3 rounded-lg mr-4">
          <IconSymbol
            size={24}
            color="#0369a1"
            name={iconName}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-inter-semibold text-secondary-700">
              {title}
            </Text>
            {isComingSoon && (
              <View className="bg-warning px-2 py-1 rounded-full">
                <Text className="text-xs font-inter-medium text-white">Soon</Text>
              </View>
            )}
          </View>
          <Text className="text-sm font-inter text-secondary-600 mt-1 leading-5">
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-secondary-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-secondary-50" edges={['top']}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
        accessibilityLabel="VetConnect home screen"
      >
        {/* Welcome Section */}
        <View className="mb-8">
          <Text 
            className="text-2xl font-inter-bold text-primary-700 mb-3"
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            Welcome to VetConnect
          </Text>
          
          {user && (
            <View className="mb-4">
              <Text className="text-lg font-inter-semibold text-secondary-700 mb-1">
                Hello, {user.name || user.email}! 👋
              </Text>
              <Text className="text-sm font-inter text-secondary-600">
                {user.email} • {user.userType === 'veterinarian' ? 'Veterinarian' : 'Pet Owner'}
              </Text>
            </View>
          )}
          
          <Text 
            className="text-base font-inter text-secondary-600 leading-6"
            accessibilityRole="text"
          >
            {user?.userType === 'veterinarian' 
              ? 'Your professional platform for managing veterinary practice and connecting with pet parents'
              : 'Your trusted companion for finding quality veterinary care'
            }
          </Text>
        </View>

        {/* Quick Actions */}
        <View 
          className="mb-8"
          accessibilityRole="region"
          accessibilityLabel="Quick actions"
        >
          <Text 
            className="text-lg font-inter-semibold text-secondary-700 mb-4"
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            {user?.userType === 'veterinarian' ? 'Veterinarian Tools' : 'Quick Actions'}
          </Text>
          
          {user && getQuickActionsForUserType(user.userType).map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              description={action.description}
              iconName={action.iconName}
              onPress={action.onPress}
              isComingSoon={action.isComingSoon}
            />
          ))}
        </View>

        {/* Development Status */}
        <View 
          className="bg-green-50 p-6 rounded-xl mb-6"
          accessibilityRole="region"
          accessibilityLabel="Development status"
        >
          <Text 
            className="text-lg font-inter-semibold text-green-700 mb-3"
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            {user?.userType === 'veterinarian' ? 'Veterinarian Portal Active! 🩺' : 'Phase 4 Features Now Available! 🎉'}
          </Text>
          <Text 
            className="text-sm font-inter text-green-600 leading-6"
            accessibilityRole="text"
          >
            {user?.userType === 'veterinarian' 
              ? 'Welcome to your veterinarian dashboard! Manage appointments, view patient records, and update your professional profile. More features coming soon!'
              : 'Vet discovery, detailed profiles, search filters, and pet management are now ready! Tap "Find Nearby Vets" to explore veterinarians in your area.'
            }
          </Text>
        </View>

        {/* Debug & Logout Buttons */}
        <View className="space-y-3">
          <TouchableOpacity
            className="bg-secondary-100 rounded-xl py-3 px-6 items-center"
            onPress={() => Alert.alert('Debug', 'Debug info coming soon')}
            accessibilityRole="button"
            accessibilityLabel="Debug storage info"
            style={{ minHeight: 48 }}
          >
            <Text className="text-secondary-700 font-inter-medium">Debug Storage Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-error rounded-xl py-3 px-6 items-center"
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            style={{ minHeight: 48 }}
          >
            <Text className="text-white font-inter-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;