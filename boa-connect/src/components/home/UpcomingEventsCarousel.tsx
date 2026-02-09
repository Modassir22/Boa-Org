import { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, FileText, ExternalLink, Clock, Vote, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
  
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (events.length === 0) return;

    const calculateCountdowns = () => {
      const newCountdowns: { [key: number]: TimeLeft } = {};

      events.forEach((event, index) => {
        if (event.start_date) {
          try {
            let eventDate = new Date(event.start_date);

            if (isNaN(eventDate.getTime())) {
              eventDate = new Date(event.start_date + 'T00:00:00');
            }

            const eventTime = eventDate.getTime();
            const now = Date.now();
            const difference = eventTime - now;

            if (difference > 0) {
              const days = Math.floor(difference / (1000 * 60 * 60 * 24));
              const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((difference % (1000 * 60)) / 1000);

              newCountdowns[index] = { days, hours, minutes, seconds };
            } else {
              newCountdowns[index] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }
          } catch (error) {
            newCountdowns[index] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
          }
        } else {
          newCountdowns[index] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
      });

      setCountdowns(newCountdowns);
    };

    calculateCountdowns();
    const timer = setInterval(calculateCountdowns, 1000);

    return () => clearInterval(timer);
  }, [events]);

  const loadEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/upcoming-events`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getEventTypeInfo = (eventType: string) => {
    const types = {
      seminar: { 
        icon: Calendar, 
        label: 'Seminar', 
        color: 'bg-blue-100 text-blue-800 border-blue-200' 
      },
      election: { 
        icon: Vote, 
        label: 'Election', 
        color: 'bg-purple-100 text-purple-800 border-purple-200' 
      },
      job: { 
        icon: Briefcase, 
        label: 'Job Opening', 
        color: 'bg-green-100 text-green-800 border-green-200' 
      },
      event: { 
        icon: Calendar, 
        label: 'Event', 
        color: 'bg-orange-100 text-orange-800 border-orange-200' 
      }
    };

    return types[eventType as keyof typeof types] || types.event;
  };

  const handleEventAction = (event: any, actionType: 'details' | 'download') => {
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

    if (actionType === 'details') {
      if (event.event_type === 'seminar') {
        navigate(`/seminar/${event.seminar_id || event.id}`);
      } else if (event.event_type === 'election') {
        navigate(`/election-submission/${event.election_id || event.id}`);
      } else if (event.seminar_id) {
        navigate(`/seminar/${event.seminar_id}`);
      } else if (event.id) {
        navigate(`/seminar/${event.id}`);
      } else if (event.link_url) {
        if (event.link_url.startsWith('http://') || event.link_url.startsWith('https://')) {
          window.open(event.link_url, '_blank');
        } else {
          navigate(event.link_url);
        }
      } else {
        toast({
          title: 'Navigation Issue',
          description: `Event: ${event.title || 'Unknown'} - Missing navigation data`,
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-blue-600"></div>
            <h2 className="text-2xl font-bold text-gray-900 p-2 bg-[#0B3C5D] text-white" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
              Upcoming Events {isLoading ? '(Loading...)' : `(${events.length} events)`}
            </h2>
          </div>
          <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
            Stay informed about seminars, elections, and important announcements from Ophthalmic Association Of Bihar
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent animate-spin"></div>
            <span className="ml-3 text-gray-600 font-medium">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
            <p className="text-gray-600">Check back soon for upcoming events and announcements.</p>
          </div>
        ) : (
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {events.map((event, index) => {
                const status = getEventStatus(event.start_date, event.end_date);
                const countdown = countdowns[index] || { days: 0, hours: 0, minutes: 0, seconds: 0 };
                const eventTypeInfo = getEventTypeInfo(event.event_type || 'event');
                const EventIcon = eventTypeInfo.icon;

                return (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-full">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full flex flex-col md:flex-row">
                      {/* Left - Event Image */}
                      <div className="md:w-1/2 lg:w-2/3">
                        <div className="relative h-64 md:h-full min-h-[400px] bg-gray-100">
                          {event.image_url ? (
                            <img
                              src={event.image_url}
                              alt={event.title || 'Event'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/placeholder/800/400';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                              <EventIcon className="h-24 w-24 text-blue-300" />
                            </div>
                          )}
                          
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border ${eventTypeInfo.color}`}>
                              <EventIcon className="h-4 w-4" />
                              {eventTypeInfo.label}
                            </span>
                            {getStatusBadge(status)}
                          </div>
                        </div>
                      </div>

                      {/* Right - Event Details */}
                      <div className="md:w-1/2 lg:w-1/3 p-6 flex flex-col justify-between">
                        {status === 'upcoming' && (countdown.days > 0 || countdown.hours > 0) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <h4 className="text-sm font-semibold text-blue-900">Starts In</h4>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div className="bg-white border border-blue-200 rounded p-2 text-center">
                                <div className="text-2xl font-bold text-blue-600">{countdown.days}</div>
                                <div className="text-xs text-blue-700 font-medium">Days</div>
                              </div>
                              <div className="bg-white border border-blue-200 rounded p-2 text-center">
                                <div className="text-2xl font-bold text-blue-600">{countdown.hours}</div>
                                <div className="text-xs text-blue-700 font-medium">Hrs</div>
                              </div>
                              <div className="bg-white border border-blue-200 rounded p-2 text-center">
                                <div className="text-2xl font-bold text-blue-600">{countdown.minutes}</div>
                                <div className="text-xs text-blue-700 font-medium">Min</div>
                              </div>
                              <div className="bg-white border border-blue-200 rounded p-2 text-center">
                                <div className="text-2xl font-bold text-blue-600">{countdown.seconds}</div>
                                <div className="text-xs text-blue-700 font-medium">Sec</div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4 flex-grow">
                          <h3 className="text-xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                            {event.title || event.name || 'Official Event'}
                          </h3>

                          <div className="space-y-2 text-sm">
                            {event.start_date && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="font-medium">Date:</span>
                                <span>
                                  {formatDate(event.start_date)}
                                  {event.end_date && event.end_date !== event.start_date &&
                                    ` - ${formatDate(event.end_date)}`
                                  }
                                </span>
                              </div>
                            )}

                            {event.location && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="font-medium">Location:</span>
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 mt-4">
                          <button
                            onClick={() => handleEventAction(event, 'details')}
                            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg h-11 px-6 text-sm transition-colors"
                            style={{ fontFamily: 'Noto Sans, sans-serif' }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12" />
            <CarouselNext className="hidden md:flex -right-4 lg:-right-12" />
          </Carousel>
        )}
      </div>
    </section>
  );
}
