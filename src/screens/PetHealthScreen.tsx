import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LoadingScreen from '../components/LoadingScreen';
import { AppDispatch, RootState } from '../store';
import { fetchPetHealthData } from '../store/slices/petHealthSlice';
import { PetTimelineEntry, RootStackParamList } from '../types';

type PetHealthRouteProp = RouteProp<RootStackParamList, 'PetHealth'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  route: PetHealthRouteProp;
}

const PetHealthScreen: React.FC<Props> = ({ route }) => {
  const { petId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pet = useSelector((state: RootState) =>
    state.pets.pets.find((p) => p.id === petId)
  );
  const healthState = useSelector((state: RootState) => state.petHealth.byPetId[petId]);

  const isInitialLoading =
    !healthState || (healthState.status === 'loading' && !healthState.lastFetchedAt);

  useEffect(() => {
    if (pet) {
      navigation.setOptions({
        headerShown: true,
        title: `${pet.name} • Health`,
      });
    } else {
      navigation.setOptions({
        headerShown: true,
        title: 'Pet Health',
      });
    }
  }, [navigation, pet]);

  useEffect(() => {
    dispatch(fetchPetHealthData(petId));
  }, [dispatch, petId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchPetHealthData(petId)).unwrap();
    } catch (error) {
      console.error('Failed to refresh pet health data:', error);
      Alert.alert('Refresh Failed', 'Could not refresh health data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, petId]);

  const handleFeatureComingSoon = useCallback((feature: string) => {
    Alert.alert('Coming soon', `${feature} will be available in a future update.`);
  }, []);

  const formatDate = useCallback((isoString?: string) => {
    if (!isoString) {
      return 'Not available';
    }
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const timelineEntries = useMemo<PetTimelineEntry[]>(() => {
    return healthState?.timeline ?? [];
  }, [healthState?.timeline]);

  if (!pet) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Ionicons name="paw-outline" size={36} color="#9CA3AF" />
        <Text className="mt-3 text-lg font-semibold text-gray-800">Pet not found</Text>
        <Text className="mt-1 text-center text-gray-500">
          The selected pet is no longer available. Please go back and choose a different pet.
        </Text>
      </View>
    );
  }

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="px-6 pt-6 pb-16">
          {/* Overview Card */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-sm text-gray-500">Primary veterinarian</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {healthState?.overview?.primaryVeterinarian ?? 'TBD'}
                </Text>
              </View>
              <TouchableOpacity
                className="bg-blue-50 rounded-full px-4 py-2"
                onPress={() => handleFeatureComingSoon('Messaging with your vet')}
              >
                <Text className="text-blue-600 font-semibold text-sm">Contact</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row">
              <View className="flex-1">
                <Text className="text-xs uppercase text-gray-400 tracking-wider">Last visit</Text>
                <Text className="text-base font-semibold text-gray-900 mt-1">
                  {formatDate(healthState?.overview?.lastVisit)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase text-gray-400 tracking-wider">
                  Next appointment
                </Text>
                <Text className="text-base font-semibold text-gray-900 mt-1">
                  {formatDate(healthState?.overview?.nextAppointment)}
                </Text>
              </View>
            </View>

            <View className="mt-4 border-t border-gray-100 pt-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Reminders</Text>
              {healthState?.overview?.reminders && healthState.overview.reminders.length > 0 ? (
                <View className="flex-row flex-wrap -m-1">
                  {healthState.overview.reminders.map((reminder) => (
                    <View
                      key={reminder.id}
                      className={`px-3 py-1.5 rounded-full m-1 ${
                        reminder.status === 'overdue'
                          ? 'bg-red-50'
                          : reminder.status === 'completed'
                          ? 'bg-green-50'
                          : 'bg-blue-50'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          reminder.status === 'overdue'
                            ? 'text-red-600'
                            : reminder.status === 'completed'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {reminder.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-gray-500">No reminders yet.</Text>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row mb-6" style={{ gap: 12 }}>
            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-2xl p-4 flex-row items-center justify-center"
              onPress={() => handleFeatureComingSoon('Sharing health summaries')}
            >
              <Ionicons name={'share-outline' as keyof typeof Ionicons.glyphMap} size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Share Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-900 rounded-2xl p-4 flex-row items-center justify-center"
              onPress={() => handleFeatureComingSoon('Owner health notes')}
            >
              <Ionicons name={'create-outline' as keyof typeof Ionicons.glyphMap} size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Add Note</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-lg font-semibold text-gray-900">Health timeline</Text>
                <Text className="text-sm text-gray-500">Latest treatments and updates</Text>
              </View>
              <TouchableOpacity onPress={handleRefresh}>
                <Ionicons name="refresh" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {timelineEntries.length === 0 ? (
              <Text className="text-sm text-gray-500">No records yet.</Text>
            ) : (
              <View>
                {timelineEntries.map((entry, index) => (
                  <View key={entry.id} style={{ marginBottom: index < timelineEntries.length - 1 ? 16 : 0 }}>
                    <TimelineEntry entry={entry} isLast={index === timelineEntries.length - 1} />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Vaccinations */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-semibold text-gray-900">Vaccinations</Text>
              <TouchableOpacity onPress={() => handleFeatureComingSoon('Vaccine scheduling')}>
                <Text className="text-blue-600 font-semibold">Schedule</Text>
              </TouchableOpacity>
            </View>
            {healthState?.vaccinations.length ? (
              <View>
                {healthState.vaccinations.map((vaccination, index) => (
                  <View
                    key={vaccination.id}
                    className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"
                    style={{ marginBottom: index < healthState.vaccinations.length - 1 ? 12 : 0 }}
                  >
                    <View>
                      <Text className="font-semibold text-gray-900">{vaccination.name}</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        Given on {formatDate(vaccination.date)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-gray-400 uppercase">Next due</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {formatDate(vaccination.nextDue)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-gray-500">No vaccination history recorded.</Text>
            )}
          </View>

          {/* Active Medications */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-semibold text-gray-900">Medications</Text>
              <TouchableOpacity onPress={() => handleFeatureComingSoon('Medication reminders')}>
                <Text className="text-blue-600 font-semibold">Reminders</Text>
              </TouchableOpacity>
            </View>
            {healthState?.prescriptions.length ? (
              <View>
                {healthState.prescriptions.map((prescription, index) => (
                  <View
                    key={prescription.id}
                    className="border border-gray-100 rounded-2xl px-4 py-3"
                    style={{ marginBottom: index < healthState.prescriptions.length - 1 ? 12 : 0 }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semibold text-gray-900">
                        {prescription.medicationName}
                      </Text>
                      <Text
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          prescription.status === 'active'
                            ? 'bg-green-50 text-green-600'
                            : prescription.status === 'completed'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {prescription.status}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-600 mt-1">{prescription.dosage}</Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {prescription.frequency}
                      {prescription.durationDays
                        ? ` • ${prescription.durationDays} day course`
                        : ''}
                    </Text>
                    {prescription.instructions && (
                      <Text className="text-xs text-gray-500 mt-2">
                        {prescription.instructions}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-gray-500">No prescriptions on file.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

interface TimelineEntryProps {
  entry: PetTimelineEntry;
  isLast: boolean;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({ entry, isLast }) => {
  const iconName: keyof typeof Ionicons.glyphMap = (() => {
    switch (entry.entryType) {
      case 'vaccination':
        return 'shield-checkmark-outline';
      case 'prescription':
        return 'medkit-outline';
      case 'note':
        return 'document-text-outline';
      default:
        return 'medal-outline';
    }
  })();

  return (
    <View className="flex-row">
      <View className="items-center mr-4">
        <View className="w-10 items-center">
          <View className="w-4 h-4 rounded-full bg-blue-600" />
        </View>
        {!isLast && <View className="w-px bg-blue-100 flex-1 mt-1" style={{ minHeight: 20 }} />}
      </View>
      <View className="flex-1 bg-gray-50 rounded-2xl p-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center space-x-2">
            <Ionicons name={iconName} size={18} color="#2563EB" />
            <Text className="text-base font-semibold text-gray-900">{entry.title}</Text>
          </View>
          {entry.status && (
            <Text
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                entry.status === 'completed'
                  ? 'bg-green-50 text-green-600'
                  : entry.status === 'overdue'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {entry.status}
            </Text>
          )}
        </View>
        <Text className="text-xs uppercase text-gray-400 tracking-wider">
          {new Date(entry.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        {entry.description && (
          <Text className="text-sm text-gray-700 mt-2">{entry.description}</Text>
        )}
        {entry.tags && entry.tags.length > 0 && (
          <View className="flex-row flex-wrap -m-1 mt-3">
            {entry.tags.map((tag) => (
              <View key={tag} className="px-2 py-1 bg-white rounded-full m-1 border border-gray-200">
                <Text className="text-xs text-gray-600">{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {entry.veterinarianName && (
          <Text className="text-xs text-gray-500 mt-3">Recorded by {entry.veterinarianName}</Text>
        )}
      </View>
    </View>
  );
};

export default PetHealthScreen;
