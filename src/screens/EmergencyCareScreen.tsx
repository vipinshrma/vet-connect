import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Veterinarian, Clinic, UserLocation } from '../types';
import { locationService } from '../services/locationService';
import { vetService } from '../services/vetService';
import VetCard from '../components/VetCard';

type EmergencyCareNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EmergencyCareScreen: React.FC = () => {
  const navigation = useNavigation<EmergencyCareNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [emergencyVets, setEmergencyVets] = useState<Veterinarian[]>([]);
  const [emergencyClinics, setEmergencyClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    loadEmergencyServices();
  }, []);

  const loadEmergencyServices = async () => {
    try {
      setLoading(true);
      
      // Get user location
      const location = await locationService.getCurrentLocation();
      setUserLocation(location.coordinates);

      // Get emergency veterinarians and clinics
      const [vets, clinics] = await Promise.all([
        vetService.getEmergencyVets(location.coordinates, 25), // 25km radius
        vetService.getEmergencyClinics(location.coordinates, 25),
      ]);

      setEmergencyVets(vets);
      setEmergencyClinics(clinics);
    } catch (error: any) {
      console.error('Error loading emergency services:', error);
      Alert.alert(
        'Location Error',
        'Unable to find your location. Showing all emergency services.',
        [{ text: 'OK' }]
      );
      
      // Load emergency services without location
      try {
        const [vets, clinics] = await Promise.all([
          vetService.getEmergencyVets(),
          vetService.getEmergencyClinics(),
        ]);
        setEmergencyVets(vets);
        setEmergencyClinics(clinics);
      } catch (fallbackError) {
        console.error('Error loading emergency services without location:', fallbackError);
        Alert.alert('Error', 'Unable to load emergency services. Please try again later.');
      }
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
    const url = `https://maps.apple.com/?daddr=${clinic.latitude},${clinic.longitude}`;
    Linking.openURL(url);
  };

  const calculateDistance = (clinic: Clinic): number | undefined => {
    if (!userLocation) return undefined;
    return locationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      clinic.latitude,
      clinic.longitude
    );
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

  const EmergencyClinicCard = ({ clinic }: { clinic: Clinic }) => {
    const distance = calculateDistance(clinic);
    const isOpen24Hours = clinic.services.some(service => 
      service.toLowerCase().includes('24/7') || service.toLowerCase().includes('24 hour')
    );

    return (
      <View style={styles.clinicCard}>
        <View style={styles.clinicHeader}>
          <Text style={styles.clinicName}>{clinic.name}</Text>
          {isOpen24Hours && (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>24/7</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.clinicAddress}>{clinic.address}</Text>
        {distance && (
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
            description="Get directions to closest 24/7 clinic"
            iconName="location"
            onPress={() => {
              if (emergencyClinics.length > 0) {
                handleDirections(emergencyClinics[0]);
              }
            }}
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
            emergencyClinics.map((clinic) => (
              <EmergencyClinicCard key={clinic.id} clinic={clinic} />
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
            emergencyVets.map((vet) => (
              <VetCard
                key={vet.id}
                veterinarian={vet}
                distance={userLocation ? locationService.calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  // Note: We'd need vet location coordinates for accurate distance
                  0, 0 // Placeholder
                ) : undefined}
                onPress={() => navigation.navigate('VetProfile', { veterinarianId: vet.id })}
                onBookAppointment={() => navigation.navigate('BookAppointment', {
                  veterinarianId: vet.id,
                  clinicId: vet.clinic_id
                })}
                onCall={() => handleEmergencyCall(vet.phone)}
              />
            ))
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
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clinicName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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