import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Download, Smartphone } from 'lucide-react';
import { subscribeToOnlineStatus, isRunningStandalone } from '../utils/pwaService';

interface OfflineSyncBannerProps {
  onOpenInstallModal?: () => void;
  canInstall?: boolean;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  onOpenInstallModal,
  canInstall,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedBanner, setShowReconnectedBanner] = useState<boolean>(false);
  const isStandalone = isRunningStandalone();

  useEffect(() => {
    const unsubscribe = subscribeToOnlineStatus((online) => {
      setIsOnline((prev) => {
        if (!prev && online) {
          // Just reconnected
          setShowReconnectedBanner(true);
          const timer = setTimeout(() => setShowReconnectedBanner(false), 4000);
          return online;
        }
        return online;
      });
    });
    return unsubscribe;
  }, []);

  return (
    <>
      {/* Offline Mode Floating Banner */}
      {!isOnline && (
        <div
          id="offline-status-banner"
          className="w-full bg-[#1C1917] border-b border-amber-900/60 text-[#D4AF37] px-4 py-2 text-xs font-serif font-bold tracking-wide flex items-center justify-between shadow-md z-40 animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-center gap-2 max-w-2xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-serif">
                Offline Mode Active — All tasks, habits, and notes are saved locally and will auto-sync when online.
              </span>
            </div>
            <span className="text-[10px] font-sans uppercase font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 hidden sm:inline-block">
              Device Local Cache
            </span>
          </div>
        </div>
      )}

      {/* Just Reconnected Toast */}
      {showReconnectedBanner && isOnline && (
        <div
          id="online-reconnected-toast"
          className="fixed bottom-16 sm:bottom-6 right-6 z-50 bg-[#1C1917] border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-3 text-xs font-serif font-bold animate-in slide-in-from-bottom duration-300"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-white">Back Online</div>
            <div className="text-[11px] font-sans font-normal text-emerald-200">
              All local planner changes are active and synchronized.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
