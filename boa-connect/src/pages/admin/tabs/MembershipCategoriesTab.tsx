import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, X, GripVertical, Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { API_BASE_URL } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MembershipCategory {
  id: number;
  title: string;
  icon: string;
  category: string;
  price: string;
  student_price?: string; // Added student_price field
  duration: string;
  features: string[];
  is_recommended: boolean;
  display_order: number;
  is_active: boolean;
}

export default function MembershipCategoriesTab() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MembershipCategory | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    student_price: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      // Add cache-busting parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/api/membership-categories?t=${timestamp}`, {
        cache: 'no-cache'
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load membership categories',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (category?: MembershipCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        title: category.title,
        price: category.price,
        student_price: category.student_price || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        title: '',
        price: '',
        student_price: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    try {
      // Validate
      if (!formData.title || !formData.price) {
        toast({
          title: 'Validation Error',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }

      const url = editingCategory
        ? `${API_BASE_URL}/api/admin/membership-categories/${editingCategory.id}`
        : `${API_BASE_URL}/api/admin/membership-categories`;

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
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
          description: editingCategory ? 'Category updated successfully' : 'Category created successfully',
        });
        handleCloseDialog();
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
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/membership-categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        });
        loadCategories();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/membership-categories/${id}`, {
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
          description: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
        loadCategories();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update category status',
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Membership Categories</h2>
          <p className="text-muted-foreground">Manage membership plans and pricing</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`border rounded-lg p-6 space-y-4 ${
              !category.is_active ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{category.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      category.category === 'passout_fee' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {category.category === 'passout_fee' ? 'Passout Fee' : 'Student Fee'}
                    </span>
                    {category.is_recommended && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold">₹{category.price}</div>
              <div className="text-sm text-muted-foreground">{category.duration}</div>
              {(category as any).student_price && parseFloat((category as any).student_price) > 0 && (
                <div className="text-lg font-semibold text-green-600 mt-1">
                  Student: ₹{parseFloat((category as any).student_price).toLocaleString()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Features:</p>
              <ul className="space-y-1">
                {category.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
                {category.features.length > 3 && (
                  <li className="text-sm text-muted-foreground">
                    +{category.features.length - 3} more
                  </li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Order: {category.display_order}
              </span>
              <Button
                variant={category.is_active ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleToggleActive(category.id, category.is_active)}
              >
                {category.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Membership Plan' : 'Add Membership Plan'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Yearly, 5-Yearly, Lifetime"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Passout Fee (₹) *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1200"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Student Fee (₹)</label>
              <Input
                type="number"
                value={formData.student_price}
                onChange={(e) => setFormData({ ...formData, student_price: e.target.value })}
                placeholder="600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
