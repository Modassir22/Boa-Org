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
    icon: 'Award',
    category: 'passout_fee',
    price: '',
    duration: '',
    features: [''],
    is_recommended: false,
    is_active: true,
  });

  const iconOptions = [
    'Award', 'Briefcase', 'CreditCard', 'GraduationCap', 'Users', 'Star'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/membership-categories');
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
        icon: category.icon,
        category: category.category,
        price: category.price,
        duration: category.duration,
        features: category.features,
        is_recommended: category.is_recommended,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        title: '',
        icon: 'Award',
        category: 'passout_fee',
        price: '',
        duration: '',
        features: [''],
        is_recommended: false,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate
      if (!formData.title || !formData.price || !formData.duration) {
        toast({
          title: 'Validation Error',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }

      const filteredFeatures = formData.features.filter(f => f.trim() !== '');
      if (filteredFeatures.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please add at least one feature',
          variant: 'destructive',
        });
        return;
      }

      const url = editingCategory
        ? `http://localhost:5000/api/admin/membership-categories/${editingCategory.id}`
        : 'http://localhost:5000/api/admin/membership-categories';

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...formData,
          features: filteredFeatures
        })
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
      const response = await fetch(`http://localhost:5000/api/admin/membership-categories/${id}`, {
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
      const response = await fetch(`http://localhost:5000/api/admin/membership-categories/${id}`, {
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Life Membership"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category *</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passout_fee">Passout Fee</SelectItem>
                  <SelectItem value="student_fee">Student Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Price (₹) *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duration *</label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., One-time payment"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Icon</label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(icon => (
                    <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Features *</label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddFeature}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder="Enter feature"
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_recommended}
                  onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Mark as Recommended</span>
              </label>

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
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
