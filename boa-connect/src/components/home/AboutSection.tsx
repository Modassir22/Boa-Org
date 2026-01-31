import { Link } from 'react-router-dom';
import { ArrowRight, Award, Users, Target, Eye, Stethoscope, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AboutSection() {
  return (
    <section className="gov-section bg-gradient-to-br from-[#EBF4F6] via-white to-[#7AB2B2]/20">
      <div className="container px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="gov-badge inline-flex">
              <Award className="h-4 w-4 mr-2 inline" />
              Established 2021
            </div>
            
            <h2 className="gov-section-title text-2xl sm:text-3xl text-black lg:text-4xl">
              About <span className="text-black">Ophthalmic Association</span> of Bihar
            </h2>
            
            <p className="text-base sm:text-lg leading-relaxed text-gray-600">
              The Ophthalmic Association of Bihar (BOA) stands as a premier professional organization dedicated to advancing the field of ophthalmic care and eye care across Bihar state. Registered under the Societies Registration Act 21, 1860, we have been serving the ophthalmic community for decades.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="gov-card p-4 hover:shadow-md transition-shadow duration-300 border-l-4 border-[#09637E]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#09637E]/10 flex-shrink-0">
                    <Target className="h-5 w-5 text-[#09637E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-base text-gray-900">Our Mission</h3>
                    <p className="text-sm text-gray-600">Advancing eye care excellence through education and research</p>
                  </div>
                </div>
              </div>
              
              <div className="gov-card p-4 hover:shadow-md transition-shadow duration-300 border-l-4 border-[#088395]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#088395]/10 flex-shrink-0">
                    <Users className="h-5 w-5 text-[#088395]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-base text-gray-900">Our Community</h3>
                    <p className="text-sm text-gray-600">Connecting ophthalmologists across Bihar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="h-4 w-4 text-[#09637E]" />
                <span>Eye Care Excellence</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Stethoscope className="h-4 w-4 text-[#088395]" />
                <span>Medical Research</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="h-4 w-4 text-[#7AB2B2]" />
                <span>Continuous Education</span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-start">
              <Link to="/about">
                <Button className="bg-[#09637E] hover:bg-[#088395] text-white px-6 py-3 text-base">
                  Learn More About Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Simple Image Section */}
          <div className="relative mt-8 lg:mt-0">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <img 
                src="https://img.freepik.com/premium-photo/slit-lamp-examination-biomicroscopy-anterior-eye-segment_926199-2157852.jpg" 
                alt="Eye examination equipment and ophthalmology tools for comprehensive eye care"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
