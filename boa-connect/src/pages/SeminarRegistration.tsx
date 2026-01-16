import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, CreditCard, FileText, User, MapPin, Receipt, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { seminarAPI, registrationAPI } from '@/lib/api';
import { titleOptions, genderOptions, indianStates } from '@/lib/mockData';
type Step = 'personal' | 'address' | 'registration' | 'fee' | 'consent' | 'payment';

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
  const [isBOAMember, setIsBOAMember] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [title, setTitle] = useState('');
  const [fullName, setFullName] = useState('');
  const [surname, setSurname] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
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

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Login Required',
        description: 'Please login to register for seminars',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    
    loadSeminarData();
  }, [id]);

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
        dateRange: slab.date_range
      }));
      setFeeSlabs(slabs);

      // Set delegate categories from API
      const delegateCats = (response.seminar.delegateCategories || []).map((cat: any) => ({
        value: cat.name,
        label: cat.label,
        requiresMembership: cat.requires_membership
      }));
      setDelegateCategories(delegateCats);
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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!seminar) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Seminar not found</p>
            <Button onClick={() => navigate('/seminars')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Seminars
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const activeSeminar = seminar;
  
  // Use dynamic delegate categories from API, fallback to default if empty
  const displayDelegateCategories = delegateCategories.length > 0 ? delegateCategories : [
    { value: 'BOA Member', label: 'BOA MEMBER', requiresMembership: true },
    { value: 'Non BOA Member', label: 'NON BOA MEMBER', requiresMembership: false },
    { value: 'Accompanying Person', label: 'ACCOMPANYING PERSON', requiresMembership: false },
  ];

  const steps: { id: Step; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'registration', label: 'Delegate', icon: FileText },
    { id: 'fee', label: 'Fee', icon: Receipt },
    { id: 'consent', label: 'Consent', icon: Check },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const selectedFee = feeCategories.find(f => f.id.toString() === selectedCategory);
  const selectedAmount = selectedFee && selectedSlab ? selectedFee.fees[selectedSlab] || 0 : 0;
  const selectedSlabLabel = feeSlabs.find(s => s.id.toString() === selectedSlab)?.label || '';
  const additionalAmount = additionalPersons.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAmount = selectedAmount + additionalAmount;

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
      // Check if selected category requires membership
      const selectedCat = displayDelegateCategories.find(c => c.value === delegateType);
      if (selectedCat?.requiresMembership && !membershipNo) {
        toast({
          title: 'Required Field',
          description: 'Please enter BOA membership number to continue',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentStep === 'fee') {
      if (!selectedCategory || !selectedSlab) {
        toast({
          title: 'Required Selection',
          description: 'Please select fee category and slab',
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
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const generatePaymentReceipt = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    doc.setFillColor(0, 128, 128);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Receipt', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(activeSeminar.name, pageWidth / 2, 23, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`${activeSeminar.venue} | ${activeSeminar.location}`, pageWidth / 2, 30, { align: 'center' });

    let yPos = 50;
    doc.setTextColor(0, 0, 0);

    // Receipt details
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 128, 128);
    doc.text('REGISTRATION DETAILS', margin + 3, yPos + 5.5);
    yPos += 14;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const details = [
      { label: 'Name', value: `${fullName} ${surname}` },
      { label: 'Email', value: email },
      { label: 'Mobile', value: mobile },
      { label: 'City', value: city },
      { label: 'State', value: state },
      { label: 'Delegate Category', value: delegateCategories.find(d => d.value === delegateType)?.label || '' },
      { label: 'Registration Category', value: selectedFee?.name || '' },
      { label: 'Fee Slab', value: selectedSlabLabel },
      { label: 'Amount Paid', value: `Rs ${selectedAmount.toLocaleString()}` },
      { label: 'Transaction ID', value: `TXN${Date.now()}` },
      { label: 'Payment Date', value: new Date().toLocaleDateString() },
    ];

    if (delegateType === 'boa-member' && membershipNo) {
      details.splice(6, 0, { label: 'BOA Membership No.', value: membershipNo });
    }

    details.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label + ':', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, margin + 50, yPos);
      yPos += 8;
    });

    yPos += 10;

    // Footer
    doc.setFillColor(0, 128, 128);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Bihar Ophthalmic Association | www.boabihar.org', pageWidth / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });

    doc.save('Registration_Receipt.pdf');
  };

  const handlePayment = async () => {
    try {
      // Prepare registration data
      const registrationData = {
        seminar_id: activeSeminar.id,
        category_id: selectedCategory,
        slab_id: selectedSlab,
        delegate_type: delegateType,
        amount: totalAmount,
        additional_persons: additionalPersons.map(p => ({
          name: p.name,
          category_id: parseInt(p.category_id),
          slab_id: parseInt(p.slab_id),
          amount: p.amount
        }))
      };

      // Submit registration
      const response = await registrationAPI.create(registrationData);
      
      if (response.success) {
        setPaymentComplete(true);
        toast({
          title: 'Success!',
          description: 'Registration completed successfully',
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Registration failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge className="gradient-gold text-secondary-foreground border-0 mb-4">
              Registration Open
            </Badge>
            
            {/* Main Seminar Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {activeSeminar.name}
            </h1>
            
            {/* Title/Tagline if exists */}
            {activeSeminar.title && (
              <p className="text-lg md:text-xl text-primary font-semibold mb-4">
                {activeSeminar.title}
              </p>
            )}
            
            {/* Date and Venue Info */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-muted-foreground text-base md:text-lg">
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

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  index === currentIndex 
                    ? 'gradient-primary text-primary-foreground shadow-glow' 
                    : index < currentIndex 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-6 h-0.5 ${
                    index < currentIndex ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
            {/* Personal Information */}
            {currentStep === 'personal' && (
              <div className="space-y-6 animate-fade-in">
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

                {/* BOA Member Checkbox */}
                <div className="flex items-center space-x-2 p-4 bg-accent/30 rounded-lg border border-border">
                  <Checkbox 
                    id="boa-member" 
                    checked={isBOAMember}
                    onCheckedChange={(checked) => {
                      setIsBOAMember(checked as boolean);
                      if (!checked) setMembershipNo('');
                    }}
                  />
                  <label
                    htmlFor="boa-member"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I am a BOA Member
                  </label>
                </div>

                {/* BOA Membership Number Field */}
                {isBOAMember && (
                  <div className="space-y-2 animate-fade-in p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <Label>BOA Membership Number <span className="text-destructive">*</span></Label>
                    <Input 
                      placeholder="BOA/LM/0001/2023" 
                      value={membershipNo}
                      onChange={(e) => setMembershipNo(e.target.value)}
                      required={isBOAMember}
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your valid BOA membership number for member pricing
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Address */}
            {currentStep === 'address' && (
              <div className="space-y-6 animate-fade-in">
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

            {/* Registration Details */}
            {currentStep === 'registration' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-foreground">Registration Details</h2>

                <div className="space-y-2">
                  <Label>Delegate Category <span className="text-destructive">*</span></Label>
                  <Select value={delegateType} onValueChange={(value) => {
                    setDelegateType(value);
                    // Clear membership number if category doesn't require membership
                    const selectedCat = displayDelegateCategories.find(c => c.value === value);
                    if (!selectedCat?.requiresMembership) {
                      setMembershipNo('');
                    }
                  }} required>
                    <SelectTrigger><SelectValue placeholder="Select delegate category" /></SelectTrigger>
                    <SelectContent>
                      {displayDelegateCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show membership field only when category requires membership */}
                {displayDelegateCategories.find(c => c.value === delegateType)?.requiresMembership && (
                  <div className="space-y-2 animate-fade-in p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <Label>BOA Membership Number <span className="text-destructive">*</span></Label>
                    <Input 
                      placeholder="BOA/LM/0001/2023" 
                      value={membershipNo}
                      onChange={(e) => setMembershipNo(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your valid BOA membership number to continue
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fee Selection */}
            {currentStep === 'fee' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-foreground">Registration Fee Structure</h2>
                <p className="text-muted-foreground">Select your category and preferred fee slab/timeline</p>

                {/* Fee Table with Timeline Selection */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="gradient-primary text-primary-foreground">
                        <th className="px-4 py-3 text-left font-semibold">Category</th>
                        {feeSlabs.map(slab => (
                          <th key={slab.id} className="px-4 py-3 text-center font-semibold">
                            <div className="flex flex-col gap-1">
                              <span>{slab.label}</span>
                              <span className="text-xs opacity-75">{slab.dateRange}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {feeCategories.map((category, index) => (
                        <tr 
                          key={category.id} 
                          className={`border-b border-border transition-colors ${
                            selectedCategory === category.id ? 'bg-accent/50' : index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {category.name}
                            {category.isPopular && <Badge className="ml-2 gradient-primary text-primary-foreground border-0 text-xs">Popular</Badge>}
                          </td>
                          {feeSlabs.map(slab => (
                            <td key={slab.id} className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(category.id.toString());
                                  setSelectedSlab(slab.id.toString());
                                }}
                                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                                  selectedCategory === category.id.toString() && selectedSlab === slab.id.toString()
                                    ? 'gradient-primary text-primary-foreground shadow-glow'
                                    : 'bg-muted hover:bg-accent text-foreground'
                                }`}
                              >
                                Rs {category.fees[slab.id].toLocaleString()}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedFee && selectedSlab && (
                  <div className="p-4 bg-accent/50 rounded-xl border border-primary/30">
                    <p className="text-sm text-muted-foreground mb-1">
                      Selected: <span className="font-semibold text-foreground">{selectedFee.name}</span> - 
                      <span className="font-semibold text-foreground ml-1">{selectedSlabLabel}</span>
                    </p>
                    <p className="text-2xl font-bold text-primary">Rs {selectedAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedFee.description}</p>
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
                      size="sm"
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
                                    updated[index].amount = category.fees[selectedSlab] || 0;
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
              <div className="space-y-6 animate-fade-in">
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
              <div className="space-y-6 animate-fade-in">
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
                      className="w-full gradient-primary text-primary-foreground"
                      size="lg"
                      disabled={!agreedToTerms || !selectedCategory || !selectedSlab}
                    >
                      Pay Rs {totalAmount.toLocaleString()}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 border border-primary rounded-xl bg-primary/5 text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full gradient-primary flex items-center justify-center">
                      <Check className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Registration Complete!</h3>
                    <p className="text-muted-foreground">Your payment has been processed successfully.</p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={generatePaymentReceipt} 
                        className="gradient-primary text-primary-foreground"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Receipt
                      </Button>
                      <Button 
                        onClick={() => navigate('/dashboard')} 
                        variant="outline"
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
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep !== 'payment' && (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  className="gradient-primary text-primary-foreground"
                  disabled={currentStep === 'fee' && (!selectedCategory || !selectedSlab)}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
