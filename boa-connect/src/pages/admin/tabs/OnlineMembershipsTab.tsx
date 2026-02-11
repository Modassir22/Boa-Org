import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download, Eye, Filter, X, User, Mail, Phone, Calendar, CreditCard, MapPin } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';

export default function OnlineMembershipsTab() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadOnlineMemberships();
  }, []);

  const loadOnlineMemberships = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/online-memberships`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setMemberships(data.memberships || []);
      }
    } catch (error) {
      console.error('Failed to load online memberships:', error);
      toast.error('Failed to load memberships');
    } finally {
      setLoading(false);
    }
  };

  const filteredMemberships = memberships.filter(membership => {
    const matchesSearch = 
      membership.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.mobile?.includes(searchTerm);
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'completed' && membership.payment_status === 'active') ||
      (filterStatus === 'pending' && membership.payment_status === 'pending');
    
    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Mobile', 'Category', 'Payment Status', 'Amount', 'Date'];
    const rows = filteredMemberships.map(m => [
      m.name,
      m.email,
      m.mobile,
      m.category_name || m.membership_type,
      m.payment_status,
      m.amount,
      new Date(m.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `online-memberships-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (membership: any) => {
    setSelectedMembership(membership);
    setIsDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Online Memberships</h2>
          <p className="text-muted-foreground">All online membership applications</p>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary - Moved up */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-blue-50">
          <p className="text-sm text-muted-foreground">Total Memberships</p>
          <p className="text-3xl font-bold text-blue-600">{memberships.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <p className="text-sm text-muted-foreground">Paid Memberships</p>
          <p className="text-3xl font-bold text-green-600">
            {memberships.filter(m => m.payment_status === 'active').length}
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-purple-50">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-bold text-purple-600">
            ₹{memberships
              .filter(m => m.payment_status === 'active')
              .reduce((sum, m) => sum + parseFloat(m.amount || 0), 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            All ({memberships.length})
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            size="sm"
          >
            Paid ({memberships.filter(m => m.payment_status === 'active').length})
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
            size="sm"
          >
            Pending ({memberships.filter(m => m.payment_status === 'pending').length})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMemberships.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No memberships found
                  </td>
                </tr>
              ) : (
                filteredMemberships.map((membership) => (
                  <tr key={membership.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{membership.name}</p>
                        <p className="text-sm text-muted-foreground">{membership.father_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p>{membership.email}</p>
                        <p className="text-muted-foreground">{membership.mobile}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{membership.category_name || membership.membership_type || 'N/A'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">₹{membership.amount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          membership.payment_status === 'active'
                            ? 'default'
                            : membership.payment_status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {membership.payment_status === 'active' ? 'Paid' : membership.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(membership.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(membership)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Membership Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedMembership && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{selectedMembership.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Father's Name</p>
                    <p className="font-medium">{selectedMembership.father_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {selectedMembership.dob ? new Date(selectedMembership.dob).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{selectedMembership.sex || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{selectedMembership.age || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="font-medium text-sm">{selectedMembership.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Mobile
                    </p>
                    <p className="font-medium">{selectedMembership.mobile}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Address
                    </p>
                    <p className="font-medium">{selectedMembership.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Qualification</p>
                    <p className="font-medium">{selectedMembership.qualification || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year of Passing</p>
                    <p className="font-medium">{selectedMembership.year_passing || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Institution</p>
                    <p className="font-medium">{selectedMembership.institution || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Working Place</p>
                    <p className="font-medium">{selectedMembership.working_place || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Membership & Payment Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Membership & Payment
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Membership Type</p>
                    <Badge variant="outline" className="mt-1">
                      {selectedMembership.category_name || selectedMembership.membership_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="font-bold text-lg text-green-600">₹{selectedMembership.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge
                      variant={selectedMembership.payment_status === 'active' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {selectedMembership.payment_status === 'active' ? 'Paid' : selectedMembership.payment_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium capitalize">{selectedMembership.payment_method || 'Online'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm bg-background p-2 rounded border">
                      {selectedMembership.razorpay_payment_id || selectedMembership.transaction_id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Registration Date
                    </p>
                    <p className="font-medium">
                      {new Date(selectedMembership.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
