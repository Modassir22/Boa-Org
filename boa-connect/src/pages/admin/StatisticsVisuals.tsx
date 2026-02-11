import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/utils';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StatisticsVisuals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [yearWiseData, setYearWiseData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    loadYearWiseData();
  }, []);

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
            {/* Bar Chart - Total Amount by Year */}
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
                      <Bar dataKey="total_amount" fill="#8b5cf6" name="Total Amount" />
                      <Bar dataKey="seminar_amount" fill="#3b82f6" name="Seminar Amount" />
                      <Bar dataKey="membership_amount" fill="#10b981" name="Membership Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart - Registrations & Members by Year */}
            <Card>
              <CardHeader>
                <CardTitle>Registrations & Members Growth</CardTitle>
              </CardHeader>
              <CardContent className="w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={yearWiseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_registrations" fill="#f59e0b" name="Registrations" />
                      <Bar dataKey="total_members" fill="#ef4444" name="Members" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Charts - Latest Year Breakdown */}
            {yearWiseData.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Distribution ({yearWiseData[yearWiseData.length - 1].year})</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Seminar', value: yearWiseData[yearWiseData.length - 1].seminar_amount },
                            { name: 'Membership', value: yearWiseData[yearWiseData.length - 1].membership_amount }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

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
                          {[0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index + 2]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {yearWiseData.map((yearData, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">Year {yearData.year}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue:</span>
                      <span className="font-semibold">₹{yearData.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Registrations:</span>
                      <span className="font-semibold">{yearData.total_registrations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Members:</span>
                      <span className="font-semibold">{yearData.total_members}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
