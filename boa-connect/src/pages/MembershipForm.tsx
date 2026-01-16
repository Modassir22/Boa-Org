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
import axios from 'axios';

export default function MembershipForm() {
  const [loading, setLoading] = useState(false);
  const [showOnlineForm, setShowOnlineForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentTimer, setPaymentTimer] = useState(60);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [offlineFormHtml, setOfflineFormHtml] = useState('');
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
    loadOfflineForm();
    
    // Listen for event to auto-open form
    const handleOpenForm = () => {
      setShowOnlineForm(true);
    };
    
    window.addEventListener('openMembershipForm', handleOpenForm);
    
    return () => {
      window.removeEventListener('openMembershipForm', handleOpenForm);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showPaymentModal && paymentMode && paymentTimer > 0) {
      interval = setInterval(() => {
        setPaymentTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showPaymentModal, paymentMode, paymentTimer]);

  // Separate effect to handle payment completion when timer reaches 0
  useEffect(() => {
    if (showPaymentModal && paymentMode && paymentTimer === 0) {
      // Timer expired - check payment one last time
      checkPaymentStatus();
    }
  }, [paymentTimer, showPaymentModal, paymentMode]);

  // Payment verification polling - check every 3 seconds
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (showPaymentModal && paymentMode && !paymentVerifying) {
      pollInterval = setInterval(() => {
        checkPaymentStatus();
      }, 3000); // Check every 3 seconds
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [showPaymentModal, paymentMode, paymentVerifying]);

  const checkPaymentStatus = async () => {
    if (paymentVerifying || !transactionId) return; // Prevent multiple simultaneous checks
    
    setPaymentVerifying(true);
    try {
      // Check payment status from backend
      const response = await axios.post('http://localhost:5000/api/payment/check-payment', {
        transaction_id: transactionId
      });
      
      if (response.data.success && response.data.payment_verified) {
        // Payment verified successfully
        handlePaymentComplete();
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    } finally {
      setPaymentVerifying(false);
    }
  };

  const loadOfflineForm = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/offline-forms-config');
      if (response.data.success && response.data.config) {
        setOfflineFormHtml(response.data.config.membership_form_html || getDefaultOfflineForm());
      } else {
        setOfflineFormHtml(getDefaultOfflineForm());
      }
    } catch (error) {
      console.error('Failed to load offline form:', error);
      setOfflineFormHtml(getDefaultOfflineForm());
    }
  };

  const getDefaultOfflineForm = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MEMBERSHIP FORM - OPHTHALMIC ASSOCIATION OF BIHAR</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 16px; margin: 5px 0; text-decoration: underline; }
        .header h2 { font-size: 14px; margin: 5px 0; }
        .header p { font-size: 12px; margin: 3px 0; }
        .form-row { margin: 15px 0; border-bottom: 1px dotted #000; padding-bottom: 5px; }
        .form-row label { font-size: 12px; font-weight: normal; }
        .inline-fields { display: flex; gap: 20px; }
        .inline-fields .form-row { flex: 1; }
        .declaration { margin: 30px 0; padding: 15px; border: 1px solid #000; background: #f9f9f9; }
        .declaration h3 { text-align: center; font-size: 14px; margin-bottom: 15px; text-decoration: underline; }
        .declaration p { font-size: 11px; margin: 8px 0; text-align: justify; }
        .signature-section { margin-top: 30px; display: flex; justify-content: space-between; }
        .enclosures { margin-top: 30px; font-size: 11px; }
        .enclosures h4 { font-size: 12px; margin-bottom: 10px; }
        .notes { margin-top: 20px; font-size: 11px; font-weight: bold; }
        @media print { body { margin: 0; padding: 15px; max-width: 800px; margin: 0 auto; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>MEMBERSHIP FORM</h1>
        <h2>OPHTHALMIC ASSOCIATION OF BIHAR(Reg.no.-S00403/21-22)</h2>
        <p>Shivpuri Road,Anishabad,Patna 800002</p>
        <p>Email:biharophthalmic2022@gmail.com</p>
        <p>Contact no :9334332714/7903220742/9572212739</p>
    </div>
    <hr>
    <div class="form-row"><label>NAME....................................................................................................................................................</label></div>
    <div class="form-row"><label>FATHER'S/HUSBAND NAME....................................................................................................................................................</label></div>
    <div class="form-row"><label>ACADEMIC QUALIFICATION....................................................................................................................................................</label></div>
    <div class="form-row"><label>....................................................................................................................................................</label></div>
    <div class="inline-fields">
        <div class="form-row"><label>YEAR OF PASSING........................</label></div>
        <div class="form-row"><label>DOB....................................................</label></div>
    </div>
    <div class="form-row"><label>NAME OF INSTITUTION....................................................................................................................................................</label></div>
    <div class="form-row"><label>WORKING PLACE....................................................................................................................................................</label></div>
    <div class="inline-fields">
        <div class="form-row"><label>SEX..............................................</label></div>
        <div class="form-row"><label>AGE ON 1st APR 22....................................................</label></div>
    </div>
    <div class="form-row"><label>ADDRESS....................................................................................................................................................</label></div>
    <div class="form-row"><label>....................................................................................................................................................</label></div>
    <div class="form-row"><label>....................................................................................................................................................</label></div>
    <div class="inline-fields">
        <div class="form-row"><label>MOB..............................................</label></div>
        <div class="form-row"><label>EMAIL....................................................</label></div>
    </div>
    <div class="declaration">
        <h3>SELF DECLARATION</h3>
        <p>I Smt/Sri/Kumari .................................................. Son/Daughter/wife of Mr. .........................................................................Age...................Sex.................</p>
        <p>Do hereby declare that,the information given above and enclosed documents are true to the best of my knowledge and belief.I am well aware of the fact that If the information given by me is proved false/not true ,I will be liable for action as per the law of association.</p>
        <p>I also declare that after getting membership of association</p>
        <p>Never violate the rule & regulation of association or never jeopardizes the objective of association & never discloses the matter which were bring in notice directly or indirectly affect the objective of association.I will always try to my best for getting the Objectives/goal of association.</p>
    </div>
    <div class="signature-section">
        <div><p>PLACE................................................</p><p>DATE................................................</p></div>
        <div><p>SIGNATURE</p></div>
    </div>
    <div class="enclosures">
        <h4>Enclosures</h4>
        <p>1. Self attested copy of marksheet of diploma in ophthalmic assistant/para ophthalmology<br>&nbsp;&nbsp;&nbsp;Or bachelor in ophthalmic technology/technique ,/for student ID card</p>
        <p>2. Two passport size colour photo.</p>
        <p>3. Self attested copy of AADHAR</p>
        <p><strong>NOTE-FOR ANY PAYMENT A/C NO(current) 40983059661  IFSC CODE SBIN0000152</strong></p>
        <p><strong>OPTHALMIC ASSOCIATION OF BIHAR (SBI MAIN BRANCH GANDHI MAIDAN PATNA)</strong></p>
    </div>
    <div class="notes">
        <p>NOTES  1.For student Rs 300/half yearly /500 yearly</p>
        <p>2. For passport/professionals  600/half yearly or 1000 /yearly or 5000/10 yearly or 10000/for lifetime.</p>
    </div>
</body>
</html>`;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadOfflineForm = () => {
    if (!offlineFormHtml) {
      toast.error('Offline form not available');
      return;
    }

    const blob = new Blob([offlineFormHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BOA_Membership_Form_Offline.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Offline form downloaded successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate membership type is selected
    if (!formData.membership_type) {
      toast.error('Please select a membership type');
      return;
    }

    // Show payment mode selection first
    setShowPaymentModal(true);
    setPaymentMode('');
    setPaymentTimer(60);
  };

  const handlePaymentModeSelect = async (mode: string) => {
    setPaymentMode(mode);
    // Generate transaction ID for tracking
    const txnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setTransactionId(txnId);
    
    // Create payment request in backend
    try {
      await axios.post('http://localhost:5000/api/payment/create-payment', {
        transaction_id: txnId,
        amount: getMembershipAmount(),
        user_data: formData
      });
      console.log('Payment request created:', txnId);
    } catch (error) {
      console.error('Failed to create payment request:', error);
      toast.error('Failed to initiate payment');
    }
    
    // Start timer when payment mode is selected
    setPaymentTimer(60);
  };

  const handlePaymentComplete = async () => {
    setLoading(true);
    setShowPaymentModal(false);

    try {
      // Add your API call here to submit membership form
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated API call
      
      toast.success('Payment successful! Membership form submitted. You will receive confirmation via email.');
      
      // Reset form
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
      setShowOnlineForm(false);
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMembershipAmount = () => {
    const amounts: any = {
      'test': '₹1',
      'yearly_passout': '₹1200',
      'yearly_student': '₹600',
      '5yearly_passout': '₹5000',
      '5yearly_student': '₹2000',
      'lifetime': '₹8000'
    };
    return amounts[formData.membership_type] || '₹0';
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-7xl mx-auto">
          {/* Online Form - Always show */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Side - Form (2 columns) */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Online Membership Registration</CardTitle>
                  <CardDescription>
                    Fill the form below to register for BOA membership
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Personal Information */}
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

                    {/* Membership Selection */}
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
                            <SelectItem value="yearly_passout">Yearly - Passout (₹1200)</SelectItem>
                            <SelectItem value="yearly_student">Yearly - Student (₹600)</SelectItem>
                            <SelectItem value="5yearly_passout">5-Yearly - Passout (₹5000)</SelectItem>
                            <SelectItem value="5yearly_student">5-Yearly - Student (₹2000)</SelectItem>
                            <SelectItem value="lifetime">Lifetime - Passout (₹8000)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full gradient-primary text-primary-foreground h-11" disabled={loading}>
                      <Send className="mr-2 h-5 w-5" />
                      Pay Now {formData.membership_type && `- ${getMembershipAmount()}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Fee Structure (1 column) */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                {/* Fee Structure Card */}
                <Card className="border-2 border-[#0B3C5D]">
                  <CardHeader className="bg-[#0B3C5D] text-white">
                    <CardTitle className="text-lg text-white">Membership Fee Structure</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">Yearly</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Passout:</span>
                          <span className="font-bold text-[#0B3C5D]">₹1,200</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Student:</span>
                          <span className="font-bold text-[#0B3C5D]">₹600</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">5-Yearly</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Passout:</span>
                          <span className="font-bold text-[#0B3C5D]">₹5,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Student:</span>
                          <span className="font-bold text-[#0B3C5D]">₹2,000</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">Lifetime</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Passout:</span>
                          <span className="font-bold text-[#0B3C5D]">₹8,000</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Special Offer Card */}
                <Card className="bg-yellow-50 border-yellow-300">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🎉</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Special Offer</h4>
                        <p className="text-xs text-gray-700">
                          Get 20% discount when you pay membership along with conference registration before the conference date.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Benefits Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Membership Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>Access to all CME programs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>Discounted conference fees</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>Professional networking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>Free publications & journals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>Recognition & awards eligibility</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <CardHeader className="pb-3">
                  <CardTitle className="text-center text-xl">
                    {!paymentMode ? 'Select Payment Method' : 'Complete Payment'}
                  </CardTitle>
                  {!paymentMode && (
                    <CardDescription className="text-center">
                      Choose your preferred payment method
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center py-2">
                    <div className="text-2xl font-bold text-primary">
                      {getMembershipAmount()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.membership_type.replace('_', ' - ').replace('yearly', 'Yearly').replace('passout', 'Passout').replace('student', 'Student').replace('lifetime', 'Lifetime')}
                    </p>
                  </div>

                  {!paymentMode ? (
                    /* Payment Mode Selection */
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handlePaymentModeSelect('phonepe')}
                          className="border-2 rounded-lg p-3 hover:border-primary hover:bg-accent transition-all flex flex-col items-center gap-1.5"
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-10 h-10">
                              <circle cx="12" cy="12" r="12" fill="#5f259f"/>
                              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Pe</text>
                            </svg>
                          </div>
                          <span className="text-xs font-medium">PhonePe</span>
                        </button>

                        <button
                          onClick={() => handlePaymentModeSelect('paytm')}
                          className="border-2 rounded-lg p-3 hover:border-primary hover:bg-accent transition-all flex flex-col items-center gap-1.5"
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-10 h-10">
                              <circle cx="12" cy="12" r="12" fill="#00BAF2"/>
                              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">P</text>
                            </svg>
                          </div>
                          <span className="text-xs font-medium">Paytm</span>
                        </button>

                        <button
                          onClick={() => handlePaymentModeSelect('googlepay')}
                          className="border-2 rounded-lg p-3 hover:border-primary hover:bg-accent transition-all flex flex-col items-center gap-1.5"
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-10 h-10">
                              <circle cx="12" cy="12" r="12" fill="white" stroke="#dadce0" strokeWidth="1"/>
                              <text x="12" y="16" textAnchor="middle" fontSize="14" fontWeight="bold">
                                <tspan fill="#4285f4">G</tspan>
                              </text>
                            </svg>
                          </div>
                          <span className="text-xs font-medium">Google Pay</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePaymentModeSelect('upi')}
                          className="border-2 rounded-lg p-3 hover:border-primary hover:bg-accent transition-all flex items-center justify-center gap-2"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded flex items-center justify-center text-white font-bold text-xs">
                            UPI
                          </div>
                          <span className="text-xs font-medium">Other UPI</span>
                        </button>

                        <button
                          onClick={() => handlePaymentModeSelect('card')}
                          className="border-2 rounded-lg p-3 hover:border-primary hover:bg-accent transition-all flex items-center justify-center gap-2"
                        >
                          <div className="w-8 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center text-white font-bold text-[10px]">
                            CARD
                          </div>
                          <span className="text-xs font-medium">Debit/Credit</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* QR Code Display */
                    <>
                      <div className="bg-accent/50 p-3 rounded-lg text-center">
                        <p className="text-xs mb-1">
                          <strong>Payment via:</strong> {paymentMode === 'phonepe' ? 'PhonePe' : paymentMode === 'paytm' ? 'Paytm' : paymentMode === 'googlepay' ? 'Google Pay' : paymentMode === 'card' ? 'Card' : 'UPI'}
                        </p>
                        <p className="text-xs"><strong>UPI:</strong> OABIHAR@SBI</p>
                      </div>

                      <div className="flex justify-center py-2">
                        <div className="w-48 h-48 border-2 rounded flex items-center justify-center bg-white p-2">
                          <img 
                            src="https://res.cloudinary.com/derzj7d4u/image/upload/v1768484804/boa-certificates/letccpxsyolezskxohzk.jpg" 
                            alt="UPI QR Code" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      <div className="text-center py-2">
                        <div className="text-3xl font-bold text-primary">
                          {Math.floor(paymentTimer / 60)}:{(paymentTimer % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Auto-verifying payment...
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                        <p className="text-xs text-blue-800 text-center">
                          {paymentVerifying ? '🔄 Verifying payment...' : '⏳ Complete payment using QR code'}
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg">
                        <p className="text-xs text-yellow-800 text-center">
                          <strong>Ref ID:</strong> {transactionId}
                        </p>
                      </div>

                      <Button 
                        className="w-full gradient-primary text-primary-foreground"
                        size="lg"
                        onClick={handlePaymentComplete}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'I Have Paid - Submit Form'}
                      </Button>
                    </>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentMode('');
                      setPaymentTimer(60);
                      setPaymentVerifying(false);
                      setTransactionId('');
                    }}
                  >
                    Cancel Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
