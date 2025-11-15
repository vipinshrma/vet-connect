import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const faqs = [
    {
      question: 'How do I book an appointment?',
      answer: 'Navigate to the Search tab, find a veterinarian, and tap "Book Appointment".',
    },
    {
      question: 'How do I update my pet profile?',
      answer: 'Go to the Pets tab, select a pet, and tap "Edit" to update their information.',
    },
    {
      question: 'How do I cancel an appointment?',
      answer: 'Go to Appointments, select the appointment, and tap "Cancel Appointment".',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can contact support through the Contact Support option in your Profile.',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Help Center</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</Text>

          {faqs.map((faq, index) => (
            <View key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
              <Text className="text-base font-medium text-gray-900 mb-2">{faq.question}</Text>
              <Text className="text-sm text-gray-600">{faq.answer}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('ContactSupport')}
          className="bg-blue-500 mx-4 mt-6 py-4 rounded-lg flex-row items-center justify-center"
        >
          <Ionicons name="mail" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Contact Support</Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpCenterScreen;

