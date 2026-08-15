import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Service } from '../../types';
import { supabase, isSupabaseConnected } from '../../lib/supabase';

// 💰 Currency formatter — matches the one in BookingFlow.tsx / Services.tsx.
const formatPrice = (amount: number): string => `CHF ${Number(amount || 0).toFixed(2)}`;

interface ServicesTabProps {
  services: Service[];
  onServicesUpdated: () => void;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  services,
  onServicesUpdated,
}) => {
  const { t, i18n } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(50);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper function to get translated service name
  const getTranslatedServiceName = (service: Service): string => {
    if (!service) return '';
    const translatedName = t(`serviceNames.${service.name}`, '');
    if (translatedName && translatedName !== `serviceNames.${service.name}`) {
      return translatedName;
    }
    return service.name;
  };

  // Helper function to get translated service description
  const getTranslatedDescription = (service: Service): string => {
    if (!service) return '';
    const translatedDesc = t(`serviceDescriptions.${service.name}`, '');
    if (translatedDesc && translatedDesc !== `serviceDescriptions.${service.name}`) {
      return translatedDesc;
    }
    return service.description || '';
  };

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setDurationMinutes(30);
    setPrice(50);
    setIsActive(true);
    setImageUrl('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    setDurationMinutes(service.duration_minutes);
    setPrice(service.price);
    setIsActive(service.is_active);
    setImageUrl(service.image_url || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(t('servicesTab.errors.nameRequired', 'Service name is required.'));
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      duration_minutes: Number(durationMinutes),
      price: Number(price),
      is_active: isActive,
    };

    try {
      if (isSupabaseConnected()) {
        if (editingService) {
          // Update
          const { error } = await supabase
            .from('services')
            .update(payload)
            .eq('id', editingService.id);

          if (error) throw error;
        } else {
          // Insert
          const { error } = await supabase
            .from('services')
            .insert([payload]);

          if (error) throw error;
        }
      }

      onServicesUpdated();
      setModalOpen(false);
    } catch (err: any) {
      console.error('Error saving service:', err);
      setErrorMsg(err.message || t('servicesTab.errors.saveFailed', 'Failed to save service.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      if (isSupabaseConnected()) {
        const { error } = await supabase
          .from('services')
          .update({ is_active: !service.is_active })
          .eq('id', service.id);

        if (error) throw error;
      }
      onServicesUpdated();
    } catch (err) {
      console.error('Error toggling service state:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-[#2d2a24]">
        <div>
          <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-[#f5f2eb]">
            {t('servicesTab.header.title', 'Barbershop Services Catalog')}
          </h2>
          <p className="text-xs text-stone-600 dark:text-[#9c978b]">
            {t('servicesTab.header.subtitle', 'Manage haircuts, beard sculpting, and grooming service rates. Inactive services remain in admin records but are hidden from clients.')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#c59b27] to-[#b8860b] text-stone-950 font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          id="admin-add-service-btn"
        >
          <Plus className="w-4 h-4" />
          {t('servicesTab.header.btnAddService', 'Add New Service')}
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const translatedName = getTranslatedServiceName(service);
          const translatedDesc = getTranslatedDescription(service);
          
          return (
            <div
              key={service.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-xl transition-all ${
                service.is_active
                  ? 'bg-white dark:bg-[#141418] border-stone-200 dark:border-[#2d2a24] hover:border-[#d4af37]/60 dark:hover:border-[#d4af37]/50'
                  : 'bg-stone-50 dark:bg-[#111114]/60 border-stone-200 dark:border-[#211f1b] opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-[#f5f2eb]">
                    {translatedName}
                  </h3>
                  <span className="text-lg font-serif font-bold text-amber-600 dark:text-[#e5c158] shrink-0">
                    {formatPrice(service.price)}
                  </span>
                </div>

                <p className="text-xs text-stone-600 dark:text-[#9c978b] line-clamp-3 leading-relaxed">
                  {translatedDesc || t('servicesTab.card.noDescription', 'No description provided.')}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-[#25221c] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-amber-700 dark:text-[#d4af37] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {t('servicesTab.card.duration', '{{minutes}} Mins', { minutes: service.duration_minutes })}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      service.is_active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-stone-200 text-stone-700 border border-stone-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                    }`}
                  >
                    {service.is_active 
                      ? t('servicesTab.card.active', 'Active') 
                      : t('servicesTab.card.inactive', 'Inactive')}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      service.is_active
                        ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/60'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/60'
                    }`}
                    title={service.is_active ? t('servicesTab.card.deactivateTitle', 'Deactivate Service') : t('servicesTab.card.activateTitle', 'Activate Service')}
                  >
                    {service.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 rounded-lg bg-amber-50 dark:bg-[#1e1c18] border border-amber-300 dark:border-[#d4af37]/40 text-amber-800 dark:text-[#e5c158] hover:bg-amber-100 dark:hover:bg-[#2b2720] transition-all cursor-pointer"
                    title={t('servicesTab.card.editTitle', 'Edit Service Details')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#141418] border border-stone-200 dark:border-[#38332c] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:text-[#9c978b] dark:hover:text-[#f5f2eb] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-[#f5f2eb]">
              {editingService 
                ? t('servicesTab.modal.editTitle', 'Edit Service') 
                : t('servicesTab.modal.addTitle', 'Add New Service')}
            </h3>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block text-amber-800 dark:text-[#d4af37] font-bold uppercase tracking-wider mb-1.5">
                  {t('servicesTab.modal.serviceName', 'Service Name *')}
                </label>
                <input
                  required
                  type="text"
                  placeholder={t('servicesTab.modal.serviceNamePlaceholder', 'e.g. Executive Skin Fade & Beard Trim')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#18181d] border border-stone-300 dark:border-[#2e2a24] text-stone-900 dark:text-[#f5f2eb] placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-amber-800 dark:text-[#d4af37] font-bold uppercase tracking-wider mb-1.5">
                  {t('servicesTab.modal.description', 'Description')}
                </label>
                <textarea
                  rows={3}
                  placeholder={t('servicesTab.modal.descriptionPlaceholder', "Describe what's included in this grooming package...")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#18181d] border border-stone-300 dark:border-[#2e2a24] text-stone-900 dark:text-[#f5f2eb] placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-800 dark:text-[#d4af37] font-bold uppercase tracking-wider mb-1.5">
                    {t('servicesTab.modal.duration', 'Duration (Minutes)')}
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#18181d] border border-stone-300 dark:border-[#2e2a24] text-stone-900 dark:text-[#f5f2eb] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-amber-800 dark:text-[#d4af37] font-bold uppercase tracking-wider mb-1.5">
                    {t('servicesTab.modal.price', 'Price (CHF)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#18181d] border border-stone-300 dark:border-[#2e2a24] text-stone-900 dark:text-[#f5f2eb] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="service-active-check"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 dark:border-[#38332c] bg-stone-50 dark:bg-[#18181d] text-[#d4af37] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="service-active-check" className="text-stone-800 dark:text-[#f5f2eb] font-semibold cursor-pointer select-none">
                  {t('servicesTab.modal.activeCheckbox', 'Active (Visible on public booking page)')}
                </label>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-[#25221c] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-[#18181d] text-stone-700 dark:text-[#c5c1b5] font-semibold hover:bg-stone-200 dark:hover:bg-[#25221c] transition-colors"
                >
                  {t('servicesTab.modal.btnCancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-stone-950 font-bold uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  {saving 
                    ? t('servicesTab.modal.btnSaving', 'Saving...') 
                    : t('servicesTab.modal.btnSave', 'Save Service')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};