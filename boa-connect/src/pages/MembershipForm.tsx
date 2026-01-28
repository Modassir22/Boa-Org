import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Send } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { razorpayService } from '@/lib/razorpay';

export default function MembershipForm() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    qualification: '',
    year_passing: '',
    dob: '',
    institution: '',
    working_place: '',
    sex: '',
    age: '',
    address: '',
    mobile: '',
    email: '',
    membership_type: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`http://localhost:5000/api/membership-categories?t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load membership categories:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadOfflineForm = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Header with BOA branding
    doc.setFillColor(11, 60, 93); // BOA Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MEMBERSHIP FORM', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('OPHTHALMIC ASSOCIATION OF BIHAR', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('(Reg.no.-S00403/21-22)', pageWidth / 2, 32, { align: 'center' });

    let yPos = 55;
    doc.setTextColor(0, 0, 0);

    // Contact Information
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Shivpuri Road, Anishabad, Patna 800002', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('Email: biharophthalmic2022@gmail.com', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('Contact: 9334332714 / 7903220742 / 9572212739', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Form Fields
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    // Name field
    doc.text('NAME:', margin, yPos);
    doc.line(margin + 20, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Father's/Husband's name
    doc.text("FATHER'S/HUSBAND NAME:", margin, yPos);
    doc.line(margin + 50, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Academic Qualification
    doc.text('ACADEMIC QUALIFICATION:', margin, yPos);
    doc.line(margin + 50, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Two column fields
    const midPoint = pageWidth / 2;
    
    // Year of Passing and DOB
    doc.text('YEAR OF PASSING:', margin, yPos);
    doc.line(margin + 35, yPos, midPoint - 5, yPos);
    doc.text('DOB:', midPoint + 5, yPos);
    doc.line(midPoint + 15, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Institution
    doc.text('NAME OF INSTITUTION:', margin, yPos);
    doc.line(margin + 45, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Working Place
    doc.text('WORKING PLACE:', margin, yPos);
    doc.line(margin + 35, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Sex and Age
    doc.text('SEX:', margin, yPos);
    doc.line(margin + 15, yPos, midPoint - 5, yPos);
    doc.text('AGE:', midPoint + 5, yPos);
    doc.line(midPoint + 15, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Address (3 lines)
    doc.text('ADDRESS:', margin, yPos);
    doc.line(margin + 25, yPos, pageWidth - margin, yPos);
    yPos += 8;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Mobile and Email
    doc.text('MOBILE:', margin, yPos);
    doc.line(margin + 20, yPos, midPoint - 5, yPos);
    doc.text('EMAIL:', midPoint + 5, yPos);
    doc.line(midPoint + 15, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // Self Declaration Box
    doc.setFillColor(249, 249, 249);
    doc.rect(margin, yPos, contentWidth, 35, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, yPos, contentWidth, 35);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SELF DECLARATION', pageWidth / 2, yPos + 8, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const declarationText = [
      'I Smt/Sri/Kumari _________________________ Son/Daughter/wife of Mr. _________________________',
      'Age _______ Sex _______ Do hereby declare that, the information given above and enclosed documents',
      'are true to the best of my knowledge and belief. I am well aware of the fact that if the information',
      'given by me is proved false/not true, I will be liable for action as per the law of association.',
      'I also declare that after getting membership of association I will never violate the rule & regulation',
      'of association and will always try my best for getting the objectives/goal of association.'
    ];

    let textY = yPos + 15;
    declarationText.forEach(line => {
      doc.text(line, margin + 2, textY);
      textY += 4;
    });

    yPos += 45;

    // Signature section
    doc.text('PLACE: ________________________', margin, yPos);
    doc.text('SIGNATURE: ________________________', pageWidth - margin - 60, yPos);
    yPos += 8;
    doc.text('DATE: ________________________', margin, yPos);
    yPos += 15;

    // Enclosures
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Enclosures:', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const enclosures = [
      '1. Self attested copy of marksheet of diploma in ophthalmic assistant/para ophthalmology',
      '   Or bachelor in ophthalmic technology/technique, for student ID card',
      '2. Two passport size colour photo',
      '3. Self attested copy of AADHAR'
    ];

    enclosures.forEach(item => {
      doc.text(item, margin, yPos);
      yPos += 5;
    });

    yPos += 5;

    // Payment Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTE - FOR ANY PAYMENT:', margin, yPos);
    yPos += 6;
    doc.text('A/C NO (current): 40983059661', margin, yPos);
    yPos += 5;
    doc.text('IFSC CODE: SBIN0000152', margin, yPos);
    yPos += 5;
    doc.text('OPHTHALMIC ASSOCIATION OF BIHAR (SBI MAIN BRANCH GANDHI MAIDAN PATNA)', margin, yPos);
    yPos += 10;

    // Fee Structure
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('MEMBERSHIP FEES:', margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Generate dynamic fee structure from categories
    const studentCategories = categories.filter(cat => cat.category === 'student_fee');
    const passoutCategories = categories.filter(cat => cat.category === 'passout_fee');
    
    const feeStructure = [];
    
    if (studentCategories.length > 0) {
      const studentFees = studentCategories.map(cat => 
        `Rs ${parseFloat(cat.price).toLocaleString()}/${cat.duration.toLowerCase()}`
      ).join(' or ');
      feeStructure.push(`1. For student: ${studentFees}`);
    }
    
    if (passoutCategories.length > 0) {
      const passoutFees = passoutCategories.map(cat => 
        `Rs ${parseFloat(cat.price).toLocaleString()}/${cat.duration.toLowerCase()}`
      ).join(' or ');
      feeStructure.push(`2. For passout/professionals: ${passoutFees}`);
    }

    feeStructure.forEach(item => {
      doc.text(item, margin, yPos);
      yPos += 5;
    });

    // Footer
    doc.setFillColor(11, 60, 93);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Bihar Ophthalmic Association | www.boabihar.org | Email: biharophthalmic2022@gmail.com', pageWidth / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });

    // Save the PDF
    doc.save('BOA_Membership_Form_Offline.pdf');
    toast.success('Offline form downloaded as PDF successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membership_type) {
      toast.error('Please select a membership type');
      return;
    }

    const requiredFields = ['name', 'father_name', 'qualification', 'year_passing', 'dob', 'institution', 'working_place', 'sex', 'age', 'address', 'mobile', 'email'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      // Create dynamic amount map from categories
      const amountMap: Record<string, number> = {
        'test': 1
      };
      
      // Add dynamic amounts from categories
      categories.forEach(cat => {
        const key = cat.title.toLowerCase().replace(/\s+/g, '_');
        amountMap[key] = parseFloat(cat.price);
      });

      const amount = amountMap[formData.membership_type] || 0;

      if (amount === 0) {
        toast.error('Invalid membership type selected');
        return;
      }

      const paymentResult = await razorpayService.processMembershipPayment(amount, formData);

      if (paymentResult.success) {
        toast.success('Payment successful! Membership form submitted.');
        
        setFormData({
          name: '',
          father_name: '',
          qualification: '',
          year_passing: '',
          dob: '',
          institution: '',
          working_place: '',
          sex: '',
          age: '',
          address: '',
          mobile: '',
          email: '',
          membership_type: ''
        });
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      
      if (error.message === 'Payment cancelled by user') {
        toast.error('Payment cancelled. You can try again when ready.');
      } else {
        toast.error(error.message || 'Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Online Membership Registration</CardTitle>
                  <CardDescription>
                    Fill the form below to register for BOA membership
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#0B3C5D]">Personal Information</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-sm">Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="father_name" className="text-sm">Father's/Husband Name *</Label>
                          <Input
                            id="father_name"
                            value={formData.father_name}
                            onChange={(e) => handleChange('father_name', e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="qualification" className="text-sm">Academic Qualification *</Label>
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => handleChange('qualification', e.target.value)}
                          required
                          className="h-10"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="year_passing" className="text-sm">Year of Passing *</Label>
                          <Input
                            id="year_passing"
                            type="number"
                            value={formData.year_passing}
                            onChange={(e) => handleChange('year_passing', e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dob" className="text-sm">Date of Birth *</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={formData.dob}
                            onChange={(e) => handleChange('dob', e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="institution" className="text-sm">Name of Institution *</Label>
                        <Input
                          id="institution"
                          value={formData.institution}
                          onChange={(e) => handleChange('institution', e.target.value)}
                          required
                          className="h-10"
                        />
                      </div>

                      <div>
                        <Label htmlFor="working_place" className="text-sm">Working Place *</Label>
                        <Input
                          id="working_place"
                          value={formData.working_place}
                          onChange={(e) => handleChange('working_place', e.target.value)}
                          required
                          className="h-10"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sex" className="text-sm">Sex *</Label>
                          <Select value={formData.sex} onValueChange={(value) => handleChange('sex', value)}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="age" className="text-sm">Age *</Label>
                          <Input
                            id="age"
                            type="number"
                            value={formData.age}
                            onChange={(e) => handleChange('age', e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-sm">Address *</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          rows={3}
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="mobile" className="text-sm">Mobile *</Label>
                          <Input
                            id="mobile"
                            type="tel"
                            value={formData.mobile}
                            onChange={(e) => handleChange('mobile', e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-lg font-semibold text-[#0B3C5D]">Membership Selection</h3>

                      <div>
                        <Label htmlFor="membership_type" className="text-sm">Select Membership Type *</Label>
                        <Select value={formData.membership_type} onValueChange={(value) => handleChange('membership_type', value)}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select membership type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="test">Test Payment (₹1)</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.title.toLowerCase().replace(/\s+/g, '_')}>
                                {cat.title} - {cat.category === 'student_fee' ? 'Student' : 'Passout'} (₹{parseFloat(cat.price).toLocaleString()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full gradient-primary text-primary-foreground h-11" disabled={loading}>
                      <Send className="mr-2 h-5 w-5" />
                      {loading ? 'Processing Payment...' : 'Pay Now'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Offline Form</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Prefer to fill the form offline? Download the printable form.
                    </p>
                    <Button 
                      onClick={handleDownloadOfflineForm}
                      variant="outline" 
                      className="w-full"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Offline Form
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}