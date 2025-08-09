/**
 * Test email validation to help debug Supabase email issues
 */

import { validateEmailWithMessage, suggestEmailFix } from './emailValidation';

export const testEmailValidation = () => {
  const testEmails = [
    'vipin@gmail.com',
    'test@example.com',
    'user@domain.co',
    'invalid-email',
    'user@',
    '@domain.com',
    'user@domain',
    'user.name@domain.com',
    'user+tag@domain.com',
    'USER@DOMAIN.COM',
    ' user@domain.com ', // with spaces
  ];

  console.log('🧪 Testing Email Validation:');
  console.log('================================');

  testEmails.forEach(email => {
    const result = validateEmailWithMessage(email);
    const suggestion = suggestEmailFix(email);
    
    console.log(`Email: "${email}"`);
    console.log(`Valid: ${result.valid}`);
    if (!result.valid) {
      console.log(`Error: ${result.error}`);
    }
    if (suggestion) {
      console.log(`Suggestion: ${suggestion}`);
    }
    console.log('---');
  });
};

// Common email validation issues and solutions
export const emailValidationTips = [
  'Make sure email contains @ symbol',
  'Email should have format: username@domain.com',
  'Check for typos in common domains (gmail, yahoo, hotmail)',
  'Remove extra spaces before/after email',
  'Ensure domain has at least one dot (.)',
  'Avoid using test or fake email domains',
];

export const debugSupabaseEmailError = (email: string, error: string) => {
  console.log('🔍 Debugging Supabase Email Error:');
  console.log('==================================');
  console.log(`Email: ${email}`);
  console.log(`Error: ${error}`);
  
  const validation = validateEmailWithMessage(email);
  console.log(`Local validation: ${validation.valid ? 'PASS' : 'FAIL'}`);
  
  if (!validation.valid) {
    console.log(`Local error: ${validation.error}`);
  }
  
  const suggestion = suggestEmailFix(email);
  if (suggestion) {
    console.log(`Suggested fix: ${suggestion}`);
  }
  
  console.log('\nPossible causes:');
  console.log('- Supabase project has email confirmation enabled');
  console.log('- Email domain is blacklisted by Supabase');
  console.log('- Rate limiting on signup attempts');
  console.log('- Invalid characters in email');
  console.log('- Email already exists in the system');
};