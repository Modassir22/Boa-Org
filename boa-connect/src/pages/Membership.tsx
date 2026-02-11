import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Award,
  Users,
  BookOpen,
  Calendar,
  Network,
  FileText,
  CheckCircle,
  ArrowRight,
  Download,
  CreditCard,
  GraduationCap,
  Briefcase,
  Lock,
  LogIn
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';

export default function Membership() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadCategories();
    checkAuthentication();
    
    // Also reload when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCategories();
        checkAuthentication();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!(token && user));
  };

  const handleMembershipFormClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to apply for membership');
      navigate('/login', { state: { from: '/membership-form' } });
      return;
    }
    navigate('/membership-form');
    
    // Trigger form to open automatically
    setTimeout(() => {
      const event = new CustomEvent('openMembershipForm');
      window.dispatchEvent(event);
    }, 100);
  };

  const loadCategories = async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/api/membership-categories?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load membership categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadOfflineForm = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error('Please login to download the membership form');
      navigate('/login', { state: { from: '/membership' } });
      return;
    }

    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/api/generate-membership-pdf?t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get PDF blob
      const pdfBlob = await response.blob();

      // Create download link with timestamp
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BOA_Membership_Application_Form_${timestamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up with a small delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // Use setTimeout to avoid extension conflicts with toast
      setTimeout(() => {
        toast.success('Offline form downloaded successfully!');
      }, 200);
      
    } catch (error) {
      // Use setTimeout to avoid extension conflicts with toast
      setTimeout(() => {
        toast.error('Failed to download form. Please try again.');
      }, 100);
    }
  };

  const getIcon = (iconName: string) => {
    const icons: any = {
      'Briefcase': Briefcase,
      'CreditCard': CreditCard,
      'GraduationCap': GraduationCap
    };
    return icons[iconName] || Briefcase;
  };
  const benefits = [
    {
      icon: BookOpen,
      title: 'CME Programs',
      description: 'Access to all Continuing Medical Education programs and workshops',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Calendar,
      title: 'Conference Access',
      description: 'Discounted registration for annual conferences and seminars',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Network,
      title: 'Professional Network',
      description: 'Connect with ophthalmologists across Bihar and India',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: FileText,
      title: 'Publications',
      description: 'Free access to newsletters, journals, and research papers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Award,
      title: 'Recognition',
      description: 'Eligibility for BOA awards and recognition programs',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Professional guidance and peer support network',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Choose Membership',
      description: 'Select the membership category that suits you best'
    },
    {
      number: '2',
      title: 'Fill Application',
      description: 'Complete the online membership application form'
    },
    {
      number: '3',
      title: 'Make Payment',
      description: 'Pay membership fee via online payment or bank transfer'
    },
    {
      number: '4',
      title: 'Get Verified',
      description: 'Your application will be reviewed and approved'
    },
    {
      number: '5',
      title: 'Start Enjoying',
      description: 'Access all member benefits and join the BOA family'
    }
  ];

  const faqs = [
    {
      question: 'Who can become a member of BOA?',
      answer: 'A person holding certificate of Diploma in Para-Ophthalmology/Diploma in Ophthalmic Assistant/Bachelor of Ophthalmic Technology or any higher degree course in Ophthalmic science from government, Semi government or non government college/institute recognized by the law of government and fit for recruitment at post of ophthalmic Assistant. To get membership of Association, they have to submit a full filled form.'
    },
    {
      question: 'How long does the approval process take?',
      answer: 'Membership applications are typically reviewed and approved within 7-10 working days after payment verification.'
    },
    {
      question: 'Can I upgrade from Annual to Life Membership?',
      answer: 'Yes, you can upgrade anytime by paying the difference amount. Your previous payments will be adjusted.'
    },
    {
      question: 'What documents are required?',
      answer: 'You need to submit your original certificate photocopy, qualification certificates, and a recent passport-size photograph.'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="gradient-hero py-16">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary backdrop-blur-sm text-primary-foreground text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            Join Members
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Become a Life Member
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Join Bihar's premier ophthalmic association and advance your career while serving the community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground"
              onClick={handleMembershipFormClick}
            >
              {!isAuthenticated && <LogIn className="mr-2 h-5 w-5" />}
              {isAuthenticated ? 'Apply Online' : 'Login to Apply'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleDownloadOfflineForm}
            >
              {!isAuthenticated && <Lock className="mr-2 h-5 w-5" />}
              <Download className="mr-2 h-5 w-5" />
              {isAuthenticated ? 'Download Form' : 'Login to Download'}
            </Button>
          </div>
        </div>
      </section>

      {/* Membership Benefits */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Membership Benefits</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enjoy exclusive benefits and opportunities as a BOA member
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 ${benefit.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`h-7 w-7 ${benefit.color}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Membership Categories */}
      <section className="py-16 bg-muted/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Membership Details</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the membership plan that best fits your needs
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-6 py-4 text-left text-gray-800 font-bold border-r-2 border-gray-300">Type</th>
                      <th className="px-6 py-4 text-left text-gray-800 font-bold border-r-2 border-gray-300">Passout Fee</th>
                      <th className="px-6 py-4 text-left text-gray-800 font-bold">Student Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => (
                      <tr
                        key={index}
                        className="border-t-2 border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 border-r-2 border-gray-300">
                          {category.title}
                        </td>
                        <td className="px-6 py-4 text-gray-900 border-r-2 border-gray-300">
                          <span className="font-bold">₹{category.price.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          <span className="font-bold">
                            {category.student_price && parseFloat(category.student_price) > 0 
                              ? `₹${parseFloat(category.student_price).toLocaleString()}` 
                              : 'N/A'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 italic">
                  * Offer: Pay membership fees with conference registration or before the conference
                </p>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* How to Apply */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How to Apply</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple 5-step process to become a BOA member
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block"></div>

              <div className="space-y-8">
                {steps.map((step, index) => (
                  <div key={index} className="relative flex gap-6 items-start">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg z-10">
                      {step.number}
                    </div>
                    <div className="flex-1 bg-card rounded-xl p-6 shadow-md border border-border">
                      <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="gradient-primary text-primary-foreground"
              onClick={handleMembershipFormClick}
            >
              {!isAuthenticated && <LogIn className="mr-2 h-5 w-5" />}
              {isAuthenticated ? 'Start Your Application' : 'Login to Apply'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-muted/20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Common questions about BOA membership
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Link to="/contact">
              <Button variant="outline">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
