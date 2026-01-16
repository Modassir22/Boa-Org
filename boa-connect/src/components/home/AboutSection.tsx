import { Link } from 'react-router-dom';
import { ArrowRight, Award, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AboutSection() {
  return (
    <section className="gov-section">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div className="gov-badge">
              <Award className="h-4 w-4 mr-2 inline" />
              Established 1975
            </div>
            
            <h2 className="gov-section-title">
              About Ophthalmic Association of Bihar
            </h2>
            
            <p className="text-lg leading-relaxed" style={{color: '#616E7C'}}>
              The Ophthalmic Association of Bihar (BOA) stands as a premier professional organization dedicated to advancing the field of ophthalmology and eye care across Bihar state. Registered under the Societies Registration Act 21, 1860, we have been serving the ophthalmology community for decades.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="gov-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded flex-shrink-0" style={{background: '#E3F2FD'}}>
                    <Target className="h-5 w-5" style={{color: '#0B3C5D'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#1F2933'}}>Our Mission</h3>
                    <p className="text-sm" style={{color: '#616E7C'}}>Advancing eye care excellence through education and research</p>
                  </div>
                </div>
              </div>
              
              <div className="gov-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded flex-shrink-0" style={{background: '#E8F5E9'}}>
                    <Users className="h-5 w-5" style={{color: '#2E7D32'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#1F2933'}}>Our Community</h3>
                    <p className="text-sm" style={{color: '#616E7C'}}>Connecting ophthalmologists across Bihar</p>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/about">
              <button className="bg-white border-2 px-5 py-2.5 rounded font-medium hover:bg-gray-50 transition-colors" style={{color: '#0B3C5D', borderColor: '#0B3C5D'}}>
                Learn More About Us
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </Link>
          </div>

          {/* Image/Visual */}
          <div className="relative">
            <div className="aspect-[4/3] rounded overflow-hidden shadow-md border border-gray-200">
              <img 
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80" 
                alt="BOA Conference"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
