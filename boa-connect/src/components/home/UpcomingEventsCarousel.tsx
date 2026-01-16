import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function UpcomingEventsCarousel() {
  const [events, setEvents] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [events.length]);

  useEffect(() => {
    if (events.length === 0 || !events[currentIndex]?.start_date) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const calculateTimeLeft = () => {
      try {
        // Parse the date - handle both ISO format and other formats
        let eventDate;
        const dateStr = events[currentIndex].start_date;
        
        // Try parsing as ISO string first
        eventDate = new Date(dateStr);
        
        // If invalid, try adding time if only date is provided
        if (isNaN(eventDate.getTime())) {
          eventDate = new Date(dateStr + 'T00:00:00');
        }
        
        const eventTime = eventDate.getTime();
        const now = Date.now();
        const difference = eventTime - now;

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          setTimeLeft({ days, hours, minutes, seconds });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      } catch (error) {
        console.error('Error calculating countdown:', error);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately
    calculateTimeLeft();
    
    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [events, currentIndex]);

  const loadEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/upcoming-events');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to load upcoming events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleRegisterClick = () => {
    // If link_url is provided, use it
    if (currentEvent.link_url) {
      // Check if it's an external link
      if (currentEvent.link_url.startsWith('http://') || currentEvent.link_url.startsWith('https://')) {
        window.open(currentEvent.link_url, '_blank');
      } else {
        // Internal route
        navigate(currentEvent.link_url);
      }
    } 
    // Otherwise, check if it's linked to a seminar and redirect to registration
    else if (currentEvent.seminar_id) {
      navigate(`/seminar/${currentEvent.seminar_id}/register`);
    }
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-muted/30">
        <div className="container flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const currentEvent = events[currentIndex];

  return (
    <section className="py-12" style={{background: '#F9FAFB'}}>
      <div className="container">
        {/* Section Heading */}
        <h2 className="text-4xl font-bold text-center mb-8" style={{color: '#0B3C5D'}}>
          {events.length > 1 ? 'Upcoming Events' : 'Upcoming Event'}
        </h2>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-3 gap-6 p-6">
            {/* Left Side - Event Details */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-3xl font-bold mb-4" style={{color: '#0B3C5D'}}>
                  {currentEvent.title || 'Event Title'}
                </h3>
                
                <div className="space-y-3">
                  {currentEvent.start_date && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-5 w-5" style={{color: '#0B3C5D'}} />
                      <span className="font-medium">
                        {formatDate(currentEvent.start_date)}
                        {currentEvent.end_date && currentEvent.end_date !== currentEvent.start_date && 
                          ` - ${formatDate(currentEvent.end_date)}`
                        }
                      </span>
                    </div>
                  )}
                  
                  {currentEvent.location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-5 w-5" style={{color: '#0B3C5D'}} />
                      <span>{currentEvent.location}</span>
                    </div>
                  )}

                  {currentEvent.description && (
                    <p className="text-gray-600 mt-4 leading-relaxed">
                      {currentEvent.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Event Image */}
              <div className="rounded-lg overflow-hidden shadow-md">
                <img
                  src={currentEvent.image_url}
                  alt={currentEvent.title || 'Event'}
                  className="w-full h-[300px] object-cover"
                />
              </div>
            </div>

            {/* Right Side - Countdown Timer & Register Button */}
            <div className="flex flex-col justify-center">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-md space-y-6">
                {/* Countdown Timer */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-6 w-6" style={{color: '#0B3C5D'}} />
                    <h3 className="text-xl font-bold" style={{color: '#0B3C5D'}}>
                      Event Starts In
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <div className="text-3xl font-bold" style={{color: '#0B3C5D'}}>
                        {timeLeft.days}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Days</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <div className="text-3xl font-bold" style={{color: '#0B3C5D'}}>
                        {timeLeft.hours}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Hours</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <div className="text-3xl font-bold" style={{color: '#0B3C5D'}}>
                        {timeLeft.minutes}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Minutes</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <div className="text-3xl font-bold" style={{color: '#0B3C5D'}}>
                        {timeLeft.seconds}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Seconds</div>
                    </div>
                  </div>
                </div>

                {/* Register Button */}
                {(currentEvent.link_url || currentEvent.seminar_id) && (
                  <button
                    onClick={handleRegisterClick}
                    className="w-full px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                    style={{background: '#0B3C5D'}}
                  >
                    Click here to register
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Event Navigation Dots */}
              {events.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {events.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-3 rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-8 bg-blue-600'
                          : 'w-3 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to event ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
