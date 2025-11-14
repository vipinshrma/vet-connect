import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../store';
import { TabParamList, UserType } from '../types';
import { supabase } from '../config/supabase';

import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import MapScreen from '../screens/MapScreen';
import AppointmentsScreen from '../screens/main/AppointmentsScreen';
import PetsScreen from '../screens/main/PetsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import VeterinarianPatientsScreen from '../screens/vet/VeterinarianPatientsScreen';
import LoadingScreen from '../components/LoadingScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const MainNavigator: React.FC = () => {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  
  // Get user from Redux
  const reduxUser = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    getUserType();
  }, [reduxUser]);

  const getUserType = async () => {
    try {
      // First try Redux user
      if (reduxUser) {
        setUserType(reduxUser.userType);
        setIsLoading(false);
        return;
      }

      // Fallback to fetching from Supabase
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setUserType('pet-owner'); // Default fallback
        setIsLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Could not fetch user type, defaulting to pet-owner:', profileError.message);
        setUserType('pet-owner');
      } else {
        setUserType(profileData.user_type as UserType);
      }
    } catch (error) {
      console.error('Error getting user type:', error);
      setUserType('pet-owner'); // Default fallback
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              if (userType === 'veterinarian') {
                iconName = focused ? 'people' : 'people-outline'; // Patients for vets
              } else {
                iconName = focused ? 'search' : 'search-outline'; // Find vets for pet owners
              }
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Appointments':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Pets':
              iconName = focused ? 'paw' : 'paw-outline';
              break;
            case 'Profile':
              if (userType === 'veterinarian') {
                iconName = focused ? 'medical' : 'medical-outline'; // Practice for vets
              } else {
                iconName = focused ? 'person' : 'person-outline'; // Profile for pet owners
              }
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: userType === 'veterinarian' ? '#059669' : '#3B82F6', // Green for vets, blue for pet owners
        tabBarInactiveTintColor: '#6B7280',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 50 + insets.bottom : 60,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: userType === 'veterinarian' ? '#059669' : '#3B82F6', // Green for vets, blue for pet owners
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      {/* Common tabs for all users */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'VetConnect' }}
      />
      
      {/* Veterinarian-specific tabs */}
      {userType === 'veterinarian' ? (
        <>
          <Tab.Screen
            name="Appointments"
            component={AppointmentsScreen}
            options={{ title: 'My Schedule' }}
          />
          <Tab.Screen
            name="Search"
            component={VeterinarianPatientsScreen}
            options={{ title: 'Patients' }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'My Practice' }}
          />
        </>
      ) : (
        // Pet owner-specific tabs
        <>
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{ title: 'Find Vets' }}
          />
          <Tab.Screen
            name="Pets"
            component={PetsScreen}
            options={{ title: 'My Pets' }}
          />
          <Tab.Screen
            name="Map"
            component={MapScreen}
            options={{ title: 'Map View' }}
          />
          <Tab.Screen
            name="Appointments"
            component={AppointmentsScreen}
            options={{ title: 'My Appointments' }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainNavigator;