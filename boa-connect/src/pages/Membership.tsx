import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
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
  Briefcase
} from 'lucide-react';

export default function Membership() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offlineFormHtml, setOfflineFormHtml] = useState('');

  useEffect(() => {
    loadCategories();
    loadOfflineForm();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/membership-categories');
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

  const loadOfflineForm = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/offline-forms-config');
      const data = await response.json();
      if (data.success && data.config) {
        setOfflineFormHtml(data.config.membership_form_html || '');
      }
    } catch (error) {
      console.error('Failed to load offline form:', error);
    }
  };

  const handleDownloadOfflineForm = () => {
    if (!offlineFormHtml) {
      alert('Offline form is not available at the moment. Please try again later.');
      return;
    }

    // Create a complete HTML document
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOA Membership Application Form</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        @media print {
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    ${offlineFormHtml}
</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BOA_Membership_Application_Form.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
      answer: 'Any qualified ophthalmologist registered with Medical Council of India or ophthalmology residents can apply for BOA membership.'
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
      answer: 'You need to submit your medical registration certificate, qualification certificates, and a recent passport-size photograph.'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="gradient-hero py-16">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-primary-foreground text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            Join 500+ Members
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Become a BOA Member
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Join Bihar's premier ophthalmology association and advance your career while serving the community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-primary text-primary-foreground"
              onClick={() => navigate('/membership-form')}
            >
              Apply Online
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleDownloadOfflineForm}>
              <Download className="mr-2 h-5 w-5" />
              Download Offline Form
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
            <h2 className="text-3xl font-bold mb-4">Membership Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the membership plan that best fits your needs
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {categories.map((category, index) => {
                const Icon = getIcon(category.icon);
                return (
                  <Card 
                    key={index} 
                    className={`relative ${category.is_recommended ? 'border-2 border-primary shadow-xl' : 'border shadow-lg'}`}
                  >
                    {category.is_recommended && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                          Recommended
                        </span>
                      </div>
                    )}
                    <CardContent className="p-8">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
                          <Icon className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                        <div className="text-3xl font-bold text-primary mb-1">₹{category.price.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">{category.duration}</p>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {category.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link to="/membership-form">
                        <Button 
                          className={`w-full ${category.is_recommended ? 'gradient-primary text-primary-foreground' : ''}`}
                          variant={category.is_recommended ? 'default' : 'outline'}
                        >
                          Choose Plan
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
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
            <Link to="/membership-form">
              <Button size="lg" className="gradient-primary text-primary-foreground">
                Start Your Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
