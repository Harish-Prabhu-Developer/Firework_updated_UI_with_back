// src/hooks/useResponsive.ts
import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

const getMetrics = () => {
  const { width, height } = Dimensions.get('window');
  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    // Desktop table view only on web + wide screen
    showTable: Platform.OS === 'web' && width >= 1024,
  };
};

export const useResponsive = () => {
  const [metrics, setMetrics] = useState(getMetrics);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () => {
      setMetrics(getMetrics());
    });
    return () => sub?.remove();
  }, []);

  return metrics;
};
