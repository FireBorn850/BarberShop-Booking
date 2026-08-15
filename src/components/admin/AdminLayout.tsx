import React, { useState } from 'react';
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  ListOrdered,
  Clock,
  CalendarX,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OverviewTab } from './OverviewTab';
import { AppointmentsTab } from './AppointmentsTab';
import { ClientsTab } from './ClientsTab';
import { ServicesTab } from './ServicesTab';
import { BusinessHoursTab } from './BusinessHoursTab';
import { BlockedDatesTab } from './BlockedDatesTab';
import { SettingsTab } from './SettingsTab';
import { Appointment, Service, BusinessHour, BlockedDate, BarbershopSettings, AppointmentStatus, Barber } from '../../types';
import { Sun, Moon, Globe } from 'lucide-react';

interface AdminLayoutProps {
  adminUserId: string;
  appointments: Appointment[];
  services: Service[];
  businessHours: BusinessHour[];
  blockedDates: BlockedDate[];
  settings: BarbershopSettings;
  barbers: Barber[];
  onUpdateStatus: (appointmentId: string, newStatus: AppointmentStatus) => void;
  onServicesUpdated: () => void;
  onHoursUpdated: () => void;
  onBlockedDatesUpdated: () => void;
  onSettingsUpdated: () => void;
  onSignOut: () => void;
  onReturnToPublicSite: () => void;
  onRefreshData?: () => void;

  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  adminUserId,
  appointments,
  services,
  businessHours,
  blockedDates,
  settings,
  barbers,
  onUpdateStatus,
  onServicesUpdated,
  onHoursUpdated,
  onBlockedDatesUpdated,
  onSettingsUpdated,
  onSignOut,
  onReturnToPublicSite,
  onRefreshData,
  theme,
  onToggleTheme,

}) => {
  const { t, i18n } = useTranslation();
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: t('adminLayout.nav_overview', 'Overview'), icon: LayoutDashboard },
    { id: 'appointments', label: t('adminLayout.nav_appointments', 'Appointments'), icon: Calendar, badge: appointments.filter((a) => a.status === 'pending').length },
    { id: 'clients', label: t('adminLayout.nav_clients', 'Clients'), icon: Users },
    { id: 'services', label: t('adminLayout.nav_services', 'Services'), icon: ListOrdered },
    { id: 'hours', label: t('adminLayout.nav_hours', 'Business Hours'), icon: Clock },
    { id: 'blocked', label: t('adminLayout.nav_blocked', 'Blocked Dates'), icon: CalendarX },
    { id: 'settings', label: t('adminLayout.nav_settings', 'Barbershop Settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-800 dark:text-stone-200 flex flex-col font-sans transition-colors duration-300">

      {/* Top Header Navigation */}
      <header className="bg-white dark:bg-[#0C0C0C] border-b border-zinc-200 dark:border-stone-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md dark:shadow-xl transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-sm bg-zinc-100 dark:bg-[#0A0A0A] text-zinc-700 dark:text-stone-200 border border-zinc-200 dark:border-stone-800 lg:hidden cursor-pointer hover:bg-zinc-200 dark:hover:bg-stone-800 transition-colors"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-amber-600 flex items-center justify-center shadow-sm">
              <Scissors className="w-4 h-4 text-black transform -rotate-45" />
            </div>

            <div>
              <span className="block text-sm font-serif font-light tracking-[0.2em] text-zinc-900 dark:text-stone-100 uppercase">
                {settings.barbershop_name || 'CROWN & CUT'}
              </span>
              <span className="block text-[9px] tracking-[0.2em] text-amber-600 dark:text-amber-500 font-bold uppercase -mt-0.5">
                {t('adminLayout.portal_subtitle', 'Admin Operations Portal')}
              </span>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-100 dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-sm px-2 py-1 shrink-0">
            <Globe className="w-3.5 h-3.5 text-zinc-500 dark:text-stone-400 mr-1 shrink-0" />
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-transparent text-zinc-800 dark:text-stone-300 text-xs font-medium uppercase tracking-wider focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">EN</option>
              <option value="de" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">DE</option>
              <option value="fr" className="bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-stone-200">FR</option>
            </select>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-sm bg-zinc-100 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-amber-600 dark:text-amber-500 hover:border-amber-600/50 dark:hover:border-amber-600/50 transition-all cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onReturnToPublicSite}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-zinc-100 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 hover:border-amber-600/50 dark:hover:border-amber-600/50 text-zinc-700 dark:text-stone-300 hover:text-zinc-900 dark:hover:text-stone-100 text-xs uppercase tracking-widest font-bold transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
            {t('adminLayout.public_site', 'Public Site')}
          </button>

          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            id="admin-signout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('adminLayout.sign_out', 'Sign Out')}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar Navigation */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-[#0C0C0C] border-r border-zinc-200 dark:border-stone-800 p-4 flex flex-col justify-between transition-all duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
        >
          <div className="space-y-6 pt-2">
            <div className="px-3 py-2.5 rounded-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-zinc-800 dark:text-stone-200 block uppercase tracking-wider">
                  {t('adminLayout.authorized_admin', 'Authorized Admin')}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-stone-500 font-mono">
                  {t('adminLayout.id_prefix', 'ID:')} {adminUserId.slice(0, 8)}...
                </span>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${isActive
                      ? 'bg-amber-600 text-black shadow-md'
                      : 'text-zinc-600 dark:text-stone-400 hover:text-zinc-900 dark:hover:text-stone-100 hover:bg-zinc-100 dark:hover:bg-[#0A0A0A]'
                      }`}
                    id={`admin-tab-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-amber-600 dark:text-amber-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${isActive
                          ? 'bg-black text-amber-400'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-stone-800 space-y-2">
            <button
              onClick={onReturnToPublicSite}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm bg-zinc-100 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-stone-300 hover:text-zinc-900 dark:hover:text-stone-100 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              {t('adminLayout.return_to_website', 'Return to Website')}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewTab
              appointments={appointments}
              services={services}
              barbers={barbers}
              onUpdateStatus={onUpdateStatus}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onRefreshData={onRefreshData}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsTab
              appointments={appointments}
              onUpdateStatus={onUpdateStatus}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsTab
              appointments={appointments}
            />
          )}

          {activeTab === 'services' && (
            <ServicesTab
              services={services}
              onServicesUpdated={onServicesUpdated}
            />
          )}

          {activeTab === 'hours' && (
            <BusinessHoursTab
              businessHours={businessHours}
              onHoursUpdated={onHoursUpdated}
            />
          )}

          {activeTab === 'blocked' && (
            <BlockedDatesTab
              blockedDates={blockedDates}
              onBlockedDatesUpdated={onBlockedDatesUpdated}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onSettingsUpdated={onSettingsUpdated}
            />
          )}
        </main>

      </div>

    </div>
  );
};