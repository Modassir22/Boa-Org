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

  useEffect(() => {
    loadSeminar();
  }, [id]);

  const loadSeminar = async () => {
    try {
      const response = await seminarAPI.getById(id!);
      console.log('Seminar data loaded:', response.seminar);
      console.log('Start date:', response.seminar.start_date);
      console.log('End date:', response.seminar.end_date);
      console.log('Registration start:', response.seminar.registration_start);
      console.log('Registration end:', response.seminar.registration_end);
      setSeminar(response.seminar);
    } catch (error) {
      console.error('Failed to load seminar:', error);
    } finally {
      setIsLoading(false);
    }
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
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Seminar Not Found</h2>
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

  console.log('Parsed dates:', {
    startDate: startDate.toLocaleDateString(),
    endDate: endDate.toLocaleDateString(),
    regStartDate: regStartDate.toLocaleDateString(),
    regEndDate: regEndDate.toLocaleDateString()
  });

  return (
    <Layout>
      <div className="py-12 px-4">
        <div className="container max-w-5xl">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/seminars')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Seminars
          </Button>

          {/* Hero Image */}
          <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
            {seminar.image_url ? (
              <img 
                src={seminar.image_url} 
                alt={seminar.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center">
                <Calendar className="h-32 w-32 text-primary-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Status Badge */}
            {seminar.status === 'previous' ? (
              <div className="absolute top-6 right-6">
                <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-lg px-4 py-2">
                  Completed
                </Badge>
              </div>
            ) : seminar.is_active && (
              <div className="absolute top-6 right-6">
                <Badge className="gradient-gold text-secondary-foreground border-0 text-lg px-4 py-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-foreground mr-2 animate-pulse" />
                  Registration Open
                </Badge>
              </div>
            )}

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {seminar.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-white/90 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{seminar.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' - '}
                    {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              
          
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">About the Conference</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {seminar.description}
                </p>
              </div>

              {/* Venue Details */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">Venue</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">{seminar.venue}</p>
                      <p className="text-muted-foreground">{seminar.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Categories - Only show for active/upcoming events with online registration enabled */}
              {seminar.status !== 'previous' && seminar.online_registration_enabled === 1 && seminar.categories && seminar.categories.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="text-2xl font-bold mb-4">Registration Categories & Fees</h2>
                  
                  {/* Fee Slabs Header */}
                  {seminar.slabs && seminar.slabs.length > 0 && (
                    <div className="mb-6">
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-accent">
                              <th className="text-left py-3 px-3 font-semibold border-r w-[30%]">Category</th>
                              {seminar.slabs.map((slab: any) => (
                                <th key={slab.id} className="text-center py-3 px-2 font-semibold border-r">
                                  <div className="text-sm font-bold">{slab.label}</div>
                                  <div className="text-xs font-normal text-muted-foreground mt-0.5">{slab.date_range}</div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {seminar.categories.map((category: any) => (
                              <tr key={category.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                                <td className="py-3 px-3 border-r">
                                  <div>
                                    <div className="font-semibold text-sm flex items-center gap-2">
                                      {category.name}
                                      {category.is_popular === 1 && (
                                        <Badge className="gradient-gold text-secondary-foreground border-0 text-xs px-1.5 py-0">Popular</Badge>
                                      )}
                                    </div>
                                    {category.description && (
                                      <div className="text-xs text-muted-foreground mt-0.5">{category.description}</div>
                                    )}
                                  </div>
                                </td>
                                {seminar.slabs.map((slab: any) => {
                                  const amount = category.fees?.[slab.id];
                                  return (
                                    <td key={slab.id} className="text-center py-3 px-2 border-r">
                                      {amount ? (
                                        <>
                                          <div className="font-bold text-primary text-sm">
                                            Rs {Number(amount).toLocaleString('en-IN')}
                                          </div>
                                          <div className="text-xs text-muted-foreground">(Incl. GST)</div>
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
                  )}

                  <div className="bg-accent/30 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="font-semibold mb-2">Note:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>All fees are in Indian Rupees (Rs)</li>
                      <li>Early registration recommended for best rates</li>
                      <li>Fees are non-refundable once paid</li>
                      <li>Group discounts may be available - contact us for details</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* What to Expect */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">What to Expect</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Expert Speakers</p>
                      <p className="text-sm text-muted-foreground">Learn from leading ophthalmologists</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">CME Credits</p>
                      <p className="text-sm text-muted-foreground">Earn continuing education points</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Networking</p>
                      <p className="text-sm text-muted-foreground">Connect with peers and experts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Latest Research</p>
                      <p className="text-sm text-muted-foreground">Stay updated with innovations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-xl font-bold mb-4">Registration Details</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Conference Dates</p>
                      <p className="font-bold text-lg text-primary">
                        {startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' - '}
                        {endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
          
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Period</p>
                      <p className="font-bold text-lg text-primary">
                        {regStartDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' - '}
                        {regEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                     
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Delegates</p>
                      <p className="font-semibold">500+ Participants</p>
                    </div>
                  </div>
                </div>

                {seminar.status !== 'previous' && seminar.is_active && seminar.online_registration_enabled === 1 ? (
                  <Link to={`/seminar/${seminar.id}/register`}>
                    <Button className="w-full gradient-primary text-primary-foreground" size="lg">
                      Register Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : seminar.status === 'previous' ? (
                  <Button disabled className="w-full" size="lg">
                    Event Completed
                  </Button>
                ) : seminar.online_registration_enabled === 0 ? (
                  <Button disabled className="w-full" size="lg">
                    Online Registration Disabled
                  </Button>
                ) : (
                  <Button disabled className="w-full" size="lg">
                    Registration Closed
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center mt-4">
                  {seminar.status === 'previous' 
                    ? 'This event has been completed' 
                    : 'Secure your spot today. Limited seats available!'}
                </p>
              </div>

              {/* Contact Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-lg font-bold mb-3">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about the conference? Our team is here to help.
                </p>
                <Link to="/contact">
                  <Button variant="outline" className="w-full">
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
