import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { AboutSection } from '@/components/home/AboutSection';
import { CommitteeSection } from '@/components/home/CommitteeSection';
import { UpcomingEventsCarousel } from '@/components/home/UpcomingEventsCarousel';
import { GallerySection } from '@/components/home/GallerySection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { ContactSection } from '@/components/home/ContactSection';
import { SeminarPopup } from '@/components/home/SeminarPopup';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <div className="animate-on-scroll">
        <StatsSection />
      </div>
      <div className="animate-on-scroll-left">
        <AboutSection />
      </div>
      <div className="animate-on-scroll-zoom">
        <CommitteeSection />
      </div>
      <div className="animate-on-scroll">
        <UpcomingEventsCarousel />
      </div>
      <div className="animate-on-scroll">
        <GallerySection />
      </div>
      <div className="animate-on-scroll-left">
        <TestimonialsSection />
      </div>
      <div className="animate-on-scroll">
        <ContactSection />
      </div>
      
      {/* Seminar Popup - Shows on page load if active seminar exists */}
      <SeminarPopup />
    </Layout>
  );
};

export default Index;
