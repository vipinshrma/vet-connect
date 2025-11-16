import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { supabaseVetService } from '../services/supabaseVetService';
import { supabase } from '../config/supabase';

type VetProfileSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'VetProfileSetup'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const specialtyOptions = [
  'General Practice',
  'Surgery',
  'Internal Medicine',
  'Emergency Medicine',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Ophthalmology',
  'Dentistry',
  'Exotic Animals',
  'Large Animals',
  'Equine Medicine',
  'Wildlife Medicine',
];

const VetProfileSetupScreen: React.FC<VetProfileSetupScreenProps> = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [clinicState, setClinicState] = useState('');
  const [clinicZipCode, setClinicZipCode] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadExistingData();
  }, [userId]);

  const loadExistingData = async () => {
    try {
      setInitialLoading(true);
      const existingVet = await supabaseVetService.getVeterinarianById(userId);
      
      if (existingVet) {
        // Load existing veterinarian data
        setSelectedSpecialties(existingVet.specialties);
        setExperience(existingVet.experience.toString());
        
        // Load clinic data if exists
        if (existingVet.clinic_id) {
          const { data: clinicData, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', existingVet.clinic_id)
            .single();

          if (!error && clinicData) {
            setClinicName(clinicData.name || '');
            setClinicAddress(clinicData.address || '');
            setClinicCity(clinicData.city || '');
            setClinicState(clinicData.state || '');
            setClinicZipCode(clinicData.zip_code || '');
            setClinicPhone(clinicData.phone || '');
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      // Don't show error alert - this is expected for new users
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const handleSave = async () => {
    // Validation
    if (selectedSpecialties.length === 0) {
      Alert.alert('Error', 'Please select at least one specialty');
      return;
    }

    if (!experience || parseInt(experience) < 0) {
      Alert.alert('Error', 'Please enter a valid years of experience');
      return;
    }

    if (!clinicName.trim()) {
      Alert.alert('Error', 'Please enter clinic name');
      return;
    }

    if (!clinicAddress.trim()) {
      Alert.alert('Error', 'Please enter clinic address');
      return;
    }

    if (!clinicCity.trim()) {
      Alert.alert('Error', 'Please enter clinic city');
      return;
    }

    if (!clinicState.trim()) {
      Alert.alert('Error', 'Please enter clinic state');
      return;
    }

    try {
      setLoading(true);
      
      // First create/update the clinic in Supabase
      const clinicData = {
        name: clinicName.trim(),
        address: clinicAddress.trim(),
        city: clinicCity.trim(),
        state: clinicState.trim(),
        zip_code: clinicZipCode.trim() || '00000',
        phone: clinicPhone.trim() || '(555) 000-0000',
        email: null,
        website: null,
        latitude: 40.7128,
        longitude: -74.0060,
        services: selectedSpecialties,
        // photos: [],
        rating: 0,
        review_count: 0,
        hours: {
          friday: { is_open: true, open_time: '08:00', close_time: '18:00' },
          monday: { is_open: true, open_time: '08:00', close_time: '18:00' },
          sunday: { is_open: false },
          tuesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
          saturday: { is_open: true, open_time: '09:00', close_time: '17:00' },
          thursday: { is_open: true, open_time: '08:00', close_time: '18:00' },
          wednesday: { is_open: true, open_time: '08:00', close_time: '18:00' }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if veterinarian profile already exists first
      const existingVet = await supabaseVetService.getVeterinarianById(userId);
      let clinicId: string;
      
      if (existingVet && existingVet.clinic_id) {
        // Update existing clinic
        const { error: clinicUpdateError } = await supabase
          .from('clinics')
          .update(clinicData)
          .eq('id', existingVet.clinic_id);

        if (clinicUpdateError) {
          throw new Error(`Failed to update clinic: ${clinicUpdateError.message}`);
        }
        clinicId = existingVet.clinic_id;
      } else {
        // Create new clinic
        const { data: clinic, error: clinicError } = await supabase
          .from('clinics')
          .insert(clinicData)
          .select('id')
          .single();

        if (clinicError) {
          throw new Error(`Failed to create clinic: ${clinicError.message}`);
        }
        clinicId = clinic.id;
      }
      
      if (existingVet) {
        // Update existing veterinarian profile
        await supabaseVetService.updateVeterinarianProfile(userId, {
          specialties: selectedSpecialties,
          experience: parseInt(experience),
          clinic_id: clinicId,
        });

        Alert.alert(
          'Success',
          'Veterinarian profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Create new veterinarian profile
        await supabaseVetService.createVeterinarianProfile(userId, {
          specialties: selectedSpecialties,
          experience: parseInt(experience),
          clinic_id: clinicId,
        });

        Alert.alert(
          'Success',
          'Veterinarian profile created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating veterinarian profile:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ 
            width: 64, 
            height: 64, 
            backgroundColor: '#dbeafe', 
            borderRadius: 32, 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: 16 
          }}>
            <Ionicons name="medical" size={28} color="#3b82f6" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
            Loading Profile
          </Text>
          <Text style={{ color: '#6b7280' }}>
            Please wait while we check your information...
          </Text>
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Modern Header */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Setup Your Profile
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6b7280',
              marginTop: 4
            }}>
              Complete your veterinarian information
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
        {/* Welcome Card */}
        <View style={{
          backgroundColor: '#3b82f6',
          borderRadius: 12,
          padding: 24,
          marginTop: 24,
          marginBottom: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              <Ionicons name="medical" size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: 18
              }}>
                Welcome to VetConnect
              </Text>
              <Text style={{
                color: '#dbeafe',
                fontSize: 14,
                marginTop: 4
              }}>
                Join our community of trusted veterinarians
              </Text>
            </View>
          </View>
          <Text style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 14,
            lineHeight: 20
          }}>
            Complete your profile to start connecting with pet owners, managing appointments, and growing your practice.
          </Text>
        </View>

        {/* Professional Specialties Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          marginBottom: 24
        }}>
          <View style={{ padding: 24, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: '#dbeafe',
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}>
                <Ionicons name="school" size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#111827'
                }}>
                  Medical Specialties
                </Text>
                <Text style={{
                  color: '#2563eb',
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  Required • Select at least one
                </Text>
              </View>
            </View>
            <Text style={{
              color: '#6b7280',
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 24
            }}>
              Choose all areas of veterinary medicine you specialize in. This helps pet owners find the right care for their pets.
            </Text>
            
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -4
            }}>
              {specialtyOptions.map((specialty) => {
                const isSelected = selectedSpecialties.includes(specialty);
                return (
                  <TouchableOpacity
                    key={specialty}
                    onPress={() => toggleSpecialty(specialty)}
                    style={{
                      marginHorizontal: 4,
                      marginBottom: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      backgroundColor: isSelected ? '#3b82f6' : '#f9fafb',
                      borderColor: isSelected ? '#3b82f6' : '#e5e7eb'
                    }}
                    accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${specialty}`}
                    accessibilityRole="button"
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isSelected ? '#ffffff' : '#374151'
                    }}>
                      {specialty}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Professional Experience Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          padding: 24,
          marginBottom: 24
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              <Ionicons name="trophy" size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#111827'
              }}>
                Professional Experience
              </Text>
              <Text style={{
                color: '#10b981',
                fontSize: 14,
                fontWeight: '600'
              }}>
                Required
              </Text>
            </View>
          </View>
          <Text style={{
            color: '#6b7280',
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 24
          }}>
            How many years have you been practicing veterinary medicine?
          </Text>
          
          <View style={{ position: 'relative' }}>
            <TextInput
              value={experience}
              onChangeText={setExperience}
              placeholder="Enter years of experience (e.g., 5)"
              keyboardType="numeric"
              style={{
                height: 56,
                paddingHorizontal: 16,
                paddingRight: 48,
                backgroundColor: '#f9fafb',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                color: '#111827',
                fontSize: 16,
                fontWeight: '500'
              }}
              placeholderTextColor="#9ca3af"
              accessibilityLabel="Years of experience"
              accessibilityHint="Enter the number of years you've been practicing"
            />
            <View style={{
              position: 'absolute',
              right: 16,
              top: 0,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ color: '#9ca3af', fontWeight: '500' }}>years</Text>
            </View>
          </View>
        </View>

        {/* Clinic Information Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          marginBottom: 32
        }}>
          <View style={{ padding: 24, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 48,
                height: 48,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}>
                <Ionicons name="business" size={20} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#111827'
                }}>
                  Clinic Information
                </Text>
                <Text style={{
                  color: '#f59e0b',
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  Required • Where you practice
                </Text>
              </View>
            </View>
            <Text style={{
              color: '#6b7280',
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 32
            }}>
              Provide details about your clinic or practice location. This information helps pet owners find and contact you easily.
            </Text>
            
            <View style={{ gap: 24 }}>
              {/* Clinic Name */}
              <View>
                <Text style={{
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: 12,
                  fontSize: 16
                }}>
                  Clinic Name *
                </Text>
                <TextInput
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholder="e.g., Happy Paws Veterinary Clinic"
                  style={{
                    height: 56,
                    paddingHorizontal: 16,
                    backgroundColor: '#f9fafb',
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    borderRadius: 12,
                    color: '#111827',
                    fontSize: 16
                  }}
                  placeholderTextColor="#9ca3af"
                  accessibilityLabel="Clinic name"
                />
              </View>

              {/* Street Address */}
              <View>
                <Text style={{
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: 12,
                  fontSize: 16
                }}>
                  Street Address *
                </Text>
                <TextInput
                  value={clinicAddress}
                  onChangeText={setClinicAddress}
                  placeholder="123 Main Street, Suite 100"
                  style={{
                    height: 56,
                    paddingHorizontal: 16,
                    backgroundColor: '#f9fafb',
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    borderRadius: 12,
                    color: '#111827',
                    fontSize: 16
                  }}
                  placeholderTextColor="#9ca3af"
                  accessibilityLabel="Street address"
                />
              </View>

              {/* City and State Row */}
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: 12,
                    fontSize: 16
                  }}>
                    City *
                  </Text>
                  <TextInput
                    value={clinicCity}
                    onChangeText={setClinicCity}
                    placeholder="New York"
                    style={{
                      height: 56,
                      paddingHorizontal: 16,
                      backgroundColor: '#f9fafb',
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      color: '#111827',
                      fontSize: 16
                    }}
                    placeholderTextColor="#9ca3af"
                    accessibilityLabel="City"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: 12,
                    fontSize: 16
                  }}>
                    State *
                  </Text>
                  <TextInput
                    value={clinicState}
                    onChangeText={setClinicState}
                    placeholder="NY"
                    style={{
                      height: 56,
                      paddingHorizontal: 16,
                      backgroundColor: '#f9fafb',
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      color: '#111827',
                      fontSize: 16
                    }}
                    placeholderTextColor="#9ca3af"
                    accessibilityLabel="State"
                  />
                </View>
              </View>

              {/* ZIP Code and Phone Row */}
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: 12,
                    fontSize: 16
                  }}>
                    ZIP Code
                  </Text>
                  <TextInput
                    value={clinicZipCode}
                    onChangeText={setClinicZipCode}
                    placeholder="10001"
                    keyboardType="numeric"
                    style={{
                      height: 56,
                      paddingHorizontal: 16,
                      backgroundColor: '#f9fafb',
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      color: '#111827',
                      fontSize: 16
                    }}
                    placeholderTextColor="#9ca3af"
                    accessibilityLabel="ZIP code"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: 12,
                    fontSize: 16
                  }}>
                    Phone Number
                  </Text>
                  <TextInput
                    value={clinicPhone}
                    onChangeText={setClinicPhone}
                    placeholder="(555) 123-4567"
                    keyboardType="phone-pad"
                    style={{
                      height: 56,
                      paddingHorizontal: 16,
                      backgroundColor: '#f9fafb',
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      color: '#111827',
                      fontSize: 16
                    }}
                    placeholderTextColor="#9ca3af"
                    accessibilityLabel="Phone number"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Create Profile Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{
            height: 56,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
            marginBottom: 32
          }}
          accessibilityLabel={loading ? 'Creating profile' : 'Create profile'}
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: 16,
                marginLeft: 12
              }}>
                Creating Profile...
              </Text>
            </View>
          ) : (
            <Text style={{
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: 16
            }}>
              Create My Veterinarian Profile
            </Text>
          )}
        </TouchableOpacity>

        {/* Bottom Spacing for Safe Area */}
        <View style={{ height: 16 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VetProfileSetupScreen;