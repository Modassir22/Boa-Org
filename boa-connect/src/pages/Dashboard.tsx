import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, FileText, CreditCard, Download, Calendar, ArrowRight, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { userAPI, registrationAPI, seminarAPI } from '@/lib/api';
import { titleOptions, genderOptions, indianStates } from '@/lib/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [membershipData, setMembershipData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeSeminar, setActiveSeminar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    first_name: '',
    surname: '',
    mobile: '',
    gender: '',
    city: '',
    state: ''
  });
  const [passwordFormData, setPasswordFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadUserData();
    
    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadUserData = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Load user profile
      const profileResponse = await userAPI.getProfile();
      setUser(profileResponse.user);

      // Load membership details
      try {
        const membershipResponse = await userAPI.getMembershipDetails();
        console.log('Membership response:', membershipResponse);
        console.log('Membership type:', membershipResponse.membership?.membership_type);
        setMembershipData(membershipResponse.membership);
      } catch (error) {
        console.error('No membership data found',error);
      }

      // Load registrations
      try {
        const regResponse = await registrationAPI.getMyRegistrations();
        
        if (regResponse.registrations && Array.isArray(regResponse.registrations)) {
          setRegistrations(regResponse.registrations);
        } else {
          console.error('Invalid registrations data:', regResponse);
          setRegistrations([]);
        }
      } catch (regError: any) {
        console.error('Failed to load registrations:', regError);
        console.error('Error response:', regError.response);
        console.error('Error message:', regError.message);
        setRegistrations([]);
        
        // Show error toast
        toast({
          title: 'Error',
          description: 'Failed to load registrations: ' + (regError.response?.data?.message || regError.message),
          variant: 'destructive'
        });
      }

      // Load active seminar
      try {
        const seminarResponse = await seminarAPI.getActive();
        setActiveSeminar(seminarResponse.seminar);
      } catch (error) {
        console.error('No active seminar found',error);
      }

    } catch (error: any) {
      console.error('Load data error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditFormData({
      title: user.title || '',
      first_name: user.first_name || '',
      surname: user.surname || '',
      mobile: user.mobile || '',
      gender: user.gender || '',
      city: user.city || '',
      state: user.state || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Prepare complete profile data
      const updateData = {
        title: editFormData.title,
        first_name: editFormData.first_name,
        surname: editFormData.surname,
        mobile: editFormData.mobile,
        phone: user.phone || '',
        gender: editFormData.gender,
        dob: user.dob || null,
        house: user.house || '',
        street: user.street || '',
        landmark: user.landmark || '',
        city: editFormData.city,
        state: editFormData.state,
        country: user.country || 'India',
        pin_code: user.pin_code || ''
      };

      await userAPI.updateProfile(updateData);

      // Reload user data
      const profileResponse = await userAPI.getProfile();
      setUser(profileResponse.user);

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(profileResponse.user));

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordFormData.new_password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      await userAPI.changePassword({
        current_password: passwordFormData.current_password,
        new_password: passwordFormData.new_password
      });

      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });

      setPasswordFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = async (reg: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Load and add logo
    const logoUrl = 'https://res.cloudinary.com/derzj7d4u/image/upload/v1768477374/boa-certificates/pjm2se9296raotekzmrc.png';
    
    try {
      // Load image as base64
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        // Header with logo
        doc.setFillColor(0, 128, 128);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Add logo on the left side
        try {
          doc.addImage(base64data, 'PNG', margin, 5, 30, 30);
        } catch (error) {
          console.error('Error adding logo:', error);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Registration Receipt', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(reg.seminar_name, pageWidth / 2, 23, { align: 'center' });

        doc.setFontSize(10);
        doc.text(reg.location || '', pageWidth / 2, 30, { align: 'center' });

        let yPos = 55;
        doc.setTextColor(0, 0, 0);

        // Receipt details
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 128, 128);
        doc.text('REGISTRATION DETAILS', margin + 3, yPos + 5.5);
        yPos += 14;

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const details = [
          { label: 'Registration No', value: reg.registration_no },
          { label: 'Name', value: `${getDisplayTitle(user.title)} ${user.first_name} ${user.surname}` },
          { label: 'Email', value: user.email },
          { label: 'Mobile', value: user.mobile },
          { label: 'Gender', value: user.gender || 'N/A' },
          { label: 'Category', value: reg.category_name },
          { label: 'Fee Slab', value: reg.slab_label },
          { label: 'Amount', value: `Rs ${parseFloat(reg.amount).toLocaleString()}` },
          { label: 'Status', value: reg.status.toUpperCase() },
          { label: 'Transaction ID', value: reg.transaction_id || 'N/A' },
          { label: 'Date', value: new Date(reg.created_at).toLocaleDateString() },
        ];

        details.forEach(item => {
          doc.setFont('helvetica', 'bold');
          doc.text(item.label + ':', margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(item.value, margin + 50, yPos);
          yPos += 8;
        });

        // Additional persons
        if (reg.additional_persons && reg.additional_persons.length > 0) {
          yPos += 5;
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 128, 128);
          doc.text('ADDITIONAL PERSONS', margin + 3, yPos + 5.5);
          yPos += 14;

          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');

          reg.additional_persons.forEach((person: any, index: number) => {
            doc.text(`${index + 1}. ${person.name}`, margin, yPos);
            doc.text(`${person.category_name} - Rs ${parseFloat(person.amount).toLocaleString()}`, margin + 50, yPos);
            yPos += 7;
          });
        }

        // Footer
        doc.setFillColor(0, 128, 128);
        doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Ophthalmic Association Of Bihar | www.boabihar.org', pageWidth / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });

        doc.save(`Registration_${reg.registration_no}.pdf`);
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading logo, generating PDF without logo:', error);
      
      // Fallback: Generate PDF without logo
      doc.setFillColor(0, 128, 128);
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Registration Receipt', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(reg.seminar_name, pageWidth / 2, 23, { align: 'center' });

      doc.setFontSize(10);
      doc.text(reg.location || '', pageWidth / 2, 30, { align: 'center' });

      let yPos = 50;
      doc.setTextColor(0, 0, 0);

      // Receipt details
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 128, 128);
      doc.text('REGISTRATION DETAILS', margin + 3, yPos + 5.5);
      yPos += 14;

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const details = [
        { label: 'Registration No', value: reg.registration_no },
        { label: 'Name', value: `${getDisplayTitle(user.title)} ${user.first_name} ${user.surname}` },
        { label: 'Email', value: user.email },
        { label: 'Mobile', value: user.mobile },
        { label: 'Gender', value: user.gender || 'N/A' },
        { label: 'Category', value: reg.category_name },
        { label: 'Fee Slab', value: reg.slab_label },
        { label: 'Amount', value: `Rs ${parseFloat(reg.amount).toLocaleString()}` },
        { label: 'Status', value: reg.status.toUpperCase() },
        { label: 'Transaction ID', value: reg.transaction_id || 'N/A' },
        { label: 'Date', value: new Date(reg.created_at).toLocaleDateString() },
      ];

      details.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.label + ':', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(item.value, margin + 50, yPos);
        yPos += 8;
      });

      // Additional persons
      if (reg.additional_persons && reg.additional_persons.length > 0) {
        yPos += 5;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 128, 128);
        doc.text('ADDITIONAL PERSONS', margin + 3, yPos + 5.5);
        yPos += 14;

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        reg.additional_persons.forEach((person: any, index: number) => {
          doc.text(`${index + 1}. ${person.name}`, margin, yPos);
          doc.text(`${person.category_name} - Rs ${parseFloat(person.amount).toLocaleString()}`, margin + 50, yPos);
          yPos += 7;
        });
      }

      // Footer
      doc.setFillColor(0, 128, 128);
      doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Ophthalmic Association Of Bihar | www.boabihar.org', pageWidth / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });

      doc.save(`Registration_${reg.registration_no}.pdf`);
    }
  };

  const getDisplayTitle = (title: string) => {
    const titleMap: any = {
      'dr': 'Dr.',
      'mr': 'Mr.',
      'mrs': 'Mrs.',
      'ms': 'Ms.',
      'prof': 'Prof.'
    };
    return titleMap[title?.toLowerCase()] || title || '';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const totalPaid = registrations.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Welcome, {getDisplayTitle(user.title)} {user.first_name}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Manage your registrations and profile
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Sidebar - Full width on mobile */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Profile Card - Responsive */}
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-card">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                      {getDisplayTitle(user.title)} {user.first_name} {user.surname}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                    {user.membership_no && membershipData?.membership_type && (
                      <Badge className="mt-1 bg-yellow-400 text-black border-0 hover:bg-yellow-500 text-xs">
                        {user.membership_no}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Email</span>
                    <span className="text-foreground text-right break-all">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Mobile</span>
                    <span className="text-foreground">{user.mobile}</span>
                  </div>
                  {membershipData?.membership_type && membershipData?.status === 'active' ? (
                    <>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-muted-foreground flex-shrink-0">Membership Type</span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {membershipData.membership_type}
                        </Badge>
                      </div>
                      {membershipData?.payment_type && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-muted-foreground">Payment Type</span>
                          <Badge variant="outline" className="capitalize">
                            {membershipData.payment_type}
                          </Badge>
                        </div>
                      )}
                      {membershipData?.payment_status && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Status</span>
                          <Badge className={`${membershipData.payment_status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            membershipData.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                            {membershipData.payment_status}
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Membership Status</span>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        No Active Membership
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City</span>
                    <span className="text-foreground">{user.city || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State</span>
                    <span className="text-foreground">{user.state || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => navigate('/membership-details')}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Membership
                  </Button>
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" onClick={handleEditProfile}>
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateProfile} className="space-y-4" noValidate>
                        {/* Read-only Information Section */}
                        <div className="bg-accent/30 rounded-lg p-4 mb-4">
                          <h3 className="font-semibold mb-2 text-foreground">Account Information (Read-Only)</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            These details are managed by BOA administrators and cannot be changed by users.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-muted-foreground">Email Address</Label>
                              <div className="mt-1 p-2 bg-muted rounded border text-foreground">
                                {user.email}
                              </div>
                            </div>
                            {membershipData?.membership_type && (
                              <div>
                                <Label className="text-muted-foreground">Membership Type</Label>
                                <div className="mt-1 p-2 bg-muted rounded border">
                                  <Badge variant="outline" className="capitalize">
                                    {membershipData.membership_type}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            {membershipData?.payment_type && (
                              <div>
                                <Label className="text-muted-foreground">Payment Type</Label>
                                <div className="mt-1 p-2 bg-muted rounded border">
                                  <Badge variant="outline" className="capitalize">
                                    {membershipData.payment_type}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            {user.membership_no && membershipData?.membership_type && (
                              <div>
                                <Label className="text-muted-foreground">Membership Number</Label>
                                <div className="mt-1 p-2 bg-muted rounded border">
                                  <Badge className="bg-yellow-400 text-black border-0">
                                    {user.membership_no}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Editable Information Section */}
                        <div>
                          <h3 className="font-semibold mb-3 text-foreground">Personal Information (Editable)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Select value={editFormData.title} onValueChange={(v) => setEditFormData({ ...editFormData, title: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {titleOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select value={editFormData.gender} onValueChange={(v) => setEditFormData({ ...editFormData, gender: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {genderOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input value={editFormData.first_name} onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Surname</Label>
                            <Input value={editFormData.surname} onChange={(e) => setEditFormData({ ...editFormData, surname: e.target.value })} required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Mobile</Label>
                          <Input value={editFormData.mobile} onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Input value={editFormData.city} onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>State</Label>
                            <Select value={editFormData.state} onValueChange={(v) => setEditFormData({ ...editFormData, state: v })}>
                              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                              <SelectContent>
                                {indianStates.map(state => (
                                  <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                            Cancel
                          </Button>
                          <Button type="submit" className="gradient-primary text-primary-foreground w-full sm:w-auto" disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Update Profile'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                        <div className="space-y-2">
                          <Label>Current Password</Label>
                          <Input
                            type="password"
                            value={passwordFormData.current_password}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, current_password: e.target.value })}
                            required
                            placeholder="Enter current password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>New Password</Label>
                          <Input
                            type="password"
                            value={passwordFormData.new_password}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, new_password: e.target.value })}
                            required
                            placeholder="Enter new password (min 6 characters)"
                            minLength={6}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Confirm New Password</Label>
                          <Input
                            type="password"
                            value={passwordFormData.confirm_password}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, confirm_password: e.target.value })}
                            required
                            placeholder="Re-enter new password"
                            minLength={6}
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                          <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" className="gradient-primary text-primary-foreground" disabled={isUpdating}>
                            {isUpdating ? 'Changing...' : 'Change Password'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {activeSeminar && activeSeminar.online_registration_enabled === 1 && (
                    <Link to={`/seminar/${activeSeminar.id}/register`}>
                      <Button className="w-full mb-2 justify-start gradient-primary text-primary-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        Register for {activeSeminar.name}
                      </Button>
                    </Link>
                  )}
                  <Link to="/certificates">
                    <Button variant="outline" className="w-full mb-2 justify-start">
                      <Award className="mr-2 h-4 w-4" />
                      My Certificates
                    </Button>
                  </Link>
                  <Link to="/seminars">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      View All Seminars
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{registrations.length}</p>
                      <p className="text-sm text-muted-foreground">Registrations</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg gradient-gold flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        Rs {totalPaid.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 shadow-card col-span-2 md:col-span-1">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                      <FileText className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{registrations.length}</p>
                      <p className="text-sm text-muted-foreground">PDFs Available</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registrations */}
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Your Registrations</h3>
                </div>

                {registrations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {registrations.map((reg) => (
                      <div key={reg.id} className="p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{reg.seminar_name}</h4>
                              <Badge
                                className={reg.status === 'completed' || reg.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700 border-0'
                                  : reg.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700 border-0'
                                    : 'bg-red-100 text-red-700 border-0'
                                }
                              >
                                {reg.status === 'confirmed' ? 'completed' : reg.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {reg.category_name} • Rs {parseFloat(reg.amount).toLocaleString()} • {new Date(reg.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Reg ID: {reg.registration_no} {reg.transaction_id && `| Txn: ${reg.transaction_id}`}
                            </p>
                            {reg.additional_persons && reg.additional_persons.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Additional: {reg.additional_persons.map((p: any) => p.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(reg)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No registrations yet</p>
                    {activeSeminar && activeSeminar.online_registration_enabled === 1 ? (
                      <Link to={`/seminar/${activeSeminar.id}/register`}>
                        <Button className="gradient-primary text-primary-foreground">
                          Register for {activeSeminar.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/seminars">
                        <Button className="gradient-primary text-primary-foreground">
                          View All Seminars
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
