import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

interface DelegateCategoriesManagerProps {
  seminarId: string;
}

export default function DelegateCategoriesManager({ seminarId }: DelegateCategoriesManagerProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    description: '',
    requires_membership: false,
    display_order: 0
  });

  useEffect(() => {
    if (seminarId) {
      loadCategories();
    }
  }, [seminarId]);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/delegate-categories/${seminarId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      label: '',
      description: '',
      requires_membership: false,
      display_order: categories.length
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      label: category.label,
      description: category.description || '',
      requires_membership: category.requires_membership,
      display_order: category.display_order
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCategory
        ? `http://localhost:5000/api/admin/delegate-categories/${editingCategory.id}`
        : 'http://localhost:5000/api/admin/delegate-categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seminar_id: seminarId,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: editingCategory ? 'Category updated' : 'Category added',
        });
        setIsDialogOpen(false);
        loadCategories();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save category',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this delegate category?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/delegate-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Category deleted' });
        loadCategories();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Delegate Categories
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage delegate types for registration
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="border rounded-lg divide-y">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{cat.label}</h4>
                {cat.requires_membership && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Requires Membership
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Value: {cat.name}</p>
              {cat.description && (
                <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No delegate categories added yet
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Delegate Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name (Value) *</Label>
              <Input
                placeholder="e.g., boa-member"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Lowercase with hyphens (e.g., boa-member, non-boa-member)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Label (Display) *</Label>
              <Input
                placeholder="e.g., BOA MEMBER"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_membership"
                checked={formData.requires_membership}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_membership: checked as boolean })}
              />
              <label htmlFor="requires_membership" className="text-sm font-medium cursor-pointer">
                Requires BOA Membership Number
              </label>
            </div>

            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Update' : 'Add'} Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
