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
import { RootStackParamList, Veterinarian } from '../types';
import { supabaseVetService } from '../services/supabaseVetService';
import { supabase } from '../config/supabase';

type VetProfileEditScreenProps = NativeStackScreenProps<RootStackParamList, 'VetProfileEdit'>;
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

const VetProfileEditScreen: React.FC<VetProfileEditScreenProps> = ({ route }) => {
  const { veterinarianId='' } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [veterinarian, setVeterinarian] = useState<Veterinarian | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [clinicState, setClinicState] = useState('');
  const [clinicZipCode, setClinicZipCode] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if(!veterinarianId) return;
    loadVeterinarianData();
  }, [veterinarianId]);

  console.log("clinc",clinicCity)

  const loadVeterinarianData = async () => {
    try {
      setLoading(true);
      const vet = await supabaseVetService.getVeterinarianById(veterinarianId);
      if (vet) {
        setVeterinarian(vet);
        setSelectedSpecialties(vet.specialties);
        setExperience(vet.experience.toString());

        // Load clinic data if clinic_id exists
        if (vet.clinic_id) {
          const { data: clinicData, error: clinicError } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', vet.clinic_id)
            .single();
            console.log("clinicData",clinicData)

          if (!clinicError && clinicData) {
            setClinic(clinicData);
            setClinicName(clinicData.name || '');
            setClinicAddress(clinicData.address || '');
            setClinicCity(clinicData.city || '');
            setClinicState(clinicData.state || '');
            setClinicZipCode(clinicData.zip_code || '');
            setClinicPhone(clinicData.phone || '');
          }
        }
      } else {
        Alert.alert('Error', 'Veterinarian profile not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading veterinarian data:', error);
      Alert.alert('Error', 'Failed to load veterinarian data');
      navigation.goBack();
    } finally {
      setLoading(false);
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
      setSaving(true);
      
      // Update clinic information
      if (clinic) {
        // Update existing clinic
        const { error: clinicError } = await supabase
          .from('clinics')
          .update({
            name: clinicName.trim(),
            address: clinicAddress.trim(),
            city: clinicCity.trim(),
            state: clinicState.trim(),
            zip_code: clinicZipCode.trim() || null,
            phone: clinicPhone.trim() || null,
          })
          .eq('id', clinic.id);

        if (clinicError) {
          throw new Error(`Failed to update clinic: ${clinicError.message}`);
        }
      } else {
        // Create new clinic if none exists
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

        const { data: newClinic, error: clinicError } = await supabase
          .from('clinics')
          .insert(clinicData)
          .select('id')
          .single();

          console.log("newClinic",newClinic)

        if (clinicError) {
          throw new Error(`Failed to create clinic: ${clinicError.message}`);
        }

        // Update state with new clinic
        setClinic({ id: newClinic.id, ...clinicData });
        
        // Update veterinarian with new clinic ID
        await supabaseVetService.updateVeterinarianProfile(veterinarianId, {
          specialties: selectedSpecialties,
          experience: parseInt(experience),
          clinic_id: newClinic.id,
        });
      } 

      Alert.alert(
        'Success',
        'Profile and clinic updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating veterinarian profile:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your veterinarian profile? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabaseVetService.deleteVeterinarianProfile(veterinarianId);
              Alert.alert(
                'Deleted',
                'Your veterinarian profile has been deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error('Error deleting veterinarian profile:', error);
              Alert.alert('Error', 'Failed to delete profile. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
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
            Please wait while we fetch your information...
          </Text>
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Modern Header */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                Edit Profile
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Update your veterinarian information
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={handleDelete}
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20, 
              backgroundColor: '#fef2f2', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginLeft: 8 
            }}
            accessibilityLabel="Delete profile"
            accessibilityRole="button"
          >
            <Ionicons name="trash" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* Current Profile Info Card */}
        {veterinarian && (
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
            elevation: 8,
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
                <Ionicons name="person" size={24} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: 18
                }}>
                  Dr. {veterinarian.name}
                </Text>
                <Text style={{
                  color: '#dbeafe',
                  fontSize: 14,
                  marginTop: 4
                }}>
                  Current Profile Information
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  marginLeft: 4
                }}>
                  {veterinarian.rating}
                </Text>
                <Text style={{
                  color: '#dbeafe',
                  marginLeft: 8
                }}>
                  ({veterinarian.reviewCount} reviews)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="briefcase" size={16} color="#ffffff" />
                <Text style={{
                  color: '#ffffff',
                  marginLeft: 4
                }}>
                  {veterinarian.experience} years
                </Text>
              </View>
            </View>
          </View>
        )}

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
              Update all areas of veterinary medicine you specialize in. This helps pet owners find the right care for their pets.
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
                      borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                    }}
                    accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${specialty}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: isSelected ? '#ffffff' : '#374151',
                      }}
                    >
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
            Update your years of veterinary medicine experience.
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
              Update details about your clinic or practice location. This information helps pet owners find and contact you easily.
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

        {/* Action Buttons */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          {/* Save Changes Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              height: 56,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: saving ? '#9ca3af' : '#3b82f6',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8
            }}
            accessibilityLabel={saving ? 'Saving changes' : 'Save changes'}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
          >
            {saving ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: 16,
                  marginLeft: 12
                }}>
                  Saving Changes...
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: 16,
                  marginLeft: 8
                }}>
                  Save Changes
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Delete Profile Button */}
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              height: 56,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ef4444',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8
            }}
            accessibilityLabel="Delete profile"
            accessibilityRole="button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trash" size={20} color="#ffffff" />
              <Text style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: 16,
                marginLeft: 8
              }}>
                Delete Profile
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing for Safe Area */}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default VetProfileEditScreen;