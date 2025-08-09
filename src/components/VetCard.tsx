import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Veterinarian, Clinic } from '../types';
import { Ionicons } from '@expo/vector-icons';

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

  const isAvailable = veterinarian.availableSlots.some(slot => slot.isAvailable);
  const primarySpecialty = veterinarian.specialties[0] || 'General Practice';

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
            className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
              isAvailable ? 'bg-green-500' : 'bg-gray-400'
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
            <Text className="text-lg font-semibold text-gray-900 flex-1">
              {veterinarian.name}
            </Text>
            
            {distance && (
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
              {renderStars(veterinarian.rating)}
            </View>
            <Text className="text-sm text-gray-600">
              {veterinarian.rating} ({veterinarian.reviewCount} reviews)
            </Text>
          </View>

          {/* Clinic Name */}
          {clinic && (
            <Text className="text-sm text-gray-600 mb-3">
              {clinic.name}
            </Text>
          )}

          {/* Action Buttons */}
          <View className="flex-row">
            <TouchableOpacity
              onPress={handleBookAppointment}
              className="flex-1 bg-blue-600 py-2.5 px-4 rounded-lg flex-row items-center justify-center mr-2"
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
              className="bg-green-600 py-2.5 px-4 rounded-lg flex-row items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={`Call Dr. ${veterinarian.name} at ${veterinarian.phone}`}
            >
              <Ionicons name="call" size={16} color="white" />
              <Text className="text-white font-medium ml-2 text-sm">
                Call
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Experience Badge */}
      <View className="absolute top-4 right-4">
        <View className="bg-gray-100 px-2 py-1 rounded-lg">
          <Text className="text-xs font-medium text-gray-700">
            {veterinarian.experience}y exp
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default VetCard;