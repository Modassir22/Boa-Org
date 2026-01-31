import { Users, Calendar, Award, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/utils';

export function StatsSection() {
  const [stats, setStats] = useState({
    total_members: null,
    years_of_service: null,
    seminars_conducted: null,
    districts_covered: null
  });
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
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Stats API response:', responseText.substring(0, 500));
        
        if (responseText.includes('<!doctype') || responseText.includes('<html')) {
          console.error('Stats API returned HTML instead of JSON - API server misconfigured');
          return;
        }
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('API returned success: false');
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const statsData = [
    {
      icon: Users,
      value: isLoading ? 'Loading...' : `${stats.total_members || 17}+`,
      label: 'Active Members',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Calendar,
      value: isLoading ? 'Loading...' : `${stats.years_of_service || 51}+`,
      label: 'Years of Service',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Award,
      value: isLoading ? 'Loading...' : `${stats.seminars_conducted || 1}+`,
      label: 'Seminars Conducted',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: MapPin,
      value: isLoading ? 'Loading...' : `${stats.districts_covered || 38}`,
      label: 'Districts Covered',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <section className="gov-section-gray">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="gov-section-title p-2 bg-[#0B3C5D] text-white">Our Impact</h2>
          <p className="gov-section-subtitle">
            Serving the ophthalmology community across Bihar with dedication and excellence
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="gov-card p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{background: '#E3F2FD'}}>
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8" style={{color: '#0B3C5D'}} />
                </div>
                <div className="text-2xl sm:text-3xl font-semibold mb-1 sm:mb-2" style={{color: '#1F2933'}}>{stat.value}</div>
                <div className="text-xs sm:text-sm" style={{color: '#616E7C'}}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
