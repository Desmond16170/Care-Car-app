import React, { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const PWAInstallPrompt = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('care-car-pwa-install-dismissed') === '1');

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && typeof (window as any).require === 'function';
    if (isElectron || dismissed) return;

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (standalone) return;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) setShowIosTip(true);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [dismissed]);

  const dismiss = () => {
    sessionStorage.setItem('care-car-pwa-install-dismissed', '1');
    setDismissed(true);
    setInstallEvent(null);
    setShowIosTip(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    dismiss();
  };

  if (dismissed || (!installEvent && !showIosTip)) return null;

  return (
    <div className="cc-pwa-install-card" role="status">
      <div>
        <strong>Instalar Care Car</strong>
        <span>{installEvent ? 'Úsalo como una app desde la pantalla de inicio.' : 'En Safari: Compartir → Añadir a pantalla de inicio.'}</span>
      </div>
      <div className="cc-pwa-install-actions">
        {installEvent && <button type="button" onClick={install}>Instalar</button>}
        <button type="button" className="secondary" onClick={dismiss}>Ahora no</button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
