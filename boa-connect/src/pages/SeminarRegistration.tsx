import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, CreditCard, FileText, User, MapPin, Receipt, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { seminarAPI, registrationAPI } from '@/lib/api';
import { titleOptions, genderOptions, indianStates } from '@/lib/mockData';
import { razorpayService } from '@/lib/razorpay';
import { Footer } from '@/components/layout/Footer';
import { API_BASE_URL } from '@/lib/utils';
type Step = 'personal' | 'address' | 'registration' | 'fee' | 'consent' | 'payment';

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

export default function SeminarRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // All useState hooks MUST be at the top
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSlab, setSelectedSlab] = useState<string>('');
  const [delegateType, setDelegateType] = useState<string>('');
  const [membershipNo, setMembershipNo] = useState('');
  const [isLifeMember, setIsLifeMember] = useState(false);
  const [isMembershipVerified, setIsMembershipVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [title, setTitle] = useState('');
  const [fullName, setFullName] = useState('');
  const [surname, setSurname] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [house, setHouse] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pinCode, setPinCode] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [additionalPersons, setAdditionalPersons] = useState<any[]>([]);

  // Dynamic data from API
  const [seminar, setSeminar] = useState<any>(null);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);
  const [feeSlabs, setFeeSlabs] = useState<any[]>([]);
  const [delegateCategories, setDelegateCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([]);

  useEffect(() => {
    // Test backend connection
    razorpayService.testConnection();
    loadSeminarData();
  }, [id]);

  // Auto-select fee when delegate type changes
  useEffect(() => {
    // Don't run if slabs or categories aren't loaded yet
    if (feeSlabs.length === 0 || feeCategories.length === 0) {
      return;
    }

    // Reset first
    setSelectedCategory('');
    setSelectedSlab('');

    // Auto-select fee category based on delegate type
    if (delegateType) {
      const categoryName = delegateType;

      // Find matching fee category with flexible matching
      const matchingFeeCategory = feeCategories.find(cat => {
        const catNameNormalized = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
        const searchNameNormalized = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

        // Try exact match first
        if (catNameNormalized === searchNameNormalized) {
          return true;
        }

        // Special case: life-member should ONLY match "Life Member" 
        if (searchNameNormalized === 'life-member' || searchNameNormalized.includes('life')) {
          // Must match exactly "life-member" or "life member" 
          if (catNameNormalized.includes('life') && catNameNormalized.includes('member')) {
            return true;
          }
          return false;
        }

        // Special case: non-boa-member should match "Non-BOA Member"
        if (searchNameNormalized.includes('non-boa') || searchNameNormalized.includes('non-member')) {
          if (catNameNormalized.includes('non') && catNameNormalized.includes('boa')) {
            return true;
          }
          return false;
        }

        // Try partial match (contains) - but exclude specific cases handled above
        if (!searchNameNormalized.includes('life') && !searchNameNormalized.includes('boa') && 
            (catNameNormalized.includes(searchNameNormalized) || searchNameNormalized.includes(catNameNormalized))) {
          return true;
        }

        return false;
      });

      if (matchingFeeCategory) {
        setSelectedCategory(matchingFeeCategory.id.toString());

        // Auto-select current slab based on date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        let currentSlab = null;

        for (const slab of feeSlabs) {
          // Use database dates if available, otherwise parse text
          let endDate = null;

          if (slab.endDate) {
            // Use database end_date field
            endDate = new Date(slab.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
          } else {
            // Fallback: Parse date range text
            const dateRange = slab.dateRange;
            const dateMatches = dateRange.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/g);
            if (dateMatches && dateMatches.length > 0) {
              const lastDateStr = dateMatches[dateMatches.length - 1];
              const match = lastDateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);

              if (match) {
                const [, day, month, year] = match;
                const months: { [key: string]: number } = {
                  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                  'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
                };
                const monthNum = months[month.toLowerCase().substring(0, 3)];
                endDate = new Date(parseInt(year), monthNum, parseInt(day));
                endDate.setHours(23, 59, 59, 999);
              }
            }
          }

          if (endDate && today <= endDate) {
            currentSlab = slab;
            break;
          }
        }

        // If no slab found (all dates passed), use last slab (Spot registration)
        if (!currentSlab && feeSlabs.length > 0) {
          currentSlab = feeSlabs[feeSlabs.length - 1];
        }

        if (currentSlab) {
          setSelectedSlab(currentSlab.id.toString());
        }
      } else {
        // If no exact match, clear selections
        setSelectedCategory('');
        setSelectedSlab('');
      }
    }
  }, [delegateType, feeCategories, feeSlabs]);

  const loadSeminarData = async () => {
    try {
      let response;
      if (id && id !== 'undefined') {
        // Load specific seminar by ID
        response = await seminarAPI.getById(id);
      } else {
        // Load active seminar if no ID provided
        response = await seminarAPI.getActive();
      }

      setSeminar(response.seminar);

      // Check if user has already registered for this seminar
      try {
        const registrationsResponse = await registrationAPI.getMyRegistrations();
        const existingRegistration = registrationsResponse.registrations.find(
          (reg: any) => reg.seminar_id === parseInt(id)
        );

        if (existingRegistration) {
          toast({
            title: 'Already Registered',
            description: `You have already registered for this seminar (Registration No: ${existingRegistration.registration_no})`,
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking existing registrations:', error);
        // Continue loading if registration check fails
      }

      // Transform categories for compatibility
      const categories = (response.seminar.categories || []).map((cat: any) => ({
        id: cat.id.toString(),
        name: cat.name,
        description: cat.description,
        fees: cat.fees || {}
      }));


      setFeeCategories(categories);

      // Transform slabs
      const slabs = (response.seminar.slabs || []).map((slab: any) => ({
        id: slab.id.toString(),
        label: slab.label,
        dateRange: slab.date_range,
        startDate: slab.start_date,
        endDate: slab.end_date
      }));


      setFeeSlabs(slabs);

      // Set delegate categories from API
      const delegateCats = (response.seminar.delegateCategories || []).map((cat: any) => ({
        value: cat.name,
        label: cat.label,
        requiresMembership: cat.requires_membership
      }));

      setDelegateCategories(delegateCats);

      // Load committee members
      await loadCommitteeMembers();
    } catch (error) {
      console.error('Failed to load seminar:', error);
      toast({
        title: 'Error',
        description: 'Failed to load seminar details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommitteeMembers = async () => {
    try {
      // In development, use relative URL to go through Vite proxy
      const isDevelopment = import.meta.env.DEV;
      const url = isDevelopment 
        ? '/api/committee-members?page_type=seminar'
        : `${API_BASE_URL}/api/committee-members?page_type=seminar`;
        
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        // Filter only seminar page members and remove duplicates based on member name
        const seminarMembers = data.members.filter((member: any) => member.page_type === 'seminar');
        const uniqueMembers = seminarMembers.filter((member: any, index: number, self: any[]) =>
          index === self.findIndex((m: any) => m.name === member.name)
        );
        setCommitteeMembers(uniqueMembers);
      }
    } catch (error) {
      console.error('Failed to load committee members:', error);
    }
  };

  const generateOfflineRegistrationForm = async () => {
    try {
      if (!seminar?.id) {
        toast({
          title: 'Error',
          description: 'Seminar information not available',
          variant: 'destructive',
        });
        return;
      }

      // In development, use relative URL to go through Vite proxy
      const isDevelopment = import.meta.env.DEV;
      const timestamp = new Date().getTime();
      const url = isDevelopment 
        ? `/api/generate-seminar-pdf/${seminar.id}?t=${timestamp}`
        : `${API_BASE_URL}/api/generate-seminar-pdf/${seminar.id}?t=${timestamp}`;

      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is actually a PDF or HTML fallback
      const contentType = response.headers.get('content-type');
      const isHtml = contentType && contentType.includes('text/html');
      
      // Get blob
      const blob = await response.blob();

      // Create download link with timestamp in filename
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      if (isHtml) {
        // If HTML fallback, download as HTML file
        link.download = `${seminar.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form_${timestamp}.html`;
        setTimeout(() => {
          toast({
            title: "PDF Generation Issue",
            description: "Downloaded as HTML file. Please print from browser.",
            variant: "default"
          });
        }, 200);
      } else {
        // Normal PDF download
        link.download = `${seminar.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form_${timestamp}.pdf`;
        setTimeout(() => {
          toast({
            title: "Success",
            description: "Registration form downloaded successfully!",
            variant: "default"
          });
        }, 200);
      }
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up with a small delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
    } catch (error) {
      setTimeout(() => {
        toast({
          title: 'Error',
          description: 'Failed to download form. Please try again.',
          variant: 'destructive',
        });
      }, 100);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Seminar not found</p>
          <Button onClick={() => navigate('/seminars')} className="mt-4 h-12 text-base px-6 md:h-11 md:text-sm md:px-5">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Seminars
          </Button>
        </div>
      </div>
    );
  }

  // Check if online registration is disabled
  if (seminar.online_registration_enabled === false) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Online Registration Closed</h2>
          <p className="text-muted-foreground mb-6">
            Online registration for this seminar is currently closed. Please use the offline registration form.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/seminars')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Seminars
            </Button>
            <Button onClick={generateOfflineRegistrationForm} className="gap-2">
              <Download className="h-4 w-4" />
              Download Offline Form
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeSeminar = seminar;

  // Use delegate categories from API
  const displayDelegateCategories = (() => {
    let categories = [];
    
    // If we have delegate categories from API, use them
    if (delegateCategories.length > 0) {
      categories = delegateCategories.map(cat => ({
        value: cat.value,
        label: cat.label.toUpperCase(),
        requiresMembership: cat.requiresMembership
      }));
    }
    // Fallback: If no delegate categories, generate from fee categories
    else if (feeCategories.length > 0) {
      categories = feeCategories.map(cat => ({
        value: cat.name.toLowerCase().replace(/\s+/g, '-'),
        label: cat.name.toUpperCase(),
        requiresMembership: cat.name.toLowerCase().includes('life') && cat.name.toLowerCase().includes('member')
      }));
    }
    // Final fallback to default categories
    else {
      categories = [
        { value: 'life-member', label: 'LIFE MEMBER', requiresMembership: true },
        { value: 'non-boa-member', label: 'NON BOA MEMBER', requiresMembership: false },
        { value: 'accompanying-person', label: 'ACCOMPANYING PERSON', requiresMembership: false },
        { value: 'pg-student', label: 'PG STUDENT', requiresMembership: false },
      ];
    }

    // Filter out Life Member option if not selected in Personal step
    if (!isLifeMember) {
      categories = categories.filter(cat => 
        !cat.value.includes('life') && 
        !cat.label.toLowerCase().includes('life')
      );
    }

    return categories;
  })();

  // All users go through the same steps - no skipping
  const steps: { id: Step; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'registration', label: 'Category', icon: FileText },
    { id: 'fee', label: 'Fee', icon: Receipt },
    { id: 'consent', label: 'Consent', icon: Check },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ];

  // Filter steps for Life Members - hide Category step
  const displaySteps = isLifeMember 
    ? steps.filter(step => step.id !== 'registration')
    : steps;

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const displayCurrentIndex = displaySteps.findIndex(s => s.id === currentStep);
  const selectedFee = feeCategories.find(f => f.id.toString() === selectedCategory);
  const rawAmount = selectedFee && selectedSlab ? selectedFee.fees[selectedSlab] : 0;
  const selectedAmount = typeof rawAmount === 'number' && !isNaN(rawAmount) ? rawAmount : 0;

  const selectedSlabLabel = feeSlabs.find(s => s.id.toString() === selectedSlab)?.label || '';
  const additionalAmount = additionalPersons.reduce((sum, p) => {
    const amount = typeof p.amount === 'number' && !isNaN(p.amount) ? p.amount : 0;
    return sum + amount;
  }, 0);
  const totalAmount = selectedAmount + additionalAmount;

  const handleVerifyMembership = async () => {
    if (!membershipNo) {
      toast({
        title: 'Required Field',
        description: 'Please enter membership number',
        variant: 'destructive',
      });
      return;
    }

    // Check if name is filled
    if (!fullName || !surname) {
      toast({
        title: 'Name Required',
        description: 'Please fill your first name and surname before verifying membership',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);

    try {
      // In development, use relative URL to go through Vite proxy
      const isDevelopment = import.meta.env.DEV;
      const url = isDevelopment 
        ? '/api/users/verify-membership'
        : `${API_BASE_URL}/api/users/verify-membership`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipNo }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        // Verify name matches
        const membershipName = data.membership.name.toLowerCase().trim();
        const enteredName = `${fullName} ${surname}`.toLowerCase().trim();

        // Check if names match (allow partial match for flexibility)
        const nameMatches = membershipName.includes(fullName.toLowerCase().trim()) ||
          enteredName.includes(membershipName);

        if (!nameMatches) {
          setIsMembershipVerified(false);
          toast({
            title: 'Verification Failed',
            description: 'This membership number is already registered with another user.',
            variant: 'destructive',
          });
          return;
        }

        setIsMembershipVerified(true);
        toast({
          title: 'Verified!',
          description: 'Membership verified successfully',
        });
      } else {
        setIsMembershipVerified(false);
        toast({
          title: 'Verification Failed',
          description: data.message || 'Invalid membership number',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify membership. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 'personal') {
      if (!title || !fullName || !surname || !dob || !gender || !mobile || !email) {
        toast({
          title: 'Required Fields',
          description: 'Please fill all personal information fields',
          variant: 'destructive',
        });
        return;
      }
      if (mobile.length !== 10) {
        toast({
          title: 'Invalid Mobile',
          description: 'Mobile number must be exactly 10 digits',
          variant: 'destructive',
        });
        return;
      }
      // Check Life membership verification
      if (isLifeMember && !isMembershipVerified) {
        toast({
          title: 'Verification Required',
          description: 'Please verify your Life membership number before continuing',
          variant: 'destructive',
        });
        return;
      }
      
      // If Life Member is selected, set delegate type and skip to address
      if (isLifeMember) {
        setDelegateType('life-member');
      }
    }

    if (currentStep === 'address') {
      if (!city || !state || !pinCode) {
        toast({
          title: 'Required Fields',
          description: 'Please fill all address fields',
          variant: 'destructive',
        });
        return;
      }
      if (pinCode.length !== 6) {
        toast({
          title: 'Invalid PIN Code',
          description: 'PIN code must be exactly 6 digits',
          variant: 'destructive',
        });
        return;
      }
      
      // If Life Member is selected, skip registration step and go directly to fee
      if (isLifeMember) {
        setCurrentStep('fee');
        return;
      }
    }

    if (currentStep === 'registration') {
      if (!delegateType) {
        toast({
          title: 'Required Field',
          description: 'Please select delegate category',
          variant: 'destructive',
        });
        return;
      }
      
      // Check Life membership verification if Life Member is selected
      if ((delegateType === 'life member' || delegateType === 'life-member') && !isMembershipVerified) {
        toast({
          title: 'Verification Required',
          description: 'Please verify your Life membership number before continuing',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentStep === 'fee') {
      if (!selectedCategory || !selectedSlab) {
        toast({
          title: 'Required Selection',
          description: 'Please wait while fee is being calculated',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentStep === 'consent') {
      if (!agreedToTerms) {
        toast({
          title: 'Consent Required',
          description: 'Please agree to terms and conditions',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    // Special handling for Life Members - skip registration step when going back
    if (currentStep === 'fee' && isLifeMember) {
      setCurrentStep('address');
      return;
    }
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const generatePaymentReceipt = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header with BOA branding
    doc.setFillColor(11, 60, 93); // BOA Blue
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('OPHTHALMIC ASSOCIATION OF BIHAR', pageWidth / 2, 20, { align: 'center' });

    // Receipt title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRATION RECEIPT', pageWidth / 2, 45, { align: 'center' });

    let yPos = 60;

    // Seminar details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SEMINAR DETAILS', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Event: ${seminar?.name || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Date: ${seminar?.start_date ? new Date(seminar.start_date).toLocaleDateString() : 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Venue: ${seminar?.venue || 'N/A'}`, margin, yPos);
    yPos += 15;

    // Personal details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSONAL DETAILS', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const personalDetails = [
      { label: 'Name', value: `${formatTitle(title)} ${fullName} ${surname}` },
      { label: 'Email', value: email },
      { label: 'Mobile', value: mobile },
      { label: 'Date of Birth', value: dob },
      { label: 'Gender', value: gender },
    ];

    personalDetails.forEach(detail => {
      doc.text(`${detail.label}: ${detail.value}`, margin, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Registration details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRATION DETAILS', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const selectedFee = feeCategories.find(f => f.id.toString() === selectedCategory);
    const selectedSlabLabel = feeSlabs.find(s => s.id.toString() === selectedSlab)?.label || '';

    const registrationDetails = [
      { label: 'Registration Category', value: selectedFee?.name || 'Not selected' },
      { label: 'Fee Slab', value: selectedSlabLabel || 'Not selected' },
      { label: 'Main Registration Fee', value: `₹${selectedAmount.toLocaleString()}` },
    ];

    registrationDetails.forEach(detail => {
      doc.text(`${detail.label}: ${detail.value}`, margin, yPos);
      yPos += 6;
    });

    // Additional persons
    if (additionalPersons.length > 0) {
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL PERSONS', margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      additionalPersons.forEach((person, index) => {
        const categoryName = feeCategories.find(c => c.id.toString() === person.category_id)?.name;
        const slabName = feeSlabs.find(s => s.id.toString() === person.slab_id)?.label;

        doc.text(`${index + 1}. ${person.name}`, margin, yPos);
        yPos += 6;
        doc.text(`   Category: ${categoryName} - ${slabName}`, margin, yPos);
        yPos += 6;
        doc.text(`   Fee: ₹${person.amount.toLocaleString()}`, margin, yPos);
        yPos += 8;
      });
    }

    // Payment summary
    yPos += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 25, 'F');

    const paymentDetails = [
      { label: 'Main Registration', value: `₹${selectedAmount.toLocaleString()}` },
    ];

    if (additionalPersons.length > 0) {
      paymentDetails.push({
        label: `Additional Persons (${additionalPersons.length})`,
        value: `₹${additionalPersons.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}`
      });
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    paymentDetails.forEach((detail, index) => {
      doc.text(detail.label, margin + 3, yPos + (index * 6) + 3);
      doc.text(detail.value, pageWidth - margin - 3, yPos + (index * 6) + 3, { align: 'right' });
    });

    // Total amount
    yPos += 15;
    doc.setFillColor(11, 60, 93);
    doc.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL AMOUNT PAID:', margin + 3, yPos + 4);
    doc.text(`₹${totalAmount.toLocaleString()}`, pageWidth - margin - 3, yPos + 4, { align: 'right' });

    // Footer
    doc.setFillColor(11, 60, 93);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Ophthalmic Association Of Bihar | www.boabihar.org | Email: info@boabihar.org', pageWidth / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });

    doc.save(`BOA_Registration_Receipt_${Date.now()}.pdf`);
  };


  const handlePayment = async () => {
    try {
      // Show processing modal
      setIsProcessingPayment(true);
      
      // Get logged-in user info
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      let loggedInUserId = null;
      
      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          loggedInUserId = userData.id;
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
      
      // Prepare registration data
      const registrationData = {
        user_id: loggedInUserId, // Use logged-in user ID if available, otherwise null for guest
        user_info: {
          title: title,
          full_name: fullName,
          surname: surname,
          email: email,
          mobile: mobile,
          address: `${house} ${street} ${landmark}`.trim(),
          city: city,
          state: state,
          pincode: pinCode
        },
        seminar_id: seminar.id,
        category_id: parseInt(selectedCategory),
        slab_id: parseInt(selectedSlab),
        delegate_type: delegateType,
        amount: selectedAmount,
        additional_persons: additionalPersons.map(p => ({
          name: p.name,
          category_id: parseInt(p.category_id),
          slab_id: parseInt(p.slab_id),
          amount: p.amount
        }))
      };


      // User details for Razorpay prefill
      const userDetails = {
        name: `${formatTitle(title)} ${fullName} ${surname}`,
        email: email,
        mobile: mobile
      };


      // Validate total amount before payment
      if (!totalAmount || typeof totalAmount !== 'number' || isNaN(totalAmount) || totalAmount <= 0) {
        throw new Error(`Invalid payment amount: ${totalAmount}. Please check your fee selection.`);
      }

      // Process payment through Razorpay
      const paymentResult = await razorpayService.processSeminarPayment(
        totalAmount,
        registrationData,
        userDetails
      );


      if (paymentResult && paymentResult.success) {
        setPaymentComplete(true);
        
        // Show success message
        toast({
          title: 'Payment Successful!',
          description: 'Your registration has been confirmed. Redirecting to dashboard...',
        });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        console.error('Payment result indicates failure:', paymentResult);
        throw new Error(paymentResult?.message || 'Payment processing failed');
      }

    } catch (error: any) {
      console.error('Payment error:', error);

      if (error.message === 'Payment cancelled by user') {
        toast({
          title: 'Payment Cancelled',
          description: 'You can try again when ready',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Payment Failed',
          description: error.message || 'Please try again or contact support',
          variant: 'destructive',
        });
      }
    } finally {
      // Hide processing modal
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-6 md:py-8 px-3 sm:px-4" style={{ animation: 'none', transition: 'none', opacity: 1, visibility: 'visible' }}>
        <div className="max-w-7xl mx-auto" style={{ animation: 'none', transition: 'none', opacity: 1, visibility: 'visible' }}>
          {/* Header */}
          <div className="text-center mb-8 md:mb-8 py-4 sm:py-0">
            <Badge className="gradient-gold text-secondary-foreground border-0 mb-4 md:mb-4 text-sm sm:text-sm">
              Registration Open
            </Badge>

            {/* Main Seminar Name */}
            <h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-3 px-2">
              {activeSeminar.name}
            </h1>

            {/* Title/Tagline if exists */}
            {activeSeminar.title && (
              <p className="text-lg sm:text-lg md:text-xl text-black font-semibold mb-4 md:mb-4 px-2">
                {activeSeminar.title}
              </p>
            )}

            {/* Date and Venue Info */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2 text-muted-foreground text-base sm:text-base md:text-lg px-2">
              <span className="font-medium">
                {new Date(activeSeminar.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {activeSeminar.end_date && activeSeminar.start_date !== activeSeminar.end_date && (
                  <> - {new Date(activeSeminar.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                )}
              </span>
              <span className="hidden md:inline">|</span>
              <span className="font-medium">
                {activeSeminar.venue}, {activeSeminar.location}
              </span>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Registration Form */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="mb-6 md:mb-8">
                {/* Mobile Steps - Compact View */}
                <div className="block sm:hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {displaySteps[displayCurrentIndex] && (
                        <>
                          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                            {React.createElement(displaySteps[displayCurrentIndex].icon, { className: "h-4 w-4 text-primary-foreground" })}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{displaySteps[displayCurrentIndex].label}</p>
                            <p className="text-xs text-muted-foreground">Step {displayCurrentIndex + 1} of {displaySteps.length}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {displaySteps.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 w-6 rounded-full transition-colors ${
                            index === displayCurrentIndex
                              ? 'bg-primary'
                              : index < displayCurrentIndex
                              ? 'bg-primary/60'
                              : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desktop Steps - Full View */}
                <div className="hidden sm:flex items-center justify-center gap-2 overflow-x-auto pb-2">
                  {displaySteps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${index === displayCurrentIndex
                        ? 'gradient-primary text-primary-foreground shadow-glow'
                        : index < displayCurrentIndex
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                        {index < displayCurrentIndex ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <step.icon className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">{step.label}</span>
                      </div>
                      {index < displaySteps.length - 1 && (
                        <div className={`w-6 h-0.5 ${index < displayCurrentIndex ? 'bg-primary' : 'bg-border'
                          }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl md:rounded-2xl border border-border p-4 sm:p-6 md:p-8 shadow-card" style={{ animation: 'none', transition: 'none', opacity: 1, visibility: 'visible', transform: 'none' }}>
                {/* Personal Information */}
                {currentStep === 'personal' && (
                  <div className="space-y-6" style={{ animation: 'none', opacity: 1, visibility: 'visible' }}>
                    <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Title <span className="text-destructive">*</span></Label>
                        <Select value={title} onValueChange={setTitle} required>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {titleOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>First Name <span className="text-destructive">*</span></Label>
                        <Input placeholder="First name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Surname <span className="text-destructive">*</span></Label>
                        <Input placeholder="Surname" value={surname} onChange={(e) => setSurname(e.target.value)} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Date of Birth <span className="text-destructive">*</span></Label>
                        <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender <span className="text-destructive">*</span></Label>
                        <Select value={gender} onValueChange={setGender} required>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {genderOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile (10 digits) <span className="text-destructive">*</span></Label>
                        <Input
                          type="tel"
                          placeholder="9876543210"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Email <span className="text-destructive">*</span></Label>
                      <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    {/* Life Member Section */}
                    <div className="bg-accent/30 rounded-lg p-4 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="lifeMember" 
                          checked={isLifeMember} 
                          onCheckedChange={(checked) => {
                            setIsLifeMember(checked as boolean);
                            if (!checked) {
                              setMembershipNo('');
                              setIsMembershipVerified(false);
                              // Clear delegate type if it was set to life-member
                              if (delegateType === 'life-member' || delegateType === 'life member') {
                                setDelegateType('');
                              }
                            } else {
                              // If Life Member is checked, set delegate type
                              setDelegateType('life-member');
                            }
                          }} 
                        />
                        <Label htmlFor="lifeMember" className="text-sm font-medium">
                          I am a Life Member
                        </Label>
                      </div>

                      {isLifeMember && (
                        <div className="space-y-2">
                          <Label>Membership Number <span className="text-destructive">*</span></Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter your membership number"
                              value={membershipNo}
                              onChange={(e) => {
                                setMembershipNo(e.target.value);
                                setIsMembershipVerified(false);
                              }}
                              required={isLifeMember}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleVerifyMembership}
                              disabled={!membershipNo || isVerifying}
                            >
                              {isVerifying ? 'Verifying...' : 'Verify'}
                            </Button>
                          </div>
                          {isMembershipVerified && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <Check className="h-4 w-4" />
                              Membership verified successfully
                            </p>
                          )}
                          {membershipNo && !isMembershipVerified && !isVerifying && (
                            <p className="text-sm text-orange-600">
                              Please verify your membership number
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Address */}
                {currentStep === 'address' && (
                  <div className="space-y-6" style={{ animation: 'none', opacity: 1, visibility: 'visible' }}>
                    <h2 className="text-xl font-semibold text-foreground">Address Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>House/Flat No.</Label>
                        <Input placeholder="Enter house/flat number" value={house} onChange={(e) => setHouse(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Street</Label>
                        <Input placeholder="Enter street" value={street} onChange={(e) => setStreet(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Landmark</Label>
                      <Input placeholder="Enter landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City <span className="text-destructive">*</span></Label>
                        <Input placeholder="Enter city" value={city} onChange={(e) => setCity(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>State <span className="text-destructive">*</span></Label>
                        <Select value={state} onValueChange={setState} required>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {indianStates.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="India">India</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>PIN Code (6 digits) <span className="text-destructive">*</span></Label>
                        <Input
                          placeholder="800001"
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Selection - For All Users */}
                {currentStep === 'registration' && (
                  <div className="space-y-6" style={{ animation: 'none', opacity: 1, visibility: 'visible' }}>
                    <h2 className="text-xl font-semibold text-foreground">Select Category</h2>

                    <div className="space-y-2">
                      <Label>Delegate Category <span className="text-destructive">*</span></Label>
                      <Select value={delegateType} onValueChange={(value) => {
                        setDelegateType(value);
                        
                        // If Life Member is selected, show membership verification
                        if (value === 'life member' || value === 'life-member') {
                          setIsLifeMember(true);
                        } else {
                          setIsLifeMember(false);
                          setMembershipNo('');
                          setIsMembershipVerified(false);
                        }
                      }} required>
                        <SelectTrigger><SelectValue placeholder="Select your category" /></SelectTrigger>
                        <SelectContent>
                          {displayDelegateCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Select your delegate category for the seminar
                      </p>
                    </div>

                    {/* Life Membership Verification - Show if Life Member selected */}
                    {(delegateType === 'life member' || delegateType === 'life-member') && (
                      <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                        <div className="flex items-start gap-2">
                          <div className="text-blue-600 mt-1">
                            <Check className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">Life Member Verification Required</p>
                            <p className="text-sm text-blue-700">Please verify your Life membership number to continue.</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Life Membership Number <span className="text-destructive">*</span></Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter membership number"
                              value={membershipNo}
                              onChange={(e) => {
                                setMembershipNo(e.target.value);
                                setIsMembershipVerified(false);
                              }}
                              disabled={isMembershipVerified}
                              className={isMembershipVerified ? 'bg-green-50 border-green-500' : ''}
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyMembership}
                              disabled={isVerifying || !membershipNo || isMembershipVerified}
                              className="whitespace-nowrap"
                            >
                              {isVerifying ? 'Verifying...' : isMembershipVerified ? '✓ Verified' : 'Verify'}
                            </Button>
                          </div>
                          {isMembershipVerified && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <Check className="h-4 w-4" />
                              Membership verified successfully
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fee Selection */}
                {currentStep === 'fee' && (
                  <div className="space-y-6" style={{ animation: 'none', opacity: 1, visibility: 'visible' }}>
                    <h2 className="text-xl font-semibold text-foreground">Registration Fee</h2>
                    <p className="text-muted-foreground">
                      Your registration fee based on current date and selected category
                    </p>

                    {selectedFee && selectedSlab && (
                      <div className="p-6 rounded-xl border" style={{
                        backgroundColor: 'rgba(55, 235, 121, 0.2)',
                        borderColor: 'rgba(31, 236, 106, 0.3)'
                      }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Registration Fee
                            </p>
                            <p className="text-2xl font-bold text-primary">Rs {selectedAmount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Category: <span className="font-semibold text-foreground">{selectedFee.name}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Fee Slab: <span className="font-semibold text-foreground">{selectedSlabLabel}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!selectedFee && (
                      <div className="p-6 rounded-xl border border-yellow-300 bg-yellow-50">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Fee structure not available for selected delegate category. Please contact admin.
                        </p>
                      </div>
                    )}

                    {/* Add Additional Delegates */}
                    <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">Add Additional Delegates</h3>
                          <p className="text-sm text-muted-foreground">Register spouse, colleagues, or other delegates</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setAdditionalPersons([...additionalPersons, {
                              name: '',
                              category_id: '',
                              slab_id: selectedSlab,
                              amount: 0
                            }]);
                          }}
                          variant="outline"
                          className="h-11 text-sm px-5"
                        >
                          + Add Person
                        </Button>
                      </div>

                      {additionalPersons.length > 0 && (
                        <div className="space-y-4">
                          {additionalPersons.map((person, index) => (
                            <div key={index} className="p-4 bg-background rounded-lg border border-border space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-foreground">Person {index + 1}</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = additionalPersons.filter((_, i) => i !== index);
                                    setAdditionalPersons(updated);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Remove
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Full Name</Label>
                                  <Input
                                    placeholder="Enter full name"
                                    value={person.name}
                                    onChange={(e) => {
                                      const updated = [...additionalPersons];
                                      updated[index].name = e.target.value;
                                      setAdditionalPersons(updated);
                                    }}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Category</Label>
                                  <Select
                                    value={person.category_id?.toString()}
                                    onValueChange={(value) => {
                                      const updated = [...additionalPersons];
                                      updated[index].category_id = value;
                                      const category = feeCategories.find(c => c.id.toString() === value);
                                      if (category && selectedSlab) {
                                        const rawAmount = category.fees[selectedSlab];
                                        updated[index].amount = typeof rawAmount === 'number' && !isNaN(rawAmount) ? rawAmount : 0;
                                        updated[index].slab_id = selectedSlab;
                                      }
                                      setAdditionalPersons(updated);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {feeCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                          {cat.name} - Rs {(selectedSlab && cat.fees[selectedSlab]) ? cat.fees[selectedSlab].toLocaleString() : '0'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {person.amount > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Amount: <span className="font-semibold text-foreground">Rs {person.amount.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="pt-3 border-t border-border">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Additional Delegates Total:</span>
                              <span className="font-semibold text-foreground">
                                Rs {additionalPersons.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold mt-2">
                              <span className="text-foreground">Grand Total:</span>
                              <span className="text-primary">
                                Rs {(selectedAmount + additionalPersons.reduce((sum, p) => sum + (p.amount || 0), 0)).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Consent */}
                {currentStep === 'consent' && (
                  <div className="space-y-6" style={{ animation: 'none', opacity: 1, visibility: 'visible' }}>
                    <h2 className="text-xl font-semibold text-foreground">Consent & Signature</h2>

                    <div className="p-6 bg-muted rounded-xl space-y-4">
                      <h3 className="font-semibold text-foreground">Terms & Conditions</h3>
                      <div className="h-40 overflow-y-auto text-sm text-muted-foreground space-y-2">
                        <p>1. Registration fees once paid are non-refundable.</p>
                        <p>2. BOA reserves the right to modify the program schedule.</p>
                        <p>3. Participants must carry valid ID proof for entry.</p>
                        <p>4. Photographs and videos may be captured during the event for promotional purposes.</p>
                        <p>5. Participants are responsible for their own accommodation and travel arrangements.</p>
                        <p>6. BOA is not liable for any personal loss or damage during the event.</p>
                        <p>7. All intellectual property rights of presentations belong to respective authors.</p>
                        <p>8. Participants must adhere to the code of conduct during the conference.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                        I have read and agree to the BOA rules, regulations, and terms & conditions for {activeSeminar.name}.
                      </label>
                    </div>

                    <div className="space-y-2">
                      <Label>Digital Signature</Label>
                      <div className="p-6 border-2 border-dashed border-border rounded-xl text-center">
                        <p className="text-lg font-signature text-foreground italic">
                          {fullName || 'Your Name Here'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Your full name will be used as digital signature
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment */}
                {currentStep === 'payment' && (
                  <div className="space-y-6" style={{ animation: 'none', opacity: 1, visibility: 'visible' }}>
                    <h2 className="text-xl font-semibold text-foreground">
                      {paymentComplete ? 'Payment Successful!' : 'Payment Summary'}
                    </h2>

                    <div className="p-6 bg-muted rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Seminar</span>
                        <span className="font-medium text-foreground">{activeSeminar.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Delegate Category</span>
                        <span className="font-medium text-foreground capitalize">
                          {delegateCategories.find(d => d.value === delegateType)?.label || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fee Category</span>
                        <span className="font-medium text-foreground">{selectedFee?.name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fee Slab</span>
                        <span className="font-medium text-foreground">{selectedSlabLabel || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Your Amount</span>
                        <span className="font-medium text-foreground">Rs {selectedAmount.toLocaleString()}</span>
                      </div>

                      {additionalPersons.length > 0 && (
                        <>
                          <hr className="border-border" />
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">Additional Delegates ({additionalPersons.length})</p>
                            {additionalPersons.map((person, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{person.name || `Person ${index + 1}`}</span>
                                <span className="font-medium text-foreground">Rs {person.amount.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                              <span className="text-muted-foreground">Additional Total</span>
                              <span className="font-medium text-foreground">Rs {additionalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </>
                      )}

                      <hr className="border-border" />
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-semibold text-foreground">Total Amount</span>
                        <span className="font-bold text-primary">Rs {totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {!paymentComplete ? (
                      <div className="space-y-4">
                        <div className="p-6 border border-border rounded-xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Razorpay Secure Checkout</p>
                              <p className="text-sm text-muted-foreground">Card, UPI, Netbanking, Wallets</p>
                            </div>
                          </div>
                          <Button
                            onClick={handlePayment}
                            className="w-full gradient-primary text-primary-foreground h-12 text-base px-6"
                            disabled={!agreedToTerms || !selectedCategory || !selectedSlab}
                          >
                            Pay Rs {totalAmount.toLocaleString()}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </div>
                        
                        {/* Manual Verification Option */}
                        
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Success Message */}
                        <div className="p-6 border border-primary rounded-xl bg-primary/5 text-center space-y-4">
                          <div className="h-16 w-16 mx-auto rounded-full gradient-primary flex items-center justify-center">
                            <Check className="h-8 w-8 text-primary-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">Registration Complete!</h3>
                          <p className="text-muted-foreground">Your payment has been processed successfully.</p>
                        </div>

                        {/* Detailed Registration Summary */}
                        <div className="bg-card rounded-lg border p-6 space-y-6">
                          <h4 className="text-lg font-semibold text-foreground border-b pb-2">Registration Summary</h4>

                          {/* Personal Information */}
                          <div className="space-y-3">
                            <h5 className="font-medium text-foreground">Personal Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Name:</span>
                                <span className="font-medium">{formatTitle(title)} {fullName} {surname}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium">{email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Mobile:</span>
                                <span className="font-medium">{mobile}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Gender:</span>
                                <span className="font-medium">{gender}</span>
                              </div>
                            </div>
                          </div>

                          {/* Address Information */}
                          <div className="space-y-3">
                            <h5 className="font-medium text-foreground">Address</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">City:</span>
                                <span className="font-medium">{city}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">State:</span>
                                <span className="font-medium">{state}</span>
                              </div>
                            </div>
                          </div>

                          {/* Registration Details */}
                          <div className="space-y-3">
                            <h5 className="font-medium text-foreground">Registration Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Delegate Category:</span>
                                <span className="font-medium">{delegateCategories.find(d => d.value === delegateType)?.label || delegateType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Registration Category:</span>
                                <span className="font-medium">{selectedFee?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fee Slab:</span>
                                <span className="font-medium">{selectedSlabLabel}</span>
                              </div>
                              {delegateType === 'boa-member' && membershipNo && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">BOA Membership:</span>
                                  <span className="font-medium">{membershipNo}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Additional Persons */}
                          {additionalPersons.length > 0 && (
                            <div className="space-y-3">
                              <h5 className="font-medium text-foreground">Additional Delegates ({additionalPersons.length})</h5>
                              <div className="space-y-2">
                                {additionalPersons.map((person, index) => {
                                  const categoryName = feeCategories.find(c => c.id.toString() === person.category_id)?.name;
                                  const slabName = feeSlabs.find(s => s.id.toString() === person.slab_id)?.label;
                                  return (
                                    <div key={index} className="p-3 bg-muted/30 rounded-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                        <div className="flex justify-between md:block">
                                          <span className="text-muted-foreground md:hidden">Name:</span>
                                          <span className="font-medium">{person.name || `Person ${index + 1}`}</span>
                                        </div>
                                        <div className="flex justify-between md:block">
                                          <span className="text-muted-foreground md:hidden">Category:</span>
                                          <span className="font-medium">{categoryName}</span>
                                        </div>
                                        <div className="flex justify-between md:block">
                                          <span className="text-muted-foreground md:hidden">Amount:</span>
                                          <span className="font-medium">₹{(person.amount || 0).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Payment Summary */}
                          <div className="space-y-3 border-t pt-4">
                            <h5 className="font-medium text-foreground">Payment Summary</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Main Registration:</span>
                                <span className="font-medium">₹{selectedAmount.toLocaleString()}</span>
                              </div>
                              {additionalPersons.length > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Additional Delegates:</span>
                                  <span className="font-medium">₹{additionalAmount.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                                <span className="text-foreground">Total Amount Paid:</span>
                                <span className="text-primary">₹{totalAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Transaction ID:</span>
                                <span>TXN{Date.now()}</span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Payment Date:</span>
                                <span>{new Date().toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={generatePaymentReceipt}
                            className="gradient-primary text-primary-foreground h-11 text-sm px-5"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Receipt
                          </Button>
                          <Button
                            onClick={() => navigate('/dashboard')}
                            variant="outline"
                            className="h-11 text-sm px-5"
                          >
                            Go to Dashboard
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={displayCurrentIndex === 0}
                    className="h-11 text-sm px-5"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>

                  {currentStep !== 'payment' && (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="gradient-primary text-primary-foreground h-11 text-sm px-5"
                      disabled={currentStep === 'fee' && (!selectedCategory || !selectedSlab)}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Download Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {/* Offline Form Download */}
                <div className="bg-yellow rounded-lg shadow-lg border border-gray-200">
                  <div className="px-6 py-4" style={{ background: '#0B3C5D' }}>
                    <h3 className="text-lg font-semibold text-white">Offline Registration</h3>
                  </div>
                  <div className="p-6 bg-[#aa962d]">
                    <p className="text-sm text-black mb-4">
                      Prefer to register offline? Download the printable registration form.
                    </p>
                    <Button
                      onClick={generateOfflineRegistrationForm}
                      variant="outline"
                      style={{borderColor:'#0B3C5D'}}
                      className="w-full hover:bg-black hover:text-white border-2"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Form
                    </Button>
                    <p className="text-xs text-black mt-2">
                      Fill the form manually and submit at the registration desk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Committee Members Section */}
          {committeeMembers.length > 0 && (
            <section className="py-12 md:py-16" style={{ background: '#F9FAFB' }}>
              <div className="container max-w-6xl px-4">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-semibold mb-4" style={{ color: '#1F2933' }}>
                    Organizing Committee
                  </h2>
                  <div className="w-24 h-1 mx-auto mb-4" style={{ background: '#C9A227' }}></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {committeeMembers.map((member) => (
                    <div style={{border:"0.5px solid #c7c7c4ff"}} key={member.id} className="rounded-xl p-5 max-w-44 text-center">
                      <div className="relative w-32 h-32 mb-4">
                        <img
                          src={member.image_url || '/api/placeholder/120/120'}
                          alt={member.name}
                          className="h-full w-full rounded-full mx-auto object-cover border-4"
                          style={{ borderColor: '#C9A227' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/120/120';
                          }}
                        />
                      </div>
                      <h3 className="font-semibold text-sm mb-1" style={{ color: '#1F2933' }}>
                        {member.name}
                      </h3>
                      <p className="text-xs" style={{ color: '#616E7C' }}>
                        {member.designation}
                      </p>
                      
                      <p className="text-xs text-blue-600 font-semibold">
                        {member.profession}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
      
      {/* Payment Processing Modal */}
      {isProcessingPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600 text-sm">
              Please wait while we process your payment securely...
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Do not close this window or press back button
            </p>
          </div>
        </div>
      )}
    </>
  );
}
