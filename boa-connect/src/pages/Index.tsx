import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { AboutSection } from '@/components/home/AboutSection';
import { CommitteeSection } from '@/components/home/CommitteeSection';
import { UpcomingEventsCarousel } from '@/components/home/UpcomingEventsCarousel';
import { NewsGallerySection } from '@/components/home/NewsGallerySection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { SeminarPopup } from '@/components/home/SeminarPopup';

const Index = () => {
  return (
    <Layout>
      <div className="page-enter mt-12">
        <HeroSection />
        <div className="section-enter animate-delay-100 px-4 sm:px-6 lg:px-10">
          <AboutSection />
        </div>
        <hr />
        <div className="section-enter animate-delay-300 px-4 sm:px-6 lg:px-10">
          <UpcomingEventsCarousel />
        </div>
        <div className="section-enter px-4 sm:px-6 lg:px-10">
          <NewsGallerySection />
        </div>
        <div className="section-enter animate-delay-200 px-4 sm:px-6 lg:px-10">
          <CommitteeSection />
        </div>
        <div className="section-enter px-4 sm:px-6 lg:px-10">
          <TestimonialsSection />
        </div>
        
        {/* Seminar Popup - Shows on page load if active seminar exists */}
        <SeminarPopup />
      </div>
    </Layout>
  );
};

export default Index;
