import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { seminarAPI } from '@/lib/api';

export function SeminarsSection() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSeminars();
  }, []);

  const loadSeminars = async () => {
    try {
      const response = await seminarAPI.getAll();
      // Show only first 3 seminars
      setSeminars((response.seminars || []).slice(0, 3));
    } catch (error) {
      console.error('Failed to load seminars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  // Don't show section if no seminars
  if (seminars.length === 0) {
    return null;
  }

  return (
    <section className="gov-section">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-end gap-4 mb-12">
          <Link to="/seminars">
            <button className="bg-white border-2 px-5 py-2.5 rounded font-medium hover:bg-gray-50 transition-colors" style={{color: '#0B3C5D', borderColor: '#0B3C5D'}}>
              View All
              <ArrowRight className="ml-2 h-4 w-4 inline" />
            </button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seminars.map((seminar, index) => (
            <div
              key={seminar.id}
              className="gov-card overflow-hidden"
            >
              {/* Status Badge */}
              {seminar.is_active && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="gov-badge-accent">
                    <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{background: '#C9A227'}} />
                    Active
                  </span>
                </div>
              )}

              {/* Image Placeholder */}
              <div className="h-40 relative overflow-hidden">
                {seminar.image_url ? (
                  <>
                    <img 
                      src={seminar.image_url} 
                      alt={seminar.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center" style={{background: '#0B3C5D'}}>
                      <Calendar className="h-16 w-16 text-white/30" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center" style={{background: '#0B3C5D'}}>
                    <Calendar className="h-16 w-16 text-white/30" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-medium" style={{color: '#1F2933'}}>
                  {seminar.name}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm" style={{color: '#616E7C'}}>
                    <MapPin className="h-4 w-4" style={{color: '#0B3C5D'}} />
                    <span>{seminar.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{color: '#616E7C'}}>
                    <Calendar className="h-4 w-4" style={{color: '#0B3C5D'}} />
                    <span>
                      {new Date(seminar.end_date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-sm line-clamp-2" style={{color: '#616E7C'}}>
                  {seminar.description}
                </p>

                <Link to={seminar.is_active ? `/seminar/${seminar.id}/register` : `/seminar/${seminar.id}`}>
                  <button 
                    className={`w-full ${seminar.is_active ? 'gov-button-primary' : 'bg-white border-2 px-5 py-2.5 rounded font-medium hover:bg-gray-50 transition-colors'}`}
                    style={!seminar.is_active ? {color: '#0B3C5D', borderColor: '#0B3C5D'} : {}}
                  >
                    {seminar.is_active ? 'Register Now' : 'View Details'}
                    <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
