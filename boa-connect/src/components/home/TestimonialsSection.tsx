import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Testimonial {
  id: number;
  name: string;
  designation: string;
  organization: string;
  image_url: string;
  testimonial: string;
  rating: number;
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/testimonials');
      const data = await response.json();
      if (data.success) {
        setTestimonials(data.testimonials || []);
      }
    } catch (error) {
      console.error('Failed to load testimonials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="gov-section-gray">
        <div className="container">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className="gov-section-gray">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="gov-section-title p-2 bg-[#0B3C5D] text-white">What Our Members Say</h2>
          <p className="gov-section-subtitle">
            Hear from ophthalmologists who are part of our growing community
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="gov-card p-6">
              <Quote className="h-10 w-10 mb-4" style={{color: '#E3F2FD'}} />
              <p className="mb-6 italic" style={{color: '#616E7C'}}>"{testimonial.testimonial}"</p>
              
              {/* Rating Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {testimonial.image_url ? (
                  <img 
                    src={testimonial.image_url} 
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold text-white" style={{background: '#0B3C5D'}}>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div>
                  <h4 className="font-medium" style={{color: '#1F2933'}}>{testimonial.name}</h4>
                  <p className="text-sm" style={{color: '#616E7C'}}>
                    {testimonial.designation}
                    {testimonial.organization && `, ${testimonial.organization}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

