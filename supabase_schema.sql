-- =========================================================
-- CROWN & CUT GROOMING CO. - SUPABASE DATABASE SCHEMA
-- Execute this SQL in your Supabase SQL Editor to set up all tables.
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BARBERS TABLE
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    role TEXT,
    specialty TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    start_time TEXT NOT NULL, -- e.g. '09:00'
    end_time TEXT NOT NULL,   -- e.g. '09:45'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BUSINESS HOURS TABLE
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    weekday INTEGER NOT NULL UNIQUE, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    is_open BOOLEAN NOT NULL DEFAULT true,
    start_time TEXT NOT NULL DEFAULT '09:00',
    end_time TEXT NOT NULL DEFAULT '19:00'
);

-- 5. BLOCKED DATES TABLE
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocked_date DATE NOT NULL UNIQUE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BARBERSHOP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.barbershop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_name TEXT NOT NULL DEFAULT 'Crown & Cut Grooming Co.',
    barbershop_email TEXT NOT NULL DEFAULT 'azizovjasur2007@gmail.com',
    barbershop_phone TEXT NOT NULL DEFAULT '+998 50 909 40 45',
    barbershop_address TEXT NOT NULL DEFAULT 'Rte de Collex 15, 1293 Bellevue, Geneva, Switzerland',
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
    booking_notice_hours INTEGER NOT NULL DEFAULT 2,
    reminders_enabled BOOLEAN NOT NULL DEFAULT true,
    reminder_hours_before INTEGER NOT NULL DEFAULT 2,
    reminder_methods TEXT NOT NULL DEFAULT 'email,sms', -- 'email', 'sms', 'whatsapp', or comma-separated
    twilio_enabled BOOLEAN NOT NULL DEFAULT false,
    twilio_account_sid TEXT,
    twilio_phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- SEED INITIAL DEFAULT DATA
-- =========================================================

-- Insert default services if empty
INSERT INTO public.services (name, description, duration_minutes, price, is_active)
SELECT 'The Executive Haircut', 'Precision haircut tailored to your head shape, completed with hot towel neck shave, styling, and neck massage.', 45, 55.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'The Executive Haircut');

INSERT INTO public.services (name, description, duration_minutes, price, is_active)
SELECT 'Signature Beard Sculpting', 'Custom beard shaping, hot towel conditioning treatment, straight-razor lineup, and beard oil finish.', 30, 40.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Signature Beard Sculpting');

INSERT INTO public.services (name, description, duration_minutes, price, is_active)
SELECT 'Crown Full Service Package', 'Complete Executive Haircut & Beard Sculpting, facial cleanser steam treatment, hot towel wrap, and premium styling.', 75, 90.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Crown Full Service Package');

INSERT INTO public.services (name, description, duration_minutes, price, is_active)
SELECT 'Traditional Straight Razor Shave', 'Classic hot towel straight-razor face shave with pre-shave oil, lather, and soothing aftershave lotion.', 45, 50.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Traditional Straight Razor Shave');

INSERT INTO public.services (name, description, duration_minutes, price, is_active)
SELECT 'Precision Skin Fade', 'Flawless razor skin fade or drop fade, sharp taper, finished with hot towel and pomade.', 45, 60.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Precision Skin Fade');

-- Insert default barbers if empty
INSERT INTO public.barbers (full_name, role, specialty, is_active)
SELECT 'Mireya Thorne', 'Lead Barber', 'Precision fades', true
WHERE NOT EXISTS (SELECT 1 FROM public.barbers WHERE full_name = 'Mireya Thorne');

INSERT INTO public.barbers (full_name, role, specialty, is_active)
SELECT 'Dominic Reyes', 'Master Barber', 'Straight razor shaves', true
WHERE NOT EXISTS (SELECT 1 FROM public.barbers WHERE full_name = 'Dominic Reyes');

INSERT INTO public.barbers (full_name, role, specialty, is_active)
SELECT 'Leo Chen', 'Senior Barber', 'Beard sculpting', true
WHERE NOT EXISTS (SELECT 1 FROM public.barbers WHERE full_name = 'Leo Chen');

-- Insert default business hours if empty (0 = Sun, 1 = Mon ... 6 = Sat)
INSERT INTO public.business_hours (weekday, is_open, start_time, end_time)
VALUES
  (1, true, '09:00', '19:00'), -- Monday
  (2, true, '09:00', '19:00'), -- Tuesday
  (3, true, '09:00', '19:00'), -- Wednesday
  (4, true, '09:00', '20:00'), -- Thursday
  (5, true, '09:00', '20:00'), -- Friday
  (6, true, '08:00', '18:00'), -- Saturday
  (0, false, '10:00', '16:00') -- Sunday (Closed)
ON CONFLICT (weekday) DO NOTHING;

-- Insert default barbershop settings if empty
INSERT INTO public.barbershop_settings (barbershop_name, barbershop_email, barbershop_phone, barbershop_address, slot_interval_minutes, booking_notice_hours, reminders_enabled, reminder_hours_before, reminder_methods)
SELECT 'Crown & Cut Grooming Co.', 'azizovjasur2007@gmail.com', '+998 50 909 40 45', 'Rte de Collex 15, 1293 Bellevue, Geneva, Switzerland', 30, 2, true, 2, 'email,sms'
WHERE NOT EXISTS (SELECT 1 FROM public.barbershop_settings);

-- Disable Row Level Security (RLS) for public access or configure simple policies:
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active services, business hours, blocked dates, and barbershop settings
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public read barbers" ON public.barbers FOR SELECT USING (true);
CREATE POLICY "Public insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public read business_hours" ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "Public read blocked_dates" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "Public read barbershop_settings" ON public.barbershop_settings FOR SELECT USING (true);
CREATE POLICY "Public read admin_users" ON public.admin_users FOR SELECT USING (true);

-- Allow full access for authenticated users / admins
CREATE POLICY "Admin full services" ON public.services FOR ALL USING (true);
CREATE POLICY "Admin full barbers" ON public.barbers FOR ALL USING (true);
CREATE POLICY "Admin full appointments" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Admin full business_hours" ON public.business_hours FOR ALL USING (true);
CREATE POLICY "Admin full blocked_dates" ON public.blocked_dates FOR ALL USING (true);
CREATE POLICY "Admin full barbershop_settings" ON public.barbershop_settings FOR ALL USING (true);
CREATE POLICY "Admin full admin_users" ON public.admin_users FOR ALL USING (true);
