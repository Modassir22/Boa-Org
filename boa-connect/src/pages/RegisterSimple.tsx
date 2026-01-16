import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import { titleOptions, genderOptions, indianStates } from '@/lib/mockData';

export default function RegisterSimple() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: 'dr',
    first_name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    phone: '',
    gender: 'male',
    dob: '',
    house: '',
    street: '',
    landmark: '',
    city: '',
    state: 'Bihar',
    country: 'India',
    pin_code: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: 'Agreement Required',
        description: 'You must agree to the Terms of Service and Privacy Policy.',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.password.length < 8) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authAPI.register(registerData);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast({
        title: 'Registration Successful!',
        description: 'Your account has been created successfully.',
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join BOA and access exclusive member benefits</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Select value={formData.title} onValueChange={(v) => handleChange('title', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {titleOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {genderOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input 
                      value={formData.first_name} 
                      onChange={(e) => handleChange('first_name', e.target.value)} 
                      required 
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Surname *</Label>
                    <Input 
                      value={formData.surname} 
                      onChange={(e) => handleChange('surname', e.target.value)} 
                      required 
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Birth *</Label>
                    <Input type="date" value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Mobile *</Label>
                    <Input 
                      type="tel" 
                      value={formData.mobile} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          handleChange('mobile', value);
                        }
                      }}
                      required 
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="10 digit mobile number"
                    />
                    {formData.mobile && formData.mobile.length !== 10 && (
                      <p className="text-xs text-destructive">Mobile number must be exactly 10 digits</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Email *</Label>
                    <Input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => handleChange('email', e.target.value)} 
                      required 
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>House/Flat No *</Label>
                    <Input 
                      value={formData.house} 
                      onChange={(e) => handleChange('house', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Street *</Label>
                    <Input 
                      value={formData.street} 
                      onChange={(e) => handleChange('street', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input 
                      value={formData.city} 
                      onChange={(e) => handleChange('city', e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={formData.state} onValueChange={(v) => handleChange('state', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {indianStates.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pin Code *</Label>
                    <Input 
                      value={formData.pin_code} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 6) {
                          handleChange('pin_code', value);
                        }
                      }}
                      required 
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="6 digit pin code"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Account Security</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className="pr-10"
                        required
                        placeholder="Minimum 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        className="pr-10"
                        required
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="p-4 bg-muted rounded-lg border-2 border-border">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to BOA's{' '}
                    <Link to="/terms-of-service" target="_blank" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary text-primary-foreground" 
                size="lg"
                disabled={isLoading || !agreedToTerms}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
