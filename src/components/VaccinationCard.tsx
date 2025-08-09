import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vaccination } from '../types';

interface VaccinationCardProps {
  vaccination: Vaccination;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const VaccinationCard: React.FC<VaccinationCardProps> = ({
  vaccination,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const isOverdue = vaccination.nextDue && vaccination.nextDue < new Date();
  const isDueSoon = vaccination.nextDue && 
    vaccination.nextDue > new Date() && 
    vaccination.nextDue <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const getStatusColor = () => {
    if (isOverdue) return 'text-red-600';
    if (isDueSoon) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (isOverdue) return 'Overdue';
    if (isDueSoon) return 'Due Soon';
    return 'Up to Date';
  };

  const getStatusIcon = () => {
    if (isOverdue) return 'alert-circle';
    if (isDueSoon) return 'time';
    return 'shield-checkmark';
  };

  return (
    <View className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Ionicons 
              name={getStatusIcon()} 
              size={16} 
              color={isOverdue ? '#DC2626' : isDueSoon ? '#EA580C' : '#10B981'} 
            />
            <Text className="font-semibold text-gray-900 ml-2">{vaccination.name}</Text>
          </View>
          
          <Text className="text-gray-600 text-sm mb-1">
            Given: {vaccination.date.toLocaleDateString()}
          </Text>
          
          {vaccination.nextDue && (
            <Text className={`text-sm font-medium ${getStatusColor()}`}>
              Next due: {vaccination.nextDue.toLocaleDateString()} ({getStatusText()})
            </Text>
          )}
        </View>

        {showActions && (onEdit || onDelete) && (
          <View className="flex-row space-x-2">
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                className="p-2 rounded-full bg-gray-50"
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={14} color="#6B7280" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                className="p-2 rounded-full bg-red-50"
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={14} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default VaccinationCard;