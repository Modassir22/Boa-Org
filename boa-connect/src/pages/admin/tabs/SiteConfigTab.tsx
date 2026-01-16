import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { adminAuthAPI } from '@/lib/api';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

export function SiteConfigTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [config, setConfig] = useState({
    favicon_url: '',
    logo_url: '',
    hero_circle_image_url: '',
    site_title: 'Bihar Ophthalmic Association',
    site_description: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/site-config', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (response.data.config) {
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to load site config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load site configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploadingField(field);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await adminAuthAPI.uploadCertificateImage(uploadFormData);
      
      if (response.success) {
        setConfig(prev => ({ ...prev, [field]: response.image_url }));
        toast({ title: 'Success', description: 'Image uploaded successfully!' });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put('http://localhost:5000/api/admin/site-config', config, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast({ title: 'Success', description: 'Site configuration saved successfully!' });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Site Configuration</h2>
        <p className="text-muted-foreground">Manage your website's branding and appearance</p>
      </div>

      {/* Favicon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Favicon
          </CardTitle>
          <CardDescription>
            Small icon displayed in browser tabs (recommended: 32x32px or 64x64px, .ico or .png)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.favicon_url && (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <img
                src={config.favicon_url}
                alt="Favicon preview"
                className="w-8 h-8 object-contain"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Current Favicon</p>
                <p className="text-xs text-muted-foreground truncate">{config.favicon_url}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'favicon_url')}
              disabled={uploadingField === 'favicon_url'}
              className="cursor-pointer"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingField === 'favicon_url'}
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
            >
              {uploadingField === 'favicon_url' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
          <div>
            <Label>Or paste URL</Label>
            <Input
              value={config.favicon_url}
              onChange={(e) => setConfig({ ...config, favicon_url: e.target.value })}
              placeholder="https://example.com/favicon.ico"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>
            Main logo displayed in navbar (recommended: transparent background, .png)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.logo_url && (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <img
                src={config.logo_url}
                alt="Logo preview"
                className="h-16 object-contain"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Current Logo</p>
                <p className="text-xs text-muted-foreground truncate">{config.logo_url}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'logo_url')}
              disabled={uploadingField === 'logo_url'}
              className="cursor-pointer"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingField === 'logo_url'}
            >
              {uploadingField === 'logo_url' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
          <div>
            <Label>Or paste URL</Label>
            <Input
              value={config.logo_url}
              onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hero Circle Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Hero Section Circle Image
          </CardTitle>
          <CardDescription>
            Circular image displayed in the hero section (recommended: square image, will be cropped to circle)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.hero_circle_image_url && (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <img
                src={config.hero_circle_image_url}
                alt="Hero circle preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Current Hero Image</p>
                <p className="text-xs text-muted-foreground truncate">{config.hero_circle_image_url}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'hero_circle_image_url')}
              disabled={uploadingField === 'hero_circle_image_url'}
              className="cursor-pointer"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingField === 'hero_circle_image_url'}
            >
              {uploadingField === 'hero_circle_image_url' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
          <div>
            <Label>Or paste URL</Label>
            <Input
              value={config.hero_circle_image_url}
              onChange={(e) => setConfig({ ...config, hero_circle_image_url: e.target.value })}
              placeholder="https://example.com/hero-image.jpg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Site Info */}
      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
          <CardDescription>Basic information about your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Site Title</Label>
            <Input
              value={config.site_title}
              onChange={(e) => setConfig({ ...config, site_title: e.target.value })}
              placeholder="Bihar Ophthalmic Association"
            />
          </div>
          <div>
            <Label>Site Description</Label>
            <Textarea
              value={config.site_description}
              onChange={(e) => setConfig({ ...config, site_description: e.target.value })}
              placeholder="Brief description of your organization..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gradient-primary text-primary-foreground"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </div>
    </div>
  );
}
