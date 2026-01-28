import { useEffect, useState } from 'react';
import { useScrollAnimations } from '@/hooks/useScrollAnimation';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  // Initialize scroll animations
  useScrollAnimations(0.1);

  // No transition - just render children directly
  return <div>{children}</div>;
}
