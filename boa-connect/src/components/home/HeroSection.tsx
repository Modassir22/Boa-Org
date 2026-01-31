import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Users, Award, MapPin } from "lucide-react";
import { seminarAPI } from "@/lib/api";
import { useSiteConfig } from "@/hooks/useSiteConfig";

export function HeroSection() {
  const [activeSeminar, setActiveSeminar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { config } = useSiteConfig();

  useEffect(() => {
    loadActiveSeminar();
  }, []);

  const loadActiveSeminar = async () => {
    try {
      const response = await seminarAPI.getActive();
      setActiveSeminar(response.seminar);
    } catch (error) {
      console.error('Failed to load active seminar:', error);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <section className="relative overflow-hidden" style={{ background: '#F9FAFB' }}>
      {/* Simple background - no fancy patterns */}

      <div className="container relative py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
            {activeSeminar && activeSeminar.online_registration_enabled === 1 && (
              <div className="gov-badge-accent inline-flex">
                <span className="w-2 h-2 rounded-full mr-2 inline-block bg-green-500" />
                <span className="text-black text-sm">{activeSeminar.name} - Registration Open</span>
              </div>
            )}

            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight" style={{ color: '#1F2933' }}>
                Bihar Ophthalmic Association
              </h1>
              <p className="text-base sm:text-lg md:text-xl max-w-lg mx-auto lg:mx-0" style={{ color: '#616E7C' }}>
                Advancing eye care excellence through education, research, and collaboration since 1975.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              {activeSeminar && activeSeminar.online_registration_enabled === 1 ? (
                <>
                  <Link to={`/seminar/${activeSeminar.id}/register`}>
                    <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 h-11 text-sm px-5">
                      Register for {activeSeminar.name}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link to="/seminars">
                    <button className="w-full sm:w-auto bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors h-11 text-sm px-5">
                      View All Seminars
                    </button>
                  </Link>
                </>
              ) : (
                <Link to="/seminars">
                  <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 h-11 text-sm px-5">
                    View All Seminars
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative hidden lg:block">
            <div className="relative w-full max-w-[80vh] mx-auto" style={{ aspectRatio: '1/1' }}>
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
