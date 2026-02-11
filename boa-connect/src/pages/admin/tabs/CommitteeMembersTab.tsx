import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import { adminAuthAPI } from '@/lib/api';
import { API_BASE_URL } from '@/lib/utils';
import axios from 'axios';

export default function CommitteeMembersTab() {
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    profession: '',
    image_url: '',
    display_order: 0,
    page_type: 'about'
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/committee-members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await axios.put(`${API_BASE_URL}/api/admin/committee-members/${editingMember.id}`,
          { ...formData, is_active: true },
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }
        );
        toast({ title: 'Success', description: 'Member updated successfully' });
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/committee-members`, formData, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        toast({ title: 'Success', description: 'Member added successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
      loadMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      profession: member.profession,
      image_url: member.image_url || '',
      display_order: member.display_order || 0,
      page_type: member.page_type || 'about'
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/committee-members/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast({ title: 'Success', description: 'Member deleted successfully' });
      loadMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Delete failed',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingMember(null);
    setFormData({ name: '', profession: '', image_url: '', display_order: 0, page_type: 'about' });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Committee Members</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Dr. John Doe" />
              </div>
              <div>
                <Label>Profession/Role *</Label>
                <Input value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} required placeholder="President" />
              </div>

              <div className="space-y-2">
                <Label>Member Image</Label>
                {formData.image_url && (
                  <div className="relative rounded-lg border border-border overflow-hidden mb-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-32 h-32 object-cover mx-auto"
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
                <p className="text-xs text-muted-foreground">Upload image (Max 5MB, JPG/PNG) or leave empty for default avatar</p>
              </div>

              <div>
                <Label>Image URL (Alternative)</Label>
                <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://example.com/image.jpg" />
                <p className="text-xs text-muted-foreground mt-1">Or paste image URL directly</p>
              </div>

              <div>
                <Label>Display On Page *</Label>
                <select
                  value={formData.page_type}
                  onChange={(e) => setFormData({ ...formData, page_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="about">About Page</option>
                  <option value="home">Home Page</option>
                  <option value="seminar">Seminar Registration Page</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Choose where to display this member</p>
              </div>

              <div>
                <Label>Display Order</Label>
                <Input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })} />
                <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
              </div>
              <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background border-t mt-4 -mx-6 px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="gradient-primary text-primary-foreground">
                  {editingMember ? 'Update' : 'Add'}
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
              <TableHead className="w-12">#</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Profession</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}.
                </TableCell>
                <TableCell>{member.display_order}</TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.profession}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded ${
                    member.page_type === 'home' ? 'bg-blue-500 text-white' : 
                    member.page_type === 'seminar' ? 'bg-green-500 text-white' : 
                    'bg-gray-500 text-white'
                  }`}>
                    {member.page_type === 'home' ? 'Home' : member.page_type === 'seminar' ? 'Seminar' : 'About'}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.image_url ? '✓ Has image' : '✗ No image'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>
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
