import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/utils';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Payment {
  id: string;
  payment_type: string;
  amount: number;
  status: string;
}

export default function StatisticsVisuals() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [yearWiseData, setYearWiseData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStats, setCurrentStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    seminarAmount: 0,
    membershipAmount: 0
  });

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    loadYearWiseData();
    loadCurrentStats();
  }, []);

  const loadCurrentStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payments/all?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      const data = await response.json();
      if (data.success) {
        // Calculate current stats from completed payments only
        const completedPayments = data.payments.filter((p: Payment) => p.status === 'completed');
        const seminarPayments = completedPayments.filter((p: Payment) => p.payment_type === 'seminar');
        const membershipPayments = completedPayments.filter((p: Payment) => p.payment_type === 'membership');
        
        const seminarAmount = seminarPayments.reduce((sum: number, p: Payment) => sum + (parseFloat(String(p.amount)) || 0), 0);
        const membershipAmount = membershipPayments.reduce((sum: number, p: Payment) => sum + (parseFloat(String(p.amount)) || 0), 0);
        
        setCurrentStats({
          totalPayments: completedPayments.length,
          totalAmount: data.stats?.totalAmount || 0,
          seminarAmount,
          membershipAmount
        });
      }
    } catch (error) {
      console.error('Failed to load current stats:', error);
    }
  };

  const loadYearWiseData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/stats/year-wise`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      const data = await response.json();
      if (data.success) {
        setYearWiseData(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load year-wise data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load year-wise statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Statistics
          </Button>
          <h1 className="text-3xl font-bold">Year-wise Growth Analysis</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading charts...</p>
            </div>
          </div>
        ) : yearWiseData.length > 0 ? (
          <div className="space-y-6">
            {/* Current Statistics Overview Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-2 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{currentStats.totalPayments}</div>
                  <p className="text-xs text-muted-foreground mt-1">Completed transactions</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">₹{currentStats.totalAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">All payments combined</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Seminar Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">₹{currentStats.seminarAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registration fees</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Membership Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">₹{currentStats.membershipAmount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Membership fees</p>
                </CardContent>
              </Card>
            </div>

            {/* Current Payment Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Current Payment Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Seminar Payments', value: currentStats.seminarAmount },
                        { name: 'Membership Payments', value: currentStats.membershipAmount }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value, percent }) => `${name}: ₹${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f97316" />
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Charts in Single Row */}
            <div className="grid md:grid-cols-1 gap-6">
              {/* Bar Chart - Total Amount by Year with Total */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue by Year</CardTitle>
                </CardHeader>
                <CardContent className="w-full overflow-x-auto">
                  <div className="min-w-[600px]">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={yearWiseData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `₹${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Bar dataKey="total_amount" fill="#10b981" name="Total Amount" />
                        <Bar dataKey="seminar_amount" fill="#3b82f6" name="Seminar Amount" />
                        <Bar dataKey="membership_amount" fill="#f97316" name="Membership Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie Chart - Latest Year Online vs Offline */}
              {yearWiseData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Online vs Offline Payments ({yearWiseData[yearWiseData.length - 1].year})</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: 'Online', 
                              value: yearWiseData[yearWiseData.length - 1].total_online_amount || 
                                     (yearWiseData[yearWiseData.length - 1].seminar_online_amount || 0) + 
                                     (yearWiseData[yearWiseData.length - 1].membership_online_amount || 0)
                            },
                            { 
                              name: 'Offline', 
                              value: yearWiseData[yearWiseData.length - 1].total_offline_amount || 
                                     (yearWiseData[yearWiseData.length - 1].seminar_offline_amount || 0) + 
                                     (yearWiseData[yearWiseData.length - 1].membership_offline_amount || 0)
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, value, percent }) => `${name}: ₹${value.toLocaleString()} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Pie Chart - Latest Year Activity Distribution */}
              {yearWiseData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Distribution ({yearWiseData[yearWiseData.length - 1].year})</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Registrations', value: yearWiseData[yearWiseData.length - 1].total_registrations },
                            { name: 'Members', value: yearWiseData[yearWiseData.length - 1].total_members }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">There is no year-wise data to display charts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
