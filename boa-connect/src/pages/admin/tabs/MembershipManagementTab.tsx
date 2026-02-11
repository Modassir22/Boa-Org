import { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import './MembershipManagementTab.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { Search, Edit, Award, Calendar, User, Mail, Phone, Download, Upload, FileText, X, CheckCircle, Trash2, DollarSign } from 'lucide-react';
import { exportToCSV, formatMembershipForExport } from '@/lib/exportUtils';

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

export default function MembershipManagementTab() {
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isCertificateMenuOpen, setIsCertificateMenuOpen] = useState(false);
  const [certificateViewMode, setCertificateViewMode] = useState<'list' | 'upload'>('list');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddOfflineOpen, setIsAddOfflineOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [membershipCategories, setMembershipCategories] = useState<any[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [offlineForm, setOfflineForm] = useState({
    email: '',
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
    membership_type: '',
    payment_type: '',
    amount: '',
    transaction_id: '',
    valid_from: '',
    valid_until: '',
    notes: ''
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateForm, setCertificateForm] = useState({
    title: '',
    description: '',
    issue_date: '',
    expiry_date: '',
    certificate_type: 'membership'
  });
  const [memberCertificates, setMemberCertificates] = useState<any[]>([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [isDeletingCertificate, setIsDeletingCertificate] = useState(false);
  const [editForm, setEditForm] = useState({
    membership_no: '',
    membership_type: '',
    status: 'active',
    valid_from: '',
    valid_until: '',
    notes: ''
  });

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (isAddOfflineOpen) {
      loadUsers();
      loadMembershipCategories();
    }
  }, [isAddOfflineOpen]);

  useEffect(() => {
    if (isEditOpen) {
      loadMembershipCategories();
    }
  }, [isEditOpen]);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, members]);

  const loadMembers = async () => {
    try {
      const response = await adminAPI.getAllMembers();
      setMembers(response.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMembershipCategories = async () => {
    try {
      const response = await adminAPI.getMembershipCategories();
      setMembershipCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load membership categories:', error);
    }
  };

  const handleUserSelect = useCallback((email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      // Use flushSync to force synchronous update and prevent blink
      flushSync(() => {
        setSelectedUserEmail(email);
      });
      flushSync(() => {
        setOfflineForm(prev => ({ 
          ...prev, 
          email: email,
          name: `${formatTitle(user.title)} ${user.first_name} ${user.surname}`.trim(),
          mobile: user.mobile || '',
          address: `${user.house || ''} ${user.street || ''} ${user.landmark || ''} ${user.city || ''} ${user.state || ''}`.trim()
        }));
      });
    }
  }, [users]);

  const handleAddOfflineMembership = async () => {
    try {
      if (!offlineForm.email || !offlineForm.membership_type) {
        toast({
          title: 'Missing Fields',
          description: 'Email and membership type are required',
          variant: 'destructive',
        });
        return;
      }

      await adminAPI.addOfflineMembership(offlineForm);
      
      toast({
        title: 'Success',
        description: 'Offline membership added successfully',
      });
      
      setIsAddOfflineOpen(false);
      setSelectedUserEmail('');
      setOfflineForm({
        email: '',
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
        membership_type: '',
        payment_type: '',
        amount: '',
        transaction_id: '',
        valid_from: '',
        valid_until: '',
        notes: ''
      });
      loadMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add offline membership',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin/members/sample-template`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'membership_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Template downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to import',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', bulkImportFile);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin/members/bulk-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setImportResult(data.result);
        toast({
          title: 'Import Completed',
          description: `${data.result.success} memberships imported successfully, ${data.result.failed} failed`,
        });
        loadMembers();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import memberships',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkImportFile(file);
      setImportResult(null);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredMembers.length > 0 ? filteredMembers : members;
    const formattedData = formatMembershipForExport(dataToExport);
    exportToCSV(formattedData, 'export_membership_registration');
    toast({
      title: 'Success',
      description: `Exported ${dataToExport.length} memberships to CSV`,
    });
  };

  const filterMembers = () => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter(member => 
      member.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.membership_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.mobile?.includes(searchQuery)
    );
    setFilteredMembers(filtered);
  };

  const handleAddCertificate = (member: any) => {
    setSelectedMember(member);
    setCertificateForm({
      title: '',
      description: '',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      certificate_type: 'membership'
    });
    setCertificateFile(null);
    setCertificatePreview(null);
    setUploadSuccess(false);
    // Load existing certificates for this member
    loadMemberCertificates(member.id);
    // Show menu to choose between view and upload
    setIsCertificateMenuOpen(true);
  };

  const loadMemberCertificates = async (memberId: string) => {
    setIsLoadingCertificates(true);
    try {
      // Extract actual user ID from membership registration
      // memberId can be 'mr_32' format, we need to get user_id from email
      const member = members.find(m => m.id === memberId);
      if (!member || !member.email) {
        setMemberCertificates([]);
        return;
      }
      
      // Get user_id from email
      const userResponse = await adminAPI.get(`/admin/users?email=${encodeURIComponent(member.email)}`);
      if (userResponse.users && userResponse.users.length > 0) {
        const userId = userResponse.users[0].id;
        const response = await adminAPI.getUserCertificates(userId);
        setMemberCertificates(response.certificates || []);
      } else {
        setMemberCertificates([]);
      }
    } catch (error) {
      console.error('Failed to load certificates:', error);
      setMemberCertificates([]);
    } finally {
      setIsLoadingCertificates(false);
    }
  };

  const handleDeleteCertificate = async (certificateId: number) => {
    if (!confirm('Are you sure you want to delete this certificate?')) {
      return;
    }

    setIsDeletingCertificate(true);
    try {
      await adminAPI.deleteCertificate(certificateId);
      toast({
        title: 'Success',
        description: 'Certificate deleted successfully',
      });
      // Reload certificates
      if (selectedMember) {
        loadMemberCertificates(selectedMember.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete certificate',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingCertificate(false);
    }
  };

  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF, JPEG, or PNG file',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please upload a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setCertificateFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCertificatePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setCertificatePreview(null);
      }
    }
  };

  const handleUploadCertificate = async () => {
    if (!certificateFile || !selectedMember) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!certificateForm.title.trim()) {
      toast({
        title: 'Missing Title',
        description: 'Please enter a certificate title',
        variant: 'destructive',
      });
      return;
    }

    if (!certificateForm.issue_date) {
      toast({
        title: 'Missing Issue Date',
        description: 'Please select an issue date',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingCertificate(true);

    try {
      // Get actual user_id from email
      if (!selectedMember.email) {
        throw new Error('Member email not found');
      }
      
      const userResponse = await adminAPI.get(`/admin/users?email=${encodeURIComponent(selectedMember.email)}`);
      if (!userResponse.users || userResponse.users.length === 0) {
        throw new Error('User not found');
      }
      
      const userId = userResponse.users[0].id;

      const formData = new FormData();
      formData.append('certificate', certificateFile);
      formData.append('user_id', userId.toString());
      formData.append('title', certificateForm.title.trim());
      formData.append('description', certificateForm.description.trim());
      formData.append('issue_date', certificateForm.issue_date);
      formData.append('expiry_date', certificateForm.expiry_date);
      formData.append('certificate_type', certificateForm.certificate_type);

      
      const response = await adminAPI.uploadCertificate(formData);
      
      toast({
        title: 'Success',
        description: 'Certificate uploaded successfully! You can upload another certificate or close this dialog.',
      });
      
      // Set success state but DON'T reset form - keep it visible
      setUploadSuccess(true);
      
      // Reload certificates list
      if (selectedMember) {
        loadMemberCertificates(selectedMember.id);
      }
      
    } catch (error: any) {
      console.error('Certificate upload error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let errorMessage = 'Failed to upload certificate';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Upload timeout - Please try with a smaller file (max 5MB recommended).';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error - Please check your internet connection and try again.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File is too large. Maximum size is 5MB.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsUploadingCertificate(false);
    }
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setEditForm({
      membership_no: member.membership_no || '',
      membership_type: member.membership_type || 'standard',
      status: member.status || 'active',
      valid_from: member.valid_from ? member.valid_from.split('T')[0] : '',
      valid_until: member.valid_until ? member.valid_until.split('T')[0] : '',
      notes: member.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleEditFormChange = useCallback((field: string, value: any) => {
    flushSync(() => {
      setEditForm(prev => ({ ...prev, [field]: value }));
    });
  }, []);

  const handleSaveMember = async () => {
    try {
      // Check availability before saving
      if (editForm.membership_no) {
        const isAvailable = await checkMembershipAvailability(editForm.membership_no);
        if (!isAvailable) {
          return; // Don't save if there's a conflict
        }
      }

      await adminAPI.updateMembershipDetails(selectedMember.id, editForm);
      toast({
        title: 'Success',
        description: 'Membership details updated successfully',
      });
      setIsEditOpen(false);
      loadMembers();
    } catch (error: any) {
      if (error.response?.data?.conflict) {
        toast({
          title: 'Membership Number Conflict',
          description: error.response.data.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update membership',
          variant: 'destructive',
        });
      }
    }
  };

  const generateMembershipNumber = async () => {
    try {
      // Get the last membership number from database (global sequence)
      const response = await adminAPI.get(`/admin/last-membership-number?prefix=LM`);
      const lastNumber = response.lastNumber || 0;
      const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
      
      return `LM${nextNumber}`;
    } catch (error) {
      console.error('Error generating membership number:', error);
      // Fallback to random if API fails
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `LM${randomNum}`;
    }
  };

  const assignMembershipNumber = async () => {
    if (!editForm.membership_no) {
      const newNumber = await generateMembershipNumber();
      setEditForm(prev => ({
        ...prev,
        membership_no: newNumber
      }));
    }
  };

  const checkMembershipAvailability = async (membershipNo: string) => {
    if (!membershipNo || membershipNo.length < 3) return;
    
    setIsCheckingAvailability(true);
    try {
      const response = await adminAPI.get(`/admin/check-membership-availability?membership_no=${encodeURIComponent(membershipNo)}&user_id=${selectedMember?.id || ''}`);
      
      if (!response.available) {
        toast({
          title: 'Membership Number Conflict',
          description: response.message,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('Availability check error:', error);
      toast({
        title: 'Error',
        description: 'Failed to check membership number availability',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleMembershipNumberChange = async (value: string) => {
    setEditForm(prev => ({ ...prev, membership_no: value }));
    
    // Debounce the availability check
    if (value && value.length >= 3) {
      setTimeout(() => {
        checkMembershipAvailability(value);
      }, 500);
    }
  };

  const handleDeleteMembership = (member: any) => {
    setMemberToDelete(member);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteMembership = async () => {
    if (!memberToDelete) return;

    setIsDeleting(true);
    try {
      await adminAPI.deleteMembership(memberToDelete.id);
      toast({
        title: 'Success',
        description: `${memberToDelete.first_name} ${memberToDelete.surname}'s membership deleted successfully. User account remains active.`,
        duration: 3000,
      });
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
      loadMembers(); // Reload the members list
    } catch (error: any) {
      console.error('Delete membership error:', error);
      
      let errorMessage = 'Failed to delete membership';
      if (error.response?.status === 404) {
        errorMessage = 'Membership not found. It may have already been deleted.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const exportMembersList = async () => {
    try {
      // This would trigger a download from the backend
      window.open('/api/admin/export-members', '_blank');
      toast({
        title: 'Export Started',
        description: 'Members list export has been initiated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export members list',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Paid Members Only</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddOfflineOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Add Single
          </Button>
          <Button onClick={() => setIsBulkImportOpen(true)} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={handleExportCSV} className="gradient-primary">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Membership Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All paid memberships</p>
          </CardContent>
        </Card>

        {/* Total Payment (Combined) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{members
                .filter(m => ['completed', 'paid', 'active'].includes(m.status?.toLowerCase()))
                .reduce((sum, m) => sum + parseFloat(m.amount || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Online + Offline</p>
          </CardContent>
        </Card>

        {/* Online Payments Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {members.filter(m => m.transaction_id).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{members
                .filter(m => m.transaction_id && ['completed', 'paid', 'active'].includes(m.status?.toLowerCase()))
                .reduce((sum, m) => sum + parseFloat(m.amount || 0), 0)
                .toLocaleString()} paid
            </p>
          </CardContent>
        </Card>

        {/* Offline Payments Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {members.filter(m => !m.transaction_id).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{members
                .filter(m => !m.transaction_id && ['completed', 'paid', 'active'].includes(m.status?.toLowerCase()))
                .reduce((sum, m) => sum + parseFloat(m.amount || 0), 0)
                .toLocaleString()} paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {filteredMembers.length} members
        </Badge>
      </div>

      {/* Members Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Member Details</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Membership No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}.
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {formatTitle(member.title)} {member.first_name} {member.surname}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Member since {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {member.mobile}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {member.membership_no ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {member.membership_no}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Not Assigned
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {member.membership_type || 'Standard'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${
                    member.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                    member.status === 'inactive' ? 'bg-red-100 text-red-800 border-red-200' :
                    member.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    member.status === 'expired' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {member.status === 'active' ? 'Active' :
                     member.status === 'inactive' ? 'Inactive' :
                     member.status === 'pending' ? 'Pending' :
                     member.status === 'expired' ? 'Expired' :
                     'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.valid_until ? (
                    <div className="text-sm">
                      {new Date(member.valid_until).toLocaleDateString()}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-blue-600">
                      Lifetime
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMember(member)}
                      title="Edit Membership"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddCertificate(member)}
                      title="Add Certificate"
                    >
                      <Award className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMembership(member)}
                      title="Delete Membership Only"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredMembers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Paid Members Found</h3>
        </div>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl no-animations">
          <DialogHeader>
            <DialogTitle>
              Edit Membership - {selectedMember && `${formatTitle(selectedMember.title)} ${selectedMember.first_name} ${selectedMember.surname}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6">

              {/* Membership Details Form */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Membership Number</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={editForm.membership_no}
                        onChange={(e) => handleMembershipNumberChange(e.target.value)}
                        placeholder="BOA/LM/0001/2024"
                        className={isCheckingAvailability ? 'border-yellow-300' : ''}
                      />
                      {isCheckingAvailability && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={assignMembershipNumber}
                      disabled={!!editForm.membership_no}
                    >
                      Generate
                    </Button>
                  </div>
                  {editForm.membership_no && (
                    <p className="text-xs text-muted-foreground">
                      {isCheckingAvailability ? 'Checking availability...' : 'Membership number will be validated before saving'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Membership Type</Label>
                  <Select value={editForm.membership_type} onValueChange={(value) => handleEditFormChange('membership_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ animation: 'none', transition: 'none' }}>
                      {membershipCategories.length > 0 ? (
                        membershipCategories.map((category) => (
                          <SelectItem key={category.id} value={category.title}>
                            {category.title}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="lifetime">Lifetime</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="honorary">Honorary</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => handleEditFormChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ animation: 'none', transition: 'none' }}>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={editForm.valid_from}
                    onChange={(e) => setEditForm(prev => ({ ...prev, valid_from: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valid Until (Leave empty for lifetime)</Label>
                  <Input
                    type="date"
                    value={editForm.valid_until}
                    onChange={(e) => setEditForm(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this membership..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMember} className="gradient-primary">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Certificate Menu Dialog - Choose View or Upload */}
      <Dialog open={isCertificateMenuOpen} onOpenChange={setIsCertificateMenuOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Certificate Management - {selectedMember && `${formatTitle(selectedMember.title)} ${selectedMember.first_name} ${selectedMember.surname}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose an action for managing certificates:
            </p>
            
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setCertificateViewMode('list');
                  setIsCertificateMenuOpen(false);
                  setIsCertificateOpen(true);
                }}
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 mt-0.5 text-primary" />
                  <div className="text-left">
                    <div className="font-semibold">View Certificates</div>
                    <div className="text-xs text-muted-foreground">
                      View and manage existing certificates
                      {memberCertificates.length > 0 && ` (${memberCertificates.length} certificate${memberCertificates.length > 1 ? 's' : ''})`}
                    </div>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => {
                  setCertificateViewMode('upload');
                  setIsCertificateMenuOpen(false);
                  setIsCertificateOpen(true);
                }}
              >
                <div className="flex items-start gap-3">
                  <Upload className="h-5 w-5 mt-0.5 text-primary" />
                  <div className="text-left">
                    <div className="font-semibold">Upload New Certificate</div>
                    <div className="text-xs text-muted-foreground">
                      Add a new certificate for this member
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Certificate Dialog */}
      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {certificateViewMode === 'list' ? 'View Certificates' : 'Upload Certificate'} - {selectedMember && `${formatTitle(selectedMember.title)} ${selectedMember.first_name} ${selectedMember.surname}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6">
              {certificateViewMode === 'list' ? (
                /* View Certificates Mode */
                <div className="space-y-4">
                  {isLoadingCertificates ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : memberCertificates.length > 0 ? (
                    <div className="space-y-3">
                      {memberCertificates.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Award className="h-5 w-5 text-primary" />
                              <span className="font-semibold">{cert.certificate_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {cert.certificate_type || 'membership'}
                              </Badge>
                            </div>
                            {cert.description && (
                              <p className="text-sm text-gray-600 ml-7 mb-2">{cert.description}</p>
                            )}
                            <div className="flex items-center gap-4 ml-7 text-xs text-gray-500">
                              {cert.issued_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Issued: {new Date(cert.issued_date).toLocaleDateString()}
                                </span>
                              )}
                              {cert.expiry_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(cert.certificate_url, '_blank')}
                              title="View Certificate"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCertificate(cert.id)}
                              disabled={isDeletingCertificate}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Certificate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This member doesn't have any certificates yet.
                      </p>
                      <Button
                        onClick={() => setCertificateViewMode('upload')}
                        className="gradient-primary"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload First Certificate
                      </Button>
                    </div>
                  )}
                  
                  {memberCertificates.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setIsCertificateOpen(false)}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => setCertificateViewMode('upload')}
                        className="gradient-primary"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New Certificate
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* Upload Certificate Mode */
                <div className="space-y-6">
                  {/* Success Message */}
              {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <h3 className="font-semibold">Certificate Uploaded Successfully!</h3>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    The certificate has been uploaded and the member will be notified. You can upload another certificate or close this dialog.
                  </p>
                </div>
              )}

              {/* Certificate Form */}
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Certificate Title <span className="text-destructive">*</span></Label>
                    <Input
                      value={certificateForm.title}
                      onChange={(e) => setCertificateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Membership Certificate"
                      disabled={isUploadingCertificate}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Certificate Type</Label>
                    <Select 
                      value={certificateForm.certificate_type} 
                      onValueChange={(value) => setCertificateForm(prev => ({ ...prev, certificate_type: value }))}
                      disabled={isUploadingCertificate}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="membership">Membership Certificate</SelectItem>
                        <SelectItem value="completion">Course Completion</SelectItem>
                        <SelectItem value="participation">Participation Certificate</SelectItem>
                        <SelectItem value="achievement">Achievement Certificate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={certificateForm.description}
                    onChange={(e) => setCertificateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the certificate..."
                    rows={3}
                    disabled={isUploadingCertificate}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Issue Date <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={certificateForm.issue_date}
                      onChange={(e) => setCertificateForm(prev => ({ ...prev, issue_date: e.target.value }))}
                      disabled={isUploadingCertificate}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiry Date (Optional)</Label>
                    <Input
                      type="date"
                      value={certificateForm.expiry_date}
                      onChange={(e) => setCertificateForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                      disabled={isUploadingCertificate}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Certificate File <span className="text-destructive">*</span></Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <div className="flex gap-2 justify-center mb-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('certificate-upload') as HTMLInputElement;
                              if (input) {
                                input.accept = '.jpg,.jpeg,.png';
                                input.click();
                              }
                            }}
                            disabled={isUploadingCertificate}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('certificate-upload') as HTMLInputElement;
                              if (input) {
                                input.accept = '.pdf';
                                input.click();
                              }
                            }}
                            disabled={isUploadingCertificate}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Upload PDF
                          </Button>
                        </div>
                        <label htmlFor="certificate-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            {certificateFile ? certificateFile.name : 'Or click here to browse files'}
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            PDF, JPEG, PNG up to 5MB
                          </span>
                        </label>
                        <input
                          id="certificate-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleCertificateFileChange}
                          disabled={isUploadingCertificate}
                        />
                      </div>
                      {certificateFile && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">File selected: {certificateFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCertificateFile(null);
                              setCertificatePreview(null);
                            }}
                            disabled={isUploadingCertificate}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview Section */}
                  {certificatePreview && (
                    <div className="mt-4">
                      <Label>Preview</Label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <img 
                          src={certificatePreview} 
                          alt="Certificate preview" 
                          className="max-w-full h-auto max-h-64 mx-auto rounded border"
                        />
                      </div>
                    </div>
                  )}
                  
                  {certificateFile && certificateFile.type === 'application/pdf' && (
                    <div className="mt-4">
                      <Label>PDF File Selected</Label>
                      <div className="border rounded-lg p-4 bg-gray-50 text-center">
                        <FileText className="h-16 w-16 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">{certificateFile.name}</p>
                        <p className="text-xs text-gray-500">PDF preview not available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (certificateViewMode === 'upload' && memberCertificates.length > 0) {
                      setCertificateViewMode('list');
                    } else {
                      setIsCertificateOpen(false);
                    }
                  }}
                  disabled={isUploadingCertificate}
                >
                  {certificateViewMode === 'upload' && memberCertificates.length > 0 ? 'Back to List' : 'Close'}
                </Button>
                {certificateViewMode === 'upload' && (
                  <>
                    {uploadSuccess && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setUploadSuccess(false);
                          // Reset form for another upload
                          setCertificateForm({
                            title: '',
                            description: '',
                            issue_date: new Date().toISOString().split('T')[0],
                            expiry_date: '',
                            certificate_type: 'membership'
                          });
                          setCertificateFile(null);
                          setCertificatePreview(null);
                        }}
                        disabled={isUploadingCertificate}
                      >
                        Clear Form
                      </Button>
                    )}
                    <Button 
                      onClick={handleUploadCertificate}
                      className="gradient-primary"
                      disabled={!certificateFile || !certificateForm.title || !certificateForm.issue_date || isUploadingCertificate}
                    >
                      {isUploadingCertificate ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Certificate
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Membership Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Membership</DialogTitle>
          </DialogHeader>
          
          {memberToDelete && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">Confirm Membership Deletion</h3>
                    <p className="text-red-700 text-sm mt-1">
                      Are you sure you want to delete this membership? The user account will remain active but their membership will be removed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Member Details:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><span className="font-medium">Name:</span> {formatTitle(memberToDelete.title)} {memberToDelete.first_name} {memberToDelete.surname}</div>
                  <div><span className="font-medium">Email:</span> {memberToDelete.email}</div>
                  <div><span className="font-medium">Mobile:</span> {memberToDelete.mobile}</div>
                  {memberToDelete.membership_no && (
                    <div><span className="font-medium">Membership No:</span> {memberToDelete.membership_no}</div>
                  )}
                  <div><span className="font-medium">Membership Type:</span> {memberToDelete.membership_type}</div>
                  <div><span className="font-medium">Status:</span> {memberToDelete.status}</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> This will only delete the membership record. The user account will remain active and they can still:
                </p>
                <ul className="text-blue-700 text-sm mt-1 ml-4 list-disc">
                  <li>Login to their account</li>
                  <li>Register for seminars</li>
                  <li>Apply for membership again</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setMemberToDelete(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmDeleteMembership}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Membership Only
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Offline Membership Dialog */}
      <Dialog open={isAddOfflineOpen} onOpenChange={(open) => {
        setIsAddOfflineOpen(open);
        if (!open) {
          // Reset form when dialog closes
          setSelectedUserEmail('');
          setOfflineForm({
            email: '',
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
            membership_type: '',
            payment_type: '',
            amount: '',
            transaction_id: '',
            valid_from: '',
            valid_until: '',
            notes: ''
          });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto no-animations">
          <DialogHeader>
            <DialogTitle>Add Offline Membership</DialogTitle>
          </DialogHeader>
          
          {isAddOfflineOpen && (
          <div className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label>Select User <span className="text-red-500">*</span></Label>
              <Select 
                value={selectedUserEmail} 
                onValueChange={handleUserSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a registered user" />
                </SelectTrigger>
                <SelectContent style={{ animation: 'none', transition: 'none' }}>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {formatTitle(user.title)} {user.first_name} {user.surname} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">User must be registered first</p>
            </div>

            {/* Personal Information */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={offlineForm.name}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Father's Name</Label>
                  <Input
                    value={offlineForm.father_name}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, father_name: e.target.value }))}
                    placeholder="Father's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={offlineForm.sex} onValueChange={(value) => setOfflineForm(prev => ({ ...prev, sex: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={offlineForm.dob}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, dob: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={offlineForm.age}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Age"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input
                    value={offlineForm.mobile}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="Mobile number"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Address</Label>
                <Textarea
                  value={offlineForm.address}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Complete address"
                  rows={2}
                />
              </div>
            </div>

            {/* Educational Information */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Educational Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input
                    value={offlineForm.qualification}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="e.g., MBBS, MD"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Year of Passing</Label>
                  <Input
                    value={offlineForm.year_passing}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, year_passing: e.target.value }))}
                    placeholder="e.g., 2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={offlineForm.institution}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="Institution name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Working Place</Label>
                  <Input
                    value={offlineForm.working_place}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, working_place: e.target.value }))}
                    placeholder="Current workplace"
                  />
                </div>
              </div>
            </div>

            {/* Membership Information */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Membership Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Membership Type <span className="text-red-500">*</span></Label>
                  <Select value={offlineForm.membership_type} onValueChange={(value) => setOfflineForm(prev => ({ ...prev, membership_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipCategories.length > 0 ? (
                        membershipCategories.map((category) => (
                          <SelectItem key={category.id} value={category.title}>
                            {category.title}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Yearly">Yearly</SelectItem>
                          <SelectItem value="5-Yearly">5-Yearly</SelectItem>
                          <SelectItem value="Lifetime">Lifetime</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select value={offlineForm.payment_type} onValueChange={(value) => setOfflineForm(prev => ({ ...prev, payment_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Passout">Passout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={offlineForm.amount}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Amount paid"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Transaction ID</Label>
                  <Input
                    value={offlineForm.transaction_id}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, transaction_id: e.target.value }))}
                    placeholder="Transaction/Receipt ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={offlineForm.valid_from}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, valid_from: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={offlineForm.valid_until}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for lifetime</p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Notes</Label>
                <Textarea
                  value={offlineForm.notes}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this membership..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddOfflineOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOfflineMembership} className="gradient-primary">
                Add Membership
              </Button>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Memberships</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Download the Excel template below</li>
                <li>Fill in the membership details (one member per row)</li>
                <li>Make sure all users are already registered in the system</li>
                <li>Upload the completed Excel file</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownloadTemplate} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Upload Excel File</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              {bulkImportFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {bulkImportFile.name}
                </p>
              )}
            </div>

            {importResult && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Import Results:</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{importResult.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                    <p className="text-sm text-muted-foreground">Success</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>

                {importResult.failedDetails && importResult.failedDetails.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-semibold text-sm mb-2">Failed Rows:</h5>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResult.failedDetails.map((detail: any, index: number) => (
                        <div key={index} className="text-sm bg-red-50 p-2 rounded">
                          <p className="font-medium">Row {detail.row}: {detail.email}</p>
                          <ul className="text-xs text-red-700 ml-4 list-disc">
                            {detail.errors.map((error: string, i: number) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkImportOpen(false);
                  setBulkImportFile(null);
                  setImportResult(null);
                }}
                disabled={isImporting}
              >
                Close
              </Button>
              <Button
                onClick={handleBulkImport}
                disabled={!bulkImportFile || isImporting}
                className="gradient-primary"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Memberships
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
