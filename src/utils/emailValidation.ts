/**
 * Email validation utilities
 */

// Common domain patterns that might be rejected by some email services
const SUSPICIOUS_DOMAINS = [
  'test.com',
  'example.com',
  'temp.com',
  'fake.com',
];

// More comprehensive email validation
export const isValidEmail = (email: string): boolean => {
  if (!email || email.trim() === '') {
    return false;
  }

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // More strict validation
  const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return strictEmailRegex.test(email);
};

// Check if email domain might be problematic
export const checkEmailDomain = (email: string): { valid: boolean; warning?: string } => {
  if (!isValidEmail(email)) {
    return { valid: false };
  }

  const domain = email.split('@')[1].toLowerCase();

  if (SUSPICIOUS_DOMAINS.includes(domain)) {
    return {
      valid: false,
      warning: 'Please use a real email address from a valid email provider.'
    };
  }

  return { valid: true };
};

// Comprehensive email validation with helpful error messages
export const validateEmailWithMessage = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length < 5) {
    return { valid: false, error: 'Email is too short' };
  }

  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  if (!trimmedEmail.includes('@')) {
    return { valid: false, error: 'Email must contain @ symbol' };
  }

  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Email format is invalid' };
  }

  const [localPart, domain] = parts;

  if (localPart.length === 0) {
    return { valid: false, error: 'Email must have a username before @' };
  }

  if (domain.length === 0) {
    return { valid: false, error: 'Email must have a domain after @' };
  }

  if (!domain.includes('.')) {
    return { valid: false, error: 'Email domain must contain a dot (.)' };
  }

  if (!isValidEmail(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address (e.g., user@example.com)' };
  }

  const domainCheck = checkEmailDomain(trimmedEmail);
  if (!domainCheck.valid) {
    return { valid: false, error: domainCheck.warning || 'Invalid email domain' };
  }

  return { valid: true };
};

// Helper to suggest common email fixes
export const suggestEmailFix = (email: string): string | null => {
  if (!email) return null;

  const commonTypos = {
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };

  const domain = email.split('@')[1];
  if (domain && commonTypos[domain.toLowerCase()]) {
    return email.replace(domain, commonTypos[domain.toLowerCase()]);
  }

  return null;
};