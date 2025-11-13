import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
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
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const initialCameraSettings = useMemo(
    () => ({
      centerCoordinate: getCoordinateTuple(initialRegion),
      zoomLevel: calculateZoomFromDelta(initialRegion.latitudeDelta),
    }),
    [initialRegion]
  );

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        await MapboxGL.requestAndroidLocationPermissions();
      }

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
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      animateCameraTo([location.coords.longitude, location.coords.latitude], 13);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
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
            centerCoordinate: initialCameraSettings.centerCoordinate,
            zoomLevel: initialCameraSettings.zoomLevel,
          }}
          maxZoomLevel={18}
          minZoomLevel={3}
          followUserLocation={locationPermission && showUserLocation}
          followZoomLevel={13}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {locationPermission && showUserLocation && (
          <MapboxGL.UserLocation visible showsUserHeadingIndicator />
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
