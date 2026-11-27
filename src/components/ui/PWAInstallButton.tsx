import React, {useState} from 'react';
import {Download, Share, X} from 'lucide-react';
import {usePWAInstall} from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-950/40 hover:bg-emerald-400 active:scale-[0.98] transition whitespace-nowrap shrink-0 ${
          compact ? 'min-h-[40px] px-3 text-xs' : 'w-full min-h-[48px] px-4 text-sm'
        }`}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Instalar EnCola</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-semibold hover:bg-slate-700 active:scale-[0.98] transition whitespace-nowrap shrink-0 ${
            compact ? 'min-h-[40px] px-3 text-xs' : 'w-full min-h-[48px] px-4 text-sm'
          }`}
        >
          <Share className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Instalar en iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-white">
                  Instalar en iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-2.5 text-sm text-slate-300 list-decimal list-inside">
                <li>
                  Toca el botón <strong className="text-white">Compartir</strong> en la barra de Safari.
                </li>
                <li>
                  Desliza hacia abajo y selecciona{' '}
                  <strong className="text-white">Agregar a pantalla de inicio</strong>.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[48px] rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
