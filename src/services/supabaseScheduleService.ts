import { supabase } from '../config/supabase';
import { 
  VeterinarianSchedule, 
  ScheduleException, 
  DaySchedule, 
  WeeklySchedule, 
  TimeSlot,
  DatabaseSchedule 
} from '../types';

export class SupabaseScheduleService {
  // Day names for display
  private dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Convert database schedule to app format
  private convertDatabaseToAppSchedule(dbSchedule: any): VeterinarianSchedule {
    return {
      id: dbSchedule.id,
      veterinarianId: dbSchedule.veterinarian_id,
      dayOfWeek: dbSchedule.day_of_week,
      isWorking: dbSchedule.is_working,
      startTime: dbSchedule.start_time,
      endTime: dbSchedule.end_time,
      breakStartTime: dbSchedule.break_start_time,
      breakEndTime: dbSchedule.break_end_time,
      slotDuration: dbSchedule.slot_duration,
      isActive: dbSchedule.is_active,
      createdAt: dbSchedule.created_at,
      updatedAt: dbSchedule.updated_at,
    };
  }

  // Convert app schedule to database format
  private convertAppToDatabaseSchedule(appSchedule: Partial<VeterinarianSchedule>): Partial<DatabaseSchedule> {
    return {
      veterinarian_id: appSchedule.veterinarianId,
      day_of_week: appSchedule.dayOfWeek,
      is_working: appSchedule.isWorking,
      start_time: appSchedule.startTime,
      end_time: appSchedule.endTime,
      break_start_time: appSchedule.breakStartTime,
      break_end_time: appSchedule.breakEndTime,
      slot_duration: appSchedule.slotDuration,
      is_active: appSchedule.isActive,
    };
  }

  // Get veterinarian's weekly schedule
  async getVeterinarianSchedule(veterinarianId: string): Promise<WeeklySchedule> {
    try {
      const { data, error } = await supabase
        .from('veterinarian_schedules')
        .select('*')
        .eq('veterinarian_id', veterinarianId)
        .eq('is_active', true)
        .order('day_of_week');

      if (error) {
        console.error('Error fetching veterinarian schedule:', error);
        throw new Error(`Failed to fetch schedule: ${error.message}`);
      }

      // Convert to WeeklySchedule format
      const weeklySchedule: WeeklySchedule = {};
      
      // Initialize all days with default non-working schedule
      for (let day = 0; day <= 6; day++) {
        weeklySchedule[day] = {
          dayOfWeek: day,
          dayName: this.dayNames[day],
          isWorking: false,
          startTime: '08:00',
          endTime: '17:00',
          slotDuration: 30,
        };
      }

      // Override with actual schedule data
      data.forEach((schedule: any) => {
        const appSchedule = this.convertDatabaseToAppSchedule(schedule);
        weeklySchedule[appSchedule.dayOfWeek] = {
          dayOfWeek: appSchedule.dayOfWeek,
          dayName: this.dayNames[appSchedule.dayOfWeek],
          isWorking: appSchedule.isWorking,
          startTime: appSchedule.startTime,
          endTime: appSchedule.endTime,
          breakStartTime: appSchedule.breakStartTime,
          breakEndTime: appSchedule.breakEndTime,
          slotDuration: appSchedule.slotDuration,
        };
      });

      return weeklySchedule;
    } catch (error) {
      console.error('Error in getVeterinarianSchedule:', error);
      throw error;
    }
  }

  // Update veterinarian's schedule for a specific day
  async updateDaySchedule(
    veterinarianId: string,
    dayOfWeek: number,
    daySchedule: Partial<DaySchedule>
  ): Promise<void> {
    try {
      const updateData = this.convertAppToDatabaseSchedule({
        veterinarianId,
        dayOfWeek,
        isWorking: daySchedule.isWorking,
        startTime: daySchedule.startTime,
        endTime: daySchedule.endTime,
        breakStartTime: daySchedule.breakStartTime,
        breakEndTime: daySchedule.breakEndTime,
        slotDuration: daySchedule.slotDuration,
        isActive: true,
      });

      const { error } = await supabase
        .from('veterinarian_schedules')
        .upsert({
          ...updateData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'veterinarian_id,day_of_week'
        });

      if (error) {
        console.error('Error updating day schedule:', error);
        throw new Error(`Failed to update schedule: ${error.message}`);
      }

      // Regenerate time slots for the next 30 days after schedule change
      await this.regenerateTimeSlots(veterinarianId, 30);
    } catch (error) {
      console.error('Error in updateDaySchedule:', error);
      throw error;
    }
  }

  // Update entire weekly schedule
  async updateWeeklySchedule(
    veterinarianId: string,
    weeklySchedule: WeeklySchedule
  ): Promise<void> {
    try {
      const scheduleUpdates = Object.values(weeklySchedule).map(daySchedule => ({
        ...this.convertAppToDatabaseSchedule({
          veterinarianId,
          dayOfWeek: daySchedule.dayOfWeek,
          isWorking: daySchedule.isWorking,
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
          breakStartTime: daySchedule.breakStartTime,
          breakEndTime: daySchedule.breakEndTime,
          slotDuration: daySchedule.slotDuration,
          isActive: true,
        }),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('veterinarian_schedules')
        .upsert(scheduleUpdates, {
          onConflict: 'veterinarian_id,day_of_week'
        });

      if (error) {
        console.error('Error updating weekly schedule:', error);
        throw new Error(`Failed to update weekly schedule: ${error.message}`);
      }

      // Regenerate time slots for the next 30 days after schedule change
      await this.regenerateTimeSlots(veterinarianId, 30);
    } catch (error) {
      console.error('Error in updateWeeklySchedule:', error);
      throw error;
    }
  }

  // Get schedule exceptions for a date range
  async getScheduleExceptions(
    veterinarianId: string,
    startDate: string,
    endDate: string
  ): Promise<ScheduleException[]> {
    try {
      const { data, error } = await supabase
        .from('schedule_exceptions')
        .select('*')
        .eq('veterinarian_id', veterinarianId)
        .gte('exception_date', startDate)
        .lte('exception_date', endDate)
        .order('exception_date');

      if (error) {
        console.error('Error fetching schedule exceptions:', error);
        throw new Error(`Failed to fetch exceptions: ${error.message}`);
      }

      return data.map((exception: any) => ({
        id: exception.id,
        veterinarianId: exception.veterinarian_id,
        exceptionDate: exception.exception_date,
        exceptionType: exception.exception_type,
        startTime: exception.start_time,
        endTime: exception.end_time,
        breakStartTime: exception.break_start_time,
        breakEndTime: exception.break_end_time,
        slotDuration: exception.slot_duration,
        notes: exception.notes,
        createdAt: exception.created_at,
      }));
    } catch (error) {
      console.error('Error in getScheduleExceptions:', error);
      throw error;
    }
  }

  // Add a schedule exception
  async addScheduleException(exception: Omit<ScheduleException, 'id' | 'createdAt'>): Promise<ScheduleException> {
    try {
      const { data, error } = await supabase
        .from('schedule_exceptions')
        .insert({
          veterinarian_id: exception.veterinarianId,
          exception_date: exception.exceptionDate,
          exception_type: exception.exceptionType,
          start_time: exception.startTime,
          end_time: exception.endTime,
          break_start_time: exception.breakStartTime,
          break_end_time: exception.breakEndTime,
          slot_duration: exception.slotDuration,
          notes: exception.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding schedule exception:', error);
        throw new Error(`Failed to add exception: ${error.message}`);
      }

      // Regenerate time slots for the exception date
      const exceptionDate = new Date(exception.exceptionDate);
      await this.regenerateTimeSlotsForDate(exception.veterinarianId, exceptionDate);

      return {
        id: data.id,
        veterinarianId: data.veterinarian_id,
        exceptionDate: data.exception_date,
        exceptionType: data.exception_type,
        startTime: data.start_time,
        endTime: data.end_time,
        breakStartTime: data.break_start_time,
        breakEndTime: data.break_end_time,
        slotDuration: data.slot_duration,
        notes: data.notes,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error in addScheduleException:', error);
      throw error;
    }
  }

  // Delete a schedule exception
  async deleteScheduleException(exceptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('schedule_exceptions')
        .delete()
        .eq('id', exceptionId);

      if (error) {
        console.error('Error deleting schedule exception:', error);
        throw new Error(`Failed to delete exception: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteScheduleException:', error);
      throw error;
    }
  }

  // Get available time slots for a specific date
  async getAvailableTimeSlots(veterinarianId: string, date: string): Promise<TimeSlot[]> {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('veterinarian_id', veterinarianId)
        .eq('slot_date', date)
        .eq('is_available', true)
        .eq('is_booked', false)
        .order('start_time');

      if (error) {
        console.error('Error fetching time slots:', error);
        throw new Error(`Failed to fetch time slots: ${error.message}`);
      }

      return data.map((slot: any) => ({
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        isAvailable: slot.is_available,
        isBooked: slot.is_booked,
        appointmentId: slot.appointment_id,
        slotType: slot.slot_type,
      }));
    } catch (error) {
      console.error('Error in getAvailableTimeSlots:', error);
      throw error;
    }
  }

  // Regenerate time slots for future dates
  async regenerateTimeSlots(veterinarianId: string, daysAhead: number = 30): Promise<number> {
    try {
      // Call the database function to generate slots
      const { data, error } = await supabase.rpc('generate_time_slots', {
        vet_id: veterinarianId,
        start_date: new Date().toISOString().split('T')[0], // Today
        end_date: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error regenerating time slots:', error);
        throw new Error(`Failed to regenerate time slots: ${error.message}`);
      }

      return data || 0;
    } catch (error) {
      console.error('Error in regenerateTimeSlots:', error);
      throw error;
    }
  }

  // Regenerate time slots for a specific date
  private async regenerateTimeSlotsForDate(veterinarianId: string, date: Date): Promise<void> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // Delete existing slots for this date
      await supabase
        .from('time_slots')
        .delete()
        .eq('veterinarian_id', veterinarianId)
        .eq('slot_date', dateStr);

      // Regenerate slots for this specific date
      await supabase.rpc('generate_time_slots', {
        vet_id: veterinarianId,
        start_date: dateStr,
        end_date: dateStr
      });
    } catch (error) {
      console.error('Error regenerating slots for date:', error);
      throw error;
    }
  }

  // Block/unblock a time slot
  async toggleSlotAvailability(slotId: string, isAvailable: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ 
          is_available: isAvailable,
          slot_type: isAvailable ? 'regular' : 'blocked'
        })
        .eq('id', slotId);

      if (error) {
        console.error('Error toggling slot availability:', error);
        throw new Error(`Failed to update slot availability: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in toggleSlotAvailability:', error);
      throw error;
    }
  }

  // Get all time slots for a date (for schedule management view)
  async getAllTimeSlotsForDate(veterinarianId: string, date: string): Promise<TimeSlot[]> {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('veterinarian_id', veterinarianId)
        .eq('slot_date', date)
        .order('start_time');

      if (error) {
        console.error('Error fetching all time slots:', error);
        throw new Error(`Failed to fetch time slots: ${error.message}`);
      }

      return data.map((slot: any) => ({
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        isAvailable: slot.is_available,
        isBooked: slot.is_booked,
        appointmentId: slot.appointment_id,
        slotType: slot.slot_type,
      }));
    } catch (error) {
      console.error('Error in getAllTimeSlotsForDate:', error);
      throw error;
    }
  }
}

export const supabaseScheduleService = new SupabaseScheduleService();