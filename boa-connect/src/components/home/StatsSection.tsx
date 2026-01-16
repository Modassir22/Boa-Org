import { Users, Calendar, Award, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import axios from 'axios';

export function StatsSection() {
  const [stats, setStats] = useState({
    total_members: 0,
    years_of_service: 0,
    seminars_conducted: 0,
    districts_covered: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const statsData = [
    {
      icon: Users,
      value: stats.total_members || '500+',
      label: 'Active Members',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Calendar,
      value: stats.years_of_service || '25+',
      label: 'Years of Service',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Award,
      value: stats.seminars_conducted || '100+',
      label: 'Seminars Conducted',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: MapPin,
      value: stats.districts_covered || '38',
      label: 'Districts Covered',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <section className="gov-section-gray">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="gov-section-title">Our Impact</h2>
          <p className="gov-section-subtitle">
            Serving the ophthalmology community across Bihar with dedication and excellence
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="gov-card p-6 text-center">
                <div className="w-16 h-16 rounded flex items-center justify-center mx-auto mb-4" style={{background: '#E3F2FD'}}>
                  <Icon className="h-8 w-8" style={{color: '#0B3C5D'}} />
                </div>
                <div className="text-3xl font-semibold mb-2" style={{color: '#1F2933'}}>{stat.value}</div>
                <div className="text-sm" style={{color: '#616E7C'}}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
