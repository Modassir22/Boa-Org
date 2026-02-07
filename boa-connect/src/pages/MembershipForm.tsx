import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Send } from 'lucide-react';
import { toast } from 'sonner';
import { razorpayService } from '@/lib/razorpay';
import { API_BASE_URL } from '@/lib/utils';

export default function MembershipForm() {
  const navigate = useNavigate();
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
    membership_duration: '', // Will store category ID
    payment_type: '' // 'passout' or 'student'
  });

  useEffect(() => {
    checkExistingMembership();
    loadCategories();
    // Also reload categories when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCategories();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkExistingMembership = async () => {
    try {
      // Get current user's email from token or user data
      const token = localStorage.getItem('token');
      if (!token) return;

      // Check if user has already submitted membership form
      const response = await fetch(`${API_BASE_URL}/api/users/membership`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // If user has membership data (even if inactive), they've already filled the form
        if (data.membership && data.membership.membership_type) {
          toast.error('You have already submitted a membership application. Only one application per user is allowed.');
          navigate('/membership-details');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking existing membership:', error);
      // Continue loading if check fails
    }
  };

  const loadCategories = async () => {
    try {
      // In development, use relative URL to go through Vite proxy
      // In production, use the full API URL
      const isDevelopment = import.meta.env.DEV;
      const timestamp = new Date().getTime();
      const url = isDevelopment 
        ? `/api/membership-categories?t=${timestamp}`
        : `${API_BASE_URL}/api/membership-categories?t=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        console.error('Failed to load categories:', data);
        toast.error('Failed to load membership categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load membership categories. Please refresh the page.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadOfflineForm = async () => {
    try {
      // In development, use relative URL to go through Vite proxy
      const isDevelopment = import.meta.env.DEV;
      const timestamp = new Date().getTime();
      const url = isDevelopment 
        ? `/api/generate-membership-pdf?t=${timestamp}`
        : `${API_BASE_URL}/api/generate-membership-pdf?t=${timestamp}`;

      const response = await fetch(url, {
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
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `BOA_Membership_Application_Form_${timestamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up with a small delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membership_duration) {
      toast.error('Please select a membership duration');
      return;
    }

    if (!formData.payment_type) {
      toast.error('Please select a payment type');
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
      // Check for duplicate membership before payment
      const checkResponse = await fetch(
        `${API_BASE_URL}/api/registrations/check-duplicate?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const checkData = await checkResponse.json();

      if (checkData.exists) {
        setLoading(false);
        toast.error(
          `A membership already exists with this ${checkData.users[0].email === formData.email ? 'email' : 'name'}. ` +
          `Membership No: ${checkData.users[0].membership_no || 'Pending'}`
        );
        return;
      }

      // Continue with payment if no duplicate found
      let selectedCategory = null;
      let selectedPrice = 0;
      
      if (formData.membership_duration === 'test') {
        selectedPrice = 1; // Test payment
      } else {
        selectedCategory = categories.find(cat => cat.id.toString() === formData.membership_duration);

        if (selectedCategory) {
          if (formData.payment_type === 'student' && selectedCategory.student_price && parseFloat(selectedCategory.student_price) > 0) {
            selectedPrice = parseFloat(selectedCategory.student_price);
          } else {
            selectedPrice = parseFloat(selectedCategory.price);
          }
        }
      }

      if (selectedPrice === 0) {
        toast.error('Invalid membership selection or price not available');
        return;
      }

      // Construct membership_type with subcategory
      let membershipType = selectedCategory?.title || 'Standard';
      if (formData.payment_type === 'student') {
        membershipType = `${membershipType} (Student)`;
      } else if (formData.payment_type === 'passout') {
        membershipType = `${membershipType} (Passout)`;
      }

      const paymentResult = await razorpayService.processMembershipPayment(selectedPrice, {
        ...formData,
        category_id: selectedCategory?.id,
        membership_type: membershipType
      });

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
          membership_duration: '',
          payment_type: ''
        });
      }

    } catch (error: any) {
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
      <div className="container py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl">Online Membership Registration</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Fill the form below to register for BOA membership
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-[#0B3C5D]">Personal Information</h3>
                      
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="name" className="text-xs sm:text-sm">Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="father_name" className="text-xs sm:text-sm">Father's/Husband Name *</Label>
                          <Input
                            id="father_name"
                            value={formData.father_name}
                            onChange={(e) => handleChange('father_name', e.target.value)}
                            required
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="qualification" className="text-xs sm:text-sm">Academic Qualification *</Label>
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => handleChange('qualification', e.target.value)}
                          required
                          className="h-9 sm:h-10 text-sm"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="year_passing" className="text-xs sm:text-sm">Year of Passing *</Label>
                          <Input
                            id="year_passing"
                            type="number"
                            value={formData.year_passing}
                            onChange={(e) => handleChange('year_passing', e.target.value)}
                            required
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dob" className="text-xs sm:text-sm">Date of Birth *</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={formData.dob}
                            onChange={(e) => handleChange('dob', e.target.value)}
                            required
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="institution" className="text-xs sm:text-sm">Name of Institution *</Label>
                        <Input
                          id="institution"
                          value={formData.institution}
                          onChange={(e) => handleChange('institution', e.target.value)}
                          required
                          className="h-9 sm:h-10 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="working_place" className="text-xs sm:text-sm">Working Place *</Label>
                        <Input
                          id="working_place"
                          value={formData.working_place}
                          onChange={(e) => handleChange('working_place', e.target.value)}
                          required
                          className="h-9 sm:h-10 text-sm"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="sex" className="text-xs sm:text-sm">Sex *</Label>
                          <Select value={formData.sex} onValueChange={(value) => handleChange('sex', value)}>
                            <SelectTrigger className="h-9 sm:h-10 text-sm">
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
                          <Label htmlFor="age" className="text-xs sm:text-sm">Age *</Label>
                          <Input
                            id="age"
                            type="number"
                            value={formData.age}
                            onChange={(e) => handleChange('age', e.target.value)}
                            required
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-xs sm:text-sm">Address *</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          rows={3}
                          required
                          className="text-sm"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="mobile" className="text-xs sm:text-sm">Mobile *</Label>
                          <Input
                            id="mobile"
                            type="tel"
                            value={formData.mobile}
                            onChange={(e) => handleChange('mobile', e.target.value)}
                            required
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            className="h-9 sm:h-10 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-semibold text-[#0B3C5D]">Membership Selection</h3>
                      </div>

                      <div>
                        <Label htmlFor="membership_duration" className="text-xs sm:text-sm">Select Membership Duration *</Label>
                        <Select value={formData.membership_duration} onValueChange={(value) => handleChange('membership_duration', value)}>
                          <SelectTrigger className="h-9 sm:h-10 text-sm">
                            <SelectValue placeholder="Select membership duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {categories.length === 0 && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Loading membership categories...
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs sm:text-sm">Select Payment Type *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                          <button
                            type="button"
                            onClick={() => handleChange('payment_type', 'passout')}
                            className={`p-3 sm:p-4 border-2 rounded-lg text-center transition-all ${
                              formData.payment_type === 'passout'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-semibold text-sm sm:text-base">I'm Passout</div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Professional/Graduate</div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleChange('payment_type', 'student')}
                            className={`p-3 sm:p-4 border-2 rounded-lg text-center transition-all ${
                              formData.payment_type === 'student'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-semibold text-sm sm:text-base">I'm Student</div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">Currently Studying</div>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Price Display */}
                      {formData.membership_duration && formData.payment_type && formData.membership_duration !== 'test' && (
                        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Selected Plan Summary</h4>
                          {(() => {
                            const selectedCategory = categories.find(cat => cat.id.toString() === formData.membership_duration);
                            
                            if (!selectedCategory) return null;
                            
                            const currentPrice = formData.payment_type === 'student' && selectedCategory.student_price && parseFloat(selectedCategory.student_price) > 0
                              ? parseFloat(selectedCategory.student_price)
                              : parseFloat(selectedCategory.price);
                            
                            return (
                              <div className="space-y-1 sm:space-y-2">
                                <p className="text-xs sm:text-sm">
                                  <span className="font-medium">Duration:</span> {selectedCategory.title}
                                </p>
                                <p className="text-xs sm:text-sm">
                                  <span className="font-medium">Type:</span> {formData.payment_type === 'student' ? 'Student' : 'Professional/Passout'}
                                </p>
                                <p className="text-lg sm:text-xl font-bold text-blue-900">
                                  Total Amount: ₹{currentPrice.toLocaleString()}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full gradient-primary text-primary-foreground h-10 sm:h-11 text-sm sm:text-base" disabled={loading}>
                      <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {loading ? 'Processing Payment...' : 'Pay Now'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 mt-6 lg:mt-0">
              <div className="sticky top-6 space-y-4">
                <Card className='bg-[#aa962d]'>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base text-black"><span className='p-1.5 bg-primary rounded-md text-white'>Offline Form</span></CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 ">
                    <p className="text-xs sm:text-sm text-black mb-3">
                      Prefer to fill the form offline? Download the printable form.
                    </p>
                    <Button 
                      onClick={handleDownloadOfflineForm}
                      variant="outline" 
                      className="w-full hover:bg-black hover:text-white text-xs sm:text-sm h-9 sm:h-10"
                      size="sm"
                    >
                      <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Download Form
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