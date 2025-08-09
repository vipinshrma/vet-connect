import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import VetMapView from '../components/MapView';
import { Clinic } from '../types';
import { mockClinics, getEmergencyClinics } from '../data/mockClinics';
import { getVeterinariansByClinic } from '../data/mockVeterinarians';
import { supabase } from '../config/supabase';

type RootStackParamList = {
  ClinicDetails: { clinicId: string };
  VetDetails: { veterinarianId: string };
  Auth: undefined;
};

type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'emergency' | 'specialty'>('all');

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
      setIsAuthLoading(false);
    }
  };

  // Calculate emergency clinic count safely
  const emergencyClinicCount = useMemo(() => {
    try {
      return getEmergencyClinics().length;
    } catch (error) {
      console.error('Error getting emergency clinic count:', error);
      return 0;
    }
  }, []);

  const filteredClinics = useMemo(() => {
    console.log('Filter type changed to:', filterType);
    
    try {
      let result: Clinic[] = [];
      
      switch (filterType) {
        case 'emergency':
          console.log('Calling getEmergencyClinics...');
          result = getEmergencyClinics();
          console.log('Emergency clinics found:', result.length);
          console.log('Emergency clinics:', result.map(c => c.name));
          break;
        case 'specialty':
          result = mockClinics.filter(clinic =>
            clinic.services?.some(service =>
              service.toLowerCase().includes('specialty') ||
              service.toLowerCase().includes('surgery') ||
              service.toLowerCase().includes('cardiology') ||
              service.toLowerCase().includes('oncology')
            )
          );
          console.log('Specialty clinics found:', result.length);
          break;
        default:
          result = mockClinics;
          console.log('All clinics:', result.length);
      }
      
      return result;
    } catch (error) {
      console.error('Error filtering clinics:', error);
      return mockClinics; // Fallback to all clinics
    }
  }, [filterType]);

  // Reset selected clinic when filter changes
  useEffect(() => {
    console.log('Filter changed, resetting selected clinic');
    setSelectedClinic(null);
  }, [filterType]);

  const handleMarkerPress = (clinic: Clinic) => {
    console.log('Marker pressed for clinic:', clinic.name);
    setSelectedClinic(clinic);
  };

  const handleClinicPress = (clinic: Clinic) => {
    console.log('Navigating to clinic details:', clinic.id);
    navigation.navigate('ClinicDetails', { clinicId: clinic.id });
  };

  const handleFilterPress = (newFilterType: 'all' | 'emergency' | 'specialty') => {
    console.log('Filter button pressed:', newFilterType);
    try {
      console.log('Clearing selected clinic...');
      setSelectedClinic(null);
      console.log('Setting filter type to:', newFilterType);
      setFilterType(newFilterType);
      console.log('Filter change completed successfully');
    } catch (error) {
      console.error('Error changing filter:', error);
    }
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterPress('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All Clinics ({mockClinics.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'emergency' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterPress('emergency')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'emergency' && styles.filterButtonTextActive,
            ]}
          >
            Emergency ({emergencyClinicCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'specialty' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterPress('specialty')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterType === 'specialty' && styles.filterButtonTextActive,
            ]}
          >
            Specialty
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderClinicCard = () => {
    if (!selectedClinic) {
      console.log('No clinic selected');
      return null;
    }

    try {
      console.log('Rendering clinic card for:', selectedClinic.name);
      const veterinarians = getVeterinariansByClinic(selectedClinic.id) || [];
      const isEmergency = selectedClinic.services?.some(service =>
        service.toLowerCase().includes('emergency')
      ) || false;

      return (
        <View style={styles.clinicCard}>
          <TouchableOpacity
            style={styles.clinicCardContent}
            onPress={() => handleClinicPress(selectedClinic)}
          >
            <View style={styles.clinicHeader}>
              <Text style={styles.clinicName}>{selectedClinic.name}</Text>
              {isEmergency && (
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyText}>24/7</Text>
                </View>
              )}
            </View>

            <Text style={styles.clinicAddress}>
              {selectedClinic.address}, {selectedClinic.city}
            </Text>

            <View style={styles.clinicInfo}>
              <Text style={styles.clinicPhone}>{selectedClinic.phone}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {selectedClinic.rating}</Text>
                <Text style={styles.reviewCount}>
                  ({selectedClinic.reviewCount} reviews)
                </Text>
              </View>
            </View>

            <Text style={styles.vetCount}>
              {veterinarians.length} veterinarian{veterinarians.length !== 1 ? 's' : ''}
            </Text>

            <Text style={styles.tapHint}>Tap for details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('Closing clinic card');
              setSelectedClinic(null);
            }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      );
    } catch (error) {
      console.error('Error rendering clinic card:', error);
      return (
        <View style={styles.clinicCard}>
          <Text style={styles.errorText}>Error loading clinic details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedClinic(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  if (isAuthLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 8 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  console.log('MapScreen rendering with', filteredClinics.length, 'clinics');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Veterinarians</Text>
        <Text style={styles.subtitle}>
          {filteredClinics.length} clinic{filteredClinics.length !== 1 ? 's' : ''} nearby
        </Text>
      </View>

      {renderFilterButtons()}

      <View style={styles.mapContainer}>
        {filteredClinics.length > 0 ? (
          <>
            {console.log('Rendering VetMapView with clinics:', filteredClinics.map(c => c.name))}
            <VetMapView
              clinics={filteredClinics}
              onMarkerPress={handleMarkerPress}
              showUserLocation={true}
              style={styles.map}
            />
          </>
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No clinics found for this filter</Text>
          </View>
        )}

        {renderClinicCard()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  noResultsText: {
    fontSize: 16,
    color: '#6b7280',
  },
  clinicCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clinicCardContent: {
    padding: 16,
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  emergencyBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emergencyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clinicAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  clinicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clinicPhone: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  vetCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    padding: 16,
  },
});

export default MapScreen;