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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { resetPassword } from '../../services/supabaseAuthService';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await resetPassword(email);
      
      if (response.success) {
        setSent(true);
        Alert.alert(
          'Reset Link Sent',
          'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        setError(response.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-6xl mb-8">📧</Text>
          <Text className="text-2xl font-inter-bold text-primary-700 text-center mb-4">
            Check Your Email
          </Text>
          <Text className="text-secondary-600 font-inter text-center mb-8 leading-6">
            We've sent password reset instructions to {email}
          </Text>
          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 px-8 items-center"
            onPress={() => navigation.navigate('Login')}
            style={{ minHeight: 56 }}
          >
            <Text className="text-white font-inter-semibold text-lg">Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
          accessibilityLabel="Forgot password screen"
        >
          <View className="flex-1 justify-center">
            {/* Header */}
            <View className="mb-8">
              <Text 
                className="text-2xl font-inter-bold text-primary-700 text-center mb-3"
                accessibilityRole="header"
                accessibilityLevel={1}
              >
                Reset Password
              </Text>
              <Text 
                className="text-base font-inter text-secondary-600 text-center leading-6"
                accessibilityRole="text"
              >
                Enter your email address and we'll send you a link to reset your password
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-5">
              {/* Email Input */}
              <View>
                <Text 
                  className="text-secondary-700 font-inter-medium mb-2"
                  accessibilityRole="text"
                >
                  Email Address
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-4 font-inter text-secondary-700 ${
                    error ? 'border-error bg-error/5' : 'border-secondary-300 bg-white'
                  }`}
                  placeholder="Enter your email address"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) {
                      setError('');
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email input field"
                  accessibilityRole="none"
                  style={{ minHeight: 48 }}
                />
                {error && (
                  <Text 
                    className="text-error text-sm font-inter mt-2"
                    accessibilityRole="alert"
                  >
                    {error}
                  </Text>
                )}
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                className={`bg-primary-500 rounded-xl py-4 items-center mt-8 w-full ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={handleResetPassword}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Send reset link"
                accessibilityHint="Send password reset link to your email"
                style={{ minHeight: 56 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-inter-semibold text-lg">Send Reset Link</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login Link */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
                accessibilityHint="Navigate back to login screen"
                className="py-4 items-center mt-4 w-full"
                style={{ minHeight: 56 }}
              >
                <Text className="text-primary-600 font-inter-medium text-base">
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;