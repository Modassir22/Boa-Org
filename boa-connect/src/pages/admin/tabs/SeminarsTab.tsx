import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminAPI, adminAuthAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function SeminarsTab() {
  const { toast } = useToast();
  const [seminars, setSeminars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    location: '',
    venue: '',
    start_date: '',
    end_date: '',
    registration_start: '',
    registration_end: '',
    description: '',
    offline_form_html: '',
    image_url: '',
    is_active: true,
    status: 'active', // 'active' or 'previous'
    color: '#0B3C5D', // Calendar color
    online_registration_enabled: true // Online registration toggle
  });

  useEffect(() => {
    loadSeminars();
  }, []);

  const loadSeminars = async () => {
    try {
      const response = await adminAPI.getAllSeminars();
      setSeminars(response.seminars || []);
    } catch (error) {
      console.error('Failed to load seminars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSeminar) {
        await adminAPI.updateSeminar(editingSeminar.id, formData);
        toast({ title: 'Success', description: 'Seminar updated successfully' });
      } else {
        await adminAPI.createSeminar(formData);
        toast({ title: 'Success', description: 'Seminar created successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
      loadSeminars();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (seminar: any) => {
    setEditingSeminar(seminar);
    setFormData({
      name: seminar.name,
      title: seminar.title || '',
      location: seminar.location,
      venue: seminar.venue,
      start_date: seminar.start_date?.split('T')[0] || '',
      end_date: seminar.end_date?.split('T')[0] || '',
      registration_start: seminar.registration_start?.split('T')[0] || '',
      registration_end: seminar.registration_end?.split('T')[0] || '',
      description: seminar.description || '',
      offline_form_html: seminar.offline_form_html || '',
      image_url: seminar.image_url || '',
      is_active: seminar.is_active,
      status: seminar.status || 'active',
      color: seminar.color || '#0B3C5D',
      online_registration_enabled: seminar.online_registration_enabled === 1
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file, file.name);

    

      const response = await adminAuthAPI.uploadCertificateImage(uploadFormData);

      if (response.success) {
        setFormData(prev => ({ ...prev, image_url: response.image_url }));
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
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seminar?')) return;
    try {
      await adminAPI.deleteSeminar(id);
      toast({ title: 'Success', description: 'Seminar deleted successfully' });
      loadSeminars();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Delete failed',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (seminar: any) => {
    try {
      const newActiveState = !seminar.is_active;
      await adminAPI.updateSeminar(seminar.id, {
        ...seminar,
        is_active: newActiveState
      });
      toast({
        title: 'Success',
        description: `Seminar ${newActiveState ? 'activated' : 'deactivated'} successfully`
      });
      loadSeminars();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Update failed',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingSeminar(null);
    setFormData({
      name: '',
      title: '',
      location: '',
      venue: '',
      start_date: '',
      end_date: '',
      registration_start: '',
      registration_end: '',
      description: '',
      offline_form_html: '',
      image_url: '',
      is_active: true,
      status: 'active',
      color: '#0B3C5D',
      online_registration_enabled: true
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seminars Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Seminar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSeminar ? 'Edit Seminar' : 'Add New Seminar'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Seminar Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g., Annual Ophthalmic Conference 2026" />
                </div>
                <div className="col-span-2">
                  <Label>Title/Tagline</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Advancing Eye Care Excellence" />
                  <p className="text-xs text-muted-foreground mt-1">Optional subtitle shown on registration form</p>
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                </div>
                <div>
                  <Label>Venue *</Label>
                  <Input value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} required />
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                </div>
                <div>
                  <Label>Registration Start *</Label>
                  <Input type="date" value={formData.registration_start} onChange={(e) => setFormData({ ...formData, registration_start: e.target.value })} required />
                </div>
                <div>
                  <Label>Registration End *</Label>
                  <Input type="date" value={formData.registration_end} onChange={(e) => setFormData({ ...formData, registration_end: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Offline Registration Form (HTML)</Label>
                  <Textarea
                    value={formData.offline_form_html}
                    onChange={(e) => setFormData({ ...formData, offline_form_html: e.target.value })}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder="Paste HTML code here for offline registration form..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste formatted HTML code. Users can download this form from notifications page.
                  </p>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Seminar Image</Label>
                  {formData.image_url && (
                    <div className="relative rounded-lg border border-border overflow-hidden mb-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    >
                      {isUploading ? (
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
                  <p className="text-xs text-muted-foreground">Upload seminar banner image (Max 5MB, JPG/PNG)</p>
                </div>

                <div className="col-span-2 flex items-center justify-between p-4 border rounded-lg">

                  <div>
                    <Label className="text-base font-semibold">
                      Active Status
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable account
                    </p>
                  </div>

                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                    className="
      data-[state=checked]:bg-green-600
      data-[state=unchecked]:bg-gray-400
    "
                  />

                </div>


                <div className="col-span-2">
                  <Label>Event Status *</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setFormData({
                        ...formData,
                        status: newStatus,
                        // Automatically deactivate if status is 'previous'
                        is_active: newStatus === 'previous' ? false : formData.is_active
                      });
                    }}
                    required
                  >
                    <option value="active">Active (Upcoming Event)</option>
                    <option value="previous">Previous (Completed Event)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Previous events will automatically be deactivated and shown in "Previous Events" section without fee structure
                  </p>
                </div>

                <div className="col-span-2">
                  <Label>Calendar Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#0B3C5D"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This color will be used in calendar notifications and event displays
                  </p>
                </div>

                <div className="col-span-2 flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">
                      Online Registration
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable online registration form. If disabled, only offline form will be shown.
                    </p>
                  </div>
                  <Switch
                    checked={formData.online_registration_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, online_registration_enabled: checked })
                    }
                    className="
      data-[state=checked]:bg-green-600
      data-[state=unchecked]:bg-gray-400
    "
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="gradient-primary text-primary-foreground">
                  {editingSeminar ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Event Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seminars.map((seminar) => (
              <TableRow key={seminar.id}>
                <TableCell className="font-medium">{seminar.name}</TableCell>
                <TableCell>{seminar.location}</TableCell>
                <TableCell className="text-sm">
                  {new Date(seminar.start_date).toLocaleDateString()} - {new Date(seminar.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge className={seminar.status === 'previous' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}>
                    {seminar.status === 'previous' ? 'Previous' : 'Upcoming'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={seminar.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                    {seminar.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(seminar)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(seminar.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
