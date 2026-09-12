import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Disable browser default scroll restoration so route transitions always start at top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(0, { immediate: true });
      }

      // Safeguard timeout to ensure position 0 after route render
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
        if ((window as any).lenis) {
          (window as any).lenis.scrollTo(0, { immediate: true });
        }
      }, 20);

      return () => clearTimeout(timer);
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
