import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

export type SecurityActivityType =
  | 'password_changed'
  | 'password_reset'
  | 'login'
  | 'logout'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'biometric_enabled'
  | 'biometric_disabled'
  | 'account_deactivated'
  | 'account_deleted'
  | 'account_reactivated'
  | 'email_changed'
  | 'phone_changed'
  | 'privacy_setting_changed'
  | 'session_terminated';

export interface SecurityActivity {
  id: string;
  user_id: string;
  activity_type: SecurityActivityType;
  ip_address: string | null;
  user_agent: string | null;
  device_info: any | null;
  metadata: any | null;
  created_at: string;
}

class SecurityActivityService {
  /**
   * Log a security activity
   */
  async logActivity(
    userId: string,
    activityType: SecurityActivityType,
    metadata?: any
  ): Promise<void> {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        platformVersion: Platform.Version,
      };

      const { error } = await supabase
        .from('security_activity_log')
        .insert({
          user_id: userId,
          activity_type: activityType,
          device_info: deviceInfo,
          metadata: metadata || null,
        });

      if (error) {
        console.error('Error logging security activity:', error);
        // Don't throw - logging failures shouldn't break the app
      }
    } catch (error) {
      console.error('Error in logActivity:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  /**
   * Get security activities for a user
   */
  async getUserActivities(
    userId: string,
    limit: number = 50
  ): Promise<SecurityActivity[]> {
    try {
      const { data, error } = await supabase
        .from('security_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching security activities:', error);
        throw new Error(`Failed to fetch security activities: ${error.message}`);
      }

      return (data || []) as SecurityActivity[];
    } catch (error) {
      console.error('Error in getUserActivities:', error);
      throw error;
    }
  }

  /**
   * Get security activities by type
   */
  async getActivitiesByType(
    userId: string,
    activityType: SecurityActivityType,
    limit: number = 50
  ): Promise<SecurityActivity[]> {
    try {
      const { data, error } = await supabase
        .from('security_activity_log')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching security activities by type:', error);
        throw new Error(`Failed to fetch security activities: ${error.message}`);
      }

      return (data || []) as SecurityActivity[];
    } catch (error) {
      console.error('Error in getActivitiesByType:', error);
      throw error;
    }
  }
}

export const securityActivityService = new SecurityActivityService();

