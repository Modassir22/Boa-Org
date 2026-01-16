import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminAPI } from '@/lib/api';
import { Users, FileText, DollarSign, CheckCircle, Clock, XCircle, CreditCard, Eye, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function StatisticsTab() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [latestPayments, setLatestPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    loadStatistics();
    loadLatestPayments();
  }, []);

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

  const loadLatestPayments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/payments/latest', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setLatestPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to load latest payments:', error);
    }
  };

  const handleViewDetails = async (payment: any) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
    
    // Load full payment details
    try {
      const response = await fetch(`http://localhost:5000/api/admin/payments/${payment.id}/details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPaymentDetails(data.payment);
      }
    } catch (error) {
      console.error('Failed to load payment details:', error);
    }
  };

  const handleDownloadPDF = async (paymentId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/payments/${paymentId}/pdf`, {
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

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const getStatusCount = (status: string) => {
    const item = stats?.by_status?.find((s: any) => s.status === status);
    return item?.count || 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_registrations || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getStatusCount('completed')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getStatusCount('pending')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{parseFloat(stats?.total_revenue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.by_status?.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {item.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                  {item.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                  <span className="capitalize">{item.status}</span>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Latest Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Latest Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent payments</p>
          ) : (
            <div className="space-y-3">
              {latestPayments.map((payment, index) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold transition-colors duration-200 hover:text-primary">{payment.user_name}</p>
                        <p className="text-sm text-muted-foreground">{payment.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <Badge className={`transition-all duration-200 hover:scale-105 ${
                        payment.payment_type === 'membership' 
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}>
                        {payment.payment_type}
                      </Badge>
                      <span className="text-muted-foreground truncate max-w-xs">{payment.payment_for}</span>
                      <Badge className={`transition-all duration-200 hover:scale-105 ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                        'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold transition-colors duration-200 hover:text-primary">₹{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(payment)}
                        className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPDF(payment.id)}
                        className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Details
            </DialogTitle>
          </DialogHeader>

          {!paymentDetails ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 animate-fade-in-up">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="transition-all duration-200 hover:translate-x-1">
                    <label className="text-sm text-muted-foreground">Name</label>
                    <p className="font-medium">{paymentDetails.user_name}</p>
                  </div>
                  <div className="transition-all duration-200 hover:translate-x-1">
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="font-medium">{paymentDetails.user_email}</p>
                  </div>
                  {paymentDetails.user_mobile && (
                    <div className="transition-all duration-200 hover:translate-x-1">
                      <label className="text-sm text-muted-foreground">Mobile</label>
                      <p className="font-medium">{paymentDetails.user_mobile}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="transition-all duration-200 hover:translate-x-1">
                    <label className="text-sm text-muted-foreground">Payment Type</label>
                    <p className="font-medium capitalize">{paymentDetails.payment_type}</p>
                  </div>
                  <div className="transition-all duration-200 hover:translate-x-1">
                    <label className="text-sm text-muted-foreground">Payment For</label>
                    <p className="font-medium">{paymentDetails.payment_for}</p>
                  </div>
                  <div className="transition-all duration-200 hover:translate-x-1">
                    <label className="text-sm text-muted-foreground">Amount</label>
                    <p className="font-semibold text-lg text-primary">₹{paymentDetails.amount.toLocaleString()}</p>
                  </div>
                  <div className="transition-all duration-200 hover:translate-x-1">
                    <label className="text-sm text-muted-foreground">Status</label>
                    <Badge className={`transition-all duration-200 hover:scale-105 ${
                      paymentDetails.status === 'completed' ? 'bg-green-100 text-green-700' :
                      paymentDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {paymentDetails.status}
                    </Badge>
                  </div>
                  <div className="transition-all duration-200 hover:translate-x-1">
                    <label className="text-sm text-muted-foreground">Payment Date</label>
                    <p className="font-medium">
                      {new Date(paymentDetails.created_at).toLocaleString('en-GB')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailsOpen(false)}
                  className="transition-all duration-200 hover:scale-105"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => handleDownloadPDF(selectedPayment?.id)} 
                  className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
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
