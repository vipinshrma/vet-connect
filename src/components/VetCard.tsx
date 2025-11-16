import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Clinic, Veterinarian } from '../types';
import { openDirections, openLocationInMaps } from '../utils/mapsUtils';

interface VetCardProps {
  veterinarian: Veterinarian;
  clinic?: Clinic;
  distance?: number; // in kilometers
  onPress?: () => void;
  onBookAppointment?: () => void;
  onCall?: () => void;
}

const VetCard: React.FC<VetCardProps> = ({
  veterinarian,
  clinic,
  distance,
  onPress,
  onBookAppointment,
  onCall,
}) => {
  const handleCall = () => {
    if (onCall) {
      onCall();
    } else {
      const phoneNumber = veterinarian.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleBookAppointment = () => {
    if (onBookAppointment) {
      onBookAppointment();
    } else {
      Alert.alert('Book Appointment', 'Booking functionality will be available soon.');
    }
  };

  const handleOpenLocation = () => {
    if (clinic?.coordinates) {
      openLocationInMaps(
        clinic.coordinates.latitude,
        clinic.coordinates.longitude,
        clinic.name,
        clinic.address
      );
    } else if (clinic?.latitude && clinic?.longitude) {
      openLocationInMaps(
        clinic.latitude,
        clinic.longitude,
        clinic.name,
        clinic.address
      );
    } else {
      Alert.alert('Location Unavailable', 'Location information is not available for this clinic.');
    }
  };

  const handleDirections = () => {
    if (clinic?.coordinates) {
      openDirections(clinic.coordinates.latitude, clinic.coordinates.longitude, clinic.name);
    } else if (clinic?.latitude && clinic?.longitude) {
      openDirections(clinic.latitude, clinic.longitude, clinic.name);
    } else {
      Alert.alert('Location Unavailable', 'Location information is not available for this clinic.');
    }
  };

  const isAvailable = veterinarian.availableSlots?.some(slot => slot.isAvailable) || false;
  const primarySpecialty = veterinarian.specialties?.[0] || 'General Practice';

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color="#fbbf24" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#fbbf24" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#d1d5db" />
      );
    }

    return stars;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm border border-gray-100"
      accessibilityRole="button"
      accessibilityLabel={`View details for Dr. ${veterinarian.name}, ${primarySpecialty} specialist with ${veterinarian.rating} star rating`}
      accessibilityHint="Tap to view full veterinarian profile"
    >
      <View className="flex-row">
        {/* Veterinarian Photo */}
        <View className="relative">
          <Image
            source={{
              uri: veterinarian.photoURL || 'https://via.placeholder.com/80x80'
            }}
            className="w-20 h-20 rounded-xl"
            accessibilityLabel={`Photo of Dr. ${veterinarian.name}`}
          />

          {/* Availability Indicator */}
          <View
            className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${isAvailable ? 'bg-green-500' : 'bg-gray-400'
              }`}
            accessibilityLabel={isAvailable ? 'Available' : 'Not available'}
          >
            <Ionicons
              name={isAvailable ? 'checkmark' : 'close'}
              size={12}
              color="white"
            />
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1 ml-4">
          {/* Header Row */}
          <View className="flex-row justify-between items-start mb-1">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {veterinarian.name || 'Veterinarian'}
              </Text>
              {/* Experience Badge */}
              <View className="bg-gray-100 px-2 py-1 rounded-lg mt-1 self-start">
                <Text className="text-xs font-medium text-gray-700">
                  {veterinarian.experience || 0}y exp
                </Text>
              </View>
            </View>

            {distance !== undefined && (
              <View className="bg-blue-50 px-2 py-1 rounded-lg ml-2">
                <View className="flex-row items-center">
                  <Ionicons name="location" size={12} color="#3b82f6" />
                  <Text className="text-xs font-medium text-blue-600 ml-1">
                    {distance.toFixed(1)} km
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Specialty */}
          <Text className="text-sm text-blue-600 font-medium mb-1">
            {primarySpecialty}
          </Text>

          {/* Rating and Reviews */}
          <View className="flex-row items-center mb-2">
            <View className="flex-row items-center mr-2">
              {renderStars(veterinarian.rating || 0)}
            </View>
            <Text className="text-sm text-gray-600">
              {veterinarian.rating?.toFixed(1) || '0.0'} ({(veterinarian.reviewCount || 0)} reviews)
            </Text>
          </View>

          {/* Clinic Name */}
          {clinic && (
            <Text className="text-sm text-gray-600 mb-3">
              {clinic.name}
            </Text>
          )}

          {/* Action Buttons */}
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={handleBookAppointment}
              className="flex-1 bg-blue-600 py-2.5 px-4 rounded-lg flex-row items-center justify-center"
              style={{ minWidth: '48%' }}
              accessibilityRole="button"
              accessibilityLabel={`Book appointment with Dr. ${veterinarian.name}`}
            >
              <Ionicons name="calendar" size={16} color="white" />
              <Text className="text-white font-medium ml-2 text-sm">
                Book
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-green-600 py-2.5 px-4 rounded-lg flex-row items-center justify-center"
              style={{ minWidth: '48%' }}
              accessibilityRole="button"
              accessibilityLabel={`Call Dr. ${veterinarian.name} at ${veterinarian.phone}`}
            >
              <Ionicons name="call" size={16} color="white" />
              <Text className="text-white font-medium ml-2 text-sm">
                Call
              </Text>
            </TouchableOpacity>

            {clinic && (clinic.coordinates || (clinic.latitude && clinic.longitude)) && (
              <>
                <TouchableOpacity
                  onPress={handleOpenLocation}
                  className="flex-1 bg-green-50 py-2.5 px-4 rounded-lg flex-row items-center justify-center border border-green-600"
                  style={{ minWidth: '48%' }}
                  accessibilityRole="button"
                  accessibilityLabel={`View location of ${clinic.name} in maps`}
                >
                  <Ionicons name="location" size={16} color="#10b981" />
                  <Text className="text-green-700 font-medium ml-2 text-sm">
                    Map
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDirections}
                  className="flex-1 bg-blue-50 py-2.5 px-4 rounded-lg flex-row items-center justify-center border border-blue-600"
                  style={{ minWidth: '48%' }}
                  accessibilityRole="button"
                  accessibilityLabel={`Get directions to ${clinic.name}`}
                >
                  <Ionicons name="navigate" size={16} color="#3b82f6" />
                  <Text className="text-blue-700 font-medium ml-2 text-sm">
                    Directions
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

      </View>


    </TouchableOpacity>
  );
};

export default VetCard;