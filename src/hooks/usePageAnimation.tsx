import { useEffect } from 'react';

export const usePageAnimation = () => {
  useEffect(() => {
    // Add fade-in animation to body on page load
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';

    const timer = setTimeout(() => {
      document.body.style.opacity = '1';
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, []);
};
