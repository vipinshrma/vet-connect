import { Linking, Platform, Alert } from 'react-native';

/**
 * Opens the location in Google Maps (Android) or Apple Maps (iOS)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param label - Optional label/name for the location (e.g., clinic name)
 * @param address - Optional address string
 */
export const openLocationInMaps = async (
  latitude: number,
  longitude: number,
  label?: string,
  address?: string
): Promise<void> => {
  const locationName = label || address || 'Location';
  const query = address || `${latitude},${longitude}`;

  let url = '';

  if (Platform.OS === 'ios') {
    // Try to open Google Maps if installed, otherwise fall back to Apple Maps
    const googleMapsUrl = `comgooglemaps://?q=${encodeURIComponent(query)}&center=${latitude},${longitude}`;
    const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(query)}&ll=${latitude},${longitude}`;

    // Check if Google Maps is installed
    const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
    
    if (canOpenGoogleMaps) {
      url = googleMapsUrl;
    } else {
      url = appleMapsUrl;
    }
  } else {
    // Android - Use Google Maps
    url = `geo:${latitude},${longitude}?q=${encodeURIComponent(query)}`;
    
    // Fallback to Google Maps web if geo: scheme doesn't work
    const googleMapsWebUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    
    // Try geo: scheme first (native Google Maps)
    const canOpenGeo = await Linking.canOpenURL(url);
    if (!canOpenGeo) {
      url = googleMapsWebUrl;
    }
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web-based maps
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('Error opening maps:', error);
    Alert.alert(
      'Error',
      'Unable to open maps. Please ensure you have a maps app installed.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Opens directions to a location
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param label - Optional label/name for the destination
 */
export const openDirections = async (
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> => {
  const destination = label || `${latitude},${longitude}`;

  let url = '';

  if (Platform.OS === 'ios') {
    // Try Google Maps directions if installed
    const googleMapsUrl = `comgooglemaps://?daddr=${encodeURIComponent(destination)}&directionsmode=driving`;
    const appleMapsUrl = `maps://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`;

    const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
    url = canOpenGoogleMaps ? googleMapsUrl : appleMapsUrl;
  } else {
    // Android - Google Maps directions
    url = `google.navigation:q=${latitude},${longitude}`;
    
    // Fallback to web
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    }
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web-based directions
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('Error opening directions:', error);
    Alert.alert(
      'Error',
      'Unable to open directions. Please ensure you have a maps app installed.',
      [{ text: 'OK' }]
    );
  }
};

