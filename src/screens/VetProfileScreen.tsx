import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabaseClinicService } from '../services/supabaseClinicService';
import { supabaseVetService } from '../services/supabaseVetService';
import { Clinic, Review, RootStackParamList, Veterinarian } from '../types';

type VetProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'VetProfile'>;

const { width } = Dimensions.get('window');

const VetProfileScreen: React.FC<VetProfileScreenProps> = ({ route, navigation }) => {
  // Safely extract veterinarianId with fallback
  const veterinarianId = route?.params?.veterinarianId;
  const [veterinarian, setVeterinarian] = useState<Veterinarian | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVeterinarianData = useCallback(async () => {
    if (!veterinarianId) {
      setError('No veterinarian ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      
      const vet = await supabaseVetService.getVeterinarianById(veterinarianId);
      
      if (vet) {
        setVeterinarian(vet);
        
        // Fetch clinic data if veterinarian has a clinic_id
        if (vet.clinic_id) {
          try {
            const clinicData = await supabaseClinicService.getClinicById(vet.clinic_id);
            setClinic(clinicData);
          } catch (clinicError) {
            console.error('Error loading clinic data:', clinicError);
            // Don't fail the whole screen if clinic fails to load
            setClinic(null);
          }
        } else {
          setClinic(null);
        }
        
        // For now, set reviews to empty array since we're focusing on vet data
        // In a real app, you'd fetch reviews from a reviews service
        setReviews([]);
      } else {
        setError('Veterinarian not found');
      }
    } catch (err) {
      console.error('Error loading veterinarian data:', err);
      setError('Failed to load veterinarian data');
    } finally {
      setLoading(false);
    }
  }, [veterinarianId]);

  useEffect(() => {
    if (veterinarianId) {
      loadVeterinarianData();
    } else {
      setError('No veterinarian ID provided');
      setLoading(false);
    }
  }, [veterinarianId, loadVeterinarianData]);

  // Refresh data when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      if (veterinarianId) {
        loadVeterinarianData();
      }
    }, [veterinarianId, loadVeterinarianData])
  );

  const handleCall = () => {
    if (veterinarian && veterinarian.phone) {
      const phoneNumber = veterinarian.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleBookAppointment = () => {
    if (veterinarian && clinic) {
      navigation.navigate('BookAppointment', {
        veterinarianId: veterinarian.id,
        clinicId: clinic.id
      });
    }
  };

  const handleGetDirections = () => {
    if (clinic && clinic.coordinates) {
      const url = `maps://app?daddr=${clinic.coordinates.latitude},${clinic.coordinates.longitude}`;
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        const webUrl = `https://maps.google.com/?q=${clinic.coordinates.latitude},${clinic.coordinates.longitude}`;
        Linking.openURL(webUrl);
      });
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={size} color="#fbbf24" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={size} color="#fbbf24" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={size} color="#d1d5db" />
      );
    }

    return stars;
  };

  const formatDaySchedule = (day: string, schedule: any) => {
    if (!schedule.isOpen) return 'Closed';
    
    let timeStr = `${schedule.openTime} - ${schedule.closeTime}`;
    if (schedule.breakStart && schedule.breakEnd) {
      timeStr += ` (Break: ${schedule.breakStart} - ${schedule.breakEnd})`;
    }
    return timeStr;
  };

  const isOpenNow = () => {
    if (!clinic) return false;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().substring(0, 5);
    
    // Simplified check - in real app, would properly parse times
    return true; // Mock: assume open
  };

  const renderPhotoGallery = () => {
    const photos = clinic?.photos || [veterinarian?.photoURL].filter(Boolean);
    
    return (
      <View className="mb-6">
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedPhotoIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={{ width, height: 250 }}
              className="bg-gray-200"
            />
          ))}
        </ScrollView>
        
        {photos.length > 1 && (
          <View className="flex-row justify-center mt-3">
            {photos.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === selectedPhotoIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Text className="text-blue-600 font-semibold">
            {item.userId.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900">Pet Owner</Text>
          <View className="flex-row items-center mt-1">
            {renderStars(item.rating, 14)}
            <Text className="text-gray-600 text-sm ml-2">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <Text className="text-gray-700 leading-relaxed">{item.comment}</Text>
    </View>
  );


  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <View className="items-center">
          <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="medical" size={24} color="#3b82f6" />
          </View>
          <Text className="text-lg text-gray-600">Loading veterinarian profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-4">
            Veterinarian Profile
          </Text>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-50 p-6 rounded-xl border border-red-200 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="alert-circle" size={32} color="#dc2626" />
              </View>
              <Text className="text-xl font-bold text-red-800 text-center mb-2">
                Error Loading Profile
              </Text>
              <Text className="text-red-700 text-center leading-relaxed">
                {error}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setError(null);
                loadVeterinarianData();
              }}
              className="bg-red-600 py-3 rounded-lg mb-3"
            >
              <Text className="text-white font-semibold text-center">
                Try Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-gray-600 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold text-center">
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!veterinarian && !clinic) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-4">
            Veterinarian Profile
          </Text>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-50 p-6 rounded-xl border border-red-200 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="alert-circle" size={32} color="#dc2626" />
              </View>
              <Text className="text-xl font-bold text-red-800 text-center mb-2">
                Profile Not Found
              </Text>
              <Text className="text-red-700 text-center leading-relaxed">
                We couldn't find the veterinarian profile or clinic information you're looking for. This might be due to:
              </Text>
            </View>
            
            <View className="space-y-2 mb-6">
              <View className="flex-row items-center">
                <Ionicons name="ellipse" size={8} color="#dc2626" />
                <Text className="text-red-700 ml-3">Profile has been removed</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="ellipse" size={8} color="#dc2626" />
                <Text className="text-red-700 ml-3">Temporary server issue</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="ellipse" size={8} color="#dc2626" />
                <Text className="text-red-700 ml-3">Invalid profile link</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-red-600 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold text-center">
                Go Back to Search
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!veterinarian) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-lg text-gray-600">Loading veterinarian profile...</Text>
      </SafeAreaView>
    );
  }

  if (!clinic) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 ml-4">
            Veterinarian Profile
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Photo Gallery - Vet photo only */}
          <View className="mb-6">
            <Image
              source={{ uri: veterinarian.photoURL }}
              style={{ width, height: 250 }}
              className="bg-gray-200"
            />
          </View>

          {/* Main Info */}
          <View className="bg-white mx-4 rounded-xl p-6 mb-4 shadow-sm">
            <View className="flex-row items-start mb-4">
              <Image
                source={{ uri: veterinarian.photoURL }}
                className="w-16 h-16 rounded-xl"
              />
              <View className="flex-1 ml-4">
                <Text className="text-2xl font-bold text-gray-900">
                  {veterinarian.name}
                </Text>
                <Text className="text-blue-600 font-semibold text-lg mt-1">
                  {veterinarian?.specialties?.[0] || 'General Practice'}
                </Text>
                <View className="flex-row items-center mt-2">
                  {renderStars(veterinarian.rating, 18)}
                  <Text className="text-gray-600 ml-2">
                    {veterinarian.rating} ({veterinarian.reviewCount} reviews)
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <Ionicons name="school" size={18} color="#6b7280" />
              <Text className="text-gray-700 ml-3">
                {veterinarian.experience} years of experience
              </Text>
            </View>

            {/* Call Button Only */}
            <TouchableOpacity
              onPress={handleCall}
              className="bg-green-600 py-4 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="call" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Call Veterinarian</Text>
            </TouchableOpacity>
          </View>

          {/* No Clinic Notice */}
          <View className="bg-orange-50 mx-4 rounded-xl p-4 mb-4 border border-orange-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#ea580c" />
              <Text className="text-orange-800 font-semibold ml-2">Clinic Information Unavailable</Text>
            </View>
            <Text className="text-orange-700">
              This veterinarian is not currently associated with a clinic. Please contact them directly for appointments and location information.
            </Text>
          </View>

          {/* Specialties */}
          <View className="bg-white mx-4 rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Specialties</Text>
            <View className="flex-row flex-wrap">
              {veterinarian?.specialties && veterinarian.specialties.length > 0 ? (
                veterinarian.specialties.map((specialty, index) => (
                  <View key={index} className="bg-blue-50 px-3 py-2 rounded-lg mr-2 mb-2">
                    <Text className="text-blue-700 font-medium">{specialty}</Text>
                  </View>
                ))
              ) : (
                <View className="bg-blue-50 px-3 py-2 rounded-lg mr-2 mb-2">
                  <Text className="text-blue-700 font-medium">General Practice</Text>
                </View>
              )}
            </View>
          </View>

          {/* Reviews */}
          <View className="bg-white mx-4 rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Reviews ({reviews.length})
              </Text>
              {reviews.length > 3 && (
                <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
                  <Text className="text-blue-600 font-medium">
                    {showAllReviews ? 'Show Less' : 'View All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row items-center mb-4">
              <View className="flex-row items-center mr-4">
                {renderStars(veterinarian.rating, 20)}
              </View>
              <Text className="text-2xl font-bold text-gray-900 mr-2">
                {veterinarian.rating}
              </Text>
              <Text className="text-gray-600">out of 5</Text>
            </View>

            {reviews.length > 0 ? (
              <FlatList
                data={showAllReviews ? reviews : reviews.slice(0, 3)}
                renderItem={renderReviewItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text className="text-gray-600 text-center py-8">
                No reviews yet. Be the first to leave a review!
              </Text>
            )}
          </View>

          {/* Bottom spacing */}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    );
  }
  

  const availableSlots = veterinarian?.availableSlots?.filter(slot => slot.isAvailable) || [];
  const nextAvailableSlot = availableSlots[0];

  console.log("availableSlots",availableSlots)
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-4">
          Veterinarian Profile
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        {renderPhotoGallery()}

        {/* Main Info */}
        <View className="bg-white mx-4 rounded-xl p-6 mb-4 shadow-sm">
          <View className="flex-row items-start mb-4">
            <Image
              source={{ uri: veterinarian.photoURL }}
              className="w-16 h-16 rounded-xl"
            />
            <View className="flex-1 ml-4">
              <Text className="text-2xl font-bold text-gray-900">
                {veterinarian.name}
              </Text>
              <Text className="text-blue-600 font-semibold text-lg mt-1">
                {veterinarian?.specialties?.[0] || 'General Practice'}
              </Text>
              <View className="flex-row items-center mt-2">
                {renderStars(veterinarian.rating, 18)}
                <Text className="text-gray-600 ml-2">
                  {veterinarian.rating} ({veterinarian.reviewCount} reviews)
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="business" size={18} color="#6b7280" />
            <Text className="text-gray-700 ml-3 flex-1">{clinic?.name || 'Unknown Clinic'}</Text>
            <View className={`px-3 py-1 rounded-full ${
              isOpenNow() ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Text className={`text-sm font-medium ${
                isOpenNow() ? 'text-green-800' : 'text-red-800'
              }`}>
                {isOpenNow() ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="location" size={18} color="#6b7280" />
            <Text className="text-gray-700 ml-3 flex-1">
              {clinic?.address || 'Address not available'}, {clinic?.city || ''}, {clinic?.state || ''}
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <Ionicons name="school" size={18} color="#6b7280" />
            <Text className="text-gray-700 ml-3">
              {veterinarian.experience} years of experience
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row">
            <TouchableOpacity
              onPress={handleBookAppointment}
              className="flex-1 bg-blue-600 py-4 rounded-lg flex-row items-center justify-center mr-3"
            >
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Book Appointment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleCall}
              className="bg-green-600 px-6 py-4 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Available */}
        {nextAvailableSlot && (
          <View className="bg-white mx-4 rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Next Available</Text>
            <View className="flex-row items-center">
              <Ionicons name="time" size={18} color="#10b981" />
              <Text className="text-gray-700 ml-3">
                Today at {nextAvailableSlot.startTime}
              </Text>
            </View>
          </View>
        )}

        {/* Specialties */}
        <View className="bg-white mx-4 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Specialties</Text>
          <View className="flex-row flex-wrap">
            {veterinarian?.specialties && Array.isArray(veterinarian.specialties) && veterinarian.specialties.length > 0 ? (
              veterinarian.specialties.map((specialty, index) => (
                <View key={`${specialty}-${index}`} className="bg-blue-50 px-3 py-2 rounded-lg mr-2 mb-2">
                  <Text className="text-blue-700 font-medium">{specialty}</Text>
                </View>
              ))
            ) : (
              <View className="bg-blue-50 px-3 py-2 rounded-lg mr-2 mb-2">
                <Text className="text-blue-700 font-medium">General Practice</Text>
              </View>
            )}
          </View>
          {veterinarian?.specialties && (
            <Text className="text-xs text-gray-500 mt-2">
              {veterinarian.specialties.length} {veterinarian.specialties.length === 1 ? 'specialty' : 'specialties'}
            </Text>
          )}
        </View>

        {/* Clinic Services */}
        <View className="bg-white mx-4 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Services Available</Text>
          <View className="space-y-2">
            {clinic?.services && clinic.services.length > 0 ? (
              clinic.services.map((service, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text className="text-gray-700 ml-3">{service}</Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-600">No services information available</Text>
            )}
          </View>
        </View>

        {/* Hours */}
        <View className="bg-white mx-4 rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">Hours</Text>
            <TouchableOpacity onPress={handleGetDirections}>
              <View className="flex-row items-center">
                <Ionicons name="map" size={16} color="#3b82f6" />
                <Text className="text-blue-600 font-medium ml-1">Directions</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {Object.entries(clinic?.openingHours || {}).map(([day, schedule]) => (
            <View key={day} className="flex-row justify-between py-2">
              <Text className="text-gray-900 font-medium capitalize">{day}</Text>
              <Text className="text-gray-600">
                {formatDaySchedule(day, schedule)}
              </Text>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <View className="bg-white mx-4 rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              Reviews ({reviews.length})
            </Text>
            {reviews.length > 3 && (
              <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
                <Text className="text-blue-600 font-medium">
                  {showAllReviews ? 'Show Less' : 'View All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center mr-4">
              {renderStars(veterinarian.rating, 20)}
            </View>
            <Text className="text-2xl font-bold text-gray-900 mr-2">
              {veterinarian.rating}
            </Text>
            <Text className="text-gray-600">out of 5</Text>
          </View>

          {reviews.length > 0 ? (
            <FlatList
              data={showAllReviews ? reviews : reviews.slice(0, 3)}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text className="text-gray-600 text-center py-8">
              No reviews yet. Be the first to leave a review!
            </Text>
          )}
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={handleBookAppointment}
          className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="calendar" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default VetProfileScreen;