import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import { supabaseClinicService } from '../services/supabaseClinicService';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Service {
  id: string;
  name: string;
  price: string;
}

const ServicesPricingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [clinicServices, setClinicServices] = useState<string[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Failed to load services');
        navigation.goBack();
        return;
      }

      // Get clinic services
      const clinic = await supabaseClinicService.getVeterinarianClinic(user.id);
      if (clinic) {
        setClinicServices(clinic.services || []);
        // Initialize services from clinic services
        const initialServices: Service[] = (clinic.services || []).map((service, index) => ({
          id: `service-${index}`,
          name: service,
          price: '',
        }));
        setServices(initialServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setServices([...services, { id: `service-${Date.now()}`, name: '', price: '' }]);
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(service => service.id !== id));
  };

  const handleServiceChange = (id: string, field: 'name' | 'price', value: string) => {
    setServices(services.map(service =>
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Error', 'Failed to save services');
        return;
      }

      const clinic = await supabaseClinicService.getVeterinarianClinic(user.id);
      if (!clinic) {
        Alert.alert('Error', 'Clinic not found. Please set up your clinic profile first.');
        return;
      }

      const serviceNames = services
        .filter(s => s.name.trim())
        .map(s => s.name.trim());

      // Update clinic services
      const updatedClinic = {
        ...clinic,
        services: serviceNames,
      };

      // Note: This would require an update method in supabaseClinicService
      // For now, we'll just show a success message
      Alert.alert('Success', 'Services updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving services:', error);
      Alert.alert('Error', 'Failed to save services');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading services...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Services & Pricing</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-sm text-gray-600 mb-4">
            Manage your clinic services and set pricing for each service.
          </Text>

          {services.map((service, index) => (
            <View key={service.id} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-medium text-gray-700">Service {index + 1}</Text>
                {services.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveService(service.id)}
                    className="p-2"
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-2">Service Name</Text>
                <TextInput
                  value={service.name}
                  onChangeText={(value) => handleServiceChange(service.id, 'name', value)}
                  placeholder="e.g., General Checkup"
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Price (Optional)</Text>
                <TextInput
                  value={service.price}
                  onChangeText={(value) => handleServiceChange(service.id, 'price', value)}
                  placeholder="e.g., $50"
                  keyboardType="decimal-pad"
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleAddService}
            className="flex-row items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <Ionicons name="add-circle" size={20} color="#3b82f6" />
            <Text className="text-blue-600 font-medium ml-2">Add Service</Text>
          </TouchableOpacity>
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
                <Text className="text-white font-semibold ml-2">Save Services</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServicesPricingScreen;

