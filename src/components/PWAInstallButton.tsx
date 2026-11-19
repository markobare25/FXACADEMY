import React from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'header' | 'primary' | 'outline' | 'compact';
  label?: string;
}

export const PWAInstallButton: React.FC<Props> = ({
  variant = 'outline',
  label = 'INSTALL APP',
}) => {
  const { isInstalled, isIOS, install } = usePWAInstall();

  // Hide installation controls when already running as an installed PWA
  if (isInstalled) {
    return null;
  }

  const btnClass =
    variant === 'header'
      ? 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#15803D] px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-bold tracking-wide text-white shadow-sm hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 min-h-[38px] sm:min-h-[40px]'
      : variant === 'primary'
        ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 py-2.5 text-sm font-bold tracking-wide text-white shadow-sm hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 min-h-[44px]'
        : variant === 'compact'
          ? 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#15803D]/10 border border-[#15803D]/30 px-3 py-2 text-xs font-bold text-[#15803D] dark:text-emerald-400 hover:bg-[#15803D] hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px]'
          : 'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#15803D] bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold tracking-wide text-[#15803D] dark:text-emerald-400 hover:bg-[#15803D] hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[44px]';

  const iconClass =
    variant === 'header' || variant === 'primary'
      ? 'w-4 h-4 shrink-0 text-white'
      : 'w-4 h-4 shrink-0';

  const buttonText = isIOS && variant === 'header' ? 'INSTALL APP' : label;

  return (
    <button
      type="button"
      onClick={() => {
        void install();
      }}
      className={btnClass}
      aria-label="Install MeridianFX App"
    >
      <Download className={iconClass} />
      <span>{buttonText}</span>
    </button>
  );
};
