// Mock authentication utility for development
// This will be replaced with Supabase authentication later

export interface MockUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  userType: 'pet-owner' | 'veterinarian';
}

// Mock user data for testing
export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    phone: '+1 (555) 123-4567',
    userType: 'pet-owner',
  },
  {
    id: '2',
    email: 'sarah@vetclinic.com',
    name: 'Dr. Sarah Wilson',
    phone: '+1 (555) 987-6543',
    userType: 'veterinarian',
  },
  {
    id: '3',
    email: 'admin@vetconnect.com',
    name: 'Admin User',
    phone: '+1 (555) 111-2222',
    userType: 'pet-owner',
  },
];

// Default test credentials
export const DEFAULT_TEST_EMAIL = 'john@example.com';
export const DEFAULT_TEST_PASSWORD = 'password123';

export interface MockAuthResponse {
  success: boolean;
  user?: MockUser;
  message?: string;
}

// Mock login function
export const mockLogin = async (email: string, password: string): Promise<MockAuthResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find user by email
  const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return {
      success: false,
      message: 'User not found. Please check your email address.',
    };
  }

  // For mock purposes, accept any password that's at least 6 characters
  if (password.length < 6) {
    return {
      success: false,
      message: 'Password must be at least 6 characters long.',
    };
  }

  return {
    success: true,
    user,
    message: 'Login successful!',
  };
};

// Mock registration function
export const mockRegister = async (userData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: 'pet-owner' | 'veterinarian';
}): Promise<MockAuthResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Check if user already exists
  const existingUser = MOCK_USERS.find(u => u.email.toLowerCase() === userData.email.toLowerCase());

  if (existingUser) {
    return {
      success: false,
      message: 'An account with this email already exists.',
    };
  }

  // Create new user
  const newUser: MockUser = {
    id: (MOCK_USERS.length + 1).toString(),
    email: userData.email,
    name: userData.name,
    phone: userData.phone,
    userType: userData.userType,
  };

  // Add to mock database
  MOCK_USERS.push(newUser);

  return {
    success: true,
    user: newUser,
    message: 'Account created successfully!',
  };
};

// Mock logout function
export const mockLogout = async (): Promise<{ success: boolean }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true };
};