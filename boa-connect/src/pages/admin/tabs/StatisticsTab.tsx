import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAPI } from '@/lib/api';
import { FileText, Download, Search, Eye, Trash2, DollarSign, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { exportToCSV, formatPaymentForExport } from '@/lib/exportUtils';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_BASE_URL } from '@/lib/utils';

interface Payment {
  id: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_mobile: string;
  payment_type: string;
  payment_for: string;
  amount: number;
  transaction_id: string;
  payment_method: string;
  status: string;
  created_at: string;
  details: any;
}

export default function StatisticsTab() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalAmount: 0,
    seminarAmount: 0,
    membershipAmount: 0
  });

  useEffect(() => {
    loadStatistics();
    loadPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterType, filterStatus, payments]);

  const loadStatistics = async () => {
    try {
      const response = await adminAPI.getStatistics();
      setStats(response.statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payments/all?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments || []);
        
        // Calculate payment breakdown
        const seminarPayments = data.payments.filter((p: Payment) => p.payment_type === 'seminar');
        const membershipPayments = data.payments.filter((p: Payment) => p.payment_type === 'membership');
        
        const seminarAmount = seminarPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
        const membershipAmount = membershipPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
        
        setPaymentStats({
          total: data.stats?.total || 0,
          completed: data.stats?.completed || 0,
          pending: data.stats?.pending || 0,
          totalAmount: data.stats?.totalAmount || 0,
          seminarAmount,
          membershipAmount
        });
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payments',
        variant: 'destructive',
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.user_name?.toLowerCase().includes(query) ||
        payment.user_email?.toLowerCase().includes(query) ||
        payment.user_mobile?.includes(query) ||
        payment.transaction_id?.toLowerCase().includes(query) ||
        payment.payment_for?.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(payment => payment.payment_type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    setFilteredPayments(filtered);
  };

  const handleExportCSV = () => {
    if (!stats) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Registrations', stats.total_registrations || 0],
      ['Completed', getStatusCount('completed')],
      ['Pending', getStatusCount('pending')],
      ['Failed', getStatusCount('failed')],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Success',
      description: 'Statistics exported successfully',
    });
  };

  const handleExportPayments = () => {
    const dataToExport = filteredPayments.length > 0 ? filteredPayments : payments;
    const formattedData = formatPaymentForExport(dataToExport);
    exportToCSV(formattedData, 'all_payments');
    toast({
      title: 'Success',
      description: `Exported ${dataToExport.length} payments to CSV`,
    });
  };

  const handleViewDetails = (payment: Payment) => {
    flushSync(() => {
      setSelectedPayment(payment);
    });
    flushSync(() => {
      setIsDetailsOpen(true);
    });
  };

  const handleDownloadPDF = async (paymentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payments/${paymentId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Payment receipt downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/payments/${paymentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setPayments(prev => prev.filter(p => p.id !== paymentToDelete.id));
        
        toast({
          title: 'Success',
          description: 'Payment deleted successfully',
        });
      } else {
        throw new Error(data.message || 'Failed to delete payment');
      }
    } catch (error) {
      console.error('Delete payment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const getStatusCount = (status: string) => {
    const item = stats?.by_status?.find((s: any) => s.status === status);
    return item?.count || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Statistics</h2>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/statistics-visuals')} variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Show Visuals
          </Button>
          <Button onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Payment Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Number of transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{paymentStats.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All payments combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seminar Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{paymentStats.seminarAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Registration fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membership Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₹{paymentStats.membershipAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Membership fees</p>
          </CardContent>
        </Card>
      </div>

      {/* All Payments Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">All Payments</h3>
            <p className="text-muted-foreground text-sm">Complete payment history with details</p>
          </div>
          <Button onClick={handleExportPayments} className="gap-2">
            <Download className="h-4 w-4" />
            Export Payments
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, mobile, transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="membership">Membership</SelectItem>
              <SelectItem value="seminar">Seminar Registration</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payments Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold w-12">#</th>
                  <th className="text-left p-4 font-semibold">User</th>
                  <th className="text-left p-4 font-semibold">Payment For</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Amount</th>
                  <th className="text-left p-4 font-semibold">Transaction ID</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No payments found</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, index) => (
                    <tr key={payment.id} className="border-t hover:bg-muted/50">
                      <td className="p-4 font-medium text-muted-foreground">
                        {index + 1}.
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{payment.user_name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{payment.user_email}</p>
                          <p className="text-sm text-muted-foreground">{payment.user_mobile}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{payment.payment_for}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={
                          payment.payment_type === 'membership' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }>
                          {payment.payment_type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">₹{payment.amount.toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-xs">{payment.transaction_id || 'N/A'}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={
                          payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">
                          {new Date(payment.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(payment.id)}
                            title="Download Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(payment)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Payment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Details Dialog */}
      {isDetailsOpen && selectedPayment && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* User Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <p className="font-medium">{selectedPayment.user_name || 'Unknown User'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="font-medium">{selectedPayment.user_email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Mobile</label>
                    <p className="font-medium">{selectedPayment.user_mobile}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Payment Type</label>
                    <p className="font-medium capitalize">{selectedPayment.payment_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Payment For</label>
                    <p className="font-medium">{selectedPayment.payment_for}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Amount</label>
                    <p className="font-semibold text-lg">₹{selectedPayment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <Badge className={
                      selectedPayment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Transaction ID</label>
                    <p className="font-mono text-sm">{selectedPayment.transaction_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Payment Method</label>
                    <p className="font-medium">{selectedPayment.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Payment Date</label>
                    <p className="font-medium">
                      {new Date(selectedPayment.created_at).toLocaleString('en-GB')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {selectedPayment.details && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Additional Details</h3>
                  {selectedPayment.payment_type === 'seminar' && selectedPayment.details.seminar && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-muted-foreground">Seminar Name</label>
                        <p className="font-medium">{selectedPayment.details.seminar.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Start Date</label>
                          <p className="font-medium">
                            {new Date(selectedPayment.details.seminar.start_date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">End Date</label>
                          <p className="font-medium">
                            {new Date(selectedPayment.details.seminar.end_date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Delegate Category</label>
                        <p className="font-medium">{selectedPayment.details.delegate_category || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Registration Number</label>
                        <p className="font-mono">{selectedPayment.details.registration_no}</p>
                      </div>
                    </div>
                  )}
                  {selectedPayment.payment_type === 'membership' && selectedPayment.details.membership && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-muted-foreground">Membership Type</label>
                        <p className="font-medium">{selectedPayment.details.membership.type}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Category</label>
                        <p className="font-medium">{selectedPayment.details.membership.category}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Qualification</label>
                        <p className="font-medium">{selectedPayment.details.membership.qualification}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => handleDownloadPDF(selectedPayment.id)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Receipt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
              {paymentToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p><strong>User:</strong> {paymentToDelete.user_name || 'Unknown User'}</p>
                  <p><strong>Amount:</strong> ₹{paymentToDelete.amount.toLocaleString()}</p>
                  <p><strong>Type:</strong> {paymentToDelete.payment_type}</p>
                  <p><strong>Transaction ID:</strong> {paymentToDelete.transaction_id}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePayment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
