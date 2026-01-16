import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Calendar, MapPin, ArrowRight, Bell, Download } from 'lucide-react';
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
      const response = await fetch('http://localhost:5000/api/notifications');
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
      const response = await fetch(`http://localhost:5000/api/seminars/${seminarId}`);
      const data = await response.json();
      
      if (data.success && data.seminar.offline_form_html) {
        // Create HTML file with proper structure
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seminarName} - Offline Registration Form</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
${data.seminar.offline_form_html}
</body>
</html>`;
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${seminarName.replace(/[^a-z0-9]/gi, '_')}_Registration_Form.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Offline form not available for this seminar');
      }
    } catch (error) {
      console.error('Failed to download form:', error);
      alert('Failed to download form');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 md:py-16" style={{background: '#F9FAFB'}}>
        <div className="container max-w-3xl text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl mb-6" style={{background: '#0B3C5D'}}>
            <Bell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-4" style={{color: '#1F2933'}}>
            Notifications
          </h1>
          <p className="text-lg" style={{color: '#616E7C'}}>
            Stay updated with our latest seminars and events
          </p>
        </div>
      </section>

      {/* Notifications List */}
      <section className="py-12 md:py-16">
        <div className="container max-w-4xl px-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" style={{color: '#616E7C'}} />
              <h3 className="text-xl font-semibold mb-2" style={{color: '#1F2933'}}>No Active Notifications</h3>
              <p style={{color: '#616E7C'}}>
                There are no active seminars or events at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="gov-card p-6 relative"
                >
                  {/* Active Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="gov-badge-accent">
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{background: '#C9A227'}} />
                      Active
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center" style={{background: '#0B3C5D'}}>
                      <Calendar className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1 w-full">
                      <h3 className="text-xl font-semibold mb-2 pr-16" style={{color: '#1F2933'}}>
                        {notification.title}
                      </h3>
                      <p className="mb-4" style={{color: '#616E7C'}}>
                        {notification.message}
                      </p>

                      {notification.seminar_id && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to={`/seminar/${notification.seminar_id}/register`} className="flex-1 sm:flex-initial">
                            <button className="gov-button-primary w-full sm:w-auto">
                              Register Now
                              <ArrowRight className="ml-2 h-4 w-4 inline" />
                            </button>
                          </Link>
                          <button 
                            className="bg-white border-2 px-5 py-2.5 rounded font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto"
                            style={{color: '#0B3C5D', borderColor: '#0B3C5D'}}
                            onClick={() => handleDownloadForm(notification.seminar_id, notification.title)}
                          >
                            <Download className="mr-2 h-4 w-4 inline" />
                            Download Offline Form
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t" style={{borderColor: '#E5E7EB'}}>
                    <p className="text-xs" style={{color: '#616E7C'}}>
                      Posted on {new Date(notification.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
