import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { seminarAPI } from '@/lib/api';

export default function SeminarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seminar, setSeminar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadSeminar();
  }, [id]);

  const loadSeminar = async () => {
    try {
      const response = await seminarAPI.getById(id!);
      setSeminar(response.seminar);
    } catch (error) {
      console.error('Failed to load seminar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!seminar) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Seminar Not Found</h2>
            <Button onClick={() => navigate('/seminars')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Seminars
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const startDate = new Date(seminar.start_date);
  const endDate = new Date(seminar.end_date);
  const regStartDate = new Date(seminar.registration_start);
  const regEndDate = new Date(seminar.registration_end);

  return (
    <Layout>
      <div className="py-4 md:py-8 lg:py-12">
        <div className="container max-w-6xl px-4">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/seminars')} 
            className="mb-4 md:mb-6 -ml-2 text-sm md:text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Seminars</span>
            <span className="sm:hidden">Back</span>
          </Button>

          {/* Hero Image */}
          <div className="relative seminar-image-container rounded-lg md:rounded-xl lg:rounded-2xl mb-4 md:mb-6 lg:mb-8 shadow-lg border border-gray-200">
            {seminar.image_url && !imageError ? (
              <div className="relative min-h-[200px] sm:min-h-[250px] md:min-h-[300px] flex items-center justify-center">
                <img 
                  src={seminar.image_url} 
                  alt={seminar.name}
                  className="seminar-image-mobile"
                  loading="lazy"
                  onError={handleImageError}
                />
                {/* Subtle overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="w-full h-64 sm:h-80 md:h-96 gradient-primary flex items-center justify-center">
                <Calendar className="h-16 sm:h-20 md:h-24 lg:h-32 w-16 sm:w-20 md:w-24 lg:w-32 text-primary-foreground/20" />
              </div>
            )}
            
            {/* Status Badge */}
            {seminar.status === 'previous' ? (
              <div className="absolute top-3 md:top-4 lg:top-6 right-3 md:right-4 lg:right-6 z-10">
                <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4 py-1 md:py-2">
                  Completed
                </Badge>
              </div>
            ) : seminar.is_active && (
              <div className="absolute top-3 md:top-4 lg:top-6 right-3 md:right-4 lg:right-6 z-10">
                <Badge className="gradient-gold text-secondary-foreground border-0 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4 py-1 md:py-2">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-secondary-foreground mr-1 md:mr-2 animate-pulse" />
                  <span className="hidden sm:inline">Registration Open</span>
                  <span className="sm:hidden">Open</span>
                </Badge>
              </div>
            )}

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8 z-10 bg-gradient-to-t from-black/80 to-transparent">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 md:mb-3 leading-tight drop-shadow-lg">
                {seminar.name}
              </h1>
              <div className="flex flex-col gap-1 sm:gap-2 text-white/95 text-xs sm:text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0 drop-shadow" />
                  <span className="truncate drop-shadow">{seminar.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0 drop-shadow" />
                  <span className="truncate drop-shadow">
                    {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' - '}
                    {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* About */}
              <div className="bg-card rounded-lg md:rounded-xl border border-border p-4 md:p-5 lg:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 md:mb-4">About the Conference</h2>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {seminar.description}
                </p>
              </div>

              {/* Venue Details */}
              <div className="bg-card rounded-lg md:rounded-xl border border-border p-4 md:p-5 lg:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 md:mb-4">Venue</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm md:text-base">{seminar.venue}</p>
                      <p className="text-muted-foreground text-sm md:text-base">{seminar.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Categories - Only show for active/upcoming events with online registration enabled */}
              {seminar.status !== 'previous' && seminar.online_registration_enabled === 1 && seminar.categories && seminar.categories.length > 0 && (
                <div className="bg-card rounded-lg md:rounded-xl border border-border p-3 sm:p-4 md:p-5 lg:p-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 md:mb-4">Registration Categories & Fees</h2>
                  
                  {/* Fee Slabs Header */}
                  {seminar.slabs && seminar.slabs.length > 0 && (
                    <div className="mb-4 md:mb-6">
                      {/* Mobile View - Card Layout */}
                      <div className="block sm:hidden space-y-3">
                        {seminar.categories.map((category: any) => (
                          <div key={category.id} className="border rounded-lg p-3 bg-accent/10">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">{category.name}</h3>
                                {category.is_popular === 1 && (
                                  <Badge className="gradient-gold text-secondary-foreground border-0 text-xs px-1.5 py-0">Popular</Badge>
                                )}
                              </div>
                            </div>
                            {category.description && (
                              <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                            )}
                            <div className="space-y-1">
                              {seminar.slabs.map((slab: any) => {
                                const amount = category.fees?.[slab.id];
                                return (
                                  <div key={slab.id} className="flex justify-between items-center py-1.5 text-xs">
                                    <span className="text-muted-foreground">{slab.label}</span>
                                    <span className="font-bold text-primary">
                                      {amount ? `Rs ${Number(amount).toLocaleString('en-IN')}` : '-'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tablet and Desktop View - Table */}
                      <div className="hidden sm:block">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-xs sm:text-sm">
                              <thead>
                                <tr className="bg-accent">
                                  <th className="text-left py-2 sm:py-3 px-2 sm:px-3 font-semibold border-r min-w-[120px]">
                                    Category
                                  </th>
                                  {seminar.slabs.map((slab: any) => (
                                    <th key={slab.id} className="text-center py-2 sm:py-3 px-1 sm:px-2 font-semibold border-r min-w-[80px]">
                                      <div className="text-xs sm:text-sm font-bold">{slab.label}</div>
                                      <div className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-0.5 hidden md:block">
                                        {slab.date_range}
                                      </div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {seminar.categories.map((category: any) => (
                                  <tr key={category.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                                    <td className="py-2 sm:py-3 px-2 sm:px-3 border-r">
                                      <div>
                                        <div className="font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                                          <span>{category.name}</span>
                                          {category.is_popular === 1 && (
                                            <Badge className="gradient-gold text-secondary-foreground border-0 text-[10px] sm:text-xs px-1 py-0">
                                              Popular
                                            </Badge>
                                          )}
                                        </div>
                                        {category.description && (
                                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden lg:block">
                                            {category.description}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    {seminar.slabs.map((slab: any) => {
                                      const amount = category.fees?.[slab.id];
                                      return (
                                        <td key={slab.id} className="text-center py-2 sm:py-3 px-1 sm:px-2 border-r">
                                          {amount ? (
                                            <>
                                              <div className="font-bold text-primary text-xs sm:text-sm">
                                                Rs {Number(amount).toLocaleString('en-IN')}
                                              </div>
                                              <div className="text-[9px] sm:text-xs text-muted-foreground hidden md:block">
                                                (Incl. GST)
                                              </div>
                                            </>
                                          ) : (
                                            <div className="text-muted-foreground">-</div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-accent/30 rounded-lg p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-muted-foreground">
                    <p className="font-semibold mb-1 sm:mb-2">Note:</p>
                    <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-[11px] sm:text-xs md:text-sm">
                      <li>All fees are in Indian Rupees (Rs)</li>
                      <li>Early registration recommended</li>
                      <li>Fees are non-refundable once paid</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* What to Expect */}
              <div className="bg-card rounded-lg md:rounded-xl border border-border p-4 md:p-5 lg:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 md:mb-4">What to Expect</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm md:text-base">Expert Speakers</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Learn from leading ophthalmologists</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm md:text-base">CME Credits</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Earn continuing education points</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm md:text-base">Networking</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Connect with peers and experts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm md:text-base">Latest Research</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Stay updated with innovations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 md:space-y-6">
              {/* Registration Card */}
              <div className="bg-card rounded-lg md:rounded-xl border border-border p-4 md:p-5 lg:p-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-3 md:mb-4">Registration Details</h3>
                
                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Conference Dates</p>
                      <p className="font-bold text-sm md:text-base lg:text-lg text-primary break-words">
                        {startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' - '}
                        {endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Registration Period</p>
                      <p className="font-bold text-sm md:text-base lg:text-lg text-primary break-words">
                        {regStartDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' - '}
                        {regEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Expected Delegates</p>
                      <p className="font-semibold text-sm md:text-base">500+ Participants</p>
                    </div>
                  </div>
                </div>

                {seminar.status !== 'previous' && seminar.is_active && seminar.online_registration_enabled === 1 ? (
                  <Link to={`/seminar/${seminar.id}/register`}>
                    <Button className="w-full gradient-primary text-primary-foreground text-sm md:text-base" size="lg">
                      <span className="hidden sm:inline">Register Now</span>
                      <span className="sm:hidden">Register</span>
                      <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </Link>
                ) : seminar.status === 'previous' ? (
                  <Button disabled className="w-full text-sm md:text-base" size="lg">
                    Event Completed
                  </Button>
                ) : seminar.online_registration_enabled === 0 ? (
                  <Button disabled className="w-full text-xs sm:text-sm md:text-base" size="lg">
                    <span className="hidden sm:inline">Online Registration Disabled</span>
                    <span className="sm:hidden">Registration Disabled</span>
                  </Button>
                ) : (
                  <Button disabled className="w-full text-sm md:text-base" size="lg">
                    Registration Closed
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center mt-3 md:mt-4 leading-relaxed">
                  {seminar.status === 'previous' 
                    ? 'This event has been completed' 
                    : 'Secure your spot today. Limited seats available!'}
                </p>
              </div>

              {/* Contact Card */}
              <div className="bg-card rounded-lg md:rounded-xl border border-border p-4 md:p-5 lg:p-6">
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-2 md:mb-3">Need Help?</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 leading-relaxed">
                  Have questions about the conference? Our team is here to help.
                </p>
                <Link to="/contact">
                  <Button variant="outline" className="w-full text-sm md:text-base">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
