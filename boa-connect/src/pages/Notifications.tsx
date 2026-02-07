import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Calendar, Bell, Download, ArrowRight, Clock, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/utils';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadNotifications();
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!(token && user));
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`);
      const data = await response.json();
      if (data.success) {
        // Filter only active notifications
        const activeNotifs = (data.notifications || []).filter((n: any) => n.is_active);
        
        // Debug logging for election notifications
        activeNotifs.forEach((n: any) => {
          if (n.type === 'election') {
            console.log('Election notification:', {
              id: n.id,
              title: n.title,
              election_title: n.election_title,
              election_id: n.election_id,
              display_title: n.election_title || n.title
            });
          }
        });
        
        setNotifications(activeNotifs);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadForm = async (seminarId: number, seminarName: string) => {
    // Strict authentication check
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user || !isAuthenticated) {
      toast.error('Please login to download seminar forms');
      navigate('/login', { state: { from: '/notifications' } });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-seminar-pdf/${seminarId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Authentication expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { state: { from: '/notifications' } });
          return;
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is actually a PDF or HTML fallback
      const contentType = response.headers.get('content-type');
      const isHtml = contentType && contentType.includes('text/html');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      if (isHtml) {
        // If HTML fallback, download as HTML file
        link.download = `${seminarName.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form.html`;
        setTimeout(() => {
          toast.info('PDF generation issue. Downloaded as HTML file. Please print from browser.');
        }, 200);
      } else {
        // Normal PDF download
        link.download = `${seminarName.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form.pdf`;
        setTimeout(() => {
          toast.success('Form downloaded successfully!');
        }, 200);
      }
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up with a small delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      setTimeout(() => {
        toast.error(`Failed to download form. Please try again.`);
      }, 100);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate) return 'Date TBD';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const startFormatted = start.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    // If no end date or same as start date, show only start date
    if (!end || startDate === endDate) {
      return startFormatted;
    }
    
    const endFormatted = end.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Simple Header */}
      <div className="bg-white border-b page-enter">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="notification-badge bg-blue-100 text-blue-700">
                {notifications.length} Active
              </Badge>
            )}
          </div>
          <p className="text-gray-600">Latest updates and announcements</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 min-h-screen">
        <div className="container py-8">
          {notifications.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg border p-12 text-center gov-fade-in">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">There are no active notifications at the moment.</p>
            </div>
          ) : (
            /* Notifications List */
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div 
                  key={notification.id} 
                  className="gov-card bg-white rounded-lg border section-enter"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div 
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: notification.color || '#2563eb' }}
                        >
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {notification.seminar_name || notification.election_title || notification.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>
                              {notification.start_date 
                                ? formatDateRange(notification.start_date, notification.end_date)
                                : formatDate(notification.created_at)
                              }
                            </span>
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                      <p className="text-gray-700 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {/* Actions */}
                    {notification.seminar_id && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        {notification.online_registration_enabled === 1 && (
                          <Link to={`/seminar/${notification.seminar_id}/register`}>
                            <Button 
                              className="w-full sm:w-auto h-12 text-base px-6 sm:h-11 sm:text-sm sm:px-5 text-white hover:opacity-90"
                              style={{ backgroundColor: notification.color || '#2563eb' }}
                            >
                              Register Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        
                        {isAuthenticated ? (
                          <Button 
                            variant="outline"
                            className="w-full sm:w-auto h-12 text-base px-6 sm:h-11 sm:text-sm sm:px-5"
                            onClick={() => handleDownloadForm(notification.seminar_id, notification.seminar_name || notification.title)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Form
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            className="w-full sm:w-auto h-12 text-base px-6 sm:h-11 sm:text-sm sm:px-5 opacity-75"
                            onClick={() => {
                              toast.error('Please login to download seminar forms');
                              navigate('/login', { state: { from: '/notifications' } });
                            }}
                          >
                            <LogIn className="mr-2 h-4 w-4" />
                            Login to Download
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Election Actions */}
                    {notification.type === 'election' && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          variant="outline"
                          className="w-full sm:w-auto h-12 text-base px-6 sm:h-11 sm:text-sm sm:px-5"
                          onClick={async () => {
                            if (!notification.election_id) {
                              toast.error('Election information not available');
                              return;
                            }

                            try {
                              // Generate PDF on-demand (same as seminar)
                              const response = await fetch(`${API_BASE_URL}/api/elections/generate-pdf/${notification.election_id}`);
                              
                              if (!response.ok) {
                                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                              }

                              // Download the PDF
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${notification.title.replace(/[^a-zA-Z0-9]/g, '_')}_Nomination_Form.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              
                              // Clean up
                              setTimeout(() => {
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              }, 100);
                              
                              setTimeout(() => {
                                toast.success('Form downloaded successfully!');
                              }, 200);
                            } catch (error) {
                              console.error('Failed to download form:', error);
                              setTimeout(() => {
                                toast.error('Failed to download form. Please try again.');
                              }, 100);
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Form
                        </Button>
                        <Link to={`/elections/${notification.election_id || notification.link?.split('/').pop()}/submit`}>
                          <Button 
                            className="w-full sm:w-auto h-12 text-base px-6 sm:h-11 sm:text-sm sm:px-5 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Submit Nomination
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
