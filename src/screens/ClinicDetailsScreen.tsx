import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { supabase } from '../config/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ClinicDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ClinicDetails'>;

interface Props {
  route: ClinicDetailsScreenRouteProp;
}

const ClinicDetailsScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const { clinicId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } finally {
      setIsLoading(false);
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

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-xl font-semibold">Clinic Details Screen</Text>
      <Text className="text-gray-600 mt-2">Clinic ID: {clinicId}</Text>
      <Text className="text-gray-600 mt-2">User: {user?.email}</Text>
      <Text className="text-gray-600 mt-1">Authenticated clinic details view</Text>
    </View>
  );
};

export default ClinicDetailsScreen;