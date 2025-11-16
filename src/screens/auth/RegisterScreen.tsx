import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { registerUser } from '../../store/slices/authSlice';
import { AuthStackParamList, RegisterForm, UserType } from '../../types';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<RegisterNavigationProp>();
  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'pet-owner',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterForm & { confirmPassword: string }>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterForm & { confirmPassword: string }> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        userType: formData.userType,
      };
      await dispatch(registerUser(registerData)).unwrap();
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      console.log("error",error)
      Alert.alert('Registration Failed', error || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const UserTypeSelector = ({ userType, label, description, selected, onSelect }: {
    userType: UserType;
    label: string;
    description: string;
    selected: boolean;
    onSelect: () => void;
  }) => (
    <TouchableOpacity
      className={`border-2 rounded-xl p-4 mb-3 ${
        selected ? 'border-primary-500 bg-primary-50' : 'border-secondary-300 bg-white'
      }`}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}: ${description}`}
      style={{ minHeight: 44 }}
    >
      <Text className={`font-inter-semibold text-lg ${selected ? 'text-primary-700' : 'text-secondary-700'}`}>
        {label}
      </Text>
      <Text className={`text-sm font-inter mt-1 ${selected ? 'text-primary-600' : 'text-secondary-600'}`}>
        {description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
          accessibilityLabel="Registration screen"
        >
          <View className="flex-1 justify-center">
            {/* Header */}
            <View className="mb-8">
              <Text 
                className="text-2xl font-inter-bold text-primary-700 text-center mb-3"
                accessibilityRole="header"
              >
                Create Account
              </Text>
              <Text 
                className="text-base font-inter text-secondary-600 text-center leading-6"
              >
                Join VetConnect to find the best care for your pets
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-5">
              {/* User Type Selection */}
              <View accessibilityRole="radiogroup" accessibilityLabel="User type selection">
                <Text 
                  className="text-secondary-700 font-inter-medium mb-4"
                >
                  I am a:
                </Text>
                <UserTypeSelector
                  userType="pet-owner"
                  label="Pet Owner"
                  description="Looking for veterinary care for my pets"
                  selected={formData.userType === 'pet-owner'}
                  onSelect={() => setFormData(prev => ({ ...prev, userType: 'pet-owner' }))}
                />
                <UserTypeSelector
                  userType="veterinarian"
                  label="Veterinarian"
                  description="Providing veterinary services"
                  selected={formData.userType === 'veterinarian'}
                  onSelect={() => setFormData(prev => ({ ...prev, userType: 'veterinarian' }))}
                />
              </View>

              {/* Name Input */}
              <View>
                <Text 
                  className="text-secondary-700 font-inter-medium mb-2"
                >
                  Full Name
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 font-inter text-secondary-700 ${
                    errors.name ? 'border-error bg-error/5' : 'border-secondary-300 bg-white'
                  }`}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, name: text }));
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="Full name input field"
                  accessibilityRole="none"
                  style={{ minHeight: 48 }}
                />
                {errors.name && (
                  <Text 
                    className="text-error text-sm font-inter mt-2"
                    accessibilityRole="alert"
                  >
                    {errors.name}
                  </Text>
                )}
              </View>

              {/* Email Input */}
              <View>
                <Text 
                  className="text-secondary-700 font-inter-medium mb-2"
                >
                  Email
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 font-inter text-secondary-700 ${
                    errors.email ? 'border-error bg-error/5' : 'border-secondary-300 bg-white'
                  }`}
                  placeholder="Enter your email"
                  placeholderTextColor="#94a3b8"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, email: text }));
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email input field"
                  accessibilityRole="none"
                  style={{ minHeight: 48 }}
                />
                {errors.email && (
                  <Text 
                    className="text-error text-sm font-inter mt-2"
                    accessibilityRole="alert"
                  >
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Phone Input */}
              <View>
                <Text 
                  className="text-secondary-700 font-inter-medium mb-2"
                >
                  Phone Number
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 font-inter text-secondary-700 ${
                    errors.phone ? 'border-error bg-error/5' : 'border-secondary-300 bg-white'
                  }`}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#94a3b8"
                  value={formData.phone}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, phone: text }));
                    if (errors.phone) {
                      setErrors(prev => ({ ...prev, phone: undefined }));
                    }
                  }}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  accessibilityLabel="Phone number input field"
                  accessibilityRole="none"
                  style={{ minHeight: 48 }}
                />
                {errors.phone && (
                  <Text 
                    className="text-error text-sm font-inter mt-2"
                    accessibilityRole="alert"
                  >
                    {errors.phone}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View>
                <Text 
                  className="text-secondary-700 font-inter-medium mb-2"
                >
                  Password
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 font-inter text-secondary-700 ${
                    errors.password ? 'border-error bg-error/5' : 'border-secondary-300 bg-white'
                  }`}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  value={formData.password}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, password: text }));
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Password input field"
                  accessibilityRole="none"
                  style={{ minHeight: 48 }}
                />
                {errors.password && (
                  <Text 
                    className="text-error text-sm font-inter mt-2"
                    accessibilityRole="alert"
                  >
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text 
                  className="text-secondary-700 font-inter-medium mb-2"
                >
                  Confirm Password
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 font-inter text-secondary-700 ${
                    errors.confirmPassword ? 'border-error bg-error/5' : 'border-secondary-300 bg-white'
                  }`}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94a3b8"
                  value={formData.confirmPassword}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, confirmPassword: text }));
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Confirm password input field"
                  accessibilityRole="none"
                  style={{ minHeight: 48 }}
                />
                {errors.confirmPassword && (
                  <Text 
                    className="text-error text-sm font-inter mt-2"
                    accessibilityRole="alert"
                  >
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                className={`bg-primary-500 rounded-xl py-4 items-center mt-8 w-full ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={handleRegister}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Create account"
                accessibilityHint="Create your VetConnect account"
                style={{ minHeight: 56 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-inter-semibold text-lg">Get Started</Text>
                )}
              </TouchableOpacity>

              {/* Login Link - Secondary Button */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
                accessibilityLabel="Already have an account? Sign in"
                accessibilityHint="Navigate to login screen"
                className="border-2 border-primary-600 bg-white rounded-xl py-4 items-center mt-4 w-full"
                style={{ minHeight: 56 }}
              >
                <Text className="text-primary-600 font-inter-semibold text-lg">I Already Have an Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;