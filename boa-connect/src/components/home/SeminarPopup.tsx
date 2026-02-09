import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Calendar, MapPin, ArrowRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seminarAPI } from '@/lib/api';
import { API_BASE_URL } from '@/lib/utils';

const POPUP_DISMISSED_KEY = 'boa_seminar_popup_dismissed';

export function SeminarPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSeminar, setActiveSeminar] = useState<any>(null);
  const [showReloadPopup, setShowReloadPopup] = useState(false);
  const [upcomingEvent, setUpcomingEvent] = useState<any>(null);
  const [isPageReady, setIsPageReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for page to be fully loaded before showing popup
    const checkPageReady = () => {
      // Check if document is ready and navbar is likely loaded
      if (document.readyState === 'complete') {
        const timer = setTimeout(() => {
          setIsPageReady(true);
        }, 1000); // 1 second delay after page is complete
        return () => clearTimeout(timer);
      } else {
        // If not ready, wait for load event
        const handleLoad = () => {
          setTimeout(() => {
            setIsPageReady(true);
          }, 1000);
        };
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    };

    const cleanup = checkPageReady();
    checkReloadPopup();

    return cleanup;
  }, []);

  useEffect(() => {
    if (isPageReady) {
      loadActiveSeminar();
    }
  }, [isPageReady]);

  const checkReloadPopup = async () => {
    const wasReloaded = sessionStorage.getItem('pageReloaded');

    if (wasReloaded) {
      // Clear flag immediately
      sessionStorage.removeItem('pageReloaded');

      // Load upcoming seminars only (not all events)
      try {
        const response = await seminarAPI.getActive();

        if (response.success && response.seminar && response.seminar.is_active) {
          const seminar = response.seminar;
          const now = new Date();
          const start = new Date(seminar.start_date);
          
          // Only show if seminar is upcoming
          if (now < start) {
            setUpcomingEvent(seminar);
            setShowReloadPopup(true);
          }
        }
      } catch (error) {
        console.error('Failed to load seminar for popup:', error);
      }
    }
  };

  useEffect(() => {
    // Set flag for next reload
    const handleBeforeUnload = () => {
      sessionStorage.setItem('pageReloaded', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const loadActiveSeminar = async () => {
    try {
      const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
      if (dismissed || !isPageReady) {
        return;
      }

      const response = await seminarAPI.getActive();

      if (response.success && response.seminar && response.seminar.is_active) {
        setActiveSeminar(response.seminar);
        // Add another small delay to ensure smooth animation
        setTimeout(() => {
          setIsOpen(true);
        }, 300);
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

  const handleCloseReloadPopup = () => {
    setShowReloadPopup(false);
  };

  const handleViewNotifications = () => {
    setShowReloadPopup(false);
    navigate('/seminars');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate) return 'Date TBD';
    
    const startFormatted = formatDate(startDate);
    
    // If no end date or same as start date, show only start date
    if (!endDate || startDate === endDate) {
      return startFormatted;
    }
    
    const endFormatted = formatDate(endDate);
    return `${startFormatted} to ${endFormatted}`;
  };

  return (
    <>
      {/* Reload Event Popup */}
      {showReloadPopup && upcomingEvent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto">
          {/* Backdrop - no onClick, only X button closes */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Popup */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="text-white p-4 rounded-t-lg flex items-center justify-between" style={{ backgroundColor: upcomingEvent.color || '#2563eb' }}>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <h3 className="font-bold text-white text-lg">Upcoming Event</h3>
              </div>
              <button
                onClick={handleCloseReloadPopup}
                className="hover:opacity-80 rounded-full p-1 transition-opacity"
                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Event Image */}
              {upcomingEvent.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={upcomingEvent.image_url}
                    alt={upcomingEvent.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/400/200';
                    }}
                  />
                </div>
              )}

              {/* Event Title */}
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                {upcomingEvent.title}
              </h4>

              {/* Event Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="h-4 w-4" style={{ color: upcomingEvent.color || '#2563eb' }} />
                  <span className="font-medium">Date:</span>
                  <span>{formatDateRange(upcomingEvent.start_date, upcomingEvent.end_date)}</span>
                </div>

                {upcomingEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4" style={{ color: upcomingEvent.color || '#2563eb' }} />
                    <span className="font-medium">Location:</span>
                    <span>{upcomingEvent.location}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleViewNotifications}
                  className="flex-1 text-white font-medium py-2 px-4 rounded-lg transition-opacity hover:opacity-90"
                  style={{ backgroundColor: upcomingEvent.color || '#2563eb' }}
                >
                  View Details
                </button>
                <button
                  onClick={handleCloseReloadPopup}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Original Seminar Popup */}
      {isOpen && activeSeminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
                      {formatDateRange(activeSeminar.start_date, activeSeminar.end_date)}
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
      )}
    </>
  );
}

