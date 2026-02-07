import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Calendar, MapPin, Clock, Phone, Send, Download } from 'lucide-react';
import api from '@/lib/api';
import { API_BASE_URL } from '@/lib/utils';

export default function ElectionSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    name: '',
    life_membership_no: '',
    designation: '',
    qualification: '',
    working_place: '',
    age: '',
    sex: '',
    mobile: '',
    address: '',
    email: ''
  });

  useEffect(() => {
    loadElection();
    loadUserData(); // Load logged-in user's data
    checkIfAlreadySubmitted(); // Check if user already submitted
  }, [id]);

  // Check if user has already submitted nomination
  const checkIfAlreadySubmitted = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      
      // Simply try to submit and catch the duplicate error
      // Or we can add a dedicated check endpoint
      // For now, we'll rely on backend validation during submit
      
    } catch (error) {
      console.error('Failed to check submission status:', error);
    }
  };

  // Load logged-in user's data
  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('Logged in user:', user);
        
        // Capitalize title (dr -> Dr, prof -> Prof, etc.)
        const capitalizedTitle = user.title 
          ? user.title.charAt(0).toUpperCase() + user.title.slice(1).toLowerCase()
          : '';
        
        // Construct full name from title, first_name and surname
        const fullName = [capitalizedTitle, user.first_name, user.surname]
          .filter(Boolean)
          .join(' ');
        
        // Pre-fill form with user data
        setFormData(prev => ({
          ...prev,
          name: fullName || user.name || '',
          email: user.email || '',
          mobile: user.mobile || user.phone || '',
          life_membership_no: user.membership_no || user.life_membership_no || ''
        }));
        
        console.log('Form pre-filled with:', {
          name: fullName,
          email: user.email,
          mobile: user.mobile,
          life_membership_no: user.membership_no
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // Debug: Log election state whenever it changes
  useEffect(() => {
    if (election) {
      console.log('=== ELECTION STATE UPDATED ===');
      console.log('Election:', election);
      console.log('Positions:', election.positions);
      console.log('Positions type:', typeof election.positions);
      console.log('Is array?:', Array.isArray(election.positions));
      if (Array.isArray(election.positions)) {
        console.log('Positions length:', election.positions.length);
        console.log('Positions items:', election.positions);
      }
      console.log('=== END DEBUG ===');
    }
  }, [election]);

  const loadElection = async () => {
    try {
      console.log('Loading election with ID:', id);
      const response = await api.get(`/elections/${id}`);
      console.log('Raw API response:', response.data);
      
      if (response.data.success) {
        const electionData = response.data.election;
        console.log('Election data before parsing:', electionData);
        console.log('Positions type:', typeof electionData.positions);
        console.log('Positions value:', electionData.positions);
        
        // Parse positions if they come as JSON string
        if (electionData.positions) {
          try {
            electionData.positions = typeof electionData.positions === 'string' 
              ? JSON.parse(electionData.positions) 
              : electionData.positions;
            console.log('Positions after parsing:', electionData.positions);
            console.log('Is array?', Array.isArray(electionData.positions));
            console.log('Length:', electionData.positions.length);
          } catch (e) {
            console.error('Failed to parse positions:', e);
            electionData.positions = [];
          }
        } else {
          console.warn('No positions found in election data');
          electionData.positions = [];
        }
        
        console.log('Final election data:', electionData);
        setElection(electionData);
      }
    } catch (error) {
      console.error('Failed to load election:', error);
      toast.error('Failed to load election details');
    }
  };

  const handleDownloadPDF = () => {
    if (election?.pdf_url) {
      const pdfUrl = `${API_BASE_URL}${election.pdf_url}`;
      window.open(pdfUrl, '_blank');
      toast.success('Opening PDF...');
    } else {
      toast.error('PDF not available for this election');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.position) {
      toast.error('Please select a position');
      return;
    }
    
    if (!formData.name || !formData.mobile) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting nomination with data:', {
        election_id: id,
        ...formData
      });
      
      const response = await api.post('/elections/submit', {
        election_id: id,
        ...formData
      });

      console.log('Submission response:', response.data);

      if (response.data.success) {
        toast.success('Nomination submitted successfully!');
        navigate('/notifications');
      }
    } catch (error: any) {
      console.error('Failed to submit nomination:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Failed to submit nomination';
      
      // If already submitted error, update state
      if (errorMessage.includes('already submitted')) {
        setAlreadySubmitted(true);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!election) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading election details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container max-w-4xl">
          {/* Election Info */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{election.title}</CardTitle>
                  <CardDescription>{election.description}</CardDescription>
                </div>
                {election.pdf_url && (
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    className="flex-shrink-0"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Form
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {new Date(election.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Voting: {new Date(election.voting_date).toLocaleDateString()}</span>
                </div>
                {election.voting_venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{election.voting_venue}</span>
                  </div>
                )}
                {election.voting_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{election.voting_time}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Nomination Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Nomination</CardTitle>
              <CardDescription>
                Only for {election.eligible_members}. Please fill all required fields.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alreadySubmitted ? (
                /* Already Submitted Message */
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nomination Already Submitted
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You have already submitted your nomination for this election.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/notifications')}
                  >
                    Back to Notifications
                  </Button>
                </div>
              ) : (
                /* Nomination Form */
                <form onSubmit={handleSubmit} className="space-y-6">
                {/* Position Selection */}
                <div className="space-y-2">
                  <Label htmlFor="position">Select Position *</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {election.positions && Array.isArray(election.positions) && election.positions.length > 0 ? (
                        election.positions.map((position: string) => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-positions" disabled>No positions available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {(!election.positions || election.positions.length === 0) && (
                    <p className="text-xs text-red-500">No positions defined for this election</p>
                  )}
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="life_membership_no">Life Membership No</Label>
                      <Input
                        id="life_membership_no"
                        value={formData.life_membership_no}
                        onChange={(e) => setFormData({ ...formData, life_membership_no: e.target.value })}
                        className="bg-gray-50"
                        placeholder="Auto-filled from your profile"
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-filled from your profile. Update if needed.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input
                        id="qualification"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="working_place">Working Place</Label>
                    <Input
                      id="working_place"
                      value={formData.working_place}
                      onChange={(e) => setFormData({ ...formData, working_place: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sex">Sex</Label>
                      <Select
                        value={formData.sex}
                        onValueChange={(value) => setFormData({ ...formData, sex: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile No *</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/notifications')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Nomination
                      </>
                    )}
                  </Button>
                </div>
              </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
