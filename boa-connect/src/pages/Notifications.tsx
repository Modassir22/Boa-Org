import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Calendar, Bell, Download, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      if (data.success) {
        // Filter only active notifications
        const activeNotifs = (data.notifications || []).filter((n: any) => n.is_active);
        setNotifications(activeNotifs);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadForm = async (seminarId: number, seminarName: string) => {
    try {
      const response = await fetch(`/api/generate-seminar-pdf/${seminarId}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${seminarName.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download form:', error);
      alert('Failed to download form. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(notification.created_at)}</span>
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
                        <Button 
                          variant="outline"
                          className="w-full sm:w-auto h-12 text-base px-6 sm:h-11 sm:text-sm sm:px-5"
                          onClick={() => handleDownloadForm(notification.seminar_id, notification.title)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Form
                        </Button>
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
