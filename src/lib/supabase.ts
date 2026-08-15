import { createClient } from '@supabase/supabase-js';
import { Service, BusinessHour, BarbershopSettings, BlockedDate, Barber } from '../types';
import { format, addMinutes } from 'date-fns';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean up placeholders
const isConfigured = 
  Boolean(rawUrl) && 
  Boolean(rawKey) && 
  !rawUrl.includes('PASTE_YOUR') && 
  !rawKey.includes('PASTE_YOUR') &&
  rawUrl.startsWith('http');

// Provide dummy values to prevent createClient runtime crash if unconfigured
const supabaseUrl = isConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isConfigured ? rawKey : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConnected(): boolean {
  return isConfigured;
}

// Fallback Seed Data for instant high-end visual fidelity if DB is freshly provisioned or connecting
export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    name: 'The Executive Haircut',
    description: 'Precision haircut tailored to head shape, hot towel neck shave, neck & shoulder massage, and custom pomade styling.',
    duration_minutes: 45,
    price: 55,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf7',
    name: 'Signature Beard Sculpting',
    description: 'Custom beard shaping, hot towel steam conditioning treatment, straight-razor lineup, and organic beard balm finish.',
    duration_minutes: 30,
    price: 40,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf8',
    name: 'Crown Full Service Package',
    description: 'Complete Executive Haircut & Beard Sculpting, facial cleanser steam treatment, dual hot towel wrap, and premium beverage.',
    duration_minutes: 75,
    price: 90,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf9',
    name: 'Traditional Straight Razor Shave',
    description: 'Classic multi-towel straight-razor face shave with pre-shave oil, thick warm lather, and cooling botanical aftershave lotion.',
    duration_minutes: 45,
    price: 50,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6b10',
    name: 'Precision Skin Fade',
    description: 'Flawless razor skin fade or drop fade with razor-sharp lineup, taper, hot towel wrap, and matte clay finish.',
    duration_minutes: 45,
    price: 60,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&q=80&w=800'
  }
];

export const DEFAULT_BUSINESS_HOURS: BusinessHour[] = [
  { weekday: 1, is_open: true, start_time: '09:00', end_time: '19:00' },
  { weekday: 2, is_open: true, start_time: '09:00', end_time: '19:00' },
  { weekday: 3, is_open: true, start_time: '09:00', end_time: '19:00' },
  { weekday: 4, is_open: true, start_time: '09:00', end_time: '20:00' },
  { weekday: 5, is_open: true, start_time: '09:00', end_time: '20:00' },
  { weekday: 6, is_open: true, start_time: '08:00', end_time: '18:00' },
  { weekday: 0, is_open: false, start_time: '10:00', end_time: '16:00' },
];

export const DEFAULT_BARBERS: Barber[] = [
  { id: 'barber-mireya', full_name: 'Mireya Thorne', role: 'Lead Barber', specialty: 'Precision fades', is_active: true },
  { id: 'barber-dominic', full_name: 'Dominic Reyes', role: 'Master Barber', specialty: 'Straight razor shaves', is_active: true },
  { id: 'barber-leo', full_name: 'Leo Chen', role: 'Senior Barber', specialty: 'Beard sculpting', is_active: true },
];

export const DEFAULT_SETTINGS: BarbershopSettings = {
  barbershop_name: 'Crown & Cut Grooming Co.',
  barbershop_email: 'azizovjasur2007@gmail.com',
  barbershop_phone: '+41 22 123 4567',
  barbershop_address: 'Rte de Collex 15, 1293 Bellevue, Geneva, Switzerland',
  slot_interval_minutes: 30,
  booking_notice_hours: 2,
  reminders_enabled: true,
  reminder_hours_before: 2,
  reminder_methods: 'email,sms',
  twilio_enabled: false,
};

/**
 * Creates a 1-click Quick Walk-in entry in Supabase that instantly 
 * locks out the time slot for the given duration.
 */
/**
 * Creates a Quick Walk-in appointment for a specific barber, date, and start time.
 * Relies on the database's exclusion constraint (no_overlapping_bookings) to
 * reject the insert if that barber already has an overlapping appointment —
 * whether it came from the public website or another walk-in entry.
 */
export async function createQuickWalkIn(params: {
  barberId: string;
  appointmentDate: string; // 'yyyy-MM-dd'
  startTime: string; // 'HH:mm'
  durationMinutes?: number;
  clientName?: string;
  serviceName?: string;
}) {
  const {
    barberId,
    appointmentDate,
    startTime,
    durationMinutes = 45,
    clientName = 'Walk-in Client',
    serviceName = 'Quick Walk-In',
  } = params;

  // Combine date + start time into a real Date object so we can add duration safely
  const startDateTime = new Date(`${appointmentDate}T${startTime}:00`);
  const endDateTime = addMinutes(startDateTime, durationMinutes);
  const endTimeStr = format(endDateTime, 'HH:mm');

  // Fallback default service ID if database strictly requires service_id
  const defaultServiceId = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

  const payload: Record<string, any> = {
    full_name: clientName,
    email: 'walkin@shop.local',
    phone: '000-000-0000',
    service_id: defaultServiceId,
    barber_id: barberId,
    appointment_date: appointmentDate,
    start_time: startTime,
    end_time: endTimeStr,
    status: 'confirmed',
    is_walk_in: true,
    notes: `⚡ ${serviceName} registered from Admin Portal`,
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert([payload])
    .select();

  if (error) {
    // Postgres exclusion constraint violation code
    if (error.code === '23P01') {
      throw new Error('That barber is already booked during this time slot. Please choose a different time or barber.');
    }
    console.error('Walk-in execution error:', error);
    throw error;
  }

  return data;
}