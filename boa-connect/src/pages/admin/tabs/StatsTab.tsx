import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, X, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';

interface Stat {
  id: number;
  stat_key: string;
  stat_value: string;
  stat_label: string;
  stat_icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const availableIcons = [
  { value: 'Users', label: 'Users' },
  { value: 'Calendar', label: 'Calendar' },
  { value: 'Award', label: 'Award' },
  { value: 'MapPin', label: 'Map Pin' },
  { value: 'Eye', label: 'Eye' },
  { value: 'Stethoscope', label: 'Stethoscope' },
  { value: 'BookOpen', label: 'Book Open' },
  { value: 'Target', label: 'Target' },
];

export default function StatsTab() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    stat_key: '',
    stat_value: '',
    stat_label: '',
    stat_icon: 'Users',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats || []);
      } else {
        throw new Error(data.message || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stats',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        method: 'POST',
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
          description: 'Stat created successfully',
        });
        setIsCreating(false);
        resetForm();
        loadStats();
      } else {
        throw new Error(data.message || 'Failed to create stat');
      }
    } catch (error) {
      console.error('Failed to create stat:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create stat',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats/${id}`, {
        method: 'PUT',
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
          description: 'Stat updated successfully',
        });
        setEditingId(null);
        resetForm();
        loadStats();
      } else {
        throw new Error(data.message || 'Failed to update stat');
      }
    } catch (error) {
      console.error('Failed to update stat:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update stat',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stat?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Stat deleted successfully',
        });
        loadStats();
      } else {
        throw new Error(data.message || 'Failed to delete stat');
      }
    } catch (error) {
      console.error('Failed to delete stat:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete stat',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats/${id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Stat status updated successfully',
        });
        loadStats();
      } else {
        throw new Error(data.message || 'Failed to update stat status');
      }
    } catch (error) {
      console.error('Failed to toggle stat status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update stat status',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (stat: Stat) => {
    setEditingId(stat.id);
    setFormData({
      stat_key: stat.stat_key,
      stat_value: stat.stat_value,
      stat_label: stat.stat_label,
      stat_icon: stat.stat_icon,
      display_order: stat.display_order,
      is_active: stat.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      stat_key: '',
      stat_value: '',
      stat_label: '',
      stat_icon: 'Users',
      display_order: 0,
      is_active: true,
    });
  };

  const startCreate = () => {
    setIsCreating(true);
    resetForm();
    setFormData(prev => ({
      ...prev,
      display_order: stats.length
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Homepage Stats Management
          </h2>
          <p className="text-muted-foreground">Manage the statistics displayed on the homepage "Our Impact" section</p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Stat
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Stat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stat_key">Stat Key (Unique)</Label>
                <Input
                  id="stat_key"
                  value={formData.stat_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, stat_key: e.target.value }))}
                  placeholder="e.g., total_members"
                />
              </div>
              <div>
                <Label htmlFor="stat_value">Value</Label>
                <Input
                  id="stat_value"
                  value={formData.stat_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, stat_value: e.target.value }))}
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <Label htmlFor="stat_label">Label</Label>
                <Input
                  id="stat_label"
                  value={formData.stat_label}
                  onChange={(e) => setFormData(prev => ({ ...prev, stat_label: e.target.value }))}
                  placeholder="e.g., Active Members"
                />
              </div>
              <div>
                <Label htmlFor="stat_icon">Icon</Label>
                <Select value={formData.stat_icon} onValueChange={(value) => setFormData(prev => ({ ...prev, stat_icon: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map(icon => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="gap-2">
                <Save className="h-4 w-4" />
                Create
              </Button>
              <Button variant="outline" onClick={cancelEdit} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats List */}
      <div className="grid gap-4">
        {stats.map((stat) => (
          <Card key={stat.id}>
            <CardContent className="p-4">
              {editingId === stat.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`edit_stat_key_${stat.id}`}>Stat Key</Label>
                      <Input
                        id={`edit_stat_key_${stat.id}`}
                        value={formData.stat_key}
                        onChange={(e) => setFormData(prev => ({ ...prev, stat_key: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit_stat_value_${stat.id}`}>Value</Label>
                      <Input
                        id={`edit_stat_value_${stat.id}`}
                        value={formData.stat_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, stat_value: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit_stat_label_${stat.id}`}>Label</Label>
                      <Input
                        id={`edit_stat_label_${stat.id}`}
                        value={formData.stat_label}
                        onChange={(e) => setFormData(prev => ({ ...prev, stat_label: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit_stat_icon_${stat.id}`}>Icon</Label>
                      <Select value={formData.stat_icon} onValueChange={(value) => setFormData(prev => ({ ...prev, stat_icon: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableIcons.map(icon => (
                            <SelectItem key={icon.value} value={icon.value}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`edit_display_order_${stat.id}`}>Display Order</Label>
                      <Input
                        id={`edit_display_order_${stat.id}`}
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`edit_is_active_${stat.id}`}
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor={`edit_is_active_${stat.id}`}>Active</Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(stat.id)} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={cancelEdit} className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-primary">{stat.stat_value}+</div>
                    <div>
                      <div className="font-semibold">{stat.stat_label}</div>
                      <div className="text-sm text-muted-foreground">
                        Key: {stat.stat_key} | Icon: {stat.stat_icon} | Order: {stat.display_order}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={stat.is_active}
                      onCheckedChange={() => handleToggleStatus(stat.id)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startEdit(stat)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(stat.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Stats Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first stat to display on the homepage
            </p>
            <Button onClick={startCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Stat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}