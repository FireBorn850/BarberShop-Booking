import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, X, AlertCircle, ArrowRight, UserCheck, Database } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { supabase, isSupabaseConnected } from '../lib/supabase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userId: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t('adminLogin.errMissingFields'));
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (!isSupabaseConnected()) {
        setErrorMsg(t('adminLogin.errNotConnected'));
        setLoading(false);
        return;
      }

      if (isSignUpMode) {
        // Sign Up Flow
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Attempt to add to admin_users table
          const { error: adminInsertErr } = await supabase
            .from('admin_users')
            .insert([{ user_id: signUpData.user.id }]);

          if (adminInsertErr) {
            console.warn('admin_users insert error:', adminInsertErr);
          }

          setInfoMsg(t('adminLogin.infoAccountCreated'));
          
          // Verify admin access
          const { data: adminCheck } = await supabase
            .from('admin_users')
            .select('id')
            .eq('user_id', signUpData.user.id)
            .maybeSingle();

          if (adminCheck) {
            onLoginSuccess(signUpData.user.id);
            onClose();
          } else {
            setErrorMsg(t('adminLogin.errNotAuthorizedSignUp'));
          }
        }
      } else {
        // Sign In Flow
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (signInError) throw signInError;

        if (signInData.user) {
          // Check if user.id exists in admin_users.user_id
          const { data: adminRecord } = await supabase
            .from('admin_users')
            .select('id, user_id')
            .eq('user_id', signInData.user.id)
            .maybeSingle();

          if (adminRecord) {
            // Authorized admin!
            onLoginSuccess(signInData.user.id);
            onClose();
          } else {
            // Signed in, but not authorized in admin_users table
            setErrorMsg(t('adminLogin.errNotAuthorizedSignIn'));
          }
        }
      }
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      setErrorMsg(err.message || t('adminLogin.errAuthFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121216] border border-[#38332c] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#9c978b] hover:text-[#f5f2eb] hover:bg-[#1f1f25] transition-colors"
          id="close-admin-login-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4af37] to-[#b8860b] p-0.5 mx-auto shadow-lg shadow-[#d4af37]/20">
            <div className="w-full h-full bg-[#121216] rounded-[14px] flex items-center justify-center text-[#e5c158]">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <h3 className="text-2xl font-bold font-serif text-[#f5f2eb]">
            {isSignUpMode ? t('adminLogin.titleSignUp') : t('adminLogin.titleSignIn')}
          </h3>
          <p className="text-xs text-[#9c978b]">
            {t('adminLogin.subtitle')}
          </p>
        </div>

        {/* Error / Info alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 rounded-xl bg-[#1e1a14] border border-[#d4af37]/50 text-[#e5c158] text-xs flex items-center gap-2">
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {!isSupabaseConnected() && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2">
            <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('adminLogin.supabaseReqTitle')}</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                <Trans
                  i18nKey="adminLogin.supabaseReqDesc"
                  components={{ code: <code className="text-[#e5c158]" /> }}
                />
              </p>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2">
              {t('adminLogin.emailLabel')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8a8579] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                required
                type="email"
                placeholder="azizovjasur2007@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#18181d] border border-[#2e2a24] text-[#f5f2eb] placeholder-[#635f56] text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                id="admin-login-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2">
              {t('adminLogin.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8a8579] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                required
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#18181d] border border-[#2e2a24] text-[#f5f2eb] placeholder-[#635f56] text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                id="admin-login-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#c59b27] to-[#b8860b] text-[#0a0a0c] font-extrabold text-xs uppercase tracking-widest shadow-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            id="admin-login-submit-btn"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                {t('adminLogin.verifying')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isSignUpMode ? t('adminLogin.btnRegister') : t('adminLogin.btnSignIn')}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="pt-2 text-center border-t border-[#23201b]">
          <button
            type="button"
            onClick={() => {
              setIsSignUpMode(!isSignUpMode);
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className="text-xs text-[#a39e91] hover:text-[#e5c158] transition-colors font-medium"
          >
            {isSignUpMode
              ? t('adminLogin.toggleToSignIn')
              : t('adminLogin.toggleToSignUp')}
          </button>
        </div>

      </div>
    </div>
  );
};