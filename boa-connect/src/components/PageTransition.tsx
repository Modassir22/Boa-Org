import { useEffect, useState } from 'react';
import { useScrollAnimations } from '@/hooks/useScrollAnimation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Initialize scroll animations
  useScrollAnimations(0.1);

  useEffect(() => {
    // Trigger page transition
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [children]);

  return (
    <div 
      className={`transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
}
