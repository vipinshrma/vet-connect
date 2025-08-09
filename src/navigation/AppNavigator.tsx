import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { initializeAuth, checkOnboardingStatus } from '../store/slices/authSlice';
import { RootStackParamList } from '../types';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import VetDetailsScreen from '../screens/VetDetailsScreen';
import VetProfileScreen from '../screens/VetProfileScreen';
import VetProfileSetupScreen from '../screens/VetProfileSetupScreen';
import VetProfileEditScreen from '../screens/VetProfileEditScreen';
import VetListScreen from '../screens/VetListScreen';
import AdvancedSearchScreen from '../screens/AdvancedSearchScreen';
import ClinicDetailsScreen from '../screens/ClinicDetailsScreen';
import BookAppointmentScreen from '../screens/BookAppointmentScreen';
import RescheduleAppointmentScreen from '../screens/RescheduleAppointmentScreen';
import EmergencyCareScreen from '../screens/EmergencyCareScreen';
import PetProfileScreen from '../screens/PetProfileScreen';
import AppointmentDetailsScreen from '../screens/AppointmentDetailsScreen';
import LoadingScreen from '../components/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, hasSeenOnboarding } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
    dispatch(checkOnboardingStatus());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          {!hasSeenOnboarding && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen 
            name="VetDetails" 
            component={VetDetailsScreen}
            options={{ headerShown: true, title: 'Veterinarian Details' }}
          />
          <Stack.Screen 
            name="VetProfile" 
            component={VetProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VetProfileSetup" 
            component={VetProfileSetupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VetProfileEdit" 
            component={VetProfileEditScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VetList" 
            component={VetListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdvancedSearch" 
            component={AdvancedSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ClinicDetails" 
            component={ClinicDetailsScreen}
            options={{ headerShown: true, title: 'Clinic Details' }}
          />
          <Stack.Screen 
            name="BookAppointment" 
            component={BookAppointmentScreen}
            options={{ headerShown: true, title: 'Book Appointment' }}
          />
          <Stack.Screen 
            name="RescheduleAppointment" 
            component={RescheduleAppointmentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="EmergencyCare" 
            component={EmergencyCareScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PetProfile" 
            component={PetProfileScreen}
            options={{ headerShown: true, title: 'Pet Profile' }}
          />
          <Stack.Screen 
            name="AppointmentDetails" 
            component={AppointmentDetailsScreen}
            options={{ headerShown: true, title: 'Appointment Details' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;