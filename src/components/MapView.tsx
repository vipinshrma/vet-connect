import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';
import { mockClinics } from '../data/mockClinics';
import { Clinic } from '../types';

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

interface VetMapViewProps {
  clinics?: Clinic[];
  onMarkerPress?: (clinic: Clinic) => void;
  showUserLocation?: boolean;
  initialRegion?: MapRegion;
  style?: any;
}

const DEFAULT_REGION: MapRegion = {
  latitude: 37.7749, // San Francisco
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MAPBOX_ACCESS_TOKEN =
  Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (MAPBOX_ACCESS_TOKEN) {
  MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
} else {
  console.warn('Mapbox access token is not configured. Maps may not render correctly.');
}

MapboxGL.setTelemetryEnabled(false);

const getCoordinateTuple = (region: MapRegion): [number, number] => [region.longitude, region.latitude];

const calculateZoomFromDelta = (latitudeDelta?: number): number => {
  if (!latitudeDelta) return 12;
  const zoom = Math.log2(360 / latitudeDelta);
  return Math.max(3, Math.min(16, zoom));
};

const VetMapView: React.FC<VetMapViewProps> = ({
  clinics = mockClinics,
  onMarkerPress,
  showUserLocation = true,
  initialRegion = DEFAULT_REGION,
  style,
}) => {
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [initialCameraCenter, setInitialCameraCenter] = useState<[number, number] | null>(null);
  const [initialZoomLevel, setInitialZoomLevel] = useState<number>(calculateZoomFromDelta(initialRegion.latitudeDelta));
  const cameraRef = useRef<MapboxGL.Camera>(null);

  console.log("locationPermission",locationPermission)

  const fallbackToInitialRegion = () => {
    setInitialCameraCenter(getCoordinateTuple(initialRegion));
    setInitialZoomLevel(calculateZoomFromDelta(initialRegion.latitudeDelta));
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        await MapboxGL.requestAndroidLocationPermissions();
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
console.log("status",status)
      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to show nearby veterinarians.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        fallbackToInitialRegion();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      fallbackToInitialRegion();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log("location",location)

      const coordinate: [number, number] = [location.coords.longitude, location.coords.latitude];
      setInitialCameraCenter(coordinate);
      setInitialZoomLevel(13);
      animateCameraTo(coordinate, 13);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
      fallbackToInitialRegion();
    }
  };

  const animateCameraTo = (coordinate: [number, number], zoomLevel = 13) => {
    cameraRef.current?.setCamera({
      centerCoordinate: coordinate,
      zoomLevel,
      animationDuration: 1000,
    });
  };

  useEffect(() => {
    requestLocationPermission();
  }, [showUserLocation]);

  const handleMarkerPress = (clinic: Clinic) => {
    if (onMarkerPress) {
      onMarkerPress(clinic);
    }

    const coordinate: [number, number] = [
      clinic.coordinates?.longitude ?? clinic.longitude,
      clinic.coordinates?.latitude ?? clinic.latitude,
    ];

    animateCameraTo(coordinate, 14);
  };

  const getMarkerColor = (clinic: Clinic): string => {
    if (
      clinic.services.some(
        (service) => service.toLowerCase().includes('emergency') || service.toLowerCase().includes('urgent')
      )
    ) {
      return '#ef4444';
    }

    if (
      clinic.services.some(
        (service) =>
          service.toLowerCase().includes('specialty') ||
          service.toLowerCase().includes('surgery') ||
          service.toLowerCase().includes('cardiology') ||
          service.toLowerCase().includes('oncology')
      )
    ) {
      return '#3b82f6';
    }

    return '#10b981';
  };

  if (!initialCameraCenter) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapboxGL.MapView
        styleURL={MapboxGL.StyleURL.Street}
        style={styles.map}
        logoEnabled={false}
        compassEnabled
        rotateEnabled
        pitchEnabled
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCameraCenter,
            zoomLevel: initialZoomLevel,
          }}
          maxZoomLevel={18}
          minZoomLevel={3}
          followUserLocation={locationPermission && showUserLocation}
          followZoomLevel={13}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {locationPermission && showUserLocation && (
          <MapboxGL.UserLocation visible showsUserHeadingIndicator renderMode="native" />
        )}

        {clinics.map((clinic) => {
          const coordinate: [number, number] = [
            clinic.coordinates?.longitude ?? clinic.longitude,
            clinic.coordinates?.latitude ?? clinic.latitude,
          ];

          return (
            <MapboxGL.PointAnnotation
              key={clinic.id}
              id={clinic.id}
              coordinate={coordinate}
              onSelected={() => handleMarkerPress(clinic)}
            >
              <View style={[styles.marker, { backgroundColor: getMarkerColor(clinic) }]}>
                <View style={styles.markerInner} />
              </View>
            </MapboxGL.PointAnnotation>
          );
        })}
      </MapboxGL.MapView>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
});

export default VetMapView;
