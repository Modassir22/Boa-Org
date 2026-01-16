import { useState, useEffect } from 'react';
import { GraduationCap, Award, Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CMESection() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSeminars();
  }, []);

  const loadSeminars = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/seminars');
      const data = await response.json();
      if (data.success) {
        // Get latest 3 seminars
        setSeminars((data.seminars || []).slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to load seminars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="gov-section-gray">
        <div className="container flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: '#0B3C5D'}}></div>
        </div>
      </section>
    );
  }

  if (seminars.length === 0) {
    return null;
  }

  return (
    <section className="gov-section-gray">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded mb-4" style={{background: '#0B3C5D'}}>
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="gov-section-title">CME Programs</h2>
          <p className="gov-section-subtitle">
            Earn CME credits through our certified continuing medical education programs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {seminars.map((seminar, index) => {
            return (
              <div key={seminar.id} className="gov-card p-6">
                <div className="w-12 h-12 rounded flex items-center justify-center mb-4" style={{background: '#E3F2FD'}}>
                  <GraduationCap className="h-6 w-6" style={{color: '#0B3C5D'}} />
                </div>
                <h3 className="font-semibold text-lg mb-3" style={{color: '#1F2933'}}>{seminar.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm" style={{color: '#616E7C'}}>
                    <MapPin className="h-4 w-4" style={{color: '#0B3C5D'}} />
                    <span>{seminar.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{color: '#616E7C'}}>
                    <Calendar className="h-4 w-4" style={{color: '#0B3C5D'}} />
                    <span>
                      {new Date(seminar.start_date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  {seminar.is_active && (
                    <div className="flex items-center gap-2">
                      <span className="gov-badge-green">Active</span>
                    </div>
                  )}
                </div>
                <Link to={seminar.is_active ? `/seminar/${seminar.id}/register` : `/seminar/${seminar.id}`}>
                  <button className="gov-button-primary w-full">
                    {seminar.is_active ? 'Register Now' : 'View Details'}
                  </button>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link to="/seminars">
            <button className="gov-button-primary text-lg px-6 py-3">
              View All CME Programs
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
