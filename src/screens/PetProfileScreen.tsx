import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { addPet, updatePet, deletePet, fetchUserPets } from '../store/slices/petSlice';
import { PetForm, RootStackParamList } from '../types';
import { petService } from '../services/petService';
import LoadingScreen from '../components/LoadingScreen';

type PetProfileScreenRouteProp = RouteProp<RootStackParamList, 'PetProfile'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  route: PetProfileScreenRouteProp;
}

const PetProfileScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { pets } = useSelector((state: RootState) => state.pets);
  const { petId } = route.params || {};
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Get pet from Redux store if editing
  const pet = petId ? pets.find(p => p.id === petId) || null : null;
  
  // Debug current pet state
  console.log('🔧 [DEBUG] Current pet state:', {
    petId,
    hasPet: !!pet,
    photoURL: pet?.photoURL,
    petName: pet?.name
  });
  
  // Form state
  const [formData, setFormData] = useState<PetForm>({
    name: '',
    species: 'dog',
    breed: '',
    age: 0,
    weight: undefined,
    gender: 'male',
    medicalHistory: '',
  });

  const isEditing = Boolean(petId);

  const loadPetData = async () => {
    if (!petId || !pet) return;
    
    // Use pet data from Redux store
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      age: pet.age,
      weight: pet.weight,
      gender: pet.gender,
      medicalHistory: pet.medicalHistory?.join(', ') || '',
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your pet\'s name.');
      return;
    }
    
    if (!formData.age || formData.age <= 0) {
      Alert.alert('Error', 'Please enter a valid age.');
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditing && petId) {
        await dispatch(updatePet({ petId, updates: formData })).unwrap();
        Alert.alert('Success', 'Pet profile updated successfully!');
      } else {
        await dispatch(addPet({ ...formData, ownerId: user.id })).unwrap();
        Alert.alert('Success', 'Pet added successfully!');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving pet:', error);
      Alert.alert('Error', 'Failed to save pet. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!petId) return;
            try {
              await dispatch(deletePet(petId)).unwrap();
              Alert.alert('Success', 'Pet deleted successfully.');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting pet:', error);
              Alert.alert('Error', 'Failed to delete pet.');
            }
          },
        },
      ]
    );
  };

  const handlePhotoUpload = async () => {
    if (!isEditing || !petId) {
      Alert.alert('Save Pet First', 'Please save your pet profile before adding a photo.');
      return;
    }

    try {
      console.log('🔧 [DEBUG] Opening photo picker for pet:', petId);
      
      // Call the service method which will handle selection and upload
      // The loading state will be managed by a custom version
      const photoUrl = await petService.selectAndUploadPhotoWithCallback(petId, {
        onImageSelected: () => {
          console.log('🔧 [DEBUG] Image selected, starting upload...');
          setIsUploadingPhoto(true);
        }
      });
      
      console.log('🔧 [DEBUG] Photo upload result:', photoUrl);
      
      if (photoUrl) {
        // Refresh pet data from Redux store to get updated photo URL
        if (user?.id) {
          console.log('🔧 [DEBUG] Refreshing user pets');
          await dispatch(fetchUserPets(user.id)).unwrap();
        }
        
        console.log('🔧 [DEBUG] Photo upload completed successfully');
        Alert.alert('Success', 'Photo updated successfully!');
      } else {
        console.log('🔧 [DEBUG] No photo selected or upload cancelled');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (petId && pet) {
      loadPetData();
    }
  }, [petId, pet]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Pet' : 'Add Pet',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="mr-4"
        >
          <Text className={`font-semibold ${isSaving ? 'text-gray-400' : 'text-blue-600'}`}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing, isSaving, handleSave]);

  if (!pet && isEditing) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Pet Photo Section */}
        <View className="bg-white px-6 py-8 items-center border-b border-gray-100">
          <View className="w-32 h-32 rounded-full bg-blue-50 items-center justify-center mb-4 relative">
            {isUploadingPhoto ? (
              // Upload loading state
              <View className="w-32 h-32 rounded-full bg-blue-100 items-center justify-center">
                <View className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              </View>
            ) : pet?.photoURL ? (
              <Image
                source={{ uri: pet.photoURL }}
                className="w-32 h-32 rounded-full"
                resizeMode="cover"
                onError={(error) => {
                  console.log('🔧 [DEBUG] Image load error:', error.nativeEvent);
                  console.log('🔧 [DEBUG] Image URI:', pet.photoURL);
                }}
                onLoad={() => {
                  console.log('🔧 [DEBUG] Image loaded successfully:', pet.photoURL);
                }}
              />
            ) : (
              <Ionicons name="paw-outline" size={48} color="#3B82F6" />
            )}
            
            {/* Upload overlay when uploading */}
            {isUploadingPhoto && pet?.photoURL && (
              <View className="absolute inset-0 w-32 h-32 rounded-full bg-black/50 items-center justify-center">
                <View className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={handlePhotoUpload}
            className={`px-6 py-2 rounded-lg flex-row items-center ${
              isUploadingPhoto 
                ? 'bg-gray-400' 
                : 'bg-blue-600'
            }`}
            disabled={isSaving || isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <>
                <View className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin mr-2" />
                <Text className="text-white font-medium">Uploading...</Text>
              </>
            ) : (
              <Text className="text-white font-medium">
                {pet?.photoURL ? 'Change Photo' : 'Add Photo'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View className="px-6 py-8 space-y-8">
          {/* Name */}
          <View className="mb-2">
            <Text className="text-gray-700 font-medium mb-2">Pet Name *</Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your pet's name"
              className="bg-white px-4 py-3 rounded-lg border border-gray-200"
            />
          </View>

          {/* Species */}
          <View className="mb-2">
            <Text className="text-gray-700 font-medium mb-2">Species *</Text>
            <View className="flex-row flex-wrap gap-2">
              {['dog', 'cat', 'bird', 'rabbit', 'other'].map((species) => (
                <TouchableOpacity
                  key={species}
                  onPress={() => setFormData({ ...formData, species: species as any })}
                  className={`px-4 py-2 rounded-lg border ${
                    formData.species === species
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      formData.species === species ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {species.charAt(0).toUpperCase() + species.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Breed */}
          <View className="mb-2">
            <Text className="text-gray-700 font-medium mb-2">Breed</Text>
            <TextInput
              value={formData.breed}
              onChangeText={(text) => setFormData({ ...formData, breed: text })}
              placeholder="Enter breed (optional)"
              className="bg-white px-4 py-3 rounded-lg border border-gray-200"
            />
          </View>

          {/* Age and Weight Row */}
          <View className="flex-row space-x-4 mb-2 gap-x-2">
            <View className="flex-1">
              <Text className="text-gray-700 font-medium mb-2">Age (years) *</Text>
              <TextInput
                value={formData.age.toString()}
                onChangeText={(text) => setFormData({ ...formData, age: parseFloat(text) || 0 })}
                placeholder="0"
                keyboardType="numeric"
                className="bg-white px-4 py-3 rounded-lg border border-gray-200"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 font-medium mb-2">Weight (kg)</Text>
              <TextInput
                value={formData.weight?.toString() || ''}
                onChangeText={(text) => setFormData({ ...formData, weight: parseFloat(text) || undefined })}
                placeholder="Optional"
                keyboardType="numeric"
                className="bg-white px-4 py-3 rounded-lg border border-gray-200"
              />
            </View>
          </View>

          {/* Gender */}
          <View className="mb-2">
            <Text className="text-gray-700 font-medium mb-2">Gender *</Text>
            <View className="flex-row space-x-4">
              {['male', 'female'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  onPress={() => setFormData({ ...formData, gender: gender as any })}
                  className={`flex-1 py-3 rounded-lg border ${
                    formData.gender === gender
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      formData.gender === gender ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medical History */}
          <View className="mb-2">
            <Text className="text-gray-700 font-medium mb-2">Medical History</Text>
            <TextInput
              value={formData.medicalHistory}
              onChangeText={(text) => setFormData({ ...formData, medicalHistory: text })}
              placeholder="Enter any relevant medical history, allergies, or conditions"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-white px-4 py-3 rounded-lg border border-gray-200"
            />
          </View>

          {/* Vaccination Section */}
          {isEditing && pet?.vaccinations && pet.vaccinations.length > 0 && (
            <View>
              <Text className="text-gray-700 font-medium mb-2">Vaccinations</Text>
              <View className="bg-white rounded-lg border border-gray-200 p-4">
                {pet.vaccinations.map((vaccination) => (
                  <View key={vaccination.id} className="flex-row justify-between items-center py-2">
                    <View>
                      <Text className="font-medium">{vaccination.name}</Text>
                      <Text className="text-gray-600 text-sm">
                        Given: {new Date(vaccination.date).toLocaleDateString()}
                      </Text>
                      {vaccination.nextDue && (
                        <Text className="text-blue-600 text-sm">
                          Next due: {new Date(vaccination.nextDue).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Delete Button (for editing) */}
        {isEditing && (
          <View className="px-6 pb-6">
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-50 py-4 rounded-lg border border-red-200"
            >
              <Text className="text-red-600 font-medium text-center">Delete Pet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PetProfileScreen;