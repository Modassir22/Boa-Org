import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Award, Calendar, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { API_BASE_URL } from '@/lib/utils';

export default function Certificates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/certificates/my-certificates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCertificates(data.certificates || []);
      } else {
        throw new Error(data.message || 'Failed to load certificates');
      }
    } catch (error: any) {
      console.error('Load certificates error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (certificate: any) => {
    try {
      const url = certificate.certificate_url;
      
      // Check if it's a PDF or image
      const isPDF = url.toLowerCase().includes('.pdf') || url.includes('pdf');
      
      if (isPDF) {
        // Direct download for PDF
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = certificate.certificate_name.replace(/[^a-z0-9]/gi, '_') + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Convert image to PDF
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [img.width, img.height]
          });
          
          pdf.addImage(img, 'JPEG', 0, 0, img.width, img.height);
          pdf.save(certificate.certificate_name.replace(/[^a-z0-9]/gi, '_') + '.pdf');
          
          toast({
            title: 'Success',
            description: 'Certificate downloaded as PDF',
          });
        };
        
        img.onerror = () => {
          toast({
            title: 'Error',
            description: 'Failed to load certificate image',
            variant: 'destructive',
          });
        };
        
        img.src = url;
        return;
      }
      
      toast({
        title: 'Success',
        description: 'Certificate downloaded successfully',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download certificate',
        variant: 'destructive',
      });
    }
  };

  const handleView = (certificate: any) => {
    // Open certificate URL in new tab
    window.open(certificate.certificate_url, '_blank');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading certificates...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Award className="h-8 w-8 text-amber-600" />
                My Certificates
              </h1>
              <p className="text-muted-foreground mt-1">
                View and download your certificates
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>

          {/* Certificates Grid */}
          {certificates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-elevated transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0">
                      Verified
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                    {cert.certificate_name}
                  </h3>

                  {cert.seminar_name && (
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {cert.seminar_name}
                    </p>
                  )}

                  {cert.issued_date && (
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Issued: {new Date(cert.issued_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  )}

                  {cert.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {cert.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleView(cert)}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleDownload(cert)}
                      className="flex-1 gradient-primary text-primary-foreground gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <Award className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Certificates Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Your certificates will appear here once they are issued by the administrators.
              </p>
              <Button onClick={() => navigate('/seminars')} className="gradient-primary text-primary-foreground">
                Browse Seminars
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
