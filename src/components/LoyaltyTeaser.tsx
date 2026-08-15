// src/components/LoyaltyTeaser.tsx

import React, { useState, useEffect } from 'react';
import { Gift, Users, Copy, Check, X, RefreshCw } from 'lucide-react';
import {
  CustomerProfile,
  getOrCreateCustomerProfile,
  getLoyaltySettings,
  LoyaltySettings,
  processReferral,
  getReferralStats,
  getAvailableDiscount
} from '../lib/loyalty';

// 💰 Currency formatter — matches BookingFlow.tsx / Services.tsx / ServicesTab.tsx.
const formatPrice = (amount: number): string => `CHF ${Number(amount || 0).toFixed(2)}`;

interface LoyaltyTeaserProps {
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  onBookingSuccess?: (profile: CustomerProfile) => void;
  className?: string;
}

export const LoyaltyTeaser: React.FC<LoyaltyTeaserProps> = ({
  customerEmail,
  customerName,
  customerPhone,
  onBookingSuccess,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [referralEmail, setReferralEmail] = useState('');
  const [referralName, setReferralName] = useState('');
  const [referralStatus, setReferralStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({ totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, earnedPoints: 0 });

  // Load customer profile
  useEffect(() => {
    if (customerEmail && customerName) {
      loadProfile();
    }
  }, [customerEmail, customerName]);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-refresh referral stats every 30 seconds when popup is open
  useEffect(() => {
    if (!isOpen || !profile) return;
    
    const interval = setInterval(() => {
      loadReferralStats();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, profile]);

  const loadSettings = async () => {
    const settingsData = await getLoyaltySettings();
    setSettings(settingsData);
  };

  const loadProfile = async () => {
    if (!customerEmail || !customerName) return;

    setLoading(true);
    try {
      const profileData = await getOrCreateCustomerProfile(
        customerEmail,
        customerName,
        customerPhone
      );
      if (profileData) {
        setProfile(profileData);
        await loadReferralStats(profileData.id);
        if (onBookingSuccess) {
          onBookingSuccess(profileData);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReferralStats = async (customerId?: string) => {
    const id = customerId || profile?.id;
    if (!id) return;
    
    setRefreshingStats(true);
    try {
      const stats = await getReferralStats(id);
      setReferralStats(stats);
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setRefreshingStats(false);
    }
  };

  const handleManualRefresh = () => {
    if (profile) {
      loadReferralStats(profile.id);
    }
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !referralEmail.trim()) {
      setReferralStatus({
        success: false,
        message: "Please enter your friend's email"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await processReferral(
        profile.referral_code,
        referralEmail.trim(),
        referralName.trim() || 'Friend'
      );
      setReferralStatus(result);
      if (result.success) {
        setReferralEmail('');
        setReferralName('');
        // Refresh stats after successful referral
        await loadReferralStats(profile.id);
      }
    } catch (error) {
      setReferralStatus({
        success: false,
        message: 'An error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = async () => {
    if (!profile) return;
    const shareMessage = settings?.referral_share_message
      .replace(/{code}/g, profile.referral_code)
      .replace(/{name}/g, profile.full_name);

    try {
      await navigator.clipboard.writeText(shareMessage || profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = shareMessage || profile.referral_code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Updated to use new return values from getAvailableDiscount
  const { 
    eligible, 
    discountAmount, 
    pointsNeeded, 
    pointsRequired,
    availableDiscounts,
    nextThreshold 
  } = getAvailableDiscount(profile, settings);

  // Don't show if no profile yet (will show after booking)
  if (!profile && !customerEmail) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loyalty Teaser Badge */}
      <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-full shadow-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Gift className="w-5 h-5" />
          <span className="text-sm font-bold hidden sm:inline">
            {profile ? `${profile.total_points} pts` : 'Earn Rewards'}
          </span>
          {profile && profile.total_points > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          )}
        </button>

        {/* Popup Panel */}
        {isOpen && (
          <div className="fixed bottom-24 right-4 left-4 sm:left-auto z-50 w-auto sm:w-96 max-h-[75vh] bg-white dark:bg-[#0C0C0C] rounded-xl shadow-2xl border border-zinc-200 dark:border-stone-800 flex flex-col transition-all animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            {/* Sticky header */}
            <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-zinc-900 dark:text-stone-100 truncate">
                    Loyalty Rewards
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-stone-400 truncate">
                    Earn points, get discounts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="shrink-0 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-stone-800 dark:hover:text-zinc-300 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {!profile ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-sm text-zinc-600 dark:text-stone-400">
                      Sign up to start earning loyalty points!
                    </p>
                    <button
                      onClick={loadProfile}
                      disabled={loading}
                      className="px-4 py-2 bg-amber-600 text-black font-bold text-sm rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Get Started'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Points Display - Updated with multi-discount support */}
                    <div className="bg-amber-600/5 border border-amber-600/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-amber-600">
                        {profile.total_points}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-stone-400">
                        {eligible
                          ? `Total Points · ${formatPrice(discountAmount)} reward ready!`
                          : `${pointsNeeded} more points to unlock ${formatPrice(settings?.fixed_discount_amount ?? 0)} off`}
                      </div>
                      {eligible && availableDiscounts > 0 && (
                        <div className="mt-1 text-xs text-amber-600/70 dark:text-amber-500/70">
                          {availableDiscounts} discount{availableDiscounts > 1 ? 's' : ''} available · 
                          {pointsNeeded > 0 ? ` ${pointsNeeded} more for next discount` : ' 🎉 Max discounts earned!'}
                        </div>
                      )}
                      {eligible && (
                        <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                          {formatPrice(discountAmount)} off your next booking!
                        </div>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-zinc-50 dark:bg-[#0A0A0A] rounded-lg">
                        <div className="font-bold text-zinc-900 dark:text-stone-100">
                          {formatPrice(Math.floor(profile.lifetime_spend))}
                        </div>
                        <div className="text-zinc-500 dark:text-stone-400">Spent</div>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-[#0A0A0A] rounded-lg relative">
                        <div className="font-bold text-zinc-900 dark:text-stone-100 flex items-center justify-center gap-1">
                          {referralStats.completedReferrals}
                          {refreshingStats && (
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                          )}
                        </div>
                        <div className="text-zinc-500 dark:text-stone-400">Referrals</div>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-[#0A0A0A] rounded-lg">
                        <div className="font-bold text-zinc-900 dark:text-stone-100">
                          {referralStats.earnedPoints}
                        </div>
                        <div className="text-zinc-500 dark:text-stone-400">Bonus pts</div>
                      </div>
                    </div>

                    {/* Manual Refresh Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleManualRefresh}
                        disabled={refreshingStats}
                        className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshingStats ? 'animate-spin' : ''}`} />
                        Refresh stats
                      </button>
                    </div>

                    {/* Referral Section */}
                    <div className="border-t border-zinc-200 dark:border-stone-800 pt-4">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-stone-100 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        Refer & Earn
                      </h4>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-zinc-100 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-900 dark:text-stone-100">
                          {profile.referral_code}
                        </div>
                        <button
                          onClick={handleCopyReferral}
                          className="p-2 bg-amber-600 text-black rounded-lg hover:bg-amber-500 transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="text-xs text-zinc-500 dark:text-stone-400 mb-3 p-2 bg-zinc-50 dark:bg-[#0A0A0A] rounded-lg break-words">
                        {settings?.referral_share_message
                          .replace(/{code}/g, profile.referral_code)
                          .replace(/{name}/g, profile.full_name)}
                      </div>

                      <form onSubmit={handleReferralSubmit} className="space-y-2">
                        <input
                          type="email"
                          placeholder="Their email"
                          value={referralEmail}
                          onChange={(e) => setReferralEmail(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 rounded-lg focus:outline-none focus:border-amber-600 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Their name (optional)"
                          value={referralName}
                          onChange={(e) => setReferralName(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-stone-800 rounded-lg focus:outline-none focus:border-amber-600 transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full px-4 py-2 bg-amber-600 text-black font-bold text-sm rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : 'Refer Friend'}
                        </button>
                      </form>

                      {referralStatus && (
                        <div className={`text-xs p-2 rounded-lg ${referralStatus.success ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'}`}>
                          {referralStatus.message}
                        </div>
                      )}
                    </div>

                    {/* How it works */}
                    <div className="border-t border-zinc-200 dark:border-stone-800 pt-3">
                      <div className="text-xs text-zinc-500 dark:text-stone-400 space-y-1">
                        <p className="font-semibold text-zinc-700 dark:text-stone-300">How it works:</p>
                        <p>• Earn {settings?.points_per_dollar || 10} points per CHF 1 spent</p>
                        <p>• {settings?.welcome_bonus_points || 200} points welcome bonus</p>
                        <p>• {settings?.referral_reward_points || 500} points per referral</p>
                        <p>• {pointsRequired} points = {formatPrice(settings?.fixed_discount_amount ?? 0)} off</p>
                        <p className="text-amber-600 dark:text-amber-500 font-medium">
                          Max {formatPrice(settings?.fixed_discount_amount ?? 0)} discount per booking
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};