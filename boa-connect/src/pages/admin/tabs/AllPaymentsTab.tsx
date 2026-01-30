import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Eye, FileText, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { exportToCSV, formatPaymentForExport } from '@/lib/exportUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_BASE_URL } from '@/lib/utils';

// Helper function to convert delegate_type to readable format
const formatDelegateType = (delegateType: string) => {
  const typeMap: { [key: string]: string } = {
    'boa-member': 'BOA Member',
    'non-boa-member': 'Non BOA Member',
    'accompanying-person': 'Accompanying Person'
  };
  return typeMap[delegateType] || delegateType;
};

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

export default function AllPaymentsTab() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterType, filterStatus, payments]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/payments/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments || []);
        setStats(data.stats || { total: 0, completed: 0, pending: 0, totalAmount: 0 });
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredPayments.length > 0 ? filteredPayments : payments;
    const formattedData = formatPaymentForExport(dataToExport);
    exportToCSV(formattedData, 'export_payment');
    toast({
      title: 'Success',
      description: `Exported ${dataToExport.length} payments to CSV`,
    });
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Search filter
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

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(payment => payment.payment_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    setFilteredPayments(filtered);
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
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

  const handleExportAll = () => {
    const dataToExport = filteredPayments.length > 0 ? filteredPayments : payments;
    const formattedData = formatPaymentForExport(dataToExport);
    exportToCSV(formattedData, 'all_payments');
    toast({
      title: 'Success',
      description: `Exported ${dataToExport.length} payments to CSV`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Payments</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">All Payments</h2>
          <p className="text-muted-foreground">Complete payment history with details</p>
        </div>
        <Button onClick={handleExportAll} className="gap-2">
          <Download className="h-4 w-4" />
          Export All
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
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No payments found</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{payment.user_name}</p>
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(payment.id)}
                        >
                          <Download className="h-4 w-4" />
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

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <p className="font-medium">{selectedPayment.user_name}</p>
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
                        <p className="font-medium">{selectedPayment.details.delegate_category ? formatDelegateType(selectedPayment.details.delegate_category) : 'N/A'}</p>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
