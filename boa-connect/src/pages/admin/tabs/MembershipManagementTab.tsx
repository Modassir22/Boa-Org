import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { Search, Edit, Award, Calendar, User, Mail, Phone, Download } from 'lucide-react';
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
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
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
          <h2 className="text-2xl font-bold">Membership Management</h2>
          <p className="text-muted-foreground">Manage member details and assign membership numbers</p>
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
                    member.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    member.status === 'expired' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {member.status || 'Active'}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditMember(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No members found</p>
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
              {/* Member Info */}
              <div className="bg-accent/30 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Member Information</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium">Name:</span> {formatTitle(selectedMember.title)} {selectedMember.first_name} {selectedMember.surname}</div>
                  <div><span className="font-medium">Email:</span> {selectedMember.email}</div>
                  <div><span className="font-medium">Mobile:</span> {selectedMember.mobile}</div>
                  <div><span className="font-medium">Registered:</span> {new Date(selectedMember.created_at).toLocaleDateString()}</div>
                </div>
              </div>

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
    </div>
  );
}