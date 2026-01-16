import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      // User not logged in - show toast and redirect to login
      toast({
        title: 'Login Required',
        description: 'Please login to register for this event',
        variant: 'destructive',
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1000);
      return;
    }
    
    // User is logged in - proceed with registration
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
    <section className="py-10 bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section Heading */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-[#0B3C5D]">
            {events.length > 1 ? 'Upcoming Events' : 'Upcoming Event'}
          </h2>
          <p className="text-gray-600">Don't miss out on our upcoming event</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-6 p-6">
            {/* Left Side - Event Details */}
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold text-[#0B3C5D]">
                  {currentEvent.title || 'Event Title'}
                </h3>
                
                <div className="space-y-3">
                  {currentEvent.start_date && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[#0B3C5D]">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Event Date</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatDate(currentEvent.start_date)}
                          {currentEvent.end_date && currentEvent.end_date !== currentEvent.start_date && 
                            ` - ${formatDate(currentEvent.end_date)}`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {currentEvent.location && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[#0B3C5D]">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Venue</p>
                        <p className="text-sm font-semibold text-gray-800">{currentEvent.location}</p>
                      </div>
                    </div>
                  )}

                  {currentEvent.description && (
                    <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-[#0B3C5D]">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {currentEvent.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Image */}
              <div className="rounded-lg overflow-hidden shadow-md mt-4">
                <img
                  src={currentEvent.image_url}
                  alt={currentEvent.title || 'Event'}
                  className="w-full h-[200px] object-cover"
                />
              </div>
            </div>

            {/* Right Side - Countdown & Button */}
            <div className="flex flex-col h-full justify-between">
              {/* Countdown */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-6 w-6 text-[#0B3C5D]" />
                  <h4 className="text-lg font-bold text-[#0B3C5D]">Event Starts In</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
                    <div className="text-3xl font-bold text-[#0B3C5D]">
                      {timeLeft.days}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">Days</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
                    <div className="text-3xl font-bold text-[#0B3C5D]">
                      {timeLeft.hours}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">Hours</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
                    <div className="text-3xl font-bold text-[#0B3C5D]">
                      {timeLeft.minutes}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">Minutes</div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
                    <div className="text-3xl font-bold text-[#0B3C5D]">
                      {timeLeft.seconds}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">Seconds</div>
                  </div>
                </div>
              </div>

              {/* Register Button */}
              <button
                onClick={handleRegisterClick}
                className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg flex items-center justify-center gap-2 bg-[#0B3C5D] mt-4"
              >
                Register Now
                <ArrowRight className="h-5 w-5" />
              </button>

              {/* Navigation Dots */}
              {events.length > 1 && (
                <div className="flex justify-center gap-2 pt-3">
                  {events.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-8 bg-[#0B3C5D]'
                          : 'w-2.5 bg-gray-300 hover:bg-gray-400'
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
