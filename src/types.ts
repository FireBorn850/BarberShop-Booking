export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at?: string;
  image_url?: string;
}

export interface Barber {
  id: string;
  full_name: string;
  role?: string | null;
  specialty?: string | null;
  is_active: boolean;
  created_at?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service_id: string;
  barber_id?: string | null;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm or HH:mm:ss
  end_time: string;   // HH:mm or HH:mm:ss
  status: AppointmentStatus;
  notes?: string | null;
  reminder_sent?: boolean;
  reminder_sent_at?: string | null;
  created_at?: string;
  // Joined or populated details for display
  service?: Service;
  barber?: Barber | null;

  // 👇 NEW: Loyalty & referral fields
  customer_id?: string | null;
  discount_amount?: number | null;
  points_redeemed?: number | null;
  points_earned?: number | null;
  referral_code_used?: string | null;
  lang?: string;
}

export interface BusinessHour {
  id?: string;
  weekday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  is_open: boolean;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
}

export interface BlockedDate {
  id: string;
  blocked_date: string; // YYYY-MM-DD
  reason?: string | null;
  created_at?: string;
}

export interface BarbershopSettings {
  id?: string;
  barbershop_name: string;
  barbershop_email: string;
  barbershop_phone: string;
  barbershop_address: string;
  slot_interval_minutes: number;
  booking_notice_hours: number;
  reminders_enabled?: boolean;
  reminder_hours_before?: number;
  reminder_methods?: string;
  twilio_enabled?: boolean;
  twilio_account_sid?: string | null;
  twilio_phone_number?: string | null;
  created_at?: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  created_at?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  startTimeString: string; // e.g. "09:00"
  endTimeString: string;   // e.g. "09:45"
  label: string;           // e.g. "09:00 AM - 09:45 AM"
  isAvailable: boolean;
  reason?: string;
  matchedBarberId?: string | null;
}

// =========================================================
// 👇 NEW: LOYALTY & REFERRAL SYSTEM TYPES
// (Mirrors src/lib/loyalty.ts — kept here too so components
// that only need the shape, not the functions, can import
// from types.ts without pulling in the whole loyalty lib.)
// =========================================================

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  total_points: number;
  lifetime_spend: number;
  referral_code: string;
  referred_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type LoyaltyTransactionType =
  | 'earn'
  | 'redeem'
  | 'referral_bonus'
  | 'welcome_bonus'
  | 'expire';

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  points: number;
  type: LoyaltyTransactionType;
  description?: string;
  reference_id?: string;
  reference_type?: 'appointment' | 'referral';
  expires_at?: string;
  created_at: string;
}

export type ReferralStatus = 'pending' | 'completed';

export interface Referral {
  id: string;
  referrer_id: string;
  referee_email: string;
  referee_name: string;
  appointment_id?: string | null;
  status: ReferralStatus;
  reward_given: boolean;
  completed_at?: string | null;
  created_at: string;
}

export interface LoyaltySettings {
  id: string;
  points_per_dollar: number;
  welcome_bonus_points: number;
  referral_reward_points: number;
  redeem_points_per_dollar: number;
  max_redeem_per_booking: number;
  points_expiry_months: number;
  referral_share_message: string;
  fixed_discount_amount: number;
  points_required_for_discount: number;
}