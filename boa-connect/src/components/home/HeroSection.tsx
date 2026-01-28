import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Users, Award, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seminarAPI } from "@/lib/api";
import { useSiteConfig } from "@/hooks/useSiteConfig";

const POPUP_DISMISSED_KEY = 'boa_seminar_popup_dismissed';

export function HeroSection() {
  const [activeSeminar, setActiveSeminar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const { config } = useSiteConfig();

  useEffect(() => {
    loadActiveSeminar();
  }, []);

  const loadActiveSeminar = async () => {
    try {
      const response = await seminarAPI.getActive();
      setActiveSeminar(response.seminar);

      // Check if popup should be shown
      const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
      if (!dismissed && response.seminar) {
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Failed to load active seminar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, 'true');
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden gradient-hero">
        <div className="container py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (!activeSeminar) {
    return (
      <section className="relative overflow-hidden" style={{ background: '#F9FAFB' }}>
        <div className="container py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-4" style={{ color: '#1F2933' }}>
              Bihar Ophthalmic Association
            </h1>
            <p className="text-lg md:text-xl mb-8" style={{ color: '#616E7C' }}>
              Advancing eye care excellence through education, research, and collaboration since 1975.
            </p>
            <Link to="/seminars">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 h-12 text-base px-6">
                View All Seminars
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const seminarStartDate = new Date(activeSeminar.start_date);
  const seminarEndDate = new Date(activeSeminar.end_date);

  return (
    <section className="relative overflow-hidden" style={{ background: '#F9FAFB' }}>
      {/* Simple background - no fancy patterns */}

      {/* Popup Overlay in Hero Section */}
      {showPopup && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-elevated animate-scale-in overflow-hidden">
            {/* Close Button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Banner */}
            <div className="px-6 py-8 text-center border-b-4" style={{ background: '#0B3C5D', borderColor: '#C9A227' }}>
              <div className="gov-badge-accent mb-4">
                <span className="w-2 h-2 rounded-full mr-2" style={{ background: '#C9A227' }} />
                Registration Open
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-white">
                {activeSeminar.name}
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded" style={{ background: '#E3F2FD' }}>
                    <Calendar className="h-5 w-5" style={{ color: '#0B3C5D' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#616E7C' }}>Date</p>
                    <p className="font-medium" style={{ color: '#1F2933' }}>
                      {seminarStartDate.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                      {activeSeminar.start_date !== activeSeminar.end_date && (
                        <> - {seminarEndDate.toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded" style={{ background: '#E3F2FD' }}>
                    <MapPin className="h-5 w-5" style={{ color: '#0B3C5D' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#616E7C' }}>Venue</p>
                    <p className="font-medium" style={{ color: '#1F2933' }}>{activeSeminar.venue}, {activeSeminar.location}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm" style={{ color: '#616E7C' }}>
                {activeSeminar.description || 'Join leading ophthalmologists from across India for the most prestigious eye care conference. Early bird registration now available!'}
              </p>

              <div className="flex gap-3">
                <Link to={`/seminar/${activeSeminar.id}/register`} className="flex-1">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 h-12 text-base px-6">
                    Register Now
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <button className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-colors h-12 text-base px-6" onClick={handleClosePopup}>
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container relative p md:py-30">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {activeSeminar && activeSeminar.online_registration_enabled === 1 && (
              <div className="gov-badge-accent">
                <span className="w-2 h-2 rounded-full mr-2 inline-block bg-green-500" />
                <span className="text-black">{activeSeminar.name} - Registration Open</span>
              </div>
            )}

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight" style={{ color: '#1F2933' }}>
                Bihar Ophthalmic Association
              </h1>
              <p className="text-lg md:text-xl max-w-lg" style={{ color: '#616E7C' }}>
                Advancing eye care excellence through education, research, and collaboration since 1975.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {activeSeminar && activeSeminar.online_registration_enabled === 1 ? (
                <>
                  <Link to={`/seminar/${activeSeminar.id}/register`}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 h-12 text-base px-6 md:h-11 md:text-sm md:px-5">
                      Register for {activeSeminar.name}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link to="/seminars">
                    <button className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors h-12 text-base px-6 md:h-11 md:text-sm md:px-5">
                      View All Seminars
                    </button>
                  </Link>
                </>
              ) : (
                <Link to="/seminars">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 h-12 text-base px-6 md:h-11 md:text-sm md:px-5">
                    View All Seminars
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative hidden lg:block">
            <div className="relative w-full max-w-[80vh] h-[80vh] mx-auto" style={{ aspectRatio: '1/1' }}>
              {/* Main Circle with Image - Smaller design */}
              <div className="absolute inset-6 rounded-full" style={{ background: '#E3F2FD' }} />
              <div className="absolute inset-12 rounded-full bg-white overflow-hidden border-3" style={{ borderColor: '#0B3C5D' }}>
                {config.hero_circle_image_url && (
                  <img
                    src={config.hero_circle_image_url}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Smaller Info Cards */}
              <div className="absolute top-8 left-0 gov-card p-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded flex items-center justify-center" style={{ background: '#0B3C5D' }}>
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#1F2933' }}>Best Conference</p>
                    <p className="text-xs" style={{ color: '#616E7C' }}>Feel Free Here</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-16 right-0 gov-card p-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded flex items-center justify-center" style={{ background: '#C9A227' }}>
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#1F2933' }}>CME Points</p>
                    <p className="text-xs" style={{ color: '#616E7C' }}>Certified Programs</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-8 gov-card p-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded flex items-center justify-center" style={{ background: '#E8F5E9' }}>
                    <Users className="h-4 w-4" style={{ color: '#2E7D32' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#1F2933' }}>Register Now</p>
                    <p className="text-xs" style={{ color: '#616E7C' }}>Limited Seats</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
