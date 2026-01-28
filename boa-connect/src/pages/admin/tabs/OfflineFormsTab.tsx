import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText, Calendar, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api';

export function OfflineFormsTab() {
  const [loading, setLoading] = useState(false);
  const [membershipFormHtml, setMembershipFormHtml] = useState('');
  const [seminarFormHtml, setSeminarFormHtml] = useState('');
  const [showMembershipPreview, setShowMembershipPreview] = useState(false);
  const [showSeminarPreview, setShowSeminarPreview] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await adminAPI.getOfflineFormsConfig();
      if (response.success && response.config) {
        setMembershipFormHtml(response.config.membership_form_html || '');
        setSeminarFormHtml(response.config.seminar_form_html || '');
      }
    } catch (error: any) {
      console.error('Failed to load offline forms config:', error);
      toast.error('Failed to load configuration');
    }
  };

  const handleSave = async () => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Membership HTML length:', membershipFormHtml?.length || 0);
    console.log('Seminar HTML length:', seminarFormHtml?.length || 0);
    
    setLoading(true);
    try {
      console.log('Calling adminAPI.updateOfflineFormsConfig...');
      const response = await adminAPI.updateOfflineFormsConfig({
        membership_form_html: membershipFormHtml,
        seminar_form_html: seminarFormHtml
      });
      console.log('Response:', response);
      toast.success('Offline forms configuration updated successfully');
      
      // Reload to verify
      await loadConfig();
    } catch (error: any) {
      console.error('Failed to update offline forms config:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        .html-editor-textarea {
          min-height: 500px !important;
          height: 500px !important;
          max-height: none !important;
          overflow-y: auto !important;
        }
        .html-editor-textarea:focus {
          min-height: 500px !important;
          height: 500px !important;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Offline Forms Configuration</h2>
          <p className="text-muted-foreground">
            Configure downloadable offline forms for membership and seminars
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="gradient-primary">
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="membership">
            <FileText className="mr-2 h-4 w-4" />
            Membership Form
          </TabsTrigger>
          <TabsTrigger value="seminar">
            <Calendar className="mr-2 h-4 w-4" />
            Seminar Registration Form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="membership">
          <Card>
            <CardHeader>
              <CardTitle>Membership Offline Form HTML</CardTitle>
              <CardDescription>
                This HTML will be downloaded when users click "Download Offline Form" on the membership page.
                Include complete form with declaration section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="membership-html">
                    {showMembershipPreview ? 'Form Preview' : 'HTML Content'}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMembershipPreview(!showMembershipPreview)}
                    className="gap-2"
                  >
                    {showMembershipPreview ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Back to Editor
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Show Preview
                      </>
                    )}
                  </Button>
                </div>

                {!showMembershipPreview ? (
                  <>
                    <Textarea
                      id="membership-html"
                      value={membershipFormHtml}
                      onChange={(e) => setMembershipFormHtml(e.target.value)}
                      placeholder="Enter complete HTML for offline membership form..."
                      className="html-editor-textarea font-mono text-sm resize-y w-full"
                      rows={25}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the complete HTML markup including declaration section. This will be downloaded as a file.
                    </p>
                    {membershipFormHtml && (
                      <p className="text-xs text-green-600">
                        ✓ HTML loaded ({membershipFormHtml.length} characters)
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="border rounded-lg p-6 bg-white overflow-auto" style={{ minHeight: '600px' }}>
                      <iframe
                        srcDoc={membershipFormHtml}
                        style={{ 
                          width: '100%', 
                          minHeight: '800px',
                          border: 'none',
                          background: 'white'
                        }}
                        title="Membership Form Preview"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Preview of how the form will look when downloaded. Click "Back to Editor" to continue editing.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seminar">
          <Card>
            <CardHeader>
              <CardTitle>Seminar Registration Offline Form HTML</CardTitle>
              <CardDescription>
                This HTML will be used for offline seminar registrations.
                Include complete form with all registration fields and declaration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seminar-html">
                    {showSeminarPreview ? 'Form Preview' : 'HTML Content'}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeminarPreview(!showSeminarPreview)}
                    className="gap-2"
                  >
                    {showSeminarPreview ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Back to Editor
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Show Preview
                      </>
                    )}
                  </Button>
                </div>

                {!showSeminarPreview ? (
                  <>
                    <Textarea
                      id="seminar-html"
                      value={seminarFormHtml}
                      onChange={(e) => setSeminarFormHtml(e.target.value)}
                      placeholder="Enter complete HTML for offline seminar registration form..."
                      className="html-editor-textarea font-mono text-sm resize-y w-full"
                      rows={25}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the complete HTML markup for seminar registration. This will be used for offline registrations.
                    </p>
                    {seminarFormHtml && (
                      <p className="text-xs text-green-600">
                        ✓ HTML loaded ({seminarFormHtml.length} characters)
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="border rounded-lg p-6 bg-white overflow-auto" style={{ minHeight: '600px' }}>
                      <iframe
                        srcDoc={seminarFormHtml}
                        style={{ 
                          width: '100%', 
                          minHeight: '800px',
                          border: 'none',
                          background: 'white'
                        }}
                        title="Seminar Form Preview"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Preview of how the form will look when downloaded. Click "Back to Editor" to continue editing.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2 text-sm">
          <p><strong>Membership Form:</strong> Should contain all personal details fields with declaration section for offline submission.</p>
          <p><strong>Seminar Form:</strong> Should contain registration fields, fee structure, and declaration for offline seminar registrations.</p>
          <p><strong>HTML Tips:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Use inline CSS for styling</li>
            <li>Include proper DOCTYPE and meta tags</li>
            <li>Make forms print-friendly</li>
            <li>Include bank details and payment information</li>
            <li>Add declaration and signature sections</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
