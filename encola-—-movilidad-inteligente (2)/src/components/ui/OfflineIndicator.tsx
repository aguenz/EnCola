import React from 'react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Sin conexión — Mostrando rutas y paradas guardadas</span>
    </div>
  );
};
