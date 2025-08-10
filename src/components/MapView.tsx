import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { mockClinics } from '../data/mockClinics';
import { Clinic } from '../types';

interface VetMapViewProps {
  clinics?: Clinic[];
  onMarkerPress?: (clinic: Clinic) => void;
  showUserLocation?: boolean;
  initialRegion?: Region;
  style?: any;
}

const DEFAULT_REGION: Region = {
  latitude: 37.7749, // San Francisco
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const VetMapView: React.FC<VetMapViewProps> = ({
  clinics = mockClinics,
  onMarkerPress,
  showUserLocation = true,
  initialRegion = DEFAULT_REGION,
  style,
}) => {
  const [, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(initialRegion);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      
      setUserLocation(location);
      
      // Update map region to user's location
      const newRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setCurrentRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(true);
        if (showUserLocation) {
          getCurrentLocation();
        }
      } else {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to show nearby veterinarians.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, [showUserLocation]);

  const handleMarkerPress = (clinic: Clinic) => {
    if (onMarkerPress) {
      onMarkerPress(clinic);
    }
    
    // Animate to the selected clinic
    const region: Region = {
      latitude: clinic.coordinates.latitude,
      longitude: clinic.coordinates.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    
    mapRef.current?.animateToRegion(region, 500);
  };

  const getMarkerColor = (clinic: Clinic): string => {
    // Color code based on services
    if (clinic.services.some(service => 
      service.toLowerCase().includes('emergency') || 
      service.toLowerCase().includes('urgent')
    )) {
      return '#ef4444'; // Red for emergency
    }
    
    if (clinic.services.some(service => 
      service.toLowerCase().includes('specialty') || 
      service.toLowerCase().includes('surgery')
    )) {
      return '#3b82f6'; // Blue for specialty
    }
    
    return '#10b981'; // Green for general practice
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={currentRegion}
        showsUserLocation={locationPermission && showUserLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={false}
        onRegionChangeComplete={setCurrentRegion}
      >
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            coordinate={{
              latitude: clinic.coordinates.latitude,
              longitude: clinic.coordinates.longitude,
            }}
            title={clinic.name}
            description={`${clinic.address}, ${clinic.city}`}
            pinColor={getMarkerColor(clinic)}
            onPress={() => handleMarkerPress(clinic)}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default VetMapView;