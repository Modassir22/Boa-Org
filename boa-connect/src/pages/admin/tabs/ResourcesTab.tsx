import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, X, FileText, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_type: string;
  file_size: string;
  downloads_count: number;
  is_active: boolean;
  display_order: number;
}

export default function ResourcesTab() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'guidelines',
    file_url: '',
    file_type: 'PDF',
    file_size: '',
    is_active: true,
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'guidelines', label: 'Clinical Guidelines' },
    { value: 'forms', label: 'Forms & Templates' },
    { value: 'presentations', label: 'Presentations' },
    { value: 'publications', label: 'Publications' },
  ];

  const fileTypes = ['PDF', 'DOCX', 'PPTX', 'XLSX', 'ZIP'];

  useEffect(() => {
    loadResources();
  }, [filterCategory]);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/resources?category=${filterCategory}`);
      const data = await response.json();
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        title: resource.title,
        description: resource.description,
        category: resource.category,
        file_url: resource.file_url,
        file_type: resource.file_type,
        file_size: resource.file_size,
        is_active: resource.is_active,
      });
    } else {
      setEditingResource(null);
      setFormData({
        title: '',
        description: '',
        category: 'guidelines',
        file_url: '',
        file_type: 'PDF',
        file_size: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingResource(null);
  };

  const handleSubmit = async () => {
    try {
      // Validate
      if (!formData.title || !formData.file_url) {
        toast({
          title: 'Validation Error',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }

      const url = editingResource
        ? `http://localhost:5000/api/admin/resources/${editingResource.id}`
        : 'http://localhost:5000/api/admin/resources';

      const response = await fetch(url, {
        method: editingResource ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: editingResource ? 'Resource updated successfully' : 'Resource created successfully',
        });
        handleCloseDialog();
        loadResources();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save resource',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/resources/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Resource deleted successfully',
        });
        loadResources();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete resource',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/resources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Resource ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
        loadResources();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update resource status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Resources Management</h2>
          <p className="text-muted-foreground">Manage downloadable resources and documents</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Resources Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-semibold">Title</th>
                <th className="text-left p-4 font-semibold">Category</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Size</th>
                <th className="text-left p-4 font-semibold">Downloads</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No resources found</p>
                  </td>
                </tr>
              ) : (
                resources.map((resource) => (
                  <tr key={resource.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {resource.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm capitalize">{resource.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {resource.file_type}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{resource.file_size}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Download className="h-3 w-3" />
                        {resource.downloads_count}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        resource.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {resource.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(resource)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(resource.id, resource.is_active)}
                        >
                          {resource.is_active ? '👁️' : '🚫'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(resource.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Cataract Surgery Guidelines 2024"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the resource"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">File Type *</label>
                <Select value={formData.file_type} onValueChange={(value) => setFormData({ ...formData, file_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">File URL *</label>
              <Input
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="https://example.com/file.pdf"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload file to cloud storage and paste the URL here
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">File Size</label>
              <Input
                value={formData.file_size}
                onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
                placeholder="e.g., 2.5 MB"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                {editingResource ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
