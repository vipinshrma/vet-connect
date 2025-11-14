import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pet } from '../types';

interface PetCardProps {
  pet: Pet;
  onPress: () => void;
  onEdit?: () => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onPress, onEdit }) => {
  const getSpeciesIcon = (species: string) => {
    switch (species) {
      case 'dog':
        return 'paw-outline';
      case 'cat':
        return 'paw-outline';
      case 'bird':
        return 'leaf-outline';
      case 'rabbit':
        return 'paw-outline';
      default:
        return 'heart-outline';
    }
  };

  const getAgeText = (age: number) => {
    if (age < 1) {
      const months = Math.round(age * 12);
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${age} ${age === 1 ? 'year' : 'years'}`;
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start flex-1">
          {/* Pet Photo or Icon */}
          <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mr-4">
            {pet.photoURL ? (
              <Image
                source={{ uri: pet.photoURL }}
                className="w-16 h-16 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name={getSpeciesIcon(pet.species)}
                size={24}
                color="#3B82F6"
              />
            )}
          </View>

          {/* Pet Info */}
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {pet.name}
            </Text>
            
            <View className="flex-row items-center mb-1">
              <Text className="text-sm text-gray-600">
                {capitalizeFirst(pet.species)}
              </Text>
              {pet.breed && (
                <>
                  <Text className="text-sm text-gray-400 mx-1">•</Text>
                  <Text className="text-sm text-gray-600">{pet.breed}</Text>
                </>
              )}
            </View>

            <View className="flex-row items-center mb-2">
              <Text className="text-sm text-gray-600">
                {getAgeText(pet.age)}
              </Text>
              <Text className="text-sm text-gray-400 mx-1">•</Text>
              <Text className="text-sm text-gray-600">
                {capitalizeFirst(pet.gender)}
              </Text>
              {pet.weight && (
                <>
                  <Text className="text-sm text-gray-400 mx-1">•</Text>
                  <Text className="text-sm text-gray-600">{pet.weight}kg</Text>
                </>
              )}
            </View>

            {/* Vaccination Status */}
            {pet.vaccinations && pet.vaccinations.length > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text className="text-sm text-green-600 ml-1">
                  {pet.vaccinations.length} vaccination{pet.vaccinations.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Edit Button */}
        {onEdit && (
          <TouchableOpacity
            onPress={onEdit}
            className="p-2 rounded-full bg-gray-50"
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Medical History Preview */}
      {pet.medicalHistory && pet.medicalHistory.length > 0 && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">Medical History:</Text>
          <Text className="text-sm text-gray-700" numberOfLines={2}>
            {pet.medicalHistory.join(', ')}
          </Text>
        </View>
      )}

    </TouchableOpacity>
  );
};

export default PetCard;
