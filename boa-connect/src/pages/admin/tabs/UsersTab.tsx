import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { Trash2, Eye, Download, Search, FileText, CreditCard, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.first_name?.toLowerCase().includes(query) ||
        user.surname?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.mobile?.includes(query) ||
        user.membership_no?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.users || []);
      setFilteredUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserDetails = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserDetails(data.details);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user details',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = async (user: any) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
    await loadUserDetails(user.id);
  };

  const handleExportUser = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_${userId}_details.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'User details exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export user details',
        variant: 'destructive',
      });
    }
  };

  const handleExportAll = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users/export-all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_users_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'All users exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export users',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast({ title: 'Success', description: 'User deleted successfully' });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Delete failed',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Users Management</h2>
          <p className="text-muted-foreground">Total Users: {users.length}</p>
        </div>
        <Button onClick={handleExportAll} className="gap-2">
          <Download className="h-4 w-4" />
          Export All Users
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, mobile, or membership number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Membership</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.title} {user.first_name} {user.surname}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.mobile}</TableCell>
                  <TableCell>{user.city || 'N/A'}</TableCell>
                  <TableCell>
                    {user.membership_no ? (
                      <Badge className="bg-gold-100 text-gold-700">{user.membership_no}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleExportUser(user.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} disabled={user.role === 'admin'}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              User Details - {selectedUser?.title} {selectedUser?.first_name} {selectedUser?.surname}
            </DialogTitle>
          </DialogHeader>

          {!userDetails ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="membership">Membership</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-base">{selectedUser?.title} {selectedUser?.first_name} {selectedUser?.surname}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-base">{selectedUser?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mobile</label>
                    <p className="text-base">{selectedUser?.mobile}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-base">{selectedUser?.dob || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">City</label>
                    <p className="text-base">{selectedUser?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">State</label>
                    <p className="text-base">{selectedUser?.state || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-base">{selectedUser?.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                    <p className="text-base">
                      {new Date(selectedUser?.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-base capitalize">{selectedUser?.role}</p>
                  </div>
                </div>
              </TabsContent>

              {/* Membership Tab */}
              <TabsContent value="membership" className="space-y-4">
                {userDetails.membership ? (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Membership Information</h3>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Membership Number</label>
                        <p className="text-base font-mono">{userDetails.membership.membership_no}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Category</label>
                        <p className="text-base">{userDetails.membership.category_title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                        <p className="text-base">
                          {new Date(userDetails.membership.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                        <p className="text-base font-semibold">₹{userDetails.membership.amount_paid}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No membership found</p>
                  </div>
                )}
              </TabsContent>

              {/* Bookings Tab */}
              <TabsContent value="bookings" className="space-y-4">
                {userDetails.bookings && userDetails.bookings.length > 0 ? (
                  <div className="space-y-3">
                    {userDetails.bookings.map((booking: any) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{booking.seminar_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.seminar_start_date).toLocaleDateString('en-GB')} - {new Date(booking.seminar_end_date).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <Badge className={
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-muted-foreground">Category</label>
                            <p className="font-medium">{booking.delegate_category}</p>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Amount</label>
                            <p className="font-medium">₹{booking.total_amount}</p>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Booking Date</label>
                            <p className="font-medium">{new Date(booking.created_at).toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No bookings found</p>
                  </div>
                )}
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-4">
                {userDetails.payments && userDetails.payments.length > 0 ? (
                  <div className="space-y-3">
                    {userDetails.payments.map((payment: any) => (
                      <div key={payment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">₹{payment.amount}</h3>
                            <p className="text-sm text-muted-foreground">{payment.payment_type}</p>
                          </div>
                          <Badge className={
                            payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-muted-foreground">Transaction ID</label>
                            <p className="font-mono text-xs">{payment.transaction_id || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Payment Method</label>
                            <p className="font-medium">{payment.payment_method || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Date</label>
                            <p className="font-medium">{new Date(payment.created_at).toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No payments found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
