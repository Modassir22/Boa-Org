import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Calendar, MapPin, Phone, Download, FileText, X, Upload } from 'lucide-react';
import { adminAPI } from '@/lib/api';

export default function ElectionsTab() {
  const [elections, setElections] = useState<any[]>([]);
  const [selectedElection, setSelectedElection] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    html_content: '', // HTML editor content
    image_url: '', // Image URL
    eligible_members: 'Life Member',
    deadline: '',
    voting_date: '',
    voting_time: '',
    voting_venue: '',
    contact_mobile: '',
    positions: ['President', 'Vice President', 'Secretary', 'Treasurer'],
    form_type: 'Nomination Form',
    status: 'active'
  });

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      const response = await adminAPI.get('/elections');
      if (response.success) {
        console.log('Raw elections from backend:', response.elections);
        
        // Parse positions if they come as JSON string
        const parsedElections = response.elections.map((election: any) => {
          const parsedPositions = typeof election.positions === 'string' 
            ? JSON.parse(election.positions) 
            : (election.positions || []);
          
          console.log(`Election ${election.id} positions:`, parsedPositions);
          
          return {
            ...election,
            positions: parsedPositions
          };
        });
        
        console.log('Parsed elections:', parsedElections);
        setElections(parsedElections);
      }
    } catch (error) {
      console.error('Failed to load elections:', error);
      toast.error('Failed to load elections');
    }
  };

  const loadSubmissions = async (electionId: number) => {
    try {
      setLoading(true);
      const response = await adminAPI.get(`/elections/${electionId}/submissions`);
      if (response.success) {
        setSubmissions(response.submissions);
        setSubmissionsDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      // Upload directly to Cloudinary via upload endpoint (not gallery)
      const adminToken = localStorage.getItem('adminToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const uploadResponse = await fetch(`${apiUrl}/api/admin/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: uploadFormData,
      });

      const response = await uploadResponse.json();

      if (response.success && response.imageUrl) {
        setFormData({ ...formData, image_url: response.imageUrl });
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error(response.message || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty positions
      const filteredPositions = formData.positions.filter(p => p.trim() !== '');
      
      if (filteredPositions.length === 0) {
        toast.error('Please add at least one position');
        setLoading(false);
        return;
      }

      const dataToSend = {
        ...formData,
        positions: filteredPositions
      };

      console.log('Sending election data:', dataToSend);

      let response;
      if (selectedElection) {
        // Update
        response = await adminAPI.put(`/elections/${selectedElection.id}`, dataToSend);
        toast.success('Election updated successfully');
      } else {
        // Create without PDF generation (PDF will be generated on-demand when downloaded)
        response = await adminAPI.post('/elections', {
          ...dataToSend,
          generate_pdf: false // PDF will be generated on-demand like seminars
        });
        
        console.log('Election created response:', response);
        
        toast.success('Election created successfully. PDF will be generated when users download the form.');
      }
      
      setDialogOpen(false);
      resetForm();
      loadElections();
    } catch (error: any) {
      console.error('Failed to save election:', error);
      toast.error(error.response?.data?.message || 'Failed to save election');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this election?')) return;

    try {
      await adminAPI.delete(`/elections/${id}`);
      toast.success('Election deleted successfully');
      loadElections();
    } catch (error) {
      console.error('Failed to delete election:', error);
      toast.error('Failed to delete election');
    }
  };

  const handleEdit = (election: any) => {
    setSelectedElection(election);
    setFormData({
      title: election.title,
      description: election.description || '',
      html_content: election.html_content || '',
      image_url: election.image_url || '',
      eligible_members: election.eligible_members,
      deadline: election.deadline?.split('T')[0] || '',
      voting_date: election.voting_date?.split('T')[0] || '',
      voting_time: election.voting_time || '',
      voting_venue: election.voting_venue || '',
      contact_mobile: election.contact_mobile || '',
      positions: election.positions || [],
      form_type: election.form_type,
      status: election.status
    });
    setDialogOpen(true);
  };

  const handleUpdateSubmissionStatus = async (submissionId: number, status: string) => {
    try {
      await adminAPI.put(`/elections/submissions/${submissionId}/status`, { status });
      toast.success('Submission status updated');
      if (selectedElection) {
        loadSubmissions(selectedElection.id);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setSelectedElection(null);
    setFormData({
      title: '',
      description: '',
      html_content: '',
      image_url: '',
      eligible_members: 'Life Member',
      deadline: '',
      voting_date: '',
      voting_time: '',
      voting_venue: '',
      contact_mobile: '',
      positions: ['President', 'Vice President', 'Secretary', 'Treasurer'],
      form_type: 'Nomination Form',
      status: 'active'
    });
  };

  const addPosition = () => {
    setFormData({
      ...formData,
      positions: [...formData.positions, '']
    });
  };

  const updatePosition = (index: number, value: string) => {
    const newPositions = [...formData.positions];
    newPositions[index] = value;
    setFormData({ ...formData, positions: newPositions });
  };

  const removePosition = (index: number) => {
    if (formData.positions.length <= 1) {
      toast.error('At least one position is required');
      return;
    }
    const newPositions = formData.positions.filter((_, i) => i !== index);
    setFormData({ ...formData, positions: newPositions });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Elections Management</h2>
          <p className="text-muted-foreground">Manage elections and nominations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Election
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedElection ? 'Edit Election' : 'Add New Election'}</DialogTitle>
              <DialogDescription>
                {selectedElection ? 'Update election details' : 'Create a new election'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="BOA Election 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Election description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Event Image</Label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {formData.image_url && (
                    <div className="relative border rounded-lg p-2 bg-gray-50">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-4 right-4"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex-1"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                          Uploading to Cloudinary...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload to Cloudinary
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Manual URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="image_url_input" className="text-xs text-muted-foreground">
                      Or paste image URL
                    </Label>
                    <Input
                      id="image_url_input"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://res.cloudinary.com/..."
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload image to Cloudinary or paste URL
                </p>
              </div>

              <div className="space-y-2">
                <Label>HTML Content (for PDF Generation)</Label>
                <Textarea
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Paste HTML code here for offline registration form..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste formatted HTML code. Users can download this form from notifications page.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eligible_members">Eligible Members</Label>
                  <Input
                    id="eligible_members"
                    value={formData.eligible_members}
                    onChange={(e) => setFormData({ ...formData, eligible_members: e.target.value })}
                    placeholder="Life Member"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form_type">Form Type</Label>
                  <Input
                    id="form_type"
                    value={formData.form_type}
                    onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
                    placeholder="Nomination Form"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voting_date">Voting Date *</Label>
                  <Input
                    id="voting_date"
                    type="date"
                    value={formData.voting_date}
                    onChange={(e) => setFormData({ ...formData, voting_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voting_time">Voting Time</Label>
                  <Input
                    id="voting_time"
                    value={formData.voting_time}
                    onChange={(e) => setFormData({ ...formData, voting_time: e.target.value })}
                    placeholder="9am to 11am"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_mobile">Contact Mobile</Label>
                  <Input
                    id="contact_mobile"
                    value={formData.contact_mobile}
                    onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                    placeholder="+91-7004259876"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voting_venue">Voting Venue</Label>
                <Input
                  id="voting_venue"
                  value={formData.voting_venue}
                  onChange={(e) => setFormData({ ...formData, voting_venue: e.target.value })}
                  placeholder="Venue, Siliguri"
                />
              </div>

              <div className="space-y-2">
                <Label>Positions</Label>
                {formData.positions.map((position, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={position}
                      onChange={(e) => updatePosition(index, e.target.value)}
                      placeholder="Position name"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePosition(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addPosition}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Position
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : selectedElection ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {elections.map((election) => (
          <Card key={election.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{election.title}</CardTitle>
                  <CardDescription>{election.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={election.status === 'active' ? 'default' : 'secondary'}>
                    {election.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Image Preview */}
              {election.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden border">
                  <img 
                    src={election.image_url} 
                    alt={election.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{election.eligible_members}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {new Date(election.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{election.voting_venue || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{election.contact_mobile || 'N/A'}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Positions:</p>
                <div className="flex flex-wrap gap-2">
                  {election.positions && Array.isArray(election.positions) && election.positions.length > 0 ? (
                    election.positions.map((position: string, index: number) => (
                      <Badge key={index} variant="outline">{position}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No positions defined</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {election.html_content && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        // Generate PDF on-demand (same as seminar)
                        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/elections/generate-pdf/${election.id}`);
                        
                        if (!response.ok) {
                          throw new Error('Failed to generate PDF');
                        }

                        // Download the PDF
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${election.title.replace(/[^a-zA-Z0-9]/g, '_')}_Nomination_Form.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        
                        // Clean up
                        setTimeout(() => {
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        }, 100);
                        
                        toast.success('PDF downloaded successfully!');
                      } catch (error: any) {
                        console.error('Failed to generate PDF:', error);
                        toast.error('Failed to generate PDF');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedElection(election);
                    loadSubmissions(election.id);
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Submissions
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(election)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(election.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onOpenChange={setSubmissionsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Election Submissions - {selectedElection?.title}</DialogTitle>
            <DialogDescription>
              Total submissions: {submissions.length}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Membership No</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.position}</TableCell>
                    <TableCell>{submission.name}</TableCell>
                    <TableCell>{submission.life_membership_no || 'N/A'}</TableCell>
                    <TableCell>{submission.mobile}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          submission.status === 'approved'
                            ? 'default'
                            : submission.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateSubmissionStatus(submission.id, 'approved')}
                          disabled={submission.status === 'approved'}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateSubmissionStatus(submission.id, 'rejected')}
                          disabled={submission.status === 'rejected'}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
