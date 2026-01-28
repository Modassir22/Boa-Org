import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import DelegateCategoriesManager from '@/components/admin/DelegateCategoriesManager';

export default function FeeStructureTab() {
  const { toast } = useToast();
  const [seminars, setSeminars] = useState<any[]>([]);
  const [selectedSeminar, setSelectedSeminar] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [feeChanges, setFeeChanges] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSlabDialogOpen, setIsSlabDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSlab, setEditingSlab] = useState<any>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_popular: false,
    is_enabled: true
  });

  const [slabForm, setSlabForm] = useState({
    label: '',
    date_range: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadSeminars();
  }, []);

  useEffect(() => {
    if (selectedSeminar) {
      loadFeeStructure();
    }
  }, [selectedSeminar]);

  const loadSeminars = async () => {
    try {
      const response = await adminAPI.getAllSeminars();
      setSeminars(response.seminars || []);
      if (response.seminars?.length > 0) {
        setSelectedSeminar(response.seminars[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load seminars:', error);
    }
  };

  const loadFeeStructure = async () => {
    setIsLoading(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await adminAPI.get(`/admin/fee-structure/${selectedSeminar}?t=${timestamp}`);
      console.log('Loaded fee structure:', response);
      setCategories(response.categories || []);
      setSlabs(response.slabs || []);
      setFees(response.fees || []);
    } catch (error) {
      console.error('Failed to load fee structure:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.post('/admin/fee-categories', { ...categoryForm, seminar_id: selectedSeminar });
      toast({ title: 'Success', description: 'Category created successfully' });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      loadFeeStructure();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to create category', variant: 'destructive' });
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.put(`/admin/fee-categories/${editingCategory.id}`, categoryForm);
      toast({ title: 'Success', description: 'Category updated successfully' });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      loadFeeStructure();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Delete this category? All associated fees will be deleted.')) return;
    try {
      await adminAPI.delete(`/admin/fee-categories/${id}`);
      toast({ title: 'Success', description: 'Category deleted successfully' });
      loadFeeStructure();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    }
  };

  const handleCreateSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.post('/admin/fee-slabs', { ...slabForm, seminar_id: selectedSeminar });
      toast({ title: 'Success', description: 'Fee slab created successfully' });
      setIsSlabDialogOpen(false);
      resetSlabForm();
      loadFeeStructure();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to create slab', variant: 'destructive' });
    }
  };

  const handleUpdateSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Updating slab with data:', slabForm);
      console.log('Slab ID:', editingSlab.id);
      
      const response = await adminAPI.put(`/admin/fee-slabs/${editingSlab.id}`, slabForm);
      console.log('Update response:', response);
      
      toast({ title: 'Success', description: 'Fee slab updated successfully' });
      setIsSlabDialogOpen(false);
      resetSlabForm();
      
      // Force refresh by clearing state first
      setSlabs([]);
      await loadFeeStructure();
    } catch (error: any) {
      console.error('Update slab error:', error);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update slab', variant: 'destructive' });
    }
  };

  const handleDeleteSlab = async (id: number) => {
    if (!confirm('Delete this fee slab? All associated fees will be deleted.')) return;
    try {
      await adminAPI.delete(`/admin/fee-slabs/${id}`);
      toast({ title: 'Success', description: 'Fee slab deleted successfully' });
      loadFeeStructure();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete slab', variant: 'destructive' });
    }
  };

  const handleUpdateFeeAmount = async (categoryId: number, slabId: number, amount: string) => {
    const key = `${categoryId}-${slabId}`;
    setFeeChanges({
      ...feeChanges,
      [key]: parseFloat(amount) || 0
    });
  };

  const handleSaveAllFees = async () => {
    if (Object.keys(feeChanges).length === 0) {
      toast({ title: 'No Changes', description: 'No fee amounts were modified' });
      return;
    }

    setIsSaving(true);
    try {
      const promises = Object.entries(feeChanges).map(([key, amount]) => {
        const [categoryId, slabId] = key.split('-').map(Number);
        return adminAPI.post('/admin/fee-amount', { category_id: categoryId, slab_id: slabId, amount });
      });

      await Promise.all(promises);
      
      toast({ 
        title: 'Success', 
        description: `${Object.keys(feeChanges).length} fee amounts updated successfully` 
      });
      
      setFeeChanges({});
      loadFeeStructure();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update fee amounts', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getFeeAmount = (categoryId: number, slabId: number) => {
    const key = `${categoryId}-${slabId}`;
    if (feeChanges[key] !== undefined) {
      return feeChanges[key];
    }
    const fee = fees.find(f => f.category_id === categoryId && f.slab_id === slabId);
    return fee ? fee.amount : '';
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', is_popular: false, is_enabled: true });
  };

  const resetSlabForm = () => {
    setEditingSlab(null);
    setSlabForm({ label: '', date_range: '', start_date: '', end_date: '' });
  };

  const editCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      is_popular: category.is_popular,
      is_enabled: category.is_enabled
    });
    setIsCategoryDialogOpen(true);
  };

  const editSlab = (slab: any) => {
    setEditingSlab(slab);
    setSlabForm({
      label: slab.label,
      date_range: slab.date_range,
      start_date: slab.start_date?.split('T')[0] || '',
      end_date: slab.end_date?.split('T')[0] || ''
    });
    setIsSlabDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-blue-900">Fee Structure Management</h2>
            <p className="text-blue-700 mt-1">Create and manage fee categories, slabs, and pricing for seminars</p>
          </div>
          <Select value={selectedSeminar} onValueChange={setSelectedSeminar}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Seminar" />
            </SelectTrigger>
            <SelectContent>
              {seminars.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedSeminar && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="font-semibold text-blue-900">📋 Categories</div>
              <div className="text-blue-700">Define delegate types (BOA Member, Non-Member, etc.)</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="font-semibold text-blue-900">📅 Slabs</div>
              <div className="text-blue-700">Set time-based pricing periods (Early Bird, Regular, etc.)</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="font-semibold text-blue-900">💰 Matrix</div>
              <div className="text-blue-700">Set specific amounts for each category-slab combination</div>
            </div>
          </div>
        )}
      </div>

      {!selectedSeminar && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Seminar</h3>
          <p className="text-gray-600 mb-4">Choose a seminar from the dropdown above to manage its fee structure</p>
        </div>
      )}

      {selectedSeminar && (
        <>
          {/* Quick Actions */}
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setIsCategoryDialogOpen(true)}
                size="sm" 
                className="gradient-primary text-primary-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
              <Button 
                onClick={() => setIsSlabDialogOpen(true)}
                size="sm" 
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Slab
              </Button>
              {Object.keys(feeChanges).length > 0 && (
                <Button 
                  onClick={handleSaveAllFees}
                  disabled={isSaving}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? 'Saving...' : `Save ${Object.keys(feeChanges).length} Changes`}
                </Button>
              )}
            </div>
          </div>

          {/* Delegate Categories Manager */}
          <div className="bg-card rounded-lg border p-4">
            <DelegateCategoriesManager seminarId={selectedSeminar} />
          </div>

      {/* Categories Section */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Fee Categories</h3>
          <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => { setIsCategoryDialogOpen(open); if (!open) resetCategoryForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={categoryForm.is_popular} onCheckedChange={(checked) => setCategoryForm({...categoryForm, is_popular: checked})} />
                  <Label>Popular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={categoryForm.is_enabled} onCheckedChange={(checked) => setCategoryForm({...categoryForm, is_enabled: checked})} />
                  <Label>Enabled</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="gradient-primary text-primary-foreground">{editingCategory ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-semibold">{cat.name}</span>
                {cat.is_popular && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Popular</span>}
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => editCategory(cat)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slabs Section */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Fee Slabs</h3>
          <Dialog open={isSlabDialogOpen} onOpenChange={(open) => { setIsSlabDialogOpen(open); if (!open) resetSlabForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Slab
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSlab ? 'Edit Fee Slab' : 'Add Fee Slab'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={editingSlab ? handleUpdateSlab : handleCreateSlab} className="space-y-4">
                <div>
                  <Label>Label *</Label>
                  <Input value={slabForm.label} onChange={(e) => setSlabForm({...slabForm, label: e.target.value})} required />
                </div>
                <div>
                  <Label>Date Range *</Label>
                  <Input 
                    value={slabForm.date_range} 
                    onChange={(e) => setSlabForm({...slabForm, date_range: e.target.value})} 
                    placeholder="e.g., 1 May - 15 May"
                    required 
                  />
                  <p className="text-xs text-muted-foreground mt-1">This will auto-update when you change dates below</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Input 
                      type="date" 
                      value={slabForm.start_date} 
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        // Auto-update date_range
                        if (newStartDate && slabForm.end_date) {
                          const start = new Date(newStartDate);
                          const end = new Date(slabForm.end_date);
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const dateRange = `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
                          setSlabForm({...slabForm, start_date: newStartDate, date_range: dateRange});
                        } else {
                          setSlabForm({...slabForm, start_date: newStartDate});
                        }
                      }} 
                      required 
                    />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input 
                      type="date" 
                      value={slabForm.end_date} 
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        // Auto-update date_range
                        if (slabForm.start_date && newEndDate) {
                          const start = new Date(slabForm.start_date);
                          const end = new Date(newEndDate);
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const dateRange = `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
                          setSlabForm({...slabForm, end_date: newEndDate, date_range: dateRange});
                        } else {
                          setSlabForm({...slabForm, end_date: newEndDate});
                        }
                      }} 
                      required 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsSlabDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="gradient-primary text-primary-foreground">{editingSlab ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {slabs.map(slab => (
            <div key={slab.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-semibold">{slab.label}</span>
                <p className="text-sm text-muted-foreground">{slab.date_range}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => editSlab(slab)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteSlab(slab.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Matrix */}
      {categories.length > 0 && slabs.length > 0 && (
        <div className="bg-card rounded-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fee Matrix (Rs)
            </h3>
            <div className="flex items-center gap-3">
              {Object.keys(feeChanges).length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {Object.keys(feeChanges).length} unsaved changes
                </span>
              )}
              <Button 
                onClick={handleSaveAllFees}
                disabled={Object.keys(feeChanges).length === 0 || isSaving}
                className="gradient-primary text-primary-foreground"
              >
                {isSaving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-3 font-semibold">Category</th>
                  {slabs.map(slab => (
                    <th key={slab.id} className="text-center p-3 font-semibold min-w-[120px]">
                      <div>{slab.label}</div>
                      <div className="text-xs font-normal text-muted-foreground">{slab.date_range}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-b">
                    <td className="p-3 font-medium">{cat.name}</td>
                    {slabs.map(slab => (
                      <td key={slab.id} className="p-3">
                        <Input
                          type="number"
                          placeholder="0"
                          value={getFeeAmount(cat.id, slab.id)}
                          onChange={(e) => handleUpdateFeeAmount(cat.id, slab.id, e.target.value)}
                          className="text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
