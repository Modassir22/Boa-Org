import { Award, Target, Eye, Users, Heart, Lightbulb, TrendingUp, Calendar, CheckCircle2, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

export default function About() {
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([]);
  const [certification, setCertification] = useState<any>(null);

  // Theme constants for consistency
  const theme = {
    primary: '#0F4C75',    // Deep Royal Blue
    secondary: '#3282B8',  // Teal Blue
    bgLight: '#F8F9FA',    // Medical White
    textDark: '#1B262C'    // Dark Slate
  };

  useEffect(() => {
    loadCommitteeMembers();
    loadCertification();
  }, []);

  const loadCommitteeMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/committee-members?page_type=about');
      const data = await response.json();
      if (data.success) {
        setCommitteeMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to load committee members:', error);
    }
  };

  const loadCertification = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/certification');
      const data = await response.json();
      if (data.success && data.certification) {
        setCertification(data.certification);
      }
    } catch (error) {
      console.error('Failed to load certification:', error);
    }
  };

  const values = [
    {
      icon: Eye,
      title: 'Excellence',
      description: 'Highest standards in clinical care',
      color: '#0F4C75',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Heart,
      title: 'Compassion',
      description: 'Serving with empathy and care',
      color: '#E94560',
      bgColor: 'bg-red-50'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Embracing modern eye technologies',
      color: '#D97706',
      bgColor: 'bg-amber-50'
    },
    {
      icon: Users,
      title: 'Unity',
      description: 'Stronger professional network',
      color: '#3282B8',
      bgColor: 'bg-cyan-50'
    }
  ];

  const milestones = [
    { year: '1975', event: 'BOA Founded', description: 'Establishment of Ophthalmic Association of Bihar' },
    { year: '1980', event: 'First Conference', description: 'Inaugural state-level ophthalmology meet' },
    { year: '1995', event: 'CME Launch', description: 'Started continuing medical education programs' },
    { year: '2000', event: 'Outreach', description: 'Initiated free eye screening camps' },
    { year: '2010', event: 'Digital Era', description: 'Launched online member portal' },
    { year: '2025', event: 'Golden Jubilee', description: 'Celebrating 50 years of service' }
  ];

  return (
    <Layout>
      {/* Hero Banner - Medical Professional Look */}
      <section className="relative py-20 overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, #0A2540 100%)` }}>
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="container text-center max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
            <Award className="h-4 w-4 text-[#3282B8]" />
            <span className="tracking-wide">ESTABLISHED 1975</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Vision for a <span style={{ color: theme.secondary }}>Better Bihar</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            The official body representing the ophthalmologists of Bihar. Dedicated to advancing eye care excellence, education, and ethical practice for over 50 years.
          </p>
        </div>
      </section>

      {/* Vision & Mission - Clean Cards with Top Borders */}
      <section className="py-16 -mt-10 relative z-20 px-4">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="border-0 shadow-xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="h-1 w-full" style={{ background: theme.primary }}></div>
              <CardContent className="p-8 bg-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-[#0F4C75] transition-colors duration-300">
                    <Target className="h-6 w-6 text-[#0F4C75] group-hover:text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Our Vision</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  To be the leading ophthalmology association in Eastern India, recognized for excellence in eye care education, research, and community service, ensuring accessible quality eye care for all citizens.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="h-1 w-full" style={{ background: theme.secondary }}></div>
              <CardContent className="p-8 bg-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-cyan-50 flex items-center justify-center group-hover:bg-[#3282B8] transition-colors duration-300">
                    <TrendingUp className="h-6 w-6 text-[#3282B8] group-hover:text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Our Mission</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  To advance the art and science of ophthalmology through continuous professional development, promote ethical practices, foster research, and eliminate preventable blindness in Bihar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
             {/* Left: Text Content */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 border-l-4 pl-4" style={{ borderColor: theme.secondary }}>
                Who We Are
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                The <strong style={{ color: theme.primary }}>Ophthalmic Association of Bihar (BOA)</strong> stands as a premier professional organization. As a registered society under the Societies Registration Act, BOA operates with full legal recognition to serve the medical community.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {[
                  "Professional Development (CME)",
                  "Community Outreach Camps",
                  "Scientific Research Support",
                  "Ethical Practice Advocacy"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: theme.secondary }} />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Values Grid */}
            <div className="grid grid-cols-2 gap-4">
               {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <div key={index} className={`p-6 rounded-2xl ${value.bgColor} border border-transparent hover:border-black/5 transition-all`}>
                      <Icon className="h-8 w-8 mb-3" style={{ color: value.color }} />
                      <h3 className="font-bold text-slate-800 mb-1">{value.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">{value.description}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline/Milestones - Clean Design */}
      <section className="py-20 bg-slate-50">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-sm font-bold tracking-widest uppercase text-slate-400">Our History</span>
            <h2 className="text-3xl font-bold mt-2 text-slate-800">50 Years of Excellence</h2>
          </div>

          <div className="relative">
            {/* Center Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-px bg-slate-200 hidden md:block"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  {/* Content Box */}
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow ${index % 2 === 0 && 'md:text-right'}`}>
                      <span className="text-2xl font-bold block mb-1" style={{ color: theme.secondary }}>{milestone.year}</span>
                      <h4 className="font-bold text-slate-800 text-lg mb-2">{milestone.event}</h4>
                      <p className="text-slate-500 text-sm">{milestone.description}</p>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className="relative flex items-center justify-center z-10">
                    <div className="h-4 w-4 rounded-full bg-white border-4" style={{ borderColor: theme.primary }}></div>
                  </div>

                  {/* Empty Space for Grid Balance */}
                  <div className="flex-1 hidden md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Official Recognition Certificate */}
      {certification && (
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="container max-w-4xl">
            <div className="bg-[#F8FBFF] rounded-3xl border border-blue-100 p-8 md:p-12 text-center relative overflow-hidden">
               {/* Decorative Background Icon */}
               <FileText className="absolute top-10 right-10 h-64 w-64 text-blue-50/50 -rotate-12 pointer-events-none" />
               
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white shadow-sm mb-6">
                  <Award className="h-8 w-8" style={{ color: theme.primary }} />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                  Government Registered Society
                </h2>
                <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
                  Officially recognized by the Government of Bihar under the Societies Registration Act 21, 1860.
                </p>

                <div className="grid md:grid-cols-2 gap-6 text-left bg-white rounded-xl p-6 shadow-sm border border-blue-100/50">
                   <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Registration No</p>
                      <p className="text-lg font-mono font-bold text-slate-700">{certification.registration_number}</p>
                   </div>
                   <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Registered Office</p>
                      <p className="text-sm font-medium text-slate-700">{certification.registered_office}</p>
                   </div>
                   {certification.certificate_image_url && (
                     <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100 text-center">
                        <a 
                          href={certification.certificate_image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline cursor-pointer font-medium inline-block"
                        >
                          View Original Certificate Document →
                        </a>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Executive Committee Grid */}
      {committeeMembers.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Executive Committee
              </h2>
              <div className="h-1 w-20 mx-auto rounded-full" style={{ background: theme.secondary }}></div>
            </div>
            
            <div className="flex justify-center">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-7xl">
                {committeeMembers.map((member) => (
                  <div key={member.id} className="flex flex-col items-center group">
                    <div className="relative mb-4">
                      {/* Image Container with Medical Border */}
                      <div className="h-28 w-28 rounded-full overflow-hidden border-4 bg-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg" style={{ borderColor: theme.secondary }}>
                        {member.image_url ? (
                          <img 
                            src={member.image_url} 
                            alt={member.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              // Show fallback
                              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar');
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                         {/* Fallback Avatar logic embedded */}
                        <div className={`fallback-avatar h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 ${member.image_url ? 'hidden' : ''}`}>
                             <span className="text-2xl font-bold" style={{ color: theme.primary }}>
                               {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                             </span>
                        </div>
                      </div>
                      
                      {/* Role Badge if available (Optional enhancement) */}
                      {/* <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-slate-200 whitespace-nowrap">
                         Member
                      </div> */}
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm text-center mb-1 group-hover:text-blue-700 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide text-center">
                      {member.profession}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
