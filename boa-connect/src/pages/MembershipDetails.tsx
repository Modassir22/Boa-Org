import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { userAPI } from '@/lib/api';
import { Download, Calendar, CreditCard, User, Mail, Phone, Award, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';

// Helper function to format title consistently
const formatTitle = (title: string) => {
  const titleMap: { [key: string]: string } = {
    'dr': 'Dr.',
    'mr': 'Mr.',
    'mrs': 'Mrs.',
    'ms': 'Ms.',
    'prof': 'Prof.'
  };
  return titleMap[title?.toLowerCase()] || title || '';
};

export default function MembershipDetails() {
  const { toast } = useToast();
  const [membershipData, setMembershipData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMembershipDetails();
    
    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadMembershipDetails();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadMembershipDetails = async () => {
    try {
      // Add cache-busting to ensure fresh data
      const response = await userAPI.getMembershipDetails();
      setMembershipData(response.membership);
    } catch (error: any) {
      console.error('Failed to load membership details:', error);
      // If no membership found, set to null
      setMembershipData(null);
      toast({
        title: 'Error',
        description: 'Failed to load membership details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  

  const generateMembershipCard = () => {
    if (!membershipData) return;

    const doc = new jsPDF();
    
    // Add logo at top center
    const logoUrl = '/favicon.ico'; // You can replace this with your actual logo URL
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    
    logoImg.onload = () => {
      // Add logo at top center (x: 95, y: 5, width: 20, height: 20)
      doc.addImage(logoImg, 'PNG', 95, 5, 20, 20);
      
      // Header with BOA branding (moved down to accommodate logo)
      doc.setFillColor(11, 60, 93); // #0B3C5D
      doc.rect(0, 30, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Ophthalmic Association Of Bihar', 105, 45, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Membership Certificate', 105, 55, { align: 'center' });
      doc.text('Ved Vani, East Shivpuri, Chitkohara Bypass Road, Po-Anishabad, Patna - 800002', 105, 62, { align: 'center' });
      
      // Membership Card Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('MEMBERSHIP CARD', 105, 80, { align: 'center' });
      
      // Member Details
      let y = 100;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      const memberDetails = [
        ['Membership Number:', membershipData.membership_no || 'Not Assigned'],
        ['Name:', `${formatTitle(membershipData.title)} ${membershipData.first_name} ${membershipData.surname}`],
        ['Email:', membershipData.email],
        ['Mobile:', membershipData.mobile],
        ['Membership Type:', membershipData.membership_type || 'Standard'],
        ['Payment Type:', membershipData.payment_type || 'N/A'],
        ['Status:', membershipData.status || 'Active'],
        ['Valid From:', membershipData.valid_from ? new Date(membershipData.valid_from).toLocaleDateString() : 'N/A'],
        ['Valid Until:', membershipData.valid_until ? new Date(membershipData.valid_until).toLocaleDateString() : 'Lifetime'],
        ['Registration Date:', new Date(membershipData.membership_created_at || membershipData.created_at).toLocaleDateString()]
      ];

      // Add payment information if available
      if (membershipData.payment_status) {
        memberDetails.push(['Payment Status:', membershipData.payment_status]);
        if (membershipData.amount) {
          memberDetails.push(['Amount Paid:', `₹${parseFloat(membershipData.amount).toLocaleString()}`]);
        }
        if (membershipData.transaction_id) {
          memberDetails.push(['Transaction ID:', membershipData.transaction_id]);
        }
        if (membershipData.payment_date) {
          memberDetails.push(['Payment Date:', new Date(membershipData.payment_date).toLocaleDateString()]);
        }
      }

      // Add qualification information if available
      if (membershipData.qualification) {
        memberDetails.push(['Qualification:', membershipData.qualification]);
      }
      if (membershipData.year_passing) {
        memberDetails.push(['Year of Passing:', membershipData.year_passing]);
      }
      if (membershipData.institution) {
        memberDetails.push(['Institution:', membershipData.institution]);
      }
      if (membershipData.working_place) {
        memberDetails.push(['Working Place:', membershipData.working_place]);
      }
      
      memberDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 70, y);
        y += 8;
      });
      
      // Benefits Section
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Membership Benefits:', 20, y);
      
      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const benefits = [
        '• Access to all BOA seminars and conferences',
        '• Discounted registration fees for events',
        '• CME credit points for professional development',
        '• Access to BOA digital library and resources',
        '• Networking opportunities with fellow ophthalmologists',
        '• Priority booking for workshops and training programs'
      ];
      
      benefits.forEach(benefit => {
        doc.text(benefit, 25, y);
        y += 6;
      });
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text('This is a computer-generated membership card. No signature required.', 105, pageHeight - 15, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, pageHeight - 10, { align: 'center' });
      
      // Save PDF
      doc.save(`BOA_Membership_Card_${membershipData.membership_no || 'Pending'}.pdf`);
      
      toast({
        title: 'Membership Card Downloaded',
        description: 'Your membership card has been saved as PDF',
      });
    };
    
    logoImg.onerror = () => {
      // If logo fails to load, generate PDF without logo
      generatePDFWithoutLogo();
    };
    
    logoImg.src = logoUrl;
  };

  const generatePDFWithoutLogo = () => {
    const doc = new jsPDF();
    
    // Header with BOA branding
    doc.setFillColor(11, 60, 93); // #0B3C5D
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Ophthalmic Association Of Bihar', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Membership Certificate', 105, 25, { align: 'center' });
    doc.text('Ved Vani, East Shivpuri, Chitkohara Bypass Road, Po-Anishabad, Patna - 800002', 105, 32, { align: 'center' });
    
    // Membership Card Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MEMBERSHIP CARD', 105, 55, { align: 'center' });
    
    // Member Details
    let y = 75;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const memberDetails = [
      ['Membership Number:', membershipData.membership_no || 'Not Assigned'],
      ['Name:', `${formatTitle(membershipData.title)} ${membershipData.first_name} ${membershipData.surname}`],
      ['Email:', membershipData.email],
      ['Mobile:', membershipData.mobile],
      ['Membership Type:', membershipData.membership_type || 'Standard'],
      ['Payment Type:', membershipData.payment_type || 'N/A'],
      ['Status:', membershipData.status || 'Active'],
      ['Valid From:', membershipData.valid_from ? new Date(membershipData.valid_from).toLocaleDateString() : 'N/A'],
      ['Valid Until:', membershipData.valid_until ? new Date(membershipData.valid_until).toLocaleDateString() : 'Lifetime'],
      ['Registration Date:', new Date(membershipData.membership_created_at || membershipData.created_at).toLocaleDateString()]
    ];

    // Add payment information if available
    if (membershipData.payment_status) {
      memberDetails.push(['Payment Status:', membershipData.payment_status]);
      if (membershipData.amount) {
        memberDetails.push(['Amount Paid:', `₹${parseFloat(membershipData.amount).toLocaleString()}`]);
      }
      if (membershipData.transaction_id) {
        memberDetails.push(['Transaction ID:', membershipData.transaction_id]);
      }
      if (membershipData.payment_date) {
        memberDetails.push(['Payment Date:', new Date(membershipData.payment_date).toLocaleDateString()]);
      }
    }

    // Add qualification information if available
    if (membershipData.qualification) {
      memberDetails.push(['Qualification:', membershipData.qualification]);
    }
    if (membershipData.year_passing) {
      memberDetails.push(['Year of Passing:', membershipData.year_passing]);
    }
    if (membershipData.institution) {
      memberDetails.push(['Institution:', membershipData.institution]);
    }
    if (membershipData.working_place) {
      memberDetails.push(['Working Place:', membershipData.working_place]);
    }
    
    memberDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 70, y);
      y += 8;
    });
    
    // Benefits Section
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Membership Benefits:', 20, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const benefits = [
      '• Access to all BOA seminars and conferences',
      '• Discounted registration fees for events',
      '• CME credit points for professional development',
      '• Access to BOA digital library and resources',
      '• Networking opportunities with fellow ophthalmologists',
      '• Priority booking for workshops and training programs'
    ];
    
    benefits.forEach(benefit => {
      doc.text(benefit, 25, y);
      y += 6;
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated membership card. No signature required.', 105, pageHeight - 15, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    doc.save(`BOA_Membership_Card_${membershipData.membership_no || 'Pending'}.pdf`);
    
    toast({
      title: 'Membership Card Downloaded',
      description: 'Your membership card has been saved as PDF',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!membershipData || !membershipData.membership_type) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Simple Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  My Membership
                </h1>
              </div>
            </div>

            {/* Clean No Membership State */}
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <h2 className="text-xl text-muted-foreground">
                  No Membership Available
                </h2>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Simple Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                My Membership
              </h1>
            </div>
          </div>

          <div className="space-y-8">
            {/* Main Membership Card */}
            <Card className="border shadow-sm">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Award className="mr-3 h-5 w-5" />
                    <span className="font-semibold">Membership Details</span>
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={generateMembershipCard}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Membership Number */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Membership Number</div>
                    <div className="text-2xl font-bold">
                      {membershipData.membership_no || (
                        <span className="text-orange-600">Pending Assignment</span>
                      )}
                    </div>
                    {membershipData.membership_no && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Official BOA Member ID
                      </div>
                    )}
                  </div>

                  {/* Personal Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Full Name</div>
                          <div className="font-semibold text-foreground">
                            {formatTitle(membershipData.title)} {membershipData.first_name} {membershipData.surname}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                          <div className="font-semibold text-foreground break-all">{membershipData.email}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Mobile</div>
                          <div className="font-semibold text-foreground">{membershipData.mobile}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Membership Type</div>
                          <div className="font-semibold text-foreground capitalize">
                            {membershipData.membership_type || 'Not Assigned'}
                          </div>
                        </div>
                      </div>

                      {membershipData.payment_type && (
                        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Payment Type</div>
                            <div className="font-semibold text-foreground capitalize">
                              {membershipData.payment_type}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Member Since</div>
                          <div className="font-semibold text-foreground">
                            {membershipData.membership_created_at ? 
                              new Date(membershipData.membership_created_at).toLocaleDateString() :
                              membershipData.created_at ? 
                                new Date(membershipData.created_at).toLocaleDateString() :
                                'N/A'
                            }
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                          <Badge className={`${
                            membershipData.status === 'active' ? 'bg-green-100 text-green-800' :
                            membershipData.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            !membershipData.status ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {membershipData.status === 'active' ? 'Active' : 
                             membershipData.status === 'inactive' ? 'Inactive' : 
                             !membershipData.status ? 'No Active Plan' :
                             'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validity - Only show if there's an active membership registration */}
                  {membershipData.status && (membershipData.valid_from || membershipData.valid_until) && (
                    <div className="p-4 bg-accent/30 rounded-lg">
                      <h3 className="font-semibold mb-2">Membership Validity</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valid From:</span>
                          <span className="ml-2 font-medium">
                            {membershipData.valid_from ? new Date(membershipData.valid_from).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valid Until:</span>
                          <span className="ml-2 font-medium">
                            {membershipData.valid_until ? new Date(membershipData.valid_until).toLocaleDateString() : 'Lifetime'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}