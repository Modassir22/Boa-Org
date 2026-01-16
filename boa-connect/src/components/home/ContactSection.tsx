import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ContactSection() {
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Registered Office',
      content: 'Ved Vani, East Shivpuri, Chitkohara Bypass Road, Po-Anishabad, Patna - 800002, Bihar',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'info@oabihar.org',
      link: 'mailto:info@oabihar.org',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+91 XXX XXX XXXX',
      link: 'tel:+91XXXXXXXXXX',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Clock,
      title: 'Office Hours',
      content: 'Monday - Friday: 10:00 AM - 5:00 PM',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <section className="gov-section">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="gov-section-title">Get In Touch</h2>
          <p className="gov-section-subtitle">
            Have questions? We're here to help. Reach out to us through any of these channels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <div key={index} className="gov-card p-6 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{background: '#E3F2FD'}}>
                  <Icon className="h-7 w-7" style={{color: '#0B3C5D'}} />
                </div>
                <h3 className="font-medium mb-2" style={{color: '#1F2933'}}>{info.title}</h3>
                {info.link ? (
                  <a 
                    href={info.link} 
                    className="text-sm transition-colors hover:underline"
                    style={{color: '#616E7C'}}
                  >
                    {info.content}
                  </a>
                ) : (
                  <p className="text-sm" style={{color: '#616E7C'}}>{info.content}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
