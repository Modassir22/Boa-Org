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
      <section className="relative overflow-hidden gradient-hero">
        <div className="container py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Bihar Ophthalmic Association</h1>
          <p className="text-muted-foreground">No active seminar at the moment. Check back soon!</p>
        </div>
      </section>
    );
  }

  const seminarStartDate = new Date(activeSeminar.start_date);
  const seminarEndDate = new Date(activeSeminar.end_date);
  const dateRange = `${seminarStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${seminarEndDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
  
  return (
    <section className="relative overflow-hidden" style={{background: '#F9FAFB'}}>
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
            <div className="px-6 py-8 text-center border-b-4" style={{background: '#0B3C5D', borderColor: '#C9A227'}}>
              <div className="gov-badge-accent mb-4">
                <span className="w-2 h-2 rounded-full mr-2" style={{background: '#C9A227'}} />
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
                  <div className="flex h-10 w-10 items-center justify-center rounded" style={{background: '#E3F2FD'}}>
                    <Calendar className="h-5 w-5" style={{color: '#0B3C5D'}} />
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#616E7C'}}>Date</p>
                    <p className="font-medium" style={{color: '#1F2933'}}>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded" style={{background: '#E3F2FD'}}>
                    <MapPin className="h-5 w-5" style={{color: '#0B3C5D'}} />
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#616E7C'}}>Venue</p>
                    <p className="font-medium" style={{color: '#1F2933'}}>{activeSeminar.venue}, {activeSeminar.location}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm" style={{color: '#616E7C'}}>
                {activeSeminar.description || 'Join leading ophthalmologists from across India for the most prestigious eye care conference. Early bird registration now available!'}
              </p>

              <div className="flex gap-3">
                <Link to={`/seminar/${activeSeminar.id}/register`} className="flex-1">
                  <button className="w-full gov-button-primary">
                    Register Now
                    <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </button>
                </Link>
                <button className="gov-button-secondary" onClick={handleClosePopup}>
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container relative py-5 md:py-30">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="gov-badge-accent">
              <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{background: '#C9A227'}} />
              {activeSeminar.name} - Registration Open
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight" style={{color: '#1F2933'}}>
                Bihar Ophthalmic Association
              </h1>
              <p className="text-lg md:text-xl max-w-lg" style={{color: '#616E7C'}}>
                Advancing eye care excellence through education, research, and collaboration since 1975.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to={`/seminar/${activeSeminar.id}/register`}>
                <button className="gov-button-primary text-lg px-6 py-3">
                  Register for {activeSeminar.name}
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </button>
              </Link>
              <Link to="/seminars">
                <button className="bg-white border-2 px-6 py-3 rounded font-medium hover:bg-gray-50 transition-colors text-lg" style={{color: '#0B3C5D', borderColor: '#0B3C5D'}}>
                  View All Seminars
                </button>
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square">
              {/* Main Circle with Image - Simple design */}
              <div className="absolute inset-8 rounded-full" style={{background: '#E3F2FD'}} />
              <div className="absolute inset-16 rounded-full bg-white overflow-hidden border-4" style={{borderColor: '#0B3C5D'}}>
                {config.hero_circle_image_url && (
                  <img 
                    src={config.hero_circle_image_url} 
                    alt="Hero" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Simple Info Cards */}
              <div className="absolute top-12 left-0 gov-card p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded flex items-center justify-center" style={{background: '#0B3C5D'}}>
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium" style={{color: '#1F2933'}}>Next Conference</p>
                    <p className="text-sm" style={{color: '#616E7C'}}>{dateRange}</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 right-0 gov-card p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded flex items-center justify-center" style={{background: '#C9A227'}}>
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium" style={{color: '#1F2933'}}>CME Points</p>
                    <p className="text-sm" style={{color: '#616E7C'}}>Certified Programs</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-12 gov-card p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded flex items-center justify-center" style={{background: '#E8F5E9'}}>
                    <Users className="h-6 w-6" style={{color: '#2E7D32'}} />
                  </div>
                  <div>
                    <p className="font-medium" style={{color: '#1F2933'}}>Register Now</p>
                    <p className="text-sm" style={{color: '#616E7C'}}>Limited Seats</p>
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
