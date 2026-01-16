import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Clock, 
  Award, 
  Users,
  CheckCircle,
  Download,
  ArrowRight,
  Video,
  BookOpen
} from 'lucide-react';

export default function CMEPrograms() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingPrograms = [
    {
      title: 'Advanced Cataract Surgery Techniques',
      date: '2026-02-15',
      time: '9:00 AM - 5:00 PM',
      venue: 'PMCH Auditorium, Patna',
      credits: 5,
      faculty: 'Dr. Rajesh Kumar, Dr. Priya Singh',
      seats: 50,
      registered: 32,
      mode: 'In-person',
      topics: ['Phacoemulsification', 'IOL Selection', 'Complications Management'],
      fee: '₹2,000 (Members) / ₹3,000 (Non-members)'
    },
    {
      title: 'Retinal Disorders: Diagnosis & Management',
      date: '2026-03-10',
      time: '10:00 AM - 4:00 PM',
      venue: 'Online Webinar',
      credits: 4,
      faculty: 'Dr. Anil Verma, Dr. Sunita Sharma',
      seats: 100,
      registered: 67,
      mode: 'Online',
      topics: ['Diabetic Retinopathy', 'AMD', 'Retinal Detachment'],
      fee: '₹1,000 (Members) / ₹1,500 (Non-members)'
    },
    {
      title: 'Pediatric Ophthalmology Workshop',
      date: '2026-03-25',
      time: '9:00 AM - 3:00 PM',
      venue: 'Nalanda Medical College, Bihar Sharif',
      credits: 3,
      faculty: 'Dr. Meera Gupta',
      seats: 40,
      registered: 18,
      mode: 'In-person',
      topics: ['Amblyopia', 'Strabismus', 'Pediatric Cataract'],
      fee: '₹1,500 (Members) / ₹2,500 (Non-members)'
    }
  ];

  const pastPrograms = [
    {
      title: 'Glaucoma Management Update 2025',
      date: '2025-12-20',
      venue: 'IGIMS, Patna',
      credits: 4,
      attendees: 85,
      certificate: true
    },
    {
      title: 'Corneal Transplantation Techniques',
      date: '2025-11-15',
      venue: 'AIIMS Patna',
      credits: 5,
      attendees: 62,
      certificate: true
    },
    {
      title: 'Oculoplasty Essentials',
      date: '2025-10-08',
      venue: 'Online Webinar',
      credits: 3,
      attendees: 124,
      certificate: true
    }
  ];

  const benefits = [
    'Earn CME credits recognized by Medical Council of India',
    'Learn from renowned national and international faculty',
    'Hands-on training and live demonstrations',
    'Networking opportunities with peers',
    'Certificate of participation',
    'Access to presentation materials'
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="gradient-hero py-16">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-primary-foreground text-sm font-medium mb-4">
            <GraduationCap className="h-4 w-4" />
            Continuing Medical Education
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            CME Programs
          </h1>
          <p className="text-lg text-muted-foreground">
            Enhance your knowledge and skills with our certified CME programs
          </p>
        </div>
      </section>

      {/* CME Info Cards */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Award className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">50+</h3>
                <p className="text-muted-foreground">CME Programs Conducted</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">2000+</h3>
                <p className="text-muted-foreground">Participants Trained</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">MCI</h3>
                <p className="text-muted-foreground">Recognized Credits</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-6 bg-muted/20 sticky top-16 z-10 border-b">
        <div className="container">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-8 py-3 rounded-full font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              }`}
            >
              Upcoming Programs
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-8 py-3 rounded-full font-medium transition-colors ${
                activeTab === 'past'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              }`}
            >
              Past Programs
            </button>
          </div>
        </div>
      </section>

      {/* Upcoming Programs */}
      {activeTab === 'upcoming' && (
        <section className="py-16 bg-background">
          <div className="container max-w-5xl">
            <div className="space-y-6">
              {upcomingPrograms.map((program, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left: Program Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">
                              {program.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-primary/10 text-primary border-0">
                                <Award className="h-3 w-3 mr-1" />
                                {program.credits} CME Credits
                              </Badge>
                              <Badge className={`border-0 ${
                                program.mode === 'Online' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {program.mode === 'Online' ? (
                                  <Video className="h-3 w-3 mr-1" />
                                ) : (
                                  <MapPin className="h-3 w-3 mr-1" />
                                )}
                                {program.mode}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{new Date(program.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{program.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{program.venue}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 text-primary" />
                            <span>Faculty: {program.faculty}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-semibold text-foreground mb-2">Topics Covered:</p>
                          <div className="flex flex-wrap gap-2">
                            {program.topics.map((topic, idx) => (
                              <span key={idx} className="text-xs bg-accent px-3 py-1 rounded-full">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Registration Fee</p>
                            <p className="font-semibold text-foreground">{program.fee}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {program.registered}/{program.seats} Registered
                            </p>
                            <div className="w-32 h-2 bg-muted rounded-full mt-1">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${(program.registered / program.seats) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <div className="flex flex-col justify-center gap-3 lg:w-48">
                        <Button className="w-full gradient-primary text-primary-foreground">
                          Register Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          Brochure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Past Programs */}
      {activeTab === 'past' && (
        <section className="py-16 bg-background">
          <div className="container max-w-5xl">
            <div className="grid md:grid-cols-2 gap-6">
              {pastPrograms.map((program, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {program.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{new Date(program.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{program.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{program.attendees} Attendees</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="h-4 w-4 text-primary" />
                        <span>{program.credits} CME Credits</span>
                      </div>
                    </div>

                    {program.certificate && (
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Certificate
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-16 bg-muted/20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Attend Our CME Programs?</h2>
            <p className="text-muted-foreground">
              Benefits of participating in BOA CME programs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-background rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container text-center max-w-2xl mx-auto">
          <BookOpen className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Want to Organize a CME Program?</h2>
          <p className="text-muted-foreground mb-8">
            BOA supports members in organizing CME programs. Contact us to discuss your proposal.
          </p>
          <Button size="lg" className="gradient-primary text-primary-foreground">
            Submit Proposal
          </Button>
        </div>
      </section>
    </Layout>
  );
}
