import React, { useState, useEffect } from 'react';
import {
  Service,
  Appointment,
  BusinessHour,
  BlockedDate,
  BarbershopSettings,
  AppointmentStatus,
  Barber
} from './types';
import {
  supabase,
  isSupabaseConnected,
  DEFAULT_SERVICES,
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_SETTINGS,
  DEFAULT_BARBERS
} from './lib/supabase';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { BeforeAfterGallery } from './components/BeforeAfterGallery';
import { GoogleReviews } from './components/GoogleReviews';
import { StickyBookBar } from './components/StickyBookBar';
import { About } from './components/About';
import { BookingFlow } from './components/BookingFlow';
import { LoyaltyTeaser } from './components/LoyaltyTeaser'; // 👈 ADDED: Loyalty widget
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { CancelAppointment } from './components/CancelAppointment';
import { PrivacyPolicy } from './components/PrivacyPolicy'; // 🆕 ADDED: Standalone privacy policy page
import { ToastContainer, useToast } from './components/Toast';
import { Sun, Moon } from 'lucide-react';

export default function App() {
  // Toast notifications
  const { toasts, addToast, removeToast } = useToast();

  // Navigation & View Mode
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // Public self-service cancellation view. Set when the URL hash matches
  // #cancel/<appointment-id> (e.g. from a link in the confirmation email).
  const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(null);

  // 🆕 Standalone Privacy Policy view. Set when the URL hash is exactly
  // #privacy (e.g. from the footer link or the booking-step consent notice —
  // both open it in a NEW TAB via target="_blank", so in-progress form state
  // elsewhere on the site is never lost).
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(
    window.location.hash === '#privacy'
  );

  useEffect(() => {
    const checkPrivacyHash = () => {
      setShowPrivacyPolicy(window.location.hash === '#privacy');
    };
    // Re-check on back/forward navigation or any in-tab hash change, not just
    // on initial mount — cheap safety net in case a link is ever added
    // without target="_blank".
    window.addEventListener('hashchange', checkPrivacyHash);
    return () => window.removeEventListener('hashchange', checkPrivacyHash);
  }, []);

  // Theme State (Defaults to 'dark' for executive barbershop look)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  // Apply theme class to <html> element dynamically
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global scroll-reveal: watches for any element with class="reveal" and fades it in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const observeAll = () => {
      document.querySelectorAll('.reveal:not(.revealed)').forEach((el) => {
        if (!el.hasAttribute('data-reveal-observed')) {
          el.setAttribute('data-reveal-observed', 'true');
          observer.observe(el);
        }
      });
    };

    observeAll();

    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Safety net: if anything ever fails to trigger naturally, force-reveal it
    // so content is never permanently stuck invisible.
    const failsafe = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.revealed)').forEach((el) => {
        el.classList.add('revealed');
      });
    }, 1500);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      clearTimeout(failsafe);
    };
  }, []);

  // Hidden admin access via secret URL hash (no public button anywhere)
  // Visit yoursite.com/#admin-access to trigger login modal / admin panel
  useEffect(() => {
    if (window.location.hash === '#admin-access') {
      if (adminUserId) {
        setCurrentView('admin');
      } else {
        setAdminLoginModalOpen(true);
      }
    }
  }, [adminUserId]);

  // Public self-service cancellation link: yoursite.com/#cancel/<appointment-id>
  // (sent in the customer's booking confirmation email). Independent of the
  // admin-access check above — different hash pattern, no auth required.
  useEffect(() => {
    const match = window.location.hash.match(/^#cancel\/([a-zA-Z0-9-]+)$/);
    if (match) {
      setCancelAppointmentId(match[1]);
    }
  }, []);

  // App Data States
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(DEFAULT_BUSINESS_HOURS);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<BarbershopSettings>(DEFAULT_SETTINGS);
  const [barbers, setBarbers] = useState<Barber[]>(DEFAULT_BARBERS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Preselected service for booking when user clicks "Book Cut" on a service card
  const [preselectedService, setPreselectedService] = useState<Service | null>(null);

  // 👇 ADDED: Customer data for loyalty widget
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Loading indicator for initial data fetch
  const [initialLoading, setInitialLoading] = useState(true);

  // Check Supabase session & fetch initial dataset
  useEffect(() => {
    async function loadData() {
      setInitialLoading(true);

      if (isSupabaseConnected()) {
        try {
          // 1. Check current session
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            const uid = sessionData.session.user.id;
            // Verify if user exists in admin_users table
            const { data: adminRecord } = await supabase
              .from('admin_users')
              .select('id')
              .eq('user_id', uid)
              .maybeSingle();

            if (adminRecord) {
              setAdminUserId(uid);
            }
          }

          // 2. Fetch services
          const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: true });

          if (servicesData && servicesData.length > 0) {
            setServices(servicesData);
          } else {
            setServices(DEFAULT_SERVICES);
          }

          // 3. Fetch business hours
          const { data: hoursData } = await supabase
            .from('business_hours')
            .select('*')
            .order('weekday', { ascending: true });

          if (hoursData && hoursData.length > 0) {
            setBusinessHours(hoursData);
          } else {
            setBusinessHours(DEFAULT_BUSINESS_HOURS);
          }

          // 4. Fetch blocked dates
          const { data: blockedData } = await supabase
            .from('blocked_dates')
            .select('*')
            .order('blocked_date', { ascending: true });

          if (blockedData) {
            setBlockedDates(blockedData);
          }

          // 5. Fetch barbershop settings
          const { data: settingsData } = await supabase
            .from('barbershop_settings')
            .select('*')
            .maybeSingle();

          if (settingsData) {
            setSettings(settingsData);
          } else {
            setSettings(DEFAULT_SETTINGS);
          }

          // 6. Fetch barbers
          try {
            const { data: barbersData } = await supabase
              .from('barbers')
              .select('*')
              .order('full_name', { ascending: true });

            if (barbersData && barbersData.length > 0) {
              setBarbers(barbersData);
            } else {
              setBarbers(DEFAULT_BARBERS);
            }
          } catch {
            setBarbers(DEFAULT_BARBERS);
          }

          // 7. Fetch appointments
          const { data: appData } = await supabase
            .from('appointments')
            .select('*, service:services(*), barber:barbers(*)')
            .order('created_at', { ascending: false });

          if (appData) {
            setAppointments(appData);
          }
        } catch (err) {
          console.warn('Supabase fetch notice:', err);
        }
      }

      setInitialLoading(false);
    }

    loadData();
  }, []);

  // Helper to re-fetch all datasets
  const refetchAll = async () => {
    if (!isSupabaseConnected()) return;

    try {
      const { data: sData } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (sData && sData.length > 0) setServices(sData);

      const { data: hData } = await supabase.from('business_hours').select('*').order('weekday', { ascending: true });
      if (hData && hData.length > 0) setBusinessHours(hData);

      const { data: bData } = await supabase.from('blocked_dates').select('*').order('blocked_date', { ascending: true });
      if (bData) setBlockedDates(bData);

      const { data: stData } = await supabase.from('barbershop_settings').select('*').maybeSingle();
      if (stData) setSettings(stData);

      try {
        const { data: bData } = await supabase.from('barbers').select('*').order('full_name', { ascending: true });
        if (bData && bData.length > 0) setBarbers(bData);
        else setBarbers(DEFAULT_BARBERS);
      } catch {
        setBarbers(DEFAULT_BARBERS);
      }

      const { data: apData } = await supabase.from('appointments').select('*, service:services(*), barber:barbers(*)').order('created_at', { ascending: false });
      if (apData) setAppointments(apData);
    } catch (err) {
      console.error('Error refreshing datasets:', err);
    }
  };

  // Realtime subscription: keeps `appointments` in sync the moment a booking
  // is created/updated/cancelled anywhere (public site, walk-in, another
  // admin tab) — without this, the dashboard only updates on manual actions.
  useEffect(() => {
    if (!isSupabaseConnected()) return;

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    const fetchAppointmentsOnly = async () => {
      try {
        const { data: apData } = await supabase
          .from('appointments')
          .select('*, service:services(*), barber:barbers(*)')
          .order('created_at', { ascending: false });
        if (isMounted && apData) setAppointments(apData);
      } catch (err) {
        console.error('Error refreshing appointments from realtime event:', err);
      }
    };

    // Debounce so a burst of changes (e.g. bulk import) triggers one fetch,
    // not N fetches.
    const scheduleFetch = () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(fetchAppointmentsOnly, 300);
    };

    const subscribe = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }

      channel = supabase
        .channel(`app-appointments-realtime-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          () => scheduleFetch()
        );

      channel.subscribe((status) => {
        if (!isMounted) return;

        if (status === 'SUBSCRIBED') {
          reconnectAttempt = 0;
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          const delay = Math.min(2000 * Math.pow(2, reconnectAttempt), 30000);
          reconnectAttempt += 1;
          reconnectTimeout = setTimeout(() => {
            if (isMounted) subscribe();
          }, delay);
        }
      });
    };

    subscribe();

    return () => {
      isMounted = false;
      if (debounceTimeout) clearTimeout(debounceTimeout);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  // Update appointment status in Supabase
  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    // Optimistic local state update
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
    );

    if (isSupabaseConnected()) {
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ status: newStatus })
          .eq('id', appointmentId);

        if (error) {
          console.error('Error updating appointment status in Supabase:', error);
          refetchAll(); // rollback on error
        }
      } catch (err) {
        console.error('Error updating appointment status:', err);
      }
    }
  };

  const handleBookingSuccess = (newAppointment: Appointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
  };

  const handleAdminSignOut = async () => {
    if (isSupabaseConnected()) {
      await supabase.auth.signOut();
    }
    setAdminUserId(null);
    setCurrentView('public');
  };

  const scrollToBooking = (service?: Service) => {
    if (service) {
      setPreselectedService(service);
    }
    const bookingElem = document.getElementById('booking');
    if (bookingElem) {
      bookingElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 🆕 Standalone Privacy Policy view — takes priority over everything else,
  // same pattern as the cancellation view below. Since both entry points
  // (Footer + the booking-step consent notice) open this via target="_blank",
  // this always renders in its own fresh tab and never interrupts whatever
  // the person was doing elsewhere (e.g. mid-booking-form).
  if (showPrivacyPolicy) {
    return <PrivacyPolicy settings={settings} />;
  }

  // Public self-service cancellation view — takes priority over the normal
  // public site, independent of admin auth state.
  if (cancelAppointmentId) {
    return (
      <CancelAppointment
        appointmentId={cancelAppointmentId}
        onReturnHome={() => {
          window.location.hash = '';
          setCancelAppointmentId(null);
        }}
      />
    );
  }

  // If Admin View is active and authenticated
  if (currentView === 'admin' && adminUserId) {
    return (
      <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-[#0a0a0c] dark:text-[#f5f2eb] transition-colors duration-300">
        <AdminLayout
          adminUserId={adminUserId}
          appointments={appointments}
          services={services}
          businessHours={businessHours}
          blockedDates={blockedDates}
          settings={settings}
          barbers={barbers}
          onUpdateStatus={handleUpdateAppointmentStatus}
          onServicesUpdated={refetchAll}
          onHoursUpdated={refetchAll}
          onBlockedDatesUpdated={refetchAll}
          onSettingsUpdated={refetchAll}
          onSignOut={handleAdminSignOut}
          onReturnToPublicSite={() => setCurrentView('public')}
onRefreshData={refetchAll}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#0a0a0c] dark:text-[#f5f2eb] font-sans selection:bg-[#d4af37] selection:text-[#0a0a0c] transition-colors duration-300">

      {/* Floating Theme Switcher Button */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 left-6 z-50 p-3 rounded-full bg-zinc-900/80 text-amber-400 border border-amber-500/30 backdrop-blur-md shadow-2xl hover:scale-110 active:scale-95 transition-all dark:bg-zinc-800/80 dark:text-amber-400"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-zinc-800 dark:text-amber-400" />
        )}
      </button>

      {/* Navbar */}
      <Navbar
        settings={settings}
        onBookClick={() => scrollToBooking()}
        onAdminClick={() => {
          if (adminUserId) {
            setCurrentView('admin');
          } else {
            setAdminLoginModalOpen(true);
          }
        }}
        isAdminLoggedIn={Boolean(adminUserId)}
      />

      {/* Hero Section */}
      <Hero
        settings={settings}
        onBookClick={() => scrollToBooking()}
      />

      {/* Services Section */}
      <Services
        services={services}
        onSelectService={(service) => scrollToBooking(service)}
        businessHours={businessHours}
        settings={settings}
        blockedDates={blockedDates}
        existingAppointments={appointments}
        barbers={barbers}
      />

      {/* Before/After Transformation Gallery */}
      <BeforeAfterGallery />

      {/* Live Google Reviews */}
      <GoogleReviews />

      {/* About & Craftsmanship Section */}
      <About
        settings={settings}
        businessHours={businessHours}
      />

      {/* Booking Flow Section */}
      <BookingFlow
        services={services}
        barbers={barbers}
        businessHours={businessHours}
        blockedDates={blockedDates}
        settings={settings}
        existingAppointments={appointments}
        preselectedService={preselectedService}
        onBookingSuccess={handleBookingSuccess}
        addToast={addToast}
        onRequestRefresh={refetchAll}
        onCustomerInfoChange={(email, name, phone) => {
          setCustomerEmail(email);
          setCustomerName(name);
          setCustomerPhone(phone);
        }}
      />

      {/* 👇 ADDED: Loyalty Widget */}
      <LoyaltyTeaser
        customerEmail={customerEmail}
        customerName={customerName}
        customerPhone={customerPhone}
        onBookingSuccess={(profile) => {
          console.log('Loyalty profile loaded:', profile);
        }}
      />

      {/* Footer */}
      <Footer
        settings={settings}
        onAdminClick={() => {
          if (adminUserId) {
            setCurrentView('admin');
          } else {
            setAdminLoginModalOpen(true);
          }
        }}
        isAdminLoggedIn={Boolean(adminUserId)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminLoginModalOpen}
        onClose={() => setAdminLoginModalOpen(false)}
        onLoginSuccess={(uid) => {
          setAdminUserId(uid);
          setCurrentView('admin');
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Sticky Mobile Book Now Bar */}
      <StickyBookBar onBookClick={() => scrollToBooking()} />

    </div>
  );
}