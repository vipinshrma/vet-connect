import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { supabaseClinicService } from '../services/supabaseClinicService';
import { RootState } from '../store';
import { Clinic, OpeningHours, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ClinicFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  emergencyContact: string;
  licenseNumber: string;
  services: string[];
  insuranceAccepted: string[];
  paymentMethods: string[];
  hours: OpeningHours;
}

const MyClinicProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [hasManagePermission, setHasManagePermission] = useState(true);
  
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    emergencyContact: '',
    licenseNumber: '',
    services: [],
    insuranceAccepted: [],
    paymentMethods: ['cash', 'credit-card', 'debit-card'],
    hours: {
      monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      friday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
      sunday: { isOpen: false, openTime: '09:00', closeTime: '16:00' },
    },
  });

  // console.log("formData",formData)

  const [activeTab, setActiveTab] = useState<'info' | 'hours' | 'services'>('info');

  const availableServices = [
    'General Checkup',
    'Vaccinations', 
    'Surgery',
    'Dental Care',
    'Emergency Care',
    'X-Ray',
    'Laboratory Tests',
    'Grooming',
    'Boarding',
    'Microchipping',
    'Spay/Neuter',
    'Wellness Exams',
    'Behavioral Consultation',
    'Nutritional Counseling',
    'Senior Pet Care',
    'Puppy/Kitten Care',
    'Chronic Disease Management',
    'Pain Management',
    'Physical Therapy',
    'Ultrasound'
  ];


  const insuranceOptions = [
    'Nationwide',
    'ASPCA Pet Insurance',
    'Pets Best',
    'Healthy Paws',
    'Petplan',
    'Embrace',
    'Figo',
    'PetFirst',
    'AKC Pet Insurance',
    'Spot Pet Insurance'
  ];

  const paymentOptions = [
    { key: 'cash', label: 'Cash' },
    { key: 'credit-card', label: 'Credit Card' },
    { key: 'debit-card', label: 'Debit Card' },
    { key: 'check', label: 'Check' },
    { key: 'care-credit', label: 'CareCredit' },
    { key: 'pet-insurance', label: 'Pet Insurance' },
    { key: 'payment-plan', label: 'Payment Plans' }
  ];

  useEffect(() => {
    if (user?.id) {
      loadClinicData();
    }
  }, [user?.id]); // Only re-run when user ID changes, not the entire user object

  const loadClinicData = async () => {
    if (!user?.id) return;

    try {
      console.log('Starting to load clinic data for user:', user.id);
      setLoading(true);
      
      // Get veterinarian's clinic
      const vetClinic = await supabaseClinicService.getVeterinarianClinic(user.id);
      
      if (vetClinic) {
        setClinic(vetClinic);
        
        // Check if user has management permissions
        // TODO: Add permissions check
        // const permissions = await supabaseClinicService.getClinicPermissions(user.id, vetClinic.id);
        // setHasManagePermission(permissions.canManage);
        
        // Populate form data
        setFormData({
          name: vetClinic.name,
          address: vetClinic.address,
          city: vetClinic.city,
          state: vetClinic.state,
          zip_code: vetClinic.zip_code,
          phone: vetClinic.phone,
          email: vetClinic.email || '',
          website: vetClinic.website || '',
          description: vetClinic.description || '',
          emergencyContact: vetClinic.emergencyContact || '',
          licenseNumber: vetClinic.licenseNumber || '',
          services: vetClinic.services || [],
          insuranceAccepted: vetClinic.insuranceAccepted || [],
          paymentMethods: vetClinic.paymentMethods || ['cash', 'credit-card', 'debit-card'],
          hours: vetClinic.hours,
        });
      }
    } catch (error) {
      console.error('Error loading clinic data:', error);
      // Don't show alert for every error, just log it
      // Alert.alert('Error', 'Failed to load clinic information');
    } finally {
      console.log('Finished loading clinic data, setting loading to false');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clinic || !hasManagePermission) {
      Alert.alert('Permission Denied', 'You do not have permission to edit this clinic');
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website: formData.website.trim(),
        description: formData.description.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        services: formData.services,
        insuranceAccepted: formData.insuranceAccepted,
        paymentMethods: formData.paymentMethods,
        hours: formData.hours,
      };

      await supabaseClinicService.updateClinic(clinic.id, updateData);
      
      Alert.alert('Success', 'Clinic profile updated successfully');
      
      // Don't reload - the form data should already be correct since user entered it
      // Only update the clinic object's updatedAt timestamp
      setClinic(prev => prev ? {
        ...prev,
        updatedAt: new Date().toISOString(),
      } : null);
    } catch (error) {
      console.error('Error saving clinic data:', error);
      Alert.alert('Error', 'Failed to update clinic profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };


  const toggleInsurance = (insurance: string) => {
    setFormData(prev => ({
      ...prev,
      insuranceAccepted: prev.insuranceAccepted.includes(insurance)
        ? prev.insuranceAccepted.filter(i => i !== insurance)
        : [...prev.insuranceAccepted, insurance]
    }));
  };

  const togglePaymentMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }));
  };

  const updateHours = (day: keyof OpeningHours, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value
        }
      }
    }));
  };

  const renderTabButton = (tab: typeof activeTab, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      onPress={() => setActiveTab(tab)}
      className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg mx-1 ${
        activeTab === tab ? 'bg-blue-500' : 'bg-gray-100'
      }`}
    >
      <Ionicons 
        name={icon as any} 
        size={18} 
        color={activeTab === tab ? '#fff' : '#6b7280'} 
      />
      <Text className={`ml-2 font-medium ${
        activeTab === tab ? 'text-white' : 'text-gray-600'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderInfoTab = () => (
    <View className="space-y-6">
      {/* Basic Information */}
      <View className="bg-white rounded-xl p-4">
        <Text className="text-lg font-inter-semibold text-gray-900 mb-4">
          Basic Information
        </Text>
        
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-2">
              Clinic Name *
            </Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter clinic name"
              editable={hasManagePermission}
            />
          </View>

          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-2">
              Description
            </Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe your clinic and approach to veterinary care"
              multiline
              numberOfLines={4}
              editable={hasManagePermission}
            />
          </View>

          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-2">
              License Number
            </Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
              value={formData.licenseNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, licenseNumber: text }))}
              placeholder="Veterinary license number"
              editable={hasManagePermission}
            />
          </View>
        </View>
      </View>

      {/* Contact Information */}
      <View className="bg-white rounded-xl p-4">
        <Text className="text-lg font-inter-semibold text-gray-900 mb-4">
          Contact Information
        </Text>
        
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-2">
              Address *
            </Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              placeholder="Street address"
              editable={hasManagePermission}
            />
          </View>

          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Text className="text-sm font-inter-medium text-gray-700 mb-2">
                City *
              </Text>
              <TextInput
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder="City"
                editable={hasManagePermission}
              />
            </View>

            <View className="w-20">
              <Text className="text-sm font-inter-medium text-gray-700 mb-2">
                State *
              </Text>
              <TextInput
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                value={formData.state}
                onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                placeholder="ST"
                editable={hasManagePermission}
              />
            </View>

            <View className="w-24">
              <Text className="text-sm font-inter-medium text-gray-700 mb-2">
                ZIP *
              </Text>
              <TextInput
                className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                value={formData.zip_code}
                onChangeText={(text) => setFormData(prev => ({ ...prev, zip_code: text }))}
                placeholder="12345"
                editable={hasManagePermission}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-2">
              Phone Number *
            </Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              editable={hasManagePermission}
            />
          </View>

          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-2">
              Email
            </Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="contact@clinic.com"
              keyboardType="email-address"
              editable={hasManagePermission}
            />
          </View>

          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-2">
              Website
            </Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
              value={formData.website}
              onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
              placeholder="https://www.clinic.com"
              editable={hasManagePermission}
            />
          </View>

          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-2">
              Emergency Contact
            </Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
              value={formData.emergencyContact}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContact: text }))}
              placeholder="After-hours emergency phone number"
              keyboardType="phone-pad"
              editable={hasManagePermission}
            />
          </View>
        </View>
      </View>

      {/* Payment & Insurance */}
      <View className="bg-white rounded-xl p-4">
        <Text className="text-lg font-inter-semibold text-gray-900 mb-4">
          Payment & Insurance
        </Text>
        
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-3">
              Payment Methods Accepted
            </Text>
            <View className="flex-row flex-wrap">
              {paymentOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => hasManagePermission && togglePaymentMethod(option.key)}
                  disabled={!hasManagePermission}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                    formData.paymentMethods.includes(option.key)
                      ? 'bg-blue-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm ${
                    formData.paymentMethods.includes(option.key)
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-sm font-inter-medium text-gray-700 mb-3">
              Insurance Providers Accepted
            </Text>
            <View className="flex-row flex-wrap">
              {insuranceOptions.map((insurance) => (
                <TouchableOpacity
                  key={insurance}
                  onPress={() => hasManagePermission && toggleInsurance(insurance)}
                  disabled={!hasManagePermission}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                    formData.insuranceAccepted.includes(insurance)
                      ? 'bg-green-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm ${
                    formData.insuranceAccepted.includes(insurance)
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}>
                    {insurance}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderHoursTab = () => (
    <View className="bg-white rounded-xl p-4">
      <Text className="text-lg font-inter-semibold text-gray-900 mb-4">
        Opening Hours
      </Text>
      
      {Object.keys(formData.hours).map((day) => {
        const dayData = formData.hours[day as keyof OpeningHours];
        const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
        
        // Debug: Log the day data to see what's missing
        // console.log(`${capitalizedDay} data:`, JSON.stringify(dayData, null, 2));
        
        return (
          <View key={day} className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-base font-inter-medium text-gray-900 w-24">
              {capitalizedDay}
            </Text>
            
            <Switch
              value={dayData.isOpen}
              onValueChange={(value) => {
                if (hasManagePermission) {
                  updateHours(day as keyof OpeningHours, 'isOpen', value);
                }
              }}
              disabled={!hasManagePermission}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={dayData.isOpen ? '#ffffff' : '#f3f4f6'}
            />
            
            {dayData.isOpen && (
              <View className="flex-row items-center">
                <TextInput
                  className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 w-20 text-center mr-2"
                  value={dayData.openTime || ''}
                  onChangeText={(value) => {
                    if (hasManagePermission) {
                      updateHours(day as keyof OpeningHours, 'openTime', value);
                    }
                  }}
                  placeholder="08:00"
                  editable={hasManagePermission}
                  style={{ minHeight: 40 }} // Ensure minimum height
                />
                <Text className="text-gray-500 mx-2">to</Text>
                <TextInput
                  className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 w-20 text-center"
                  value={dayData.closeTime || ''}
                  onChangeText={(value) => {
                    if (hasManagePermission) {
                      updateHours(day as keyof OpeningHours, 'closeTime', value);
                    }
                  }}
                  placeholder="18:00"
                  editable={hasManagePermission}
                  style={{ minHeight: 40 }} // Ensure minimum height
                />
              </View>
            )}
            
            {!dayData.isOpen && (
              <Text className="text-gray-500 text-right flex-1">Closed</Text>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderServicesTab = () => (
    <View className="space-y-6">
      {/* Services */}
      <View className="bg-white rounded-xl p-4">
        <Text className="text-lg font-inter-semibold text-gray-900 mb-4">
          Services Offered ({formData.services.length} selected)
        </Text>
        <View className="flex-row flex-wrap">
          {availableServices.map((service) => (
            <TouchableOpacity
              key={service}
              onPress={() => hasManagePermission && toggleService(service)}
              disabled={!hasManagePermission}
              className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                formData.services.includes(service)
                  ? 'bg-blue-500'
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm ${
                formData.services.includes(service)
                  ? 'text-white'
                  : 'text-gray-700'
              }`}>
                {service}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Computed Specialities */}
      <View className="bg-white rounded-xl p-4">
        <Text className="text-lg font-inter-semibold text-gray-900 mb-4">
          Clinic Specialities
        </Text>
        <Text className="text-sm text-gray-600 mb-3">
          Specialities are automatically calculated from the veterinarians working at this clinic.
        </Text>
        <View className="flex-row flex-wrap">
          <View className="px-3 py-2 rounded-full mr-2 mb-2 bg-gray-100">
            <Text className="text-sm text-gray-700">
              Computed from veterinarian specialties
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading clinic profile...</Text>
      </SafeAreaView>
    );
  }

  if (!clinic) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Ionicons name="business" size={64} color="#d1d5db" />
        <Text className="text-xl font-inter-semibold text-gray-900 mt-4">
          No Clinic Associated
        </Text>
        <Text className="text-gray-600 mt-2 text-center px-8">
          You are not associated with any clinic yet. Contact your clinic administrator to be added.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="ml-3 text-lg font-inter-semibold text-gray-900">
              My Clinic Profile
            </Text>
          </View>
          
          {hasManagePermission && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="white" />
                  <Text className="text-white font-inter-semibold ml-1">Save</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {!hasManagePermission && (
          <Text className="text-sm text-amber-600 mt-2">
            Read-only: You don't have permission to edit this clinic profile
          </Text>
        )}
      </View>

      {/* Tab Navigation */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row">
          {renderTabButton('info', 'Info', 'information-circle')}
          {renderTabButton('hours', 'Hours', 'time')}
          {renderTabButton('services', 'Services', 'medical')}
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'hours' && renderHoursTab()}
          {activeTab === 'services' && renderServicesTab()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyClinicProfileScreen;