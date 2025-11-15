# Privacy & Security Flow Analysis & Recommendations

## 📋 Current Privacy & Security Flow Structure

### 1. **PrivacyScreen** (`PrivacyScreen.tsx`)
- **Location**: Stack screen (accessible from ProfileScreen)
- **User Types**: Both Pet Owners and Veterinarians
- **Current Features**:
  - **Privacy Settings**:
    - Profile Visibility toggle (not saved to database)
    - Data Sharing toggle (not saved to database)
  - **Security Settings**:
    - Change Password (placeholder - shows alert only)
    - Two-Factor Authentication (placeholder - shows "coming soon")
  - **Account Actions**:
    - Delete Account (only signs out, doesn't actually delete account)

---

## 🔍 Current Flow Issues

### 1. **Incomplete Features**
- ❌ **Issue**: Change Password only shows an alert, doesn't actually change password
- ❌ **Issue**: Two-Factor Authentication is just a placeholder
- ❌ **Issue**: Delete Account only signs out, doesn't delete the account from database
- ❌ **Issue**: Privacy settings (Profile Visibility, Data Sharing) are not saved to database
- ❌ **Issue**: No password change screen/form
- ❌ **Issue**: No confirmation flow for sensitive actions

### 2. **Missing Security Features**
- ❌ **Issue**: No session management (active sessions, logout from all devices)
- ❌ **Issue**: No security activity log (recent logins, password changes)
- ❌ **Issue**: No password strength indicator
- ❌ **Issue**: No biometric authentication option
- ❌ **Issue**: No account recovery options

### 3. **Missing Privacy Features**
- ❌ **Issue**: No data export functionality (GDPR compliance)
- ❌ **Issue**: No data deletion request flow
- ❌ **Issue**: No privacy policy link
- ❌ **Issue**: No terms of service link
- ❌ **Issue**: No cookie/data usage preferences

### 4. **Database Issues**
- ❌ **Issue**: No database columns for privacy preferences
- ❌ **Issue**: No audit trail for security actions
- ❌ **Issue**: No soft delete for accounts (hard delete loses all data)

---

## ✅ Recommended Privacy & Security Flow

### **Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│              PRIVACY & SECURITY SCREEN                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Privacy Settings                                      │  │
│  │  • Profile Visibility → Saved to profiles table       │  │
│  │  • Data Sharing → Saved to profiles table            │  │
│  │  • Location Sharing → Saved to profiles table        │  │
│  │  • Search Visibility → Saved to profiles table       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Security Settings                                      │  │
│  │  • Change Password → ChangePasswordScreen (NEW)       │  │
│  │  • Two-Factor Authentication → 2FAScreen (NEW)       │  │
│  │  • Biometric Login → BiometricSettingsScreen (NEW)    │  │
│  │  • Active Sessions → ActiveSessionsScreen (NEW)       │  │
│  │  • Security Activity → SecurityActivityScreen (NEW)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data & Privacy                                        │  │
│  │  • Download My Data → DataExportScreen (NEW)          │  │
│  │  • Privacy Policy → WebView/External Link            │  │
│  │  • Terms of Service → WebView/External Link          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Account Actions                                       │  │
│  │  • Deactivate Account → DeactivateAccountScreen (NEW)│  │
│  │  • Delete Account → DeleteAccountScreen (NEW)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Recommended Implementation

### **Phase 1: Database Schema Updates**

#### 1.1 **Add Privacy Preference Columns to `profiles` Table**

```sql
-- Migration: Add Privacy Preferences to Profiles Table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_profile_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_data_sharing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_location_sharing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_search_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS security_2fa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS security_biometric_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_deactivated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_deactivated_at TIMESTAMP WITH TIME ZONE;

-- Create index for privacy settings
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_visible 
ON profiles(privacy_profile_visible) 
WHERE privacy_profile_visible = true;
```

#### 1.2 **Create Security Activity Log Table**

```sql
-- Create security_activity_log table
CREATE TABLE IF NOT EXISTS security_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'password_changed',
    'password_reset',
    'login',
    'logout',
    '2fa_enabled',
    '2fa_disabled',
    'account_deactivated',
    'account_deleted',
    'email_changed',
    'phone_changed'
  )),
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_activity_user_id 
ON security_activity_log(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE security_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security activity" ON security_activity_log
  FOR SELECT USING (auth.uid() = user_id);
```

### **Phase 2: Core Features Implementation**

#### 2.1 **Update PrivacyScreen.tsx**

**Load and Save Privacy Preferences:**
```typescript
const [privacySettings, setPrivacySettings] = useState({
  profileVisible: true,
  dataSharing: false,
  locationSharing: true,
  searchVisible: true,
});

const loadPrivacySettings = async () => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('privacy_profile_visible, privacy_data_sharing, privacy_location_sharing, privacy_search_visible')
    .eq('id', userId)
    .single();
  
  if (profile) {
    setPrivacySettings({
      profileVisible: profile.privacy_profile_visible ?? true,
      dataSharing: profile.privacy_data_sharing ?? false,
      locationSharing: profile.privacy_location_sharing ?? true,
      searchVisible: profile.privacy_search_visible ?? true,
    });
  }
};

const handlePrivacySettingChange = async (field: string, value: boolean) => {
  await supabase
    .from('profiles')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', userId);
  
  // Log security activity
  await logSecurityActivity('privacy_setting_changed', { field, value });
};
```

#### 2.2 **Create ChangePasswordScreen.tsx**

**Features:**
- Current password verification
- New password input with strength indicator
- Confirm new password
- Password requirements display
- Success/error handling

```typescript
const ChangePasswordScreen: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChangePassword = async () => {
    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      Alert.alert('Error', 'Failed to change password');
      return;
    }

    // Log security activity
    await logSecurityActivity('password_changed');
    
    Alert.alert('Success', 'Password changed successfully');
    navigation.goBack();
  };
};
```

#### 2.3 **Create DeleteAccountScreen.tsx**

**Features:**
- Confirmation flow with multiple steps
- Reason for deletion (optional)
- Data deletion warning
- Final confirmation with password
- Soft delete (deactivate) vs hard delete option

```typescript
const DeleteAccountScreen: React.FC = () => {
  const handleDeleteAccount = async () => {
    // Step 1: Verify password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (verifyError) {
      Alert.alert('Error', 'Password is incorrect');
      return;
    }

    // Step 2: Soft delete (recommended) - deactivate account
    await supabase
      .from('profiles')
      .update({
        account_deactivated: true,
        account_deactivated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Step 3: Log security activity
    await logSecurityActivity('account_deactivated');

    // Step 4: Sign out
    await supabase.auth.signOut();
    
    // Step 5: Navigate to auth screen
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };
};
```

#### 2.4 **Create ActiveSessionsScreen.tsx**

**Features:**
- List all active sessions
- Show device info, location, last activity
- Option to logout from specific device
- Option to logout from all devices

#### 2.5 **Create SecurityActivityScreen.tsx**

**Features:**
- Show recent security activities
- Filter by activity type
- Show IP address and device info
- Export activity log

#### 2.6 **Create DataExportScreen.tsx**

**Features:**
- Request data export
- Show export status
- Download exported data
- GDPR compliance

---

## 📱 Navigation Updates

### **Update RootStackParamList**

```typescript
export type RootStackParamList = {
  // ... existing routes
  ChangePassword: undefined;
  TwoFactorAuth: undefined;
  ActiveSessions: undefined;
  SecurityActivity: undefined;
  DataExport: undefined;
  DeleteAccount: undefined;
  DeactivateAccount: undefined;
};
```

### **Update AppNavigator.tsx**

```typescript
<Stack.Screen
  name="ChangePassword"
  component={ChangePasswordScreen}
  options={{ headerShown: true, title: 'Change Password' }}
/>
<Stack.Screen
  name="TwoFactorAuth"
  component={TwoFactorAuthScreen}
  options={{ headerShown: true, title: 'Two-Factor Authentication' }}
/>
<Stack.Screen
  name="ActiveSessions"
  component={ActiveSessionsScreen}
  options={{ headerShown: true, title: 'Active Sessions' }}
/>
<Stack.Screen
  name="SecurityActivity"
  component={SecurityActivityScreen}
  options={{ headerShown: true, title: 'Security Activity' }}
/>
<Stack.Screen
  name="DataExport"
  component={DataExportScreen}
  options={{ headerShown: true, title: 'Download My Data' }}
/>
<Stack.Screen
  name="DeleteAccount"
  component={DeleteAccountScreen}
  options={{ headerShown: true, title: 'Delete Account' }}
/>
<Stack.Screen
  name="DeactivateAccount"
  component={DeactivateAccountScreen}
  options={{ headerShown: true, title: 'Deactivate Account' }}
/>
```

---

## 🔐 Security Best Practices

### 1. **Password Management**
- ✅ Minimum 8 characters
- ✅ Require uppercase, lowercase, number, special character
- ✅ Password strength indicator
- ✅ Prevent reuse of last 3 passwords
- ✅ Rate limiting on password attempts

### 2. **Two-Factor Authentication**
- ✅ TOTP (Time-based One-Time Password)
- ✅ SMS backup codes
- ✅ Recovery email
- ✅ QR code for authenticator apps

### 3. **Session Management**
- ✅ Token expiration
- ✅ Refresh token rotation
- ✅ Device fingerprinting
- ✅ Suspicious activity detection

### 4. **Account Deletion**
- ✅ Soft delete (deactivate) by default
- ✅ 30-day grace period for reactivation
- ✅ Hard delete option after grace period
- ✅ Data anonymization option

### 5. **Privacy Compliance**
- ✅ GDPR compliance (data export, deletion)
- ✅ Privacy policy link
- ✅ Terms of service link
- ✅ Cookie/data usage preferences
- ✅ Consent management

---

## 📊 Priority Implementation Order

### **High Priority** (Immediate)
1. ✅ Add privacy preference columns to `profiles` table
2. ✅ Update PrivacyScreen to save/load privacy settings
3. ✅ Create ChangePasswordScreen with proper implementation
4. ✅ Fix DeleteAccount to actually delete/deactivate account
5. ✅ Add security activity logging

### **Medium Priority** (Next Sprint)
6. ✅ Create ActiveSessionsScreen
7. ✅ Create SecurityActivityScreen
8. ✅ Create DataExportScreen (GDPR compliance)
9. ✅ Add password strength indicator
10. ✅ Implement soft delete for accounts

### **Low Priority** (Future)
11. ✅ Implement Two-Factor Authentication
12. ✅ Add biometric authentication
13. ✅ Add suspicious activity detection
14. ✅ Add privacy policy and terms links
15. ✅ Add cookie/data usage preferences

---

## 🧪 Testing Checklist

- [ ] Privacy settings save and load correctly
- [ ] Change password flow works end-to-end
- [ ] Password strength indicator works
- [ ] Delete account actually deletes/deactivates account
- [ ] Security activity is logged correctly
- [ ] Active sessions display correctly
- [ ] Data export generates correct data
- [ ] All security actions require proper authentication
- [ ] Error handling works for all operations
- [ ] Loading states display correctly

---

## 📝 Summary

The current privacy and security flow has basic structure but needs:
1. **Database integration** - Save privacy preferences to database
2. **Password management** - Implement actual password change functionality
3. **Account deletion** - Proper account deletion/deactivation flow
4. **Security logging** - Track all security-related activities
5. **Enhanced features** - 2FA, session management, data export

Following this recommended flow will provide a comprehensive, secure, and privacy-compliant experience for users.

