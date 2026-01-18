import { useEffect, useState } from 'react';
import { useScrollAnimations } from '@/hooks/useScrollAnimation';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Initialize scroll animations
  useScrollAnimations(0.1);

  // Check if current page is login/register/seminar-registration page
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/admin-login' || 
                     location.pathname === '/register' ||
                     location.pathname.includes('/seminar-registration');

  useEffect(() => {
    // Skip transition for auth pages
    if (isAuthPage) {
      setIsVisible(true);
      return;
    }

    // Trigger page transition for other pages
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [children, isAuthPage]);

  // No animation wrapper for auth pages
  if (isAuthPage) {
    return <div style={{ opacity: 1, visibility: 'visible' }}>{children}</div>;
  }

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
