import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { Search, Edit, Award, Calendar, User, Mail, Phone, Download, Upload, FileText, X, CheckCircle, Trash2 } from 'lucide-react';
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
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateForm, setCertificateForm] = useState({
    title: '',
    description: '',
    issue_date: '',
    expiry_date: '',
    certificate_type: 'membership'
  });
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
    setIsCertificateOpen(true);
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

      const formData = new FormData();
      formData.append('certificate', certificateFile);
      formData.append('user_id', selectedMember.id.toString());
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
      
    } catch (error: any) {
      console.error('Certificate upload error:', error);
      console.error('Error response:', error.response?.data);
      
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to upload certificate',
        variant: 'destructive',
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

  const generateMembershipNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BOA/LM/${randomNum}/${year}`;
  };

  const assignMembershipNumber = () => {
    if (!editForm.membership_no) {
      setEditForm(prev => ({
        ...prev,
        membership_no: generateMembershipNumber()
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
        <div>
          <h2 className="text-2xl font-bold">Paid Members Only</h2>
        </div>
        <Button onClick={handleExportCSV} className="gradient-primary">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
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
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
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
        <DialogContent className="max-w-2xl">
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
                  <Select value={editForm.membership_type} onValueChange={(value) => setEditForm(prev => ({ ...prev, membership_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="honorary">Honorary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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

      {/* Add Certificate Dialog */}
      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add Certificate - {selectedMember && `${formatTitle(selectedMember.title)} ${selectedMember.first_name} ${selectedMember.surname}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
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
                  onClick={() => setIsCertificateOpen(false)}
                  disabled={isUploadingCertificate}
                >
                  Close
                </Button>
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
              </div>
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
    </div>
  );
}