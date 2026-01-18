import { useState, useEffect } from 'react';
import { Calendar, MapPin, FileText, ExternalLink, Clock } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [countdowns, setCountdowns] = useState<{ [key: number]: TimeLeft }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (events.length === 0) return;

    const calculateCountdowns = () => {
      const newCountdowns: { [key: number]: TimeLeft } = {};

      console.log('Calculating countdowns for', events.length, 'events');

      events.forEach((event, index) => {
        console.log(`Event ${index}:`, event.title, 'Start date:', event.start_date);

        if (event.start_date) {
          try {
            let eventDate = new Date(event.start_date);

            if (isNaN(eventDate.getTime())) {
              eventDate = new Date(event.start_date + 'T00:00:00');
            }

            const eventTime = eventDate.getTime();
            const now = Date.now();
            const difference = eventTime - now;

            console.log(`Event ${index} - Now:`, new Date(now), 'Event:', eventDate, 'Difference:', difference);

            if (difference > 0) {
              const days = Math.floor(difference / (1000 * 60 * 60 * 24));
              const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((difference % (1000 * 60)) / 1000);

              newCountdowns[index] = { days, hours, minutes, seconds };
              console.log(`Countdown ${index}:`, { days, hours, minutes, seconds });
            } else {
              newCountdowns[index] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
              console.log(`Event ${index} has passed`);
            }
          } catch (error) {
            console.error('Error calculating countdown for event:', error);
            newCountdowns[index] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
          }
        } else {
          newCountdowns[index] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
          console.log(`Event ${index} has no start date`);
        }
      });

      console.log('Final countdowns:', newCountdowns);
      setCountdowns(newCountdowns);
    };

    // Calculate immediately
    calculateCountdowns();

    // Update every second
    const timer = setInterval(calculateCountdowns, 1000);

    return () => clearInterval(timer);
  }, [events]);

  const loadEvents = async () => {
    try {
      console.log('Loading upcoming events...');
      console.log('Making request to:', '/api/upcoming-events');
      const response = await fetch('/api/upcoming-events');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      const data = await response.json();
      console.log('API Response:', data);
      if (data.success) {
        console.log('Events loaded:', data.events);
        setEvents(data.events || []);
      } else {
        console.log('API returned success: false');
      }
    } catch (error) {
      console.error('Failed to load upcoming events:', error);
      console.error('Error details:', error.message);
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEventStatus = (startDate: string, endDate?: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'completed';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: { text: 'Upcoming', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      ongoing: { text: 'Ongoing', class: 'bg-green-100 text-green-800 border-green-200' },
      completed: { text: 'Completed', class: 'bg-gray-100 text-gray-600 border-gray-200' }
    };

    const badge = badges[status as keyof typeof badges] || badges.upcoming;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const handleEventAction = (event: any) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      toast({
        title: 'Login Required',
        description: 'Please login to access event details',
        variant: 'destructive',
      });

      setTimeout(() => {
        navigate('/login');
      }, 1000);
      return;
    }

    if (event.link_url) {
      if (event.link_url.startsWith('http://') || event.link_url.startsWith('https://')) {
        window.open(event.link_url, '_blank');
      } else {
        navigate(event.link_url);
      }
    } else if (event.seminar_id) {
      navigate(`/seminar/${event.seminar_id}/register`);
    }
  };

  console.log('UpcomingEventsCarousel render - Events:', events.length, 'Loading:', isLoading);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Government-style Header */}
        <div className="mb-8 ">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-blue-600"></div>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
              Upcoming Events {isLoading ? '(Loading...)' : `(${events.length} events)`}
            </h2>
          </div>
          <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
            Stay informed about official events, conferences, and important announcements from Bihar Ophthalmic Association
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="gov-loading rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            <span className="ml-3 text-gray-600 font-medium">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 gov-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
            <p className="text-gray-600">Check back soon for upcoming events and announcements.</p>
          </div>
        ) : (
          /* Events Grid - Government Card Style */
          <div className="space-y-4 mb-8">
            {events.map((event, index) => {
              const status = getEventStatus(event.start_date, event.end_date);
              const countdown = countdowns[index] || { days: 0, hours: 0, minutes: 0, seconds: 0 };
              const hasCountdown = status === 'upcoming' && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0);

              console.log(`Event ${index} render:`, {
                title: event.title,
                status,
                countdown,
                hasCountdown
              });

              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden section-enter"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Left - Event Image */}
                    <div className="md:w-1/2 lg:w-2/3">
                      <div className="relative h-64 md:h-full min-h-[300px] bg-gray-100">
                        <img
                          src={event.image_url || '/api/placeholder/800/400'}
                          alt={event.title || 'Event'}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/800/400';
                          }}
                        />
                        {/* Status Badge Overlay */}
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(status)}
                        </div>
                      </div>
                    </div>

                    {/* Right - Timer & Details */}
                    <div className="md:w-1/2 lg:w-1/3 p-6 flex flex-col justify-between">
                      {/* Top - Countdown Timer */}
                      {status === 'upcoming' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <h4 className="text-sm font-semibold text-blue-900" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                              Event Starts In
                            </h4>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-white border border-blue-200 rounded-md p-2 text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {countdown.days}
                              </div>
                              <div className="text-xs text-blue-700 font-medium">Days</div>
                            </div>

                            <div className="bg-white border border-blue-200 rounded-md p-2 text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {countdown.hours}
                              </div>
                              <div className="text-xs text-blue-700 font-medium">Hours</div>
                            </div>

                            <div className="bg-white border border-blue-200 rounded-md p-2 text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {countdown.minutes}
                              </div>
                              <div className="text-xs text-blue-700 font-medium">Mins</div>
                            </div>

                            <div className="bg-white border border-blue-200 rounded-md p-2 text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {countdown.seconds}
                              </div>
                              <div className="text-xs text-blue-700 font-medium">Secs</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom - Event Details (Compact) */}
                      <div className="space-y-3">
                        {/* Event Title */}
                        <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                          {event.title || 'Official Event'}
                        </h3>

                        {/* Event Details - Compact */}
                        <div className="space-y-2 text-xs">
                          {/* Date */}
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                            <span className="font-medium">Date:</span>
                            <span>
                              {formatDate(event.start_date)}
                              {event.end_date && event.end_date !== event.start_date &&
                                ` to ${formatDate(event.end_date)}`
                              }
                            </span>
                          </div>

                          {/* Location */}
                          {event.location && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <MapPin className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                              <span className="font-medium">Location:</span>
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}

                          {/* Organizing Authority */}
                          <div className="flex items-center gap-2 text-gray-700">
                            <div className="h-3.5 w-3.5 bg-blue-600 rounded-sm flex-shrink-0"></div>
                            <span className="font-medium">Organizing Authority:</span>
                            <span className="line-clamp-1">Bihar Ophthalmic Association</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleEventAction(event)}
                            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg h-10 px-4 text-sm transition-colors"
                            style={{ fontFamily: 'Noto Sans, sans-serif' }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Event Details
                          </button>

                          <button
                            onClick={() => handleEventAction(event)}
                            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium rounded-lg h-10 px-4 text-sm transition-colors"
                            style={{ fontFamily: 'Noto Sans, sans-serif' }}
                          >
                            <FileText className="h-4 w-4" />
                            Download Circular
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Action */}
       
      </div>
    </section>
  );
}
