import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'membership'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [membershipNo, setMembershipNo] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let response;
      
      if (loginMethod === 'email') {
        response = await authAPI.login(email, password);
      } else {
        response = await authAPI.loginWithMembership(membershipNo, password);
      }
      
      // Check if user is admin - redirect to admin login
      if (response.user.role === 'admin') {
        toast({
          title: 'Admin Account Detected',
          description: 'Please use admin login page.',
          variant: 'destructive',
        });
        setTimeout(() => {
          navigate('/admin-login');
        }, 1000);
        setIsLoading(false);
        return;
      }

      // Save token
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Show success message
      toast({
        title: 'Login Successful!',
        description: `Welcome back, ${response.user.first_name}!`,
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4" style={{background: '#F9FAFB'}}>
        <div className="w-full max-w-5xl">
          {/* Single Card Container */}
          <div className="gov-card overflow-hidden">
            <div className="grid lg:grid-cols-2">
              {/* Left Side - Image & Info */}
              <div className="hidden lg:block p-8 relative" style={{background: 'linear-gradient(135deg, #0B3C5D 0%, #0A2540 100%)'}}>
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-semibold mb-3 text-white">
                        Bihar Ophthalmic Association
                      </h2>
                      <p className="text-lg text-white/80">
                        Advancing eye care excellence through education, research, and collaboration since 1975
                      </p>
                    </div>

                    {/* Medical Image */}
                    <div className="rounded-lg overflow-hidden border-2" style={{borderColor: '#C9A227'}}>
                      <img 
                        src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80" 
                        alt="Medical Conference"
                        className="w-full h-48 object-cover"
                      />
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{background: 'rgba(201, 162, 39, 0.2)'}}>
                          <svg className="w-5 h-5" style={{color: '#C9A227'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium mb-1 text-white">Access CME Programs</h3>
                          <p className="text-sm text-white/70">Earn credits through certified continuing medical education</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{background: 'rgba(46, 125, 50, 0.2)'}}>
                          <svg className="w-5 h-5" style={{color: '#2E7D32'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium mb-1 text-white">Network with Peers</h3>
                          <p className="text-sm text-white/70">Connect with ophthalmologists across Bihar</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{background: 'rgba(201, 162, 39, 0.2)'}}>
                          <svg className="w-5 h-5" style={{color: '#C9A227'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium mb-1 text-white">Register for Events</h3>
                          <p className="text-sm text-white/70">Easy registration for seminars and conferences</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Element */}
                  <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10">
                    <svg viewBox="0 0 100 100" fill="currentColor" className="text-white">
                      <circle cx="50" cy="50" r="40" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="p-8 lg:p-10">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-semibold mb-2" style={{color: '#1F2933'}}>Welcome Back</h1>
                  <p style={{color: '#616E7C'}}>
                    Sign in to access your BOA account
                  </p>
                </div>

                <Tabs defaultValue="email" className="mb-6" onValueChange={(v) => setLoginMethod(v as 'email' | 'membership')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="membership">Membership No.</TabsTrigger>
                  </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">
                      {loginMethod === 'email' ? 'Email Address' : 'Membership Number'}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{color: '#616E7C'}} />
                      <Input
                        id="identifier"
                        type={loginMethod === 'email' ? 'email' : 'text'}
                        placeholder={loginMethod === 'email' ? 'your@email.com' : 'BOA-XXXX-XXXX'}
                        className="pl-10"
                        value={loginMethod === 'email' ? email : membershipNo}
                        onChange={(e) => loginMethod === 'email' ? setEmail(e.target.value) : setMembershipNo(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-sm hover:underline" style={{color: '#0B3C5D'}}>
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{color: '#616E7C'}} />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{color: '#616E7C'}}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full gov-button-primary" size="lg" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p style={{color: '#616E7C'}}>
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium hover:underline" style={{color: '#0B3C5D'}}>
                      Register here
                    </Link>
                  </p>
                </div>

                {/* Mobile - Show BOA Info */}
                <div className="lg:hidden mt-8 pt-8 border-t" style={{borderColor: '#E5E7EB'}}>
                  <p className="text-center text-sm" style={{color: '#616E7C'}}>
                    Advancing eye care excellence since 1975
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
