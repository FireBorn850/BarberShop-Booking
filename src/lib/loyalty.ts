// src/lib/loyalty.ts

import { supabase, isSupabaseConnected } from './supabase';

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  total_points: number;
  lifetime_spend: number;
  referral_code: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  points: number;
  type: 'earn' | 'redeem' | 'referral_bonus' | 'welcome_bonus' | 'expire';
  description?: string;
  reference_id?: string;
  reference_type?: 'appointment' | 'referral';
  expires_at?: string;
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

// Generate a unique referral code - SYNC version for local mode
export function generateReferralCodeSync(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${random}`;
}

// Generate a unique referral code - ASYNC version with collision resistance
export async function generateReferralCode(name: string, maxAttempts: number = 5): Promise<string> {
  const prefix = name.substring(0, 3).toUpperCase();
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${prefix}${random}`;
    
    // Check if code exists in database (if Supabase is connected)
    if (isSupabaseConnected()) {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('referral_code')
        .eq('referral_code', code)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking referral code uniqueness:', error);
        return code;
      }
      
      if (!data) {
        return code;
      }
    } else {
      return code;
    }
  }
  
  // Fallback: use timestamp
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

// Get or create customer profile — this IS the auto-enroll.
export async function getOrCreateCustomerProfile(
  email: string,
  fullName: string,
  phone?: string
): Promise<CustomerProfile | null> {
  if (!isSupabaseConnected()) {
    return createLocalProfile(email, fullName, phone);
  }

  try {
    // Use the safe database function that handles the welcome bonus atomically
    const { data, error } = await supabase.rpc('safe_create_customer_profile', {
      p_email: email.trim().toLowerCase(),
      p_full_name: fullName.trim(),
      p_phone: phone?.trim() || null
    });

    if (error) {
      console.error('Error creating/fetching customer profile:', error);

      // Fallback: try a regular select if RPC fails
      const { data: existing, error: fetchError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching customer profile:', fetchError);
        return null;
      }

      return existing;
    }

    return data;
  } catch (error) {
    console.error('Error in getOrCreateCustomerProfile:', error);
    return null;
  }
}

// Helper function for local mode - FIXED to use sync version
function createLocalProfile(email: string, fullName: string, phone?: string): CustomerProfile {
  return {
    id: 'local-' + Date.now(),
    email,
    full_name: fullName,
    phone: phone || '',
    total_points: 200,
    lifetime_spend: 0,
    referral_code: generateReferralCodeSync(fullName),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Add (or subtract, for redemptions — pass a negative number) loyalty points.
export async function addLoyaltyPoints(
  customerId: string,
  points: number,
  type: LoyaltyTransaction['type'],
  description: string,
  referenceId?: string,
  referenceType?: 'appointment' | 'referral'
): Promise<boolean> {
  if (!isSupabaseConnected()) {
    console.log('Loyalty points added (local):', { customerId, points, type, description });
    return true;
  }

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('customer_profiles')
      .select('total_points')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      console.error('Error fetching profile for points update:', fetchError);
      return false;
    }

    const settings = await getLoyaltySettings();
    const expiresAt = settings
      ? new Date(Date.now() + settings.points_expiry_months * 30 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const { error: txError } = await supabase
      .from('loyalty_transactions')
      .insert({
        customer_id: customerId,
        points,
        type,
        description,
        reference_id: referenceId,
        reference_type: referenceType,
        expires_at: expiresAt
      });

    if (txError) {
      console.error('Error adding loyalty transaction:', txError);
      return false;
    }

    const newTotal = Math.max(0, (profile.total_points || 0) + points);
    const { error: updateError } = await supabase
      .from('customer_profiles')
      .update({ total_points: newTotal, updated_at: new Date().toISOString() })
      .eq('id', customerId);

    if (updateError) {
      console.error('Error updating profile points:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addLoyaltyPoints:', error);
    return false;
  }
}

// Get loyalty settings
export async function getLoyaltySettings(): Promise<LoyaltySettings | null> {
  if (!isSupabaseConnected()) {
    return {
      id: 'local',
      points_per_dollar: 10,
      welcome_bonus_points: 200,
      referral_reward_points: 500,
      redeem_points_per_dollar: 100,
      max_redeem_per_booking: 1000,
      points_expiry_months: 12,
      referral_share_message: 'Hey! Get $15 off your first booking at Crown & Cut Grooming Co. using my referral code: {code}',
      fixed_discount_amount: 10,
      points_required_for_discount: 1000
    };
  }

  try {
    const { data, error } = await supabase
      .from('loyalty_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching loyalty settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLoyaltySettings:', error);
    return null;
  }
}

// Single source of truth for "can this customer redeem right now"
// FIXED: Shows correct points needed for next discount
export function getAvailableDiscount(
  profile: CustomerProfile | null,
  settings: LoyaltySettings | null
): { 
  eligible: boolean; 
  discountAmount: number; 
  pointsNeeded: number; 
  pointsRequired: number;
  availableDiscounts: number;
  nextThreshold: number;
} {
  const pointsRequired = settings?.points_required_for_discount ?? 1000;

  if (!profile || !settings) {
    return { 
      eligible: false, 
      discountAmount: 0, 
      pointsNeeded: pointsRequired, 
      pointsRequired,
      availableDiscounts: 0,
      nextThreshold: pointsRequired
    };
  }

  const earnedDiscounts = Math.floor(profile.total_points / pointsRequired);
  const nextThreshold = (earnedDiscounts + 1) * pointsRequired;
  const pointsNeeded = Math.max(0, nextThreshold - profile.total_points);
  
  // Customer is eligible if they have at least one full discount worth of points
  const eligible = earnedDiscounts >= 1;
  
  return {
    eligible,
    discountAmount: eligible ? settings.fixed_discount_amount : 0,
    pointsNeeded,
    pointsRequired,
    availableDiscounts: earnedDiscounts,
    nextThreshold
  };
}

// Get customer's transaction history
export async function getCustomerTransactions(customerId: string): Promise<LoyaltyTransaction[]> {
  if (!isSupabaseConnected()) return [];
  try {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in getCustomerTransactions:', error);
    return [];
  }
}

// Process referral (records the referral as pending)
export async function processReferral(
  referrerCode: string,
  refereeEmail: string,
  refereeName: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConnected()) {
    return { success: true, message: 'Referral recorded (local mode)' };
  }

  try {
    const { data: referrer, error: referrerError } = await supabase
      .from('customer_profiles')
      .select('id, full_name')
      .eq('referral_code', referrerCode)
      .maybeSingle();

    if (referrerError || !referrer) {
      return { success: false, message: 'Invalid referral code' };
    }

    const { data: existingReferee } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('email', refereeEmail)
      .maybeSingle();

    if (existingReferee) {
      return { success: false, message: 'This email is already registered' };
    }

    const { error: refError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referee_email: refereeEmail,
        referee_name: refereeName,
        status: 'pending'
      })
      .select()
      .single();

    if (refError) {
      console.error('Error creating referral:', refError);
      return { success: false, message: 'Failed to create referral' };
    }

    return { success: true, message: 'Referral recorded! Your friend will get a discount.' };
  } catch (error) {
    console.error('Error in processReferral:', error);
    return { success: false, message: 'Failed to process referral' };
  }
}

// Get customer's referral stats
export async function getReferralStats(customerId: string): Promise<{
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  earnedPoints: number;
}> {
  if (!isSupabaseConnected()) {
    return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, earnedPoints: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('status')
      .eq('referrer_id', customerId);

    if (error) {
      console.error('Error fetching referral stats:', error);
      return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, earnedPoints: 0 };
    }

    const total = data?.length || 0;
    const completed = data?.filter(r => r.status === 'completed').length || 0;
    const pending = data?.filter(r => r.status === 'pending').length || 0;

    const { data: pointsData, error: pointsError } = await supabase
      .from('loyalty_transactions')
      .select('points')
      .eq('customer_id', customerId)
      .eq('type', 'referral_bonus');

    if (pointsError) {
      console.error('Error fetching referral points:', pointsError);
      return { totalReferrals: total, completedReferrals: completed, pendingReferrals: pending, earnedPoints: 0 };
    }

    const earnedPoints = pointsData?.reduce((sum, tx) => sum + tx.points, 0) || 0;

    return { totalReferrals: total, completedReferrals: completed, pendingReferrals: pending, earnedPoints };
  } catch (error) {
    console.error('Error in getReferralStats:', error);
    return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, earnedPoints: 0 };
  }
}