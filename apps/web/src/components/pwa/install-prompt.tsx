'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';

const DISMISSED_KEY = 'pwa-dismissed';
const PAGE_COUNT_KEY = 'pwa-page-count';
const MIN_PAGES_BEFORE_PROMPT = 2;

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    // Don't show if user already dismissed or installed
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;

    // Increment page visit count
    const count = parseInt(localStorage.getItem(PAGE_COUNT_KEY) ?? '0', 10) + 1;
    localStorage.setItem(PAGE_COUNT_KEY, String(count));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      if (count >= MIN_PAGES_BEFORE_PROMPT) {
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
    deferredPrompt.current = null;
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white px-4 py-4 shadow-lg safe-area-bottom">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900">Add to Home Screen</p>
          <p className="text-xs text-surface-500">
            Faster access to EventTrust on your Android
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-primary-700"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-full p-1 text-surface-400 hover:bg-surface-100 active:bg-surface-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
