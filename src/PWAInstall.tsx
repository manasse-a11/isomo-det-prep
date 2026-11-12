import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIos(isIOS);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(isStandalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setHelpOpen(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!installPrompt) {
      setHelpOpen(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        aria-label="Install ISOMO Academy DET Prep"
        style={{
          position: 'fixed', right: 18, bottom: 18, zIndex: 1000,
          border: 0, borderRadius: 999, padding: '12px 17px',
          background: '#0b766e', color: '#fffaf0', fontWeight: 700,
          fontSize: 14, boxShadow: '0 5px 22px rgba(0,0,0,.2)',
          cursor: 'pointer'
        }}
      >
        ↓ Install app
      </button>

      {helpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="isomo-install-title"
          onClick={() => setHelpOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,.48)',
            display: 'grid', placeItems: 'center', padding: 20
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(100%, 420px)', background: '#fffaf0', color: '#173b38',
              borderRadius: 20, padding: 24, boxShadow: '0 18px 60px rgba(0,0,0,.25)'
            }}
          >
            <h2 id="isomo-install-title" style={{ margin: '0 0 10px', fontSize: 21 }}>
              Install ISOMO DET Prep
            </h2>
            {ios ? (
              <>
                <p>On your iPhone or iPad:</p>
                <ol style={{ paddingLeft: 22, lineHeight: 1.7 }}>
                  <li>Open this page in Safari.</li>
                  <li>Tap the Share button.</li>
                  <li>Choose <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong>.</li>
                </ol>
              </>
            ) : (
              <>
                <p>Use your browser menu to install the app on this device.</p>
                <ol style={{ paddingLeft: 22, lineHeight: 1.7 }}>
                  <li>Open the browser menu (⋮ or ⋯).</li>
                  <li>Choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li>
                  <li>Confirm the installation.</li>
                </ol>
              </>
            )}
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              style={{
                marginTop: 8, border: 0, borderRadius: 10, padding: '11px 16px',
                background: '#0b766e', color: 'white', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
