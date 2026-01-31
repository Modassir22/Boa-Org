import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/utils';

export default function Contact() {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.firstName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your first name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your last name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.subject.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a subject',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your message',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        });
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to send message',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">Contact Us</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 lg:p-8 shadow-card">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="firstName" className="text-xs sm:text-sm">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John" 
                      value={formData.firstName}
                      onChange={handleChange}
                      required 
                      disabled={isLoading}
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="lastName" className="text-xs sm:text-sm">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe" 
                      value={formData.lastName}
                      onChange={handleChange}
                      required 
                      disabled={isLoading}
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    disabled={isLoading}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="phone" className="text-xs sm:text-sm">Phone (Optional)</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+91 XXXXX XXXXX" 
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="subject" className="text-xs sm:text-sm">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="How can we help?" 
                    value={formData.subject}
                    onChange={handleChange}
                    required 
                    disabled={isLoading}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="message" className="text-xs sm:text-sm">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Your message..." 
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    required 
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-primary-foreground text-sm sm:text-base h-10 sm:h-11" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">Get in touch</h2>
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">Registered Office</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                        {contactInfo ? (
                          <>
                            {contactInfo.address}<br />
                            {contactInfo.city}, {contactInfo.state} - {contactInfo.pin_code}<br />
                            India
                          </>
                        ) : (
                          <>
                            Ved Vani, East Shivpuri<br />
                            Chitkohara Bypass Road<br />
                            Po-Anishabad, Patna - 800002<br />
                            Bihar, India
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl gradient-gold flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">Phone</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        {contactInfo?.mobile || '+91-XXXX-XXXXXX'}
                        {contactInfo?.phone && (
                          <>
                            <br />
                            {contactInfo.phone}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">Email</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        {contactInfo?.email || 'info@boabihar.org'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-muted rounded-2xl p-4 sm:p-6">
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Office Hours</h3>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="text-foreground">10:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="text-foreground">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="text-foreground">Closed</span>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="bg-muted rounded-2xl overflow-hidden border border-border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3597.726!2d85.1376!3d25.6093!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDM2JzMzLjUiTiA4NcKwMDgnMTUuNCJF!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="180"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="BOA Office Location - Patna"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
