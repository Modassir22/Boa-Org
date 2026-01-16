import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Dr. Rajesh Kumar',
      designation: 'Senior Ophthalmologist, Patna',
      content: 'BOA has been instrumental in keeping me updated with the latest advancements in ophthalmology. The seminars and workshops are world-class.',
      image: null
    },
    {
      name: 'Dr. Priya Singh',
      designation: 'Eye Surgeon, Muzaffarpur',
      content: 'Being a member of BOA has opened doors to networking with the best ophthalmologists in Bihar. The community support is exceptional.',
      image: null
    },
    {
      name: 'Dr. Anil Verma',
      designation: 'Consultant Ophthalmologist, Gaya',
      content: 'The CME programs organized by BOA are highly informative and practical. They have significantly enhanced my clinical practice.',
      image: null
    }
  ];

  return (
    <section className="gov-section-gray">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="gov-section-title">What Our Members Say</h2>
          <p className="gov-section-subtitle">
            Hear from ophthalmologists who are part of our growing community
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="gov-card p-6">
              <Quote className="h-10 w-10 mb-4" style={{color: '#E3F2FD'}} />
              <p className="mb-6 italic" style={{color: '#616E7C'}}>"{testimonial.content}"</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold text-white" style={{background: '#0B3C5D'}}>
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-medium" style={{color: '#1F2933'}}>{testimonial.name}</h4>
                  <p className="text-sm" style={{color: '#616E7C'}}>{testimonial.designation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
