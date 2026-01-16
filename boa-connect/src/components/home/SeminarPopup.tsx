import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seminarAPI } from '@/lib/api';

const POPUP_DISMISSED_KEY = 'boa_seminar_popup_dismissed';

export function SeminarPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSeminar, setActiveSeminar] = useState<any>(null);

  useEffect(() => {
    loadActiveSeminar();
  }, []);

  const loadActiveSeminar = async () => {
    try {
      const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
      if (dismissed) {
        console.log('Popup was previously dismissed');
        return;
      }

      const response = await seminarAPI.getActive();
      console.log('Active seminar response:', response);
      
      if (response.success && response.seminar && response.seminar.is_active) {
        setActiveSeminar(response.seminar);
        setIsOpen(true);
        console.log('Popup opened with seminar:', response.seminar.name);
      } else {
        console.log('No active seminar found or seminar not active');
      }
    } catch (error) {
      console.error('Failed to load active seminar:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, 'true');
  };

  if (!isOpen || !activeSeminar) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-elevated animate-scale-in overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Banner */}
        <div className="gradient-primary px-6 py-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Registration Open
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            {activeSeminar.name}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">
                  {new Date(activeSeminar.start_date).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                  {activeSeminar.start_date !== activeSeminar.end_date && (
                    <> - {new Date(activeSeminar.end_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="font-medium text-foreground">{activeSeminar.venue}, {activeSeminar.location}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {activeSeminar.description || 'Join leading ophthalmologists from across India for the most prestigious eye care conference. Early bird registration now available!'}
          </p>

          <div className="flex gap-3">
            <Link to={`/seminar/${activeSeminar.id}/register`} className="flex-1">
              <Button className="w-full gradient-primary text-primary-foreground" size="lg">
                Register Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={handleClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

