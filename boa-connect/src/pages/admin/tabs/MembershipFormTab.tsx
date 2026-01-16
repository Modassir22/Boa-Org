import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api';

export function MembershipFormTab() {
  const [loading, setLoading] = useState(false);
  const [formHtml, setFormHtml] = useState('');
  const [offlineFormHtml, setOfflineFormHtml] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await adminAPI.getMembershipFormConfig();
      if (response.success && response.config) {
        setFormHtml(response.config.form_html || '');
        setOfflineFormHtml(response.config.offline_form_html || '');
      }
    } catch (error: any) {
      console.error('Failed to load membership form config:', error);
      toast.error('Failed to load configuration');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminAPI.updateMembershipFormConfig({
        form_html: formHtml,
        offline_form_html: offlineFormHtml
      });
      toast.success('Membership form configuration updated successfully');
    } catch (error: any) {
      console.error('Failed to update membership form config:', error);
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Membership Form Configuration</h2>
          <p className="text-muted-foreground">
            Configure online and offline membership forms
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="gradient-primary">
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="online" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="online">
            <FileText className="mr-2 h-4 w-4" />
            Online Form HTML
          </TabsTrigger>
          <TabsTrigger value="offline">
            <Download className="mr-2 h-4 w-4" />
            Offline Form HTML
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online">
          <Card>
            <CardHeader>
              <CardTitle>Online Form HTML</CardTitle>
              <CardDescription>
                This HTML will be displayed on the membership form page for online filling.
                No declaration section should be included here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="form-html">HTML Content</Label>
                <Textarea
                  id="form-html"
                  value={formHtml}
                  onChange={(e) => setFormHtml(e.target.value)}
                  placeholder="Enter HTML for online membership form..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter the complete HTML markup for the online form. This will be rendered on the membership page.
                </p>
              </div>

              {formHtml && (
                <div>
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/50 max-h-[300px] overflow-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: formHtml }}
                      style={{ maxWidth: '100%', width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offline">
          <Card>
            <CardHeader>
              <CardTitle>Offline Form HTML</CardTitle>
              <CardDescription>
                This HTML will be available for download. Include declaration section here.
                Users will download this as an HTML file to print and fill manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="offline-form-html">HTML Content</Label>
                <Textarea
                  id="offline-form-html"
                  value={offlineFormHtml}
                  onChange={(e) => setOfflineFormHtml(e.target.value)}
                  placeholder="Enter HTML for offline membership form with declaration..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter the complete HTML markup including declaration section. This will be downloaded as a file.
                </p>
              </div>

              {offlineFormHtml && (
                <div>
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/50 max-h-[300px] overflow-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: offlineFormHtml }}
                      style={{ maxWidth: '100%', width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2 text-sm">
          <p><strong>Online Form:</strong> Should contain only the form fields without declaration. Users will fill this online.</p>
          <p><strong>Offline Form:</strong> Should be a complete HTML document with declaration section. Users will download and print this.</p>
          <p><strong>HTML Tips:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Use inline CSS for styling in offline form</li>
            <li>Include proper DOCTYPE and meta tags for offline form</li>
            <li>Test the HTML before saving</li>
            <li>Keep forms mobile-friendly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
