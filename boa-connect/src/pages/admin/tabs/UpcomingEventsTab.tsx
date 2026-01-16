import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { adminAuthAPI } from '@/lib/api';
import axios from 'axios';

export default function UpcomingEventsTab() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    image_url: '',
    link_url: '',
    display_order: 0
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/upcoming-events', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
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
      uploadFormData.append('image', file);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url) {
      toast({ title: 'Error', description: 'Please upload an image', variant: 'destructive' });
      return;
    }

    try {
      if (editingEvent) {
        await axios.put(`http://localhost:5000/api/admin/upcoming-events/${editingEvent.id}`, 
          { ...formData, is_active: true },
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }}
        );
        toast({ title: 'Success', description: 'Event updated successfully' });
      } else {
        await axios.post('http://localhost:5000/api/admin/upcoming-events', formData, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        toast({ title: 'Success', description: 'Event added successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
      loadEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      start_date: event.start_date ? event.start_date.split('T')[0] : '',
      end_date: event.end_date ? event.end_date.split('T')[0] : '',
      image_url: event.image_url || '',
      link_url: event.link_url || '',
      display_order: event.display_order || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/upcoming-events/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast({ title: 'Success', description: 'Event deleted successfully' });
      loadEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Delete failed',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({ 
      title: '',
      description: '',
      location: '',
      start_date: '',
      end_date: '',
      image_url: '', 
      link_url: '', 
      display_order: 0 
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <p className="text-muted-foreground">Manage carousel images for homepage</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label>Event Title *</Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Enter event description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={formData.location} 
                    onChange={(e) => setFormData({...formData, location: e.target.value})} 
                    placeholder="Event location"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input 
                    type="number" 
                    value={formData.display_order} 
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input 
                    type="date" 
                    value={formData.start_date} 
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={formData.end_date} 
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Event Image *</Label>
                {formData.image_url && (
                  <div className="relative rounded-lg border border-border overflow-hidden mb-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="cursor-pointer text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    size="sm"
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
                <p className="text-xs text-muted-foreground">Max 5MB, JPG/PNG - Recommended: 1920x600px</p>
              </div>

              <div>
                <Label>Registration Link</Label>
                <Input 
                  value={formData.link_url} 
                  onChange={(e) => setFormData({...formData, link_url: e.target.value})} 
                  placeholder="https://example.com or /seminar/1/register"
                  type="text"
                />
                <p className="text-xs text-muted-foreground mt-1">Optional - Registration form URL</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="gradient-primary text-primary-foreground">
                  {editingEvent ? 'Update' : 'Add'}
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
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Registration Link</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No upcoming events added yet. Click "Add Event" to create one.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.display_order}</TableCell>
                  <TableCell className="font-medium">{event.title || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    }) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{event.location || '-'}</TableCell>
                  <TableCell className="text-sm max-w-xs">
                    {event.link_url ? (
                      <a 
                        href={event.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate block"
                      >
                        {event.link_url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No link</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {event.image_url && (
                      <img src={event.image_url} alt="Event" className="h-12 w-24 object-cover rounded" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
