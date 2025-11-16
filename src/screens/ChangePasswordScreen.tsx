import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import { securityActivityService } from '../services/securityActivityService';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Medium';
    if (strength <= 5) return 'Strong';
    return 'Very Strong';
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 2) return '#ef4444';
    if (strength <= 4) return '#f59e0b';
    if (strength <= 5) return '#10b981';
    return '#059669';
  };

  const validatePassword = (): boolean => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return false;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (newPassword === currentPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);

      // Get current user email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user || !user.email) {
        Alert.alert('Error', 'Failed to get user information');
        return;
      }

      // Verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        Alert.alert('Error', updateError.message || 'Failed to change password');
        return;
      }

      // Log security activity
      if (user.id) {
        await securityActivityService.logActivity(user.id, 'password_changed');
      }

      Alert.alert(
        'Success',
        'Password changed successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Change Password</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-sm text-gray-600 mb-4">
            Enter your current password and choose a new secure password.
          </Text>

          {/* Current Password */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Current Password</Text>
            <View className="relative">
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 pr-12"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">New Password</Text>
            <View className="relative">
              <TextInput
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setPasswordStrength(calculatePasswordStrength(text));
                }}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 pr-12"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View className="mt-2">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-gray-600">Password Strength</Text>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: getPasswordStrengthColor(passwordStrength) }}
                  >
                    {getPasswordStrengthText(passwordStrength)}
                  </Text>
                </View>
                <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(passwordStrength / 6) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength),
                    }}
                  />
                </View>
              </View>
            )}

            {/* Password Requirements */}
            <View className="mt-2">
              <Text className="text-xs text-gray-600 mb-1">Requirements:</Text>
              <View className="space-y-1">
                <RequirementItem met={newPassword.length >= 8} text="At least 8 characters" />
                <RequirementItem met={/[A-Z]/.test(newPassword)} text="One uppercase letter" />
                <RequirementItem met={/[a-z]/.test(newPassword)} text="One lowercase letter" />
                <RequirementItem met={/[0-9]/.test(newPassword)} text="One number" />
                <RequirementItem met={/[^a-zA-Z0-9]/.test(newPassword)} text="One special character" />
              </View>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Confirm New Password</Text>
            <View className="relative">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 pr-12"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3"
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text className="text-xs text-red-600 mt-1">Passwords do not match</Text>
            )}
          </View>
        </View>

        {/* Change Password Button */}
        <View className="mx-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={loading}
            className={`bg-blue-500 py-4 rounded-lg flex-row items-center justify-center ${
              loading ? 'opacity-50' : ''
            }`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Change Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <View className="flex-row items-center">
    <Ionicons
      name={met ? 'checkmark-circle' : 'ellipse-outline'}
      size={14}
      color={met ? '#10b981' : '#9ca3af'}
    />
    <Text className={`text-xs ml-2 ${met ? 'text-gray-600' : 'text-gray-400'}`}>
      {text}
    </Text>
  </View>
);

export default ChangePasswordScreen;

