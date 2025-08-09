// Quick test script to debug email validation
// Run this with: node debug-email.js

// Simple email validation function (copy of the one in utils)
const validateEmailWithMessage = (email) => {
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

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address (e.g., user@example.com)' };
  }

  return { valid: true };
};

// Test the problematic email
const testEmail = 'vipin@gmail.com';
console.log('Testing email:', testEmail);
const result = validateEmailWithMessage(testEmail);
console.log('Validation result:', result);

// Test normalization
const normalizedEmail = testEmail.trim().toLowerCase();
console.log('Normalized email:', normalizedEmail);

// Test other variations
const testEmails = [
  'vipin@gmail.com',
  'VIPIN@GMAIL.COM',
  ' vipin@gmail.com ',
  'vipin@Gmail.Com',
  'invalid-email',
  'test@test.com'
];

console.log('\n--- Testing multiple emails ---');
testEmails.forEach(email => {
  const result = validateEmailWithMessage(email);
  const normalized = email.trim().toLowerCase();
  console.log(`Email: "${email}" -> "${normalized}" -> Valid: ${result.valid}${result.error ? `, Error: ${result.error}` : ''}`);
});