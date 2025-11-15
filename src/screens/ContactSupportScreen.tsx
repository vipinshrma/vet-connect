import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ContactSupportScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // In a real app, this would send to backend
    Alert.alert(
      'Success',
      'Your message has been sent. We will get back to you soon.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleCall = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@vetconnect.com');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Contact Support</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Quick Contact Options */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Contact</Text>

          <TouchableOpacity
            onPress={handleCall}
            className="flex-row items-center justify-between py-3 border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <Ionicons name="call" size={20} color="#3b82f6" />
              <Text className="text-base font-medium text-gray-900 ml-3">Call Us</Text>
            </View>
            <Text className="text-sm text-gray-600">+1 (234) 567-8900</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmail}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Ionicons name="mail" size={20} color="#3b82f6" />
              <Text className="text-base font-medium text-gray-900 ml-3">Email Us</Text>
            </View>
            <Text className="text-sm text-gray-600">support@vetconnect.com</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Form */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Send a Message</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Enter subject"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Enter your message"
              multiline
              numberOfLines={6}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-blue-500 py-4 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="send" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Send Message</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContactSupportScreen;

