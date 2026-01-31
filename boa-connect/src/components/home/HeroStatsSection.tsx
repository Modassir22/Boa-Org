import { Users, Calendar, Award, MapPin, Eye, Stethoscope, BookOpen, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/utils';

// Icon mapping for dynamic icons
const iconMap = {
  Users,
  Calendar, 
  Award,
  MapPin,
  Eye,
  Stethoscope,
  BookOpen,
  Target
};

// Counter animation hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return count;
};

// Individual stat counter component
const StatCounter = ({ stat }: { stat: any }) => {
  const IconComponent = iconMap[stat.stat_icon] || Users;
  const animatedValue = useCounter(parseInt(stat.stat_value), 2000);

  return (
    <div className="flex items-center gap-1 sm:gap-2 animate-fade-in">
      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-[#09637E]" />
      <div>
        <span className="text-base sm:text-xl font-bold text-[#09637E]">
          {animatedValue}+
        </span>
        <span className="text-xs sm:text-sm text-[#088395] ml-1">
          {stat.stat_label}
        </span>
      </div>
    </div>
  );
};

export function HeroStatsSection() {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      
      if (!response.ok) {
        console.error('Stats API error:', response.status, response.statusText);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Take only first 2 stats for hero section
        setStats((data.stats || []).slice(0, 2));
      } else {
        console.error('API returned success: false');
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 justify-center lg:justify-start mt-4">
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
          <div>
            <div className="h-6 w-12 bg-gray-200 rounded mb-1"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
          <div>
            <div className="h-6 w-12 bg-gray-200 rounded mb-1"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 sm:gap-6 justify-center lg:justify-start mt-4">
      {stats.map((stat) => (
        <StatCounter key={stat.stat_key} stat={stat} />
      ))}
    </div>
  );
}