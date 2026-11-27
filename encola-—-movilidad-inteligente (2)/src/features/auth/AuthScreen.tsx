import React, {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {
  ArrowRight,
  Bus,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import {CaracasTransitMap} from '../../components/map/CaracasTransitMap';
import {AnimatedTransitBackground} from '../../components/ui/AnimatedTransitBackground';
import {EnColaLogo} from '../../components/ui/EnColaLogo';
import {PWAInstallButton} from '../../components/ui/PWAInstallButton';
import {
  INITIAL_MERCHANTS,
  INITIAL_STOPS,
  INITIAL_UNITS,
} from '../../lib/caracasData';
import {signInWithGoogleOAuth} from '../../lib/supabase';
import type {UserRole} from '../../types';

interface AuthScreenProps {
  onDemoPassenger: () => void;
  onDemoDriver: () => void;
  onDirectLogin: (params: {
    role: UserRole;
    identifier: string;
    fullName?: string;
  }) => void;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onDemoPassenger,
  onDemoDriver,
  onDirectLogin,
}) => {
  const [authTab, setAuthTab] = useState<'quick' | 'credentials'>('quick');
  const [credentialMethod, setCredentialMethod] = useState<'phone' | 'email'>(
    'phone'
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>('passenger');
  const [phoneInput, setPhoneInput] = useState('0414-555-8921');
  const [emailInput, setEmailInput] = useState('viajero@encola.ve');
  const [pinInput, setPinInput] = useState('••••••');
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [isLoadingOAuth, setIsLoadingOAuth] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoadingOAuth(true);
    setOauthMessage(null);
    const res = await signInWithGoogleOAuth();
    setIsLoadingOAuth(false);
    if (!res.ok && res.reason) {
      setOauthMessage(res.reason);
    }
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const identifier =
      credentialMethod === 'phone'
        ? `+58 ${phoneInput.trim() || '0414-555-8921'}`
        : emailInput.trim() || 'viajero@encola.ve';
    onDirectLogin({
      role: selectedRole,
      identifier,
      fullName: selectedRole === 'driver' ? 'Roberto Herrera' : 'Camila Mendoza',
    });
  };

  return (
    <main className="h-screen w-screen bg-[#090D14] text-slate-100 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Auth Column — Editorial Mobility Craft */}
      <section className="relative w-full lg:w-[468px] xl:w-[504px] h-full flex flex-col justify-between px-6 sm:px-10 py-7 sm:py-9 overflow-y-auto overflow-x-hidden sheet-scroll shrink-0 lg:border-r border-white/[0.07]">
        <AnimatedTransitBackground variant="auth" />

        {/* Brand Header Lockup */}
        <motion.header
          initial={{opacity: 0, y: -8}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.38, ease: EASE}}
          className="relative z-10 w-full max-w-[396px] mx-auto lg:mx-0"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <EnColaLogo size={42} className="shrink-0" />
              <div className="min-w-0">
                <span className="font-display text-[22px] font-extrabold tracking-[-0.03em] text-white block leading-none">
                  EnCola
                </span>
                <span className="text-[11.5px] font-medium text-slate-400/90 mt-1 block truncate">
                  Camioneticas · Metro · Metrobús
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.14em] uppercase text-slate-400 shrink-0">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-[#1BB37D]"
              />
              <span>CARACAS</span>
            </span>
          </div>
          <div className="mt-5 h-px w-full bg-gradient-to-r from-white/[0.1] via-white/[0.05] to-transparent" />
        </motion.header>

        {/* Central Editorial Hero & Access Workspace */}
        <motion.div
          initial={{opacity: 0, y: 14}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.42, delay: 0.06, ease: EASE}}
          className="relative z-10 my-auto py-8 w-full max-w-[396px] mx-auto lg:mx-0 space-y-7"
        >
          {/* Hero Typography — Single-Line Headline + Balanced 2-Line Subtitle */}
          <div className="space-y-3">
            <h1 className="font-display text-[clamp(1.28rem,5.3vw,1.72rem)] sm:text-[27px] font-extrabold text-white leading-[1.15] tracking-[-0.03em] whitespace-nowrap">
              Tu parada,{' '}
              <span className="text-[#1BB37D]">en tiempo real.</span>
            </h1>
            <p className="text-[14.5px] text-slate-400 leading-[1.6] max-w-[38ch] text-pretty">
              Mira cuánta gente espera, cuánto falta para tu unidad y gana
              puntos al viajar.
            </p>
          </div>

          {/* Precision Dark-Glass Segmented Control */}
          <div
            role="tablist"
            aria-label="Método de acceso"
            className="grid grid-cols-2 p-1 rounded-[14px] bg-white/[0.035] border border-white/[0.07]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={authTab === 'quick'}
              onClick={() => setAuthTab('quick')}
              className={`relative min-h-[40px] rounded-[10px] text-[12.5px] font-semibold tracking-[-0.01em] transition-colors ${
                authTab === 'quick'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {authTab === 'quick' && (
                <motion.span
                  layoutId="loginTabThumb"
                  transition={{type: 'spring', stiffness: 460, damping: 36}}
                  className="absolute inset-0 rounded-[10px] bg-[#192231] border border-white/[0.11] shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
                />
              )}
              <span className="relative z-10">Acceso rápido</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authTab === 'credentials'}
              onClick={() => setAuthTab('credentials')}
              className={`relative min-h-[40px] rounded-[10px] text-[12.5px] font-semibold tracking-[-0.01em] transition-colors ${
                authTab === 'credentials'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {authTab === 'credentials' && (
                <motion.span
                  layoutId="loginTabThumb"
                  transition={{type: 'spring', stiffness: 460, damping: 36}}
                  className="absolute inset-0 rounded-[10px] bg-[#192231] border border-white/[0.11] shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
                />
              )}
              <span className="relative z-10">Teléfono / Correo</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {authTab === 'quick' ? (
              <motion.div
                key="quick-pane"
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -8}}
                transition={{duration: 0.22, ease: EASE}}
                className="space-y-3"
              >
                {/* Primary Anchor CTA — Passenger Demo */}
                <motion.button
                  type="button"
                  whileTap={{scale: 0.985}}
                  onClick={onDemoPassenger}
                  className="group w-full min-h-[68px] pl-3 pr-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:brightness-105 text-[#04140E] flex items-center justify-between gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_16px_32px_-12px_rgba(16,185,129,0.45)] transition-all"
                >
                  <span className="flex items-center gap-3.5 text-left min-w-0">
                    <img
                      src="/src/assets/images/avatar_camila_pasajero_1795725030121.jpg"
                      alt="Camila Mendoza"
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-[#04140E]/20 shadow-sm shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="font-display text-[14.5px] font-bold tracking-[-0.015em] block leading-snug truncate">
                        Demo Pasajero · Camila
                      </span>
                      <span className="text-[12px] font-medium text-[#04140E]/75 block mt-0.5 truncate">
                        Entra en 1 toque · 45 pts confirmados
                      </span>
                    </span>
                  </span>
                  <span className="w-8 h-8 rounded-full bg-[#04140E]/12 flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.button>

                {/* Secondary Stratified Action — Driver Demo */}
                <motion.button
                  type="button"
                  whileTap={{scale: 0.985}}
                  onClick={onDemoDriver}
                  className="group w-full min-h-[68px] pl-3 pr-3.5 py-2.5 rounded-2xl bg-[#111722]/90 hover:bg-[#161F2E] border border-white/[0.085] hover:border-amber-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-white flex items-center justify-between gap-3 transition-all"
                >
                  <span className="flex items-center gap-3.5 text-left min-w-0">
                    <img
                      src="/src/assets/images/avatar_roberto_conductor_1795725029462.jpg"
                      alt="Roberto Herrera"
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-amber-400/50 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="font-display text-[14.5px] font-bold tracking-[-0.015em] block leading-snug truncate">
                        Demo Conductor · Roberto
                      </span>
                      <span className="text-[12px] text-slate-400 font-mono-tabular block mt-0.5 truncate">
                        UNIDAD-01 · AB-412-VE
                      </span>
                    </span>
                  </span>
                  <span className="w-8 h-8 rounded-full bg-white/[0.045] group-hover:bg-amber-400/15 text-slate-400 group-hover:text-amber-300 flex items-center justify-center shrink-0 transition-all group-hover:translate-x-0.5">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.button>

                {/* Minimal Hairline Divider */}
                <div className="flex items-center gap-3 pt-2.5 pb-1">
                  <div className="h-px flex-1 bg-white/[0.07]" />
                  <span className="text-[11px] font-medium text-slate-500">
                    o continúa con tu cuenta
                  </span>
                  <div className="h-px flex-1 bg-white/[0.07]" />
                </div>

                {/* Tertiary Action — Google Sign-In */}
                <div>
                  <motion.button
                    type="button"
                    whileTap={{scale: 0.985}}
                    onClick={() => void handleGoogleLogin()}
                    disabled={isLoadingOAuth}
                    className="w-full min-h-[48px] px-4 rounded-[14px] bg-white/[0.045] hover:bg-white/[0.085] border border-white/[0.1] hover:border-white/[0.16] text-slate-100 font-medium text-[13.5px] flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.29V6.61H1.29A12 12 0 0 0 0 12c0 1.94.46 3.78 1.29 5.39l4-3.1z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l4 3.1C6.23 6.88 8.88 4.77 12 4.77z"
                      />
                    </svg>
                    <span>
                      {isLoadingOAuth ? 'Conectando...' : 'Continuar con Google'}
                    </span>
                  </motion.button>

                  {oauthMessage && (
                    <p className="mt-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-200 leading-relaxed">
                      {oauthMessage}
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="cred-pane"
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -8}}
                transition={{duration: 0.22, ease: EASE}}
                onSubmit={handleDirectSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('passenger')}
                    className={`min-h-[44px] rounded-[12px] text-[12.5px] font-semibold flex items-center justify-center gap-2 border transition-all ${
                      selectedRole === 'passenger'
                        ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                        : 'bg-[#101620] text-slate-400 border-white/[0.07] hover:text-slate-200'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Pasajero</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('driver')}
                    className={`min-h-[44px] rounded-[12px] text-[12.5px] font-semibold flex items-center justify-center gap-2 border transition-all ${
                      selectedRole === 'driver'
                        ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                        : 'bg-[#101620] text-slate-400 border-white/[0.07] hover:text-slate-200'
                    }`}
                  >
                    <Bus className="w-4 h-4" />
                    <span>Conductor</span>
                  </button>
                </div>

                <div className="flex gap-5 text-xs font-semibold border-b border-white/[0.07]">
                  <button
                    type="button"
                    onClick={() => setCredentialMethod('phone')}
                    className={`pb-2.5 border-b-2 transition-colors ${
                      credentialMethod === 'phone'
                        ? 'border-emerald-400 text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Teléfono (+58)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCredentialMethod('email')}
                    className={`pb-2.5 border-b-2 transition-colors ${
                      credentialMethod === 'email'
                        ? 'border-emerald-400 text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Correo
                  </button>
                </div>

                <div className="space-y-2.5">
                  {credentialMethod === 'phone' ? (
                    <div className="flex items-center bg-[#101620] border border-white/[0.09] rounded-[13px] px-3.5 min-h-[48px] focus-within:border-emerald-400/70 focus-within:ring-2 focus-within:ring-emerald-400/15 transition-all">
                      <Phone className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
                      <span className="font-mono-tabular text-xs font-bold text-emerald-400 mr-2">
                        +58
                      </span>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        aria-label="Número de teléfono"
                        className="bg-transparent text-sm text-white w-full focus:outline-none font-mono-tabular"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center bg-[#101620] border border-white/[0.09] rounded-[13px] px-3.5 min-h-[48px] focus-within:border-emerald-400/70 focus-within:ring-2 focus-within:ring-emerald-400/15 transition-all">
                      <Mail className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        aria-label="Correo electrónico"
                        className="bg-transparent text-sm text-white w-full focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex items-center bg-[#101620] border border-white/[0.09] rounded-[13px] px-3.5 min-h-[48px] focus-within:border-emerald-400/70 focus-within:ring-2 focus-within:ring-emerald-400/15 transition-all">
                    <Lock className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      aria-label="Clave o PIN"
                      className="bg-transparent text-sm text-white w-full focus:outline-none"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{scale: 0.985}}
                  className={`w-full min-h-[50px] rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    selectedRole === 'passenger'
                      ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:brightness-105 text-[#04140E] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_14px_28px_-10px_rgba(16,185,129,0.4)]'
                      : 'bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 hover:brightness-105 text-[#180E02] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_14px_28px_-10px_rgba(245,158,11,0.38)]'
                  }`}
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Grounded Quiet Footer */}
        <footer className="relative z-10 w-full max-w-[396px] mx-auto lg:mx-0 pt-4 border-t border-white/[0.06] space-y-3">
          <PWAInstallButton />
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="truncate">Av. Francisco de Miranda</span>
            <span className="font-mono-tabular text-slate-400/80 shrink-0">
              8 paradas en vivo
            </span>
          </div>
        </footer>
      </section>

      {/* Right Unobstructed Live Google Maps Canvas (Desktop Only) */}
      <div className="hidden lg:block flex-1 h-full relative">
        <CaracasTransitMap
          role="passenger"
          stops={INITIAL_STOPS}
          units={INITIAL_UNITS}
          merchants={INITIAL_MERCHANTS}
          userCoords={{lat: 10.49072, lng: -66.86882}}
          selectedStopId={null}
          focusTarget={null}
          showDemandHeatmap={false}
          confirmedPoints={45}
          backgroundOnly
          onSelectStop={() => {}}
          onSimulateAtStop={() => {}}
          onRedeemMerchantFromMap={() => {}}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#090D14]/70 to-transparent"
        />
      </div>
    </main>
  );
};
