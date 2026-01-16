import { Link } from 'react-router-dom';
import { Eye, Mail, Phone, MapPin, Users, Calendar, FileText, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function Footer() {
  const [contactInfo, setContactInfo] = useState<any>(null);

  // Medical Theme Colors
  const theme = {
    primary: '#0F4C75',      // Deep Royal Blue
    secondary: '#3282B8',    // Medical Teal
    accent: '#E94560',       // Alert Red
    light: '#F8F9FA',        // Medical White
    text: '#1B262C'          // Dark Slate
  };

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const response = await api.get('/contact-info');
      if (response.data.success && response.data.contactInfo) {
        setContactInfo(response.data.contactInfo);
      }
    } catch (error) {
      console.error('Failed to load contact info:', error);
    }
  };

  return (
    <footer 
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.primary} 0%, #0A2540 50%, ${theme.primary} 100%)`,
        borderTop: `4px solid ${theme.secondary}`
      }}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container py-16 relative z-10">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Brand & Description */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div 
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg group-hover:scale-105 transition-all duration-300"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Eye className="h-7 w-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white tracking-tight leading-tight">BOA</span>
                <span className="text-sm font-medium tracking-wider" style={{ color: theme.secondary }}>
                  {contactInfo?.organization_name || 'Bihar Ophthalmic Association'}
                </span>
              </div>
            </Link>
            
            <p className="text-white/80 leading-relaxed max-w-md">
              Advancing ophthalmology excellence in Bihar since 1975. Serving eye care professionals and communities through education, research, and outreach.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1 text-white/70">
                <Shield className="h-3 w-3" />
                Registered Society
              </span>
              <span className="flex items-center gap-1 text-white/70">
                <Users className="h-3 w-3" />
                266+ Members
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg text-white mb-6 flex items-center gap-2 pb-2" 
                style={{ borderBottom: `2px solid ${theme.secondary}` }}>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/seminars', label: 'Upcoming Events', icon: Calendar },
                { to: '/about', label: 'About BOA', icon: Users },
                { to: '/membership', label: 'Membership', icon: Shield },
                { to: '/gallery', label: 'Gallery', icon: Eye }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <li key={idx}>
                    <Link 
                      to={item.to}
                      className="group flex items-center gap-3 text-white/80 hover:text-white transition-all duration-200 p-2 -m-2 rounded-lg hover:bg-white/10"
                    >
                      <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-lg text-white mb-6 flex items-center gap-2 pb-2" 
                style={{ borderBottom: `2px solid ${theme.secondary}` }}>
              Resources
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/dashboard', label: 'Member Portal', icon: Users },
                { to: '/resources', label: 'Downloads', icon: FileText },
                { to: '/notifications', label: 'Notices', icon: Eye }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <li key={idx}>
                    <Link 
                      to={item.to}
                      className="group flex items-center gap-3 text-white/80 hover:text-white transition-all duration-200 p-2 -m-2 rounded-lg hover:bg-white/10"
                    >
                      <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-bold text-lg text-white mb-6 flex items-center gap-2 pb-2" 
                style={{ borderBottom: `2px solid ${theme.secondary}` }}>
              Contact Info
            </h4>
            
            <div className="space-y-4">
              {/* Address */}
              <div className="flex items-start gap-3 text-white/80 group hover:text-white transition-colors">
                <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-white/10">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="text-sm leading-relaxed">
                  {contactInfo ? (
                    <>
                      {contactInfo.address && (
                        <>
                          {contactInfo.address}<br />
                        </>
                      )}
                      {contactInfo.city}, {contactInfo.state} {contactInfo.pin_code}
                    </>
                  ) : (
                    'Ved Vani, East Shivpuri<br />Chitkohara Bypass Road, Patna<br />Bihar 800002'
                  )}
                </div>
              </div>

              {/* Phone */}
              <Link 
                to="tel:+916121234567"
                className="flex items-center gap-3 text-white/80 hover:text-white transition-all duration-200 p-2 -m-2 rounded-lg hover:bg-white/10"
              >
                <div className="p-1.5 rounded-lg bg-white/10">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{contactInfo?.mobile || '+91 612 123 4567'}</span>
              </Link>

              {/* Email */}
              <Link 
                to={`mailto:${contactInfo?.email || 'info@boa.org.in'}`}
                className="flex items-center gap-3 text-white/80 hover:text-white transition-all duration-200 p-2 -m-2 rounded-lg hover:bg-white/10"
              >
                <div className="p-1.5 rounded-lg bg-white/10">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium break-all">{contactInfo?.email || 'info@boa.org.in'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8 flex flex-col lg:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-white/60 text-center lg:text-left">
            © {new Date().getFullYear()} {' '}
            <span className="font-semibold text-white">{contactInfo?.organization_name || 'Bihar Ophthalmic Association'}</span>
            . All rights reserved. | Reg. No: S000403
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center lg:justify-end">
            <Link 
              to="/privacy-policy" 
              className="text-white/60 hover:text-white transition-colors font-medium hover:underline"
              style={{ textDecorationThickness: '1px' }}
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms-of-service" 
              className="text-white/60 hover:text-white transition-colors font-medium hover:underline"
              style={{ textDecorationThickness: '1px' }}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
