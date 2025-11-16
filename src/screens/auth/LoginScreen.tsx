import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppDispatch } from '../../store';
import { loginUser } from '../../store/slices/authSlice';
import { LoginForm, AuthStackParamList } from '../../types';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<LoginNavigationProp>();
  const [formData, setFormData] = useState<LoginForm>({
    email: 'john@example.com',
    password: 'password123',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      await dispatch(loginUser(formData)).unwrap();
    } catch (error: any) {
      console.log("error",error)
      Alert.alert('Login Failed', error || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
          accessibilityLabel="Login screen"
        >
          <View className="flex-1 justify-center">
            {/* Header */}
            <View className="mb-8">
              <Text 
                className="text-2xl font-inter-bold text-primary-700 text-center mb-3"
                accessibilityRole="header"
              >
                Welcome Back
              </Text>
              <Text 
                className="text-base font-inter text-secondary-600 text-center leading-6"
              >
                Sign in to your VetConnect account
              </Text>
              
              {/* Test Credentials */}
              <View className="bg-primary-50 p-4 rounded-xl mt-6">
                <Text className="text-sm font-inter-semibold text-primary-700 text-center mb-3">
                  Test Credentials
                </Text>
                
                {/* Pet Owner */}
                <View className="mb-3">
                  <Text className="text-xs font-inter-semibold text-primary-800 mb-1">
                    Pet Owner:
                  </Text>
                  <Text className="text-sm font-inter text-primary-600">
                    Email: hemantshrma801@gmail.com
                  </Text>
                  <Text className="text-sm font-inter text-primary-600">
                    Password: Test@1234
                  </Text>
                </View>
                
                {/* Veterinarian */}
                <View>
                  <Text className="text-xs font-inter-semibold text-primary-800 mb-1">
                    Veterinarian:
                  </Text>
                  <Text className="text-sm font-inter text-primary-600">
                    Email: pakiko9332@fermiro.com
                  </Text>
                  <Text className="text-sm font-inter text-primary-600">
                    Password: Test@1234
                  </Text>
                </View>
              </View>
            </View>

            {/* Form */}
            <View className="space-y-5">
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

              {/* Forgot Password */}
              <TouchableOpacity 
                className="self-end py-2 mt-2"
                onPress={() => navigation.navigate('ForgotPassword')}
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                accessibilityHint="Navigate to password reset screen"
                style={{ minHeight: 44 }}
              >
                <Text className="text-primary-600 font-inter-medium">Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                className={`bg-primary-500 rounded-xl py-4 items-center mt-8 w-full ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={handleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                accessibilityHint="Sign in to your account"
                style={{ minHeight: 56 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-inter-semibold text-lg">Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Register Link - Secondary Button */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('Register')}
                accessibilityRole="button"
                accessibilityLabel="Don't have an account? Sign up"
                accessibilityHint="Navigate to registration screen"
                className="border-2 border-primary-600 bg-white rounded-xl py-4 items-center mt-4 w-full"
                style={{ minHeight: 56 }}
              >
                <Text className="text-primary-600 font-inter-semibold text-lg">Don't have an account? Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;