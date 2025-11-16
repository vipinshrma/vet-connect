import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VetCard from '../components/VetCard';
import { locationService } from '../services/locationService';
import { supabaseClinicService } from '../services/supabaseClinicService';
import { supabaseVetService } from '../services/supabaseVetService';
import { Clinic, RootStackParamList, UserLocation, Veterinarian } from '../types';
import { openDirections, openLocationInMaps } from '../utils/mapsUtils';

type EmergencyCareNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type EmergencyClinicWithDistance = Clinic & {
  distance: number;
  isOpen24Hours: boolean;
  isCurrentlyOpen: boolean;
};

const EmergencyCareScreen: React.FC = () => {
  const navigation = useNavigation<EmergencyCareNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [emergencyVets, setEmergencyVets] = useState<Veterinarian[]>([]);
  const [emergencyClinics, setEmergencyClinics] = useState<EmergencyClinicWithDistance[]>([]);

  useEffect(() => {
    loadEmergencyServices();
  }, []);

  const loadEmergencyServices = async () => {
    try {
      setLoading(true);
      
      // Step 1: Get user location
      let userLocationCoords: { latitude: number; longitude: number } | null = null;
      try {
        const location = await locationService.getCurrentLocation();
        userLocationCoords = location.coordinates;
        setUserLocation(location);
        console.log('User location obtained:', userLocationCoords);
      } catch (locationError: any) {
        console.warn('Location not available, showing all emergency clinics:', locationError);
        // Continue without location - will show all clinics
      }

      // Step 2: Get emergency services from Supabase
      if (userLocationCoords) {
        // Get nearest emergency clinics with distance calculation
        try {
          let clinics = await supabaseClinicService.getNearestEmergencyClinics(
            userLocationCoords.latitude,
            userLocationCoords.longitude,
            25 // 25km radius
          );
          
          // If no results, try expanding radius
          if (clinics.length === 0) {
            console.log('No clinics found within 25km, trying 50km radius...');
            clinics = await supabaseClinicService.getNearestEmergencyClinics(
              userLocationCoords.latitude,
              userLocationCoords.longitude,
              50 // 50km radius
            );
          }
          
          setEmergencyClinics(clinics);
          console.log(`Loaded ${clinics.length} emergency clinics from Supabase`);
        } catch (clinicError) {
          console.error('Error loading emergency clinics:', clinicError);
          // Fallback to all emergency clinics
          const allClinics = await supabaseClinicService.getEmergencyClinics();
          setEmergencyClinics(allClinics.map(c => ({
            ...c,
            distance: 0,
            isOpen24Hours: false,
            isCurrentlyOpen: true
          })));
        }
      } else {
        // Fallback: Get all emergency clinics (no location)
        const allClinics = await supabaseClinicService.getEmergencyClinics();
        setEmergencyClinics(allClinics.map(c => ({
          ...c,
          distance: 0,
          isOpen24Hours: false,
          isCurrentlyOpen: true
        })));
        console.log('Loaded all emergency clinics (no location available)');
      }

      // Step 3: Get emergency veterinarians from Supabase
      try {
        const vets = await supabaseVetService.getEmergencyVeterinarians();
        
        // Calculate distances for vets if user location is available
        if (userLocationCoords && vets.length > 0) {
          const vetsWithDistance = await Promise.all(
            vets.map(async (vet) => {
              try {
                const clinic = await supabaseClinicService.getClinicById(vet.clinic_id);
                if (clinic && clinic.coordinates) {
                  const distance = locationService.calculateDistance(
                    userLocationCoords,
                    clinic.coordinates
                  );
                  return { ...vet, distance };
                }
              } catch (error) {
                console.warn(`Could not calculate distance for vet ${vet.id}:`, error);
              }
              return vet;
            })
          );
          setEmergencyVets(vetsWithDistance);
        } else {
          setEmergencyVets(vets);
        }
        
        console.log(`Loaded ${vets.length} emergency veterinarians from Supabase`);
      } catch (vetError) {
        console.error('Error loading emergency veterinarians:', vetError);
        setEmergencyVets([]);
      }
      
    } catch (error: any) {
      console.error('Error loading emergency services:', error);
      Alert.alert(
        'Error',
        'Unable to load emergency services. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyCall = (phoneNumber: string) => {
    Alert.alert(
      'Emergency Call',
      `Call ${phoneNumber} for emergency veterinary care?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
            Linking.openURL(`tel:${cleanPhone}`);
          },
        },
      ]
    );
  };

  const handleDirections = (clinic: Clinic) => {
    openDirections(clinic.latitude, clinic.longitude, clinic.name);
  };

  const handleOpenLocation = (clinic: Clinic) => {
    openLocationInMaps(clinic.latitude, clinic.longitude, clinic.name, clinic.address);
  };

  const handleFindNearestClinic = () => {
    if (emergencyClinics.length === 0) {
      Alert.alert(
        'No Clinics Found',
        'No emergency clinics found nearby. Please try calling emergency hotlines or expanding your search radius.',
        [
          { text: 'OK' },
          {
            text: 'Call Hotline',
            onPress: () => handleEmergencyCall('1-800-VET-HELP'),
            style: 'destructive'
          }
        ]
      );
      return;
    }
    
    // Get the nearest clinic (first in sorted array)
    const nearestClinic = emergencyClinics[0];
    
    // Show clinic details and options
    Alert.alert(
      `Nearest Emergency Clinic: ${nearestClinic.name}`,
      `${nearestClinic.address}\n${nearestClinic.city}, ${nearestClinic.state}\n\nDistance: ${nearestClinic.distance.toFixed(1)} km\nPhone: ${nearestClinic.phone}${nearestClinic.isOpen24Hours ? '\n\n🟢 Open 24/7' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => handleEmergencyCall(nearestClinic.phone),
          style: 'destructive'
        },
        { 
          text: 'Directions', 
          onPress: () => handleDirections(nearestClinic)
        }
      ]
    );
  };

  const calculateDistance = (clinic: EmergencyClinicWithDistance): number | undefined => {
    // Distance is already calculated in the clinic object
    return clinic.distance;
  };

  const EmergencyActionCard = ({ 
    title, 
    description, 
    iconName, 
    onPress, 
    color = '#dc2626' 
  }: {
    title: string;
    description: string;
    iconName: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.actionCard, { borderColor: color }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={iconName as any} size={32} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );

  const EmergencyClinicCard = ({ clinic, isNearest = false }: { clinic: EmergencyClinicWithDistance; isNearest?: boolean }) => {
    const distance = calculateDistance(clinic);

    return (
      <View style={[styles.clinicCard, isNearest && styles.nearestClinicCard]}>
        <View style={styles.clinicHeader}>
          <View style={styles.clinicNameContainer}>
            <Text style={styles.clinicName}>{clinic.name}</Text>
            {isNearest && (
              <View style={styles.nearestBadge}>
                <Ionicons name="location" size={12} color="white" />
                <Text style={[styles.nearestBadgeText, { marginLeft: 4 }]}>Nearest</Text>
              </View>
            )}
          </View>
          {clinic.isOpen24Hours && (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>24/7</Text>
            </View>
          )}
          {!clinic.isOpen24Hours && clinic.isCurrentlyOpen && (
            <View style={styles.openNowBadge}>
              <Text style={styles.openNowBadgeText}>Open Now</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.clinicAddress}>{clinic.address}</Text>
        {distance !== undefined && distance > 0 && (
          <Text style={styles.clinicDistance}>{distance.toFixed(1)} km away</Text>
        )}
        
        <View style={styles.clinicServices}>
          {clinic.services.slice(0, 3).map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>

        <View style={styles.clinicActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => handleEmergencyCall(clinic.phone)}
          >
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.directionsButton]}
            onPress={() => handleDirections(clinic)}
          >
            <Ionicons name="navigate" size={20} color="#3b82f6" />
            <Text style={styles.directionsButtonText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.locationButton]}
            onPress={() => handleOpenLocation(clinic)}
          >
            <Ionicons name="location" size={20} color="#10b981" />
            <Text style={styles.locationButtonText}>View Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>Finding emergency services near you...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Care</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Warning */}
        <View style={styles.emergencyWarning}>
          <Ionicons name="warning" size={24} color="#dc2626" />
          <Text style={styles.warningText}>
            If your pet is experiencing a life-threatening emergency, call immediately or visit the nearest emergency clinic.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Actions</Text>
          
          <EmergencyActionCard
            title="Call Emergency Hotline"
            description="24/7 veterinary emergency hotline"
            iconName="call"
            onPress={() => handleEmergencyCall('1-800-VET-HELP')}
            color="#dc2626"
          />
          
          <EmergencyActionCard
            title="Animal Poison Control"
            description="ASPCA Animal Poison Control Center"
            iconName="medical"
            onPress={() => handleEmergencyCall('1-888-426-4435')}
            color="#f59e0b"
          />
          
          <EmergencyActionCard
            title="Find Nearest Emergency Clinic"
            description={emergencyClinics.length > 0 && emergencyClinics[0].distance > 0
              ? `${emergencyClinics[0].distance.toFixed(1)} km away - ${emergencyClinics[0].name}`
              : emergencyClinics.length > 0
              ? `Nearest: ${emergencyClinics[0].name}`
              : "Get directions to closest 24/7 clinic"
            }
            iconName="location"
            onPress={handleFindNearestClinic}
            color="#3b82f6"
          />
        </View>

        {/* Emergency Clinics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Clinics Near You</Text>
          
          {emergencyClinics.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No emergency clinics found nearby</Text>
              <Text style={styles.emptyStateSubText}>Try expanding your search radius</Text>
            </View>
          ) : (
            emergencyClinics.map((clinic, index) => (
              <EmergencyClinicCard 
                key={clinic.id} 
                clinic={clinic} 
                isNearest={index === 0 && userLocation !== null}
              />
            ))
          )}
        </View>

        {/* Emergency Veterinarians */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Veterinarians</Text>
          
          {emergencyVets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No emergency vets found nearby</Text>
              <Text style={styles.emptyStateSubText}>Call emergency clinics directly</Text>
            </View>
          ) : (
            emergencyVets.map((vet) => {
              // Distance is already calculated in loadEmergencyServices if available
              const distance = (vet as any).distance;

              return (
                <VetCard
                  key={vet.id}
                  veterinarian={vet}
                  distance={distance}
                  onPress={() => navigation.navigate('VetProfile', { veterinarianId: vet.id })}
                  onBookAppointment={() => navigation.navigate('BookAppointment', {
                    veterinarianId: vet.id,
                    clinicId: vet.clinic_id
                  })}
                  onCall={() => handleEmergencyCall(vet.phone)}
                />
              );
            })
          )}
        </View>

        {/* Emergency Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.tipText}>Stay calm and assess your pet's condition</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.tipText}>Call ahead to let the clinic know you're coming</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.tipText}>Bring your pet's medical records if possible</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.tipText}>Have your payment method ready</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  emergencyWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  clinicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nearestClinicCard: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clinicNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginRight: 8,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  nearestBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearestBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  openBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  openNowBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openNowBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  clinicAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  clinicDistance: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: 12,
  },
  clinicServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  serviceTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  clinicActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  callButton: {
    backgroundColor: '#dc2626',
  },
  callButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  directionsButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  directionsButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  locationButton: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  tipsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
  },
});

export default EmergencyCareScreen;