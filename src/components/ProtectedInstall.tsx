import React, { useEffect } from 'react';

declare global {
  interface Window {
    careCarDesktop?: {
      isDesktop: boolean;
      platform: string;
      versions?: {
        electron?: string;
        chrome?: string;
      };
    };
  }
}

const ProtectedInstall: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (window.careCarDesktop?.isDesktop) {
      document.documentElement.classList.add('cc-desktop-runtime');
      document.documentElement.dataset.platform = window.careCarDesktop.platform;
    }

    return () => {
      document.documentElement.classList.remove('cc-desktop-runtime');
      delete document.documentElement.dataset.platform;
    };
  }, []);

  return <>{children}</>;
};

export default ProtectedInstall;
